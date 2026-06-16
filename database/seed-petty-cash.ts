import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { parseCSV } from "./parseCsv";
import { clearAllMovements, insertMovementsBatch } from "../src/database/pettyCashRepository";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "csv", "MOVIMIENTOS_CAJA.csv");

function parseAmount(val: string): number {
    if (!val) return 0;
    const clean = val.replace("$", "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
}

function isValidDate(dateStr: string): boolean {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(dateStr);
}

function convertDate(dateStr: string): string {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return "";
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
}

const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

function isHeaderOrSummary(row: string[]): boolean {
    const detail = (row[2] ?? "").trim().toUpperCase();
    
    // If it contains SALDO in row[6], it's a summary row
    if ((row[6] ?? "").trim().toUpperCase().includes("SALDO")) {
        return true;
    }
    
    // Check if the detail is just a month name (e.g. "FEBRERO")
    if (months.some(m => detail === m || detail.startsWith(m + " "))) {
        return true;
    }

    // Check if it's the column headers row
    const dateCol = (row[1] ?? "").trim().toUpperCase();
    if (dateCol === "FECHA" && detail === "DETALLE") {
        return true;
    }

    // If detail is empty and there are no amounts, skip
    const ingreso = parseAmount(row[4] ?? "");
    const egreso = parseAmount(row[5] ?? "");
    if (!detail && ingreso === 0 && egreso === 0) {
        return true;
    }

    return false;
}

async function main() {
    console.log("Leyendo CSV de Caja:", csvPath);
    const content = readFileSync(csvPath, "utf-8");
    const rows = parseCSV(content);

    console.log(`Filas totales leídas del CSV: ${rows.length}`);

    const movementsToInsert: { date: string; detail: string; amount: number; type: "ingreso" | "egreso" | "transferencia" }[] = [];
    let lastValidDate = "";

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip header or monthly summary rows
        if (isHeaderOrSummary(row)) {
            continue;
        }

        const dateStr = (row[1] ?? "").trim();
        const detailStr = (row[2] ?? "").trim();
        const receiptStr = (row[3] ?? "").trim();
        const ingresoRaw = row[4] ?? "";
        const egresoRaw = row[5] ?? "";

        // Skip ANULADO rows
        if (detailStr.toUpperCase() === "ANULADO" || detailStr.toUpperCase().includes("(ANULADO)")) {
            continue;
        }

        // Update date if a new valid date is found
        if (isValidDate(dateStr)) {
            lastValidDate = dateStr;
        }

        const ingreso = parseAmount(ingresoRaw);
        const egreso = parseAmount(egresoRaw);

        // We only care if there is an amount > 0
        if (ingreso === 0 && egreso === 0) {
            continue;
        }

        if (!lastValidDate) {
            console.warn(`Advertencia: Fila ${i + 1} tiene montos pero no hay fecha previa válida. Se omitirá. Fila:`, row);
            continue;
        }

        const dbDate = convertDate(lastValidDate);
        // Concatenate receipt to the detail text to keep it readable and searchable
        const finalDetail = receiptStr ? `${detailStr} [Recibo: ${receiptStr}]` : detailStr;

        if (ingreso > 0 && egreso > 0) {
            if (ingreso === egreso) {
                // Both columns filled and equal (e.g. transfer). Mark as transfer.
                movementsToInsert.push({
                    date: dbDate,
                    detail: finalDetail,
                    amount: ingreso,
                    type: "transferencia"
                });
            } else {
                // Both columns filled but unequal. Insert both transactions to preserve exact balance impact.
                movementsToInsert.push({
                    date: dbDate,
                    detail: finalDetail,
                    amount: ingreso,
                    type: "ingreso"
                });
                movementsToInsert.push({
                    date: dbDate,
                    detail: finalDetail,
                    amount: egreso,
                    type: "egreso"
                });
            }
        } else if (ingreso > 0) {
            movementsToInsert.push({
                date: dbDate,
                detail: finalDetail,
                amount: ingreso,
                type: "ingreso"
            });
        } else if (egreso > 0) {
            movementsToInsert.push({
                date: dbDate,
                detail: finalDetail,
                amount: egreso,
                type: "egreso"
            });
        }
    }

    console.log(`Transacciones procesadas listas para cargar: ${movementsToInsert.length}`);

    console.log("Limpiando la tabla petty_cash...");
    await clearAllMovements();

    console.log("Cargando transacciones en la base de datos...");
    const count = await insertMovementsBatch(movementsToInsert);
    console.log(`Se insertaron con éxito ${count} movimientos en petty_cash.`);

    console.log("\nSeed de caja completado sin errores.");
}

main().catch((error) => {
    console.error("Error en el seed de caja:", error);
    process.exit(1);
});
