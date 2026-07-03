import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { parseCSV } from "./parseCsv";
import { getSql } from "../src/database/connection";
import { upsertPerson } from "../src/database/personsRepository";
import {
    searchMemberByNombre,
    insertCementerios,
} from "../src/database/cementeriosRepository";
import type { Cementerio } from "../src/models/members";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "csv/CEMENTERIO.csv");
const HEADER_ROWS = 2;

const COL_NICHO = 2;
const COL_FOLIO = 3;
const COL_TIPO = 4;
const COL_OCUPANTE = 5;
const COL_TIENE_LAPIDA = 6;
const COL_ARRENDATARIO = 7;
const COL_NRO_ORDEN = 8;
const COL_DOMICILIO = 9;
const COL_CIUDAD = 10;
const COL_TELEFONO = 11;
const COL_FALLECIMIENTO_DIA = 12;
const COL_FALLECIMIENTO_MES = 13;
const COL_FALLECIMIENTO_ANO = 14;
const COL_SOCIO = 15;
const COL_PAGA_POR = 16;
const COL_ANIO_DE_GRACIA = 17;
const COL_CONTRATO_NRO = 18;
const COL_CONTRATO_POR_ANIOS = 19;
const COL_ANIO_VENC_CONTRATO = 20;
const COL_ULTIMO_PAGO = 21;
const COL_PLAN_DE_PAGO = 22;
const COL_FECHA_DE_PAGO = 23;
const COL_REDUCIR = 26;
const COL_DEBE_ANIOS = 27;

function normalizeBoolean(value: string): boolean {
    const v = value.trim().toLowerCase();
    return v === "si" || v === "sí" || v === "s";
}

function fmtDomicilio(domicilio: string, ciudad: string): string {
    const d = domicilio.trim();
    const c = ciudad.trim();
    if (d && c) return `${d} (${c})`;
    return d || c;
}

function joinDate(dia: string, mes: string, anio: string): string {
    const d = dia.trim();
    const m = mes.trim();
    const a = anio.trim();
    if (!d && !m && !a) return "";
    return `${d || "00"}/${m || "00"}/${a || "0000"}`;
}

async function runSchema() {
    const schemaPath = join(__dirname, "../src/database/schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");
    const sql = getSql();

    const statements = schema
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

    for (const statement of statements) {
        await sql.query(statement);
    }
}

