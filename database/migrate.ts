import { config } from "dotenv";
import { migratePettyCashSchema } from "../src/database/pettyCashRepository";
import { migrateDuesSchema } from "../src/database/duesRepository";
import { ensurePricingTable } from "../src/database/duesConfigRepository";
import { ensureServicesTable } from "../src/database/servicesRepository";
import { migrateServiceRecordsSchema } from "../src/database/serviceRecordsRepository";

config();

async function main() {
    console.log("Ejecutando migraciones...");

    console.log("1/6 - Migrando petty_cash (columna concept)...");
    await migratePettyCashSchema();

    console.log("2/6 - Creando tabla dues y columnas faltantes...");
    await migrateDuesSchema();

    console.log("3/6 - Creando tabla pricing...");
    await ensurePricingTable();

    console.log("4/6 - Creando tabla services...");
    await ensureServicesTable();

    console.log("5/6 - Creando tabla service_records...");
    await migrateServiceRecordsSchema();

    console.log("6/6 - Migraciones completadas sin errores.");
}

main().catch((error) => {
    console.error("Error en migración:", error);
    process.exit(1);
});
