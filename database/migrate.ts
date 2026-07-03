import { config } from "dotenv";
import { migratePettyCashSchema } from "../src/database/pettyCashRepository";
import { migrateDuesSchema } from "../src/database/duesRepository";
import { ensurePricingTable } from "../src/database/duesConfigRepository";
import { ensureServicesTable } from "../src/database/servicesRepository";

config();

async function main() {
    console.log("Ejecutando migraciones...");

    console.log("1/5 - Migrando petty_cash (columna concept)...");
    await migratePettyCashSchema();

    console.log("2/5 - Creando tabla dues y columnas faltantes...");
    await migrateDuesSchema();

    console.log("3/5 - Creando tabla pricing...");
    await ensurePricingTable();

    console.log("4/5 - Creando tabla services...");
    await ensureServicesTable();

    console.log("5/5 - Migraciones completadas sin errores.");
}

main().catch((error) => {
    console.error("Error en migración:", error);
    process.exit(1);
});