async function main() {
    console.log("Leyendo CSV:", csvPath);
    const content = readFileSync(csvPath, "utf-8");
    const rows = parseCSV(content);

    console.log(`Filas totales leídas del CSV: ${rows.length}`);
    const dataRows = rows.slice(HEADER_ROWS);
    console.log(`Filas de datos (excluyendo ${HEADER_ROWS} filas de encabezado): ${dataRows.length}`);

    console.log("\nCreando/actualizando esquema...");
    await runSchema();

    const cementerios: Cementerio[] = [];
    const searchCache = new Map<string, string | null>();
    const parseIssues: {
        csvLine: number;
        arrendatario: string;
        nicho: string;
        reason: string;
    }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const csvLine = HEADER_ROWS + i + 1;

        const arrendatarioRaw = (row[COL_ARRENDATARIO] ?? "").trim();
        const nicho = (row[COL_NICHO] ?? "").trim();

        const telefonoRaw = (row[COL_TELEFONO] ?? "").trim();

        const slashIdx = arrendatarioRaw.indexOf("/");
        const arrendatario = slashIdx !== -1
            ? arrendatarioRaw.slice(0, slashIdx).trim()
            : arrendatarioRaw;
        const nombreAlternativo = slashIdx !== -1
            ? arrendatarioRaw.slice(slashIdx + 1).trim()
            : "";

        let socioId: string | null = null;
        let personaId: string | null = null;
        let esSocio = false;

        if (arrendatario) {
            const domicilioRaw = (row[COL_DOMICILIO] ?? "").trim();
            const ciudadRaw = (row[COL_CIUDAD] ?? "").trim();
            const domicilioFinal = fmtDomicilio(domicilioRaw, ciudadRaw);

            const soc = (row[COL_SOCIO] ?? "").trim().toUpperCase();
            esSocio = soc === "SI" || soc === "SÍ" || soc === "S";

            try {
                if (esSocio) {
                    const cached = searchCache.get(arrendatario);
                    if (cached !== undefined) {
                        socioId = cached;
                    } else {
                        const found = await searchMemberByNombre(arrendatario);
                        socioId = found?.id ?? null;
                        searchCache.set(arrendatario, socioId);

                        if (!socioId) {
                            parseIssues.push({
                                csvLine,
                                arrendatario,
                                nicho,
                                reason: `SOCIO=SI pero no se encontró socio con nombre: "${arrendatario}"`,
                            });
                        }
                    }
                    personaId = null;
                } else {
                    const person = {
                        id: randomUUID(),
                        nombre: arrendatario,
                        tipoDoc: "",
                        documento: "",
                        domicilio: domicilioFinal,
                        telefono: telefonoRaw,
                    };
                    personaId = await upsertPerson(person);
                    socioId = null;
                }
            } catch (error) {
                parseIssues.push({
                    csvLine,
                    arrendatario,
                    nicho,
                    reason: `Error al crear persona/buscar socio: ${error instanceof Error ? error.message : String(error)}`,
                });
                continue;
            }
        }

        const tieneLapida = normalizeBoolean(row[COL_TIENE_LAPIDA] ?? "");
        const fechaFallecimiento = joinDate(
            row[COL_FALLECIMIENTO_DIA] ?? "",
            row[COL_FALLECIMIENTO_MES] ?? "",
            row[COL_FALLECIMIENTO_ANO] ?? "",
        );

        cementerios.push({
            id: randomUUID(),
            nicho,
            folio: (row[COL_FOLIO] ?? "").trim(),
            tipo: (row[COL_TIPO] ?? "").trim(),
            ocupante: (row[COL_OCUPANTE] ?? "").trim(),
            numeroOrden: (row[COL_NRO_ORDEN] ?? "").trim(),
            tieneLapida,
            esSocio: esSocio,
            socioId,
            personaId,
            pagaPor: (row[COL_PAGA_POR] ?? "").trim(),
            anioDeGracia: (row[COL_ANIO_DE_GRACIA] ?? "").trim(),
            contratoNro: (row[COL_CONTRATO_NRO] ?? "").trim(),
            contratoPorAnios: (row[COL_CONTRATO_POR_ANIOS] ?? "").trim(),
            anioVencContrato: (row[COL_ANIO_VENC_CONTRATO] ?? "").trim(),
            ultimoPago: (row[COL_ULTIMO_PAGO] ?? "").trim(),
            planDePago: (row[COL_PLAN_DE_PAGO] ?? "").trim(),
            fechaDePago: (row[COL_FECHA_DE_PAGO] ?? "").trim(),
            telefono: telefonoRaw,
            nombreAlternativo,
            fechaFallecimiento,
            reducir: (row[COL_REDUCIR] ?? "").trim(),
            debeAnios: (row[COL_DEBE_ANIOS] ?? "").trim(),
        });
    }

    console.log(`\nRegistros de cementerio listos para insertar: ${cementerios.length}`);
    if (parseIssues.length > 0) {
        console.warn(`Problemas durante parseo: ${parseIssues.length}`);
        for (const issue of parseIssues) {
            console.warn(`  Línea ${issue.csvLine}: ${issue.reason}`);
        }
    }

    if (cementerios.length === 0) {
        console.log("No hay registros para insertar.");
        return;
    }

    console.log("Insertando registros en la base de datos...");
    const { successCount, issues: insertIssues } = await insertCementerios(cementerios);

    const allIssues = [...parseIssues.map((i) => ({
        csvLine: i.csvLine,
        arrendatario: i.arrendatario,
        nicho: i.nicho,
        reason: i.reason,
        phase: "parse" as const,
    })), ...insertIssues];

    if (allIssues.length > 0) {
        const errorPath = join(__dirname, "seed_cementerio_errors.json");
        writeFileSync(errorPath, JSON.stringify(allIssues, null, 2), "utf-8");
        console.log(`\nErrores guardados en: ${errorPath}`);
    }

    console.log(`Insertados en BD: ${successCount}`);
    console.log(`Fallos en parseo: ${parseIssues.length}`);
    console.log(`Fallos en BD: ${insertIssues.length}`);

    if (allIssues.length > 0) {
        console.warn(`Seed de cementerio completado con ${allIssues.length} errores.`);
    } else {
        console.log("\nSeed de cementerio completado sin errores.");
    }
}

main().catch((error) => {
    console.error("Error en seed de cementerio:", error);
    process.exit(1);
});
