import { config } from "dotenv";
import { migratePettyCashSchema } from "../src/database/pettyCashRepository";
import { migrateDuesSchema } from "../src/database/duesRepository";
import { ensurePricingTable } from "../src/database/duesConfigRepository";
import { ensureServicesTable } from "../src/database/servicesRepository";
import { migrateServiceRecordsSchema } from "../src/database/serviceRecordsRepository";
import { migrateDebtsSchema } from "../src/database/debtsRepository";
import { migratePersonsSchema } from "../src/database/personsRepository";

config();

async function main() {
    console.log("Ejecutando migraciones...");

    console.log("1/8 - Migrando petty_cash (columna concept)...");
    await migratePettyCashSchema();

    console.log("2/8 - Creando tabla dues y columnas faltantes...");
    await migrateDuesSchema();

    console.log("3/8 - Creando tabla pricing...");
    await ensurePricingTable();

    console.log("4/8 - Creando tabla services...");
    await ensureServicesTable();

    console.log("5/8 - Creando tabla service_records...");
    await migrateServiceRecordsSchema();

    console.log("6/8 - Creando tabla debts...");
    await migrateDebtsSchema();

    console.log("7/8 - Migrando persons (columna brinda_servicios)...");
    await migratePersonsSchema();

    console.log("8/8 - Migraciones completadas sin errores.");
}

main().catch((error) => {
    console.error("Error en migración:", error);
    process.exit(1);
});
