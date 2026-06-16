import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { parseCSV } from "./parseCsv";
import {
    clearAllMovements,
    insertMovementsBatch,
    migratePettyCashSchema,
} from "../src/database/pettyCashRepository";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "csv", "CAJA.csv");

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

// CAJA.csv columns (0-indexed):
//   0: FECHA    1: DETALLE    2: MODO    3: RECIBO    4: INGRESO    5: EGRESO
//   6: SALDO TOTAL    7: SALDO CAJA CHICA
const COL_DATE = 0;
const COL_DETAIL = 1;
const COL_MODO = 2;
const COL_RECEIPT = 3;
const COL_INGRESO = 4;
const COL_EGRESO = 5;

function isHeaderOrSummary(row: string[]): boolean {
    const detail = (row[COL_DETAIL] ?? "").trim().toUpperCase();

    // Skip rows where SALDO TOTAL or SALDO CAJA CHICA header text appears
    if ((row[6] ?? "").trim().toUpperCase().includes("SALDO")) return true;
    if ((row[7] ?? "").trim().toUpperCase().includes("SALDO")) return true;

    // Skip month-name rows
    if (months.some(m => detail === m || detail.startsWith(m + " "))) return true;

    // Skip column headers row
    const dateCol = (row[COL_DATE] ?? "").trim().toUpperCase();
    if (dateCol === "FECHA" && detail === "DETALLE") return true;

    // Skip rows with no detail and no amounts
    const ingreso = parseAmount(row[COL_INGRESO] ?? "");
    const egreso = parseAmount(row[COL_EGRESO] ?? "");
    if (!detail && ingreso === 0 && egreso === 0) return true;

    return false;
}

async function main() {
    console.log("Leyendo CSV de Caja:", csvPath);
    const content = readFileSync(csvPath, "utf-8");
    const rows = parseCSV(content);

    console.log(`Filas totales leídas del CSV: ${rows.length}`);

    // Run migration to ensure schema is up to date
    console.log("Ejecutando migración de esquema...");
    await migratePettyCashSchema();

    const movementsToInsert: {
        date: string;
        detail: string;
        amount: number;
        type: "ingreso" | "egreso" | "transferencia";
        mode: "efectivo" | "transferencia";
    }[] = [];
    let lastValidDate = "";

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        if (isHeaderOrSummary(row)) continue;

        const dateStr = (row[COL_DATE] ?? "").trim();
        const detailStr = (row[COL_DETAIL] ?? "").trim();
        const modoStr = (row[COL_MODO] ?? "").trim();
        const receiptStr = (row[COL_RECEIPT] ?? "").trim();
        const ingresoRaw = row[COL_INGRESO] ?? "";
        const egresoRaw = row[COL_EGRESO] ?? "";

        // Skip ANULADO rows
        if (detailStr.toUpperCase() === "ANULADO" || detailStr.toUpperCase().includes("(ANULADO)")) continue;

        // Skip SALDO INICIAL rows (initial balances are set via config page)
        if (detailStr.toUpperCase().includes("SALDO INICIAL")) continue;

        // Determine mode
        const mode: "efectivo" | "transferencia" =
            modoStr.toUpperCase() === "TRANSFERENCIA" ? "transferencia" : "efectivo";

        // Update date if a new valid date is found
        if (isValidDate(dateStr)) lastValidDate = dateStr;

        const ingreso = parseAmount(ingresoRaw);
        const egreso = parseAmount(egresoRaw);

        if (ingreso === 0 && egreso === 0) continue;

        if (!lastValidDate) {
            console.warn(`Advertencia: Fila ${i + 1} tiene montos pero no hay fecha previa válida. Se omitirá. Fila:`, row);
            continue;
        }

        const dbDate = convertDate(lastValidDate);
        const finalDetail = receiptStr ? `${detailStr} [Recibo: ${receiptStr}]` : detailStr;

        if (ingreso > 0 && egreso > 0) {
            if (ingreso === egreso) {
                movementsToInsert.push({
                    date: dbDate,
                    detail: finalDetail,
                    amount: ingreso,
                    type: "transferencia",
                    mode,
                });
            } else {
                movementsToInsert.push({
                    date: dbDate,
                    detail: finalDetail,
                    amount: ingreso,
                    type: "ingreso",
                    mode,
                });
                movementsToInsert.push({
                    date: dbDate,
                    detail: finalDetail,
                    amount: egreso,
                    type: "egreso",
                    mode,
                });
            }
        } else if (ingreso > 0) {
            movementsToInsert.push({
                date: dbDate,
                detail: finalDetail,
                amount: ingreso,
                type: "ingreso",
                mode,
            });
        } else if (egreso > 0) {
            movementsToInsert.push({
                date: dbDate,
                detail: finalDetail,
                amount: egreso,
                type: "egreso",
                mode,
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
