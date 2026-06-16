import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { getSql } from "../src/database/connection";
import { insertMembers } from "../src/database/membersRepository";
import { parseMembersFromCsv } from "./parseCsv";

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
    const members = parseMembersFromCsv(content);

    console.log(`Socios válidos para cargar: ${members.length}`);

    console.log("\nCreando tabla si no existe...");
    await runSchema();

    console.log("Subiendo socios a Neon...");
    const { successCount, issues } = await insertMembers(members);

    console.log(`\nInsertados/actualizados en BD: ${successCount}`);
    console.log(`Fallos en BD: ${issues.length}`);

    if (issues.length > 0) {
        console.warn(`Se completó con ${issues.length} advertencias/errores.`);
    } else {
        console.log("\nSeed de socios completado sin errores.");
    }
}

main().catch((error) => {
    console.error("Error en seed:", error);
    process.exit(1);
});
