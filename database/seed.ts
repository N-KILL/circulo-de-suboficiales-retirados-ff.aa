import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { getSql } from "../src/database/connection";
import { insertMembers } from "../src/database/membersRepository";
import { parseMembersFromCsvWithReport } from "./parseCsv";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "csv/PADRON.csv");

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
    const { members, issues: parseIssues, totalDataRows } = parseMembersFromCsvWithReport(content);

    console.log(`Socios válidos para cargar: ${members.length} (de ${totalDataRows} filas de datos)`);

    console.log("\nCreando tabla si no existe...");
    await runSchema();

    console.log("Subiendo socios a Neon...");
    const { successCount, issues: insertIssues } = await insertMembers(members);

    const allIssues = [...parseIssues, ...insertIssues];
    const notLoadedIssues = allIssues.filter(
        (i) => !i.reason.includes("duplicate key value violates unique constraint"),
    );

    if (notLoadedIssues.length > 0) {
        const errorPath = join(__dirname, "seed_errors.json");
        writeFileSync(errorPath, JSON.stringify(notLoadedIssues, null, 2), "utf-8");
        console.log(`\nErrores guardados en: ${errorPath}`);
    }

    console.log(`\nInsertados/actualizados en BD: ${successCount}`);
    console.log(`Fallos en parseo: ${parseIssues.length}`);
    console.log(`Fallos en BD: ${insertIssues.length}`);

    if (allIssues.length > 0) {
        console.warn(`Seed completado con ${allIssues.length} errores.`);
    } else {
        console.log("\nSeed de socios completado sin errores.");
    }
}

main().catch((error) => {
    console.error("Error en seed:", error);
    process.exit(1);
});
