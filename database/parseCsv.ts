import { randomUUID } from "node:crypto";
import type { Member, Person } from "../src/models/members";

type SeedIssue = {
    csvLine: number;
    numeroDeSocio: string;
    nombre: string;
    reason: string;
    phase: "parse" | "insert";
};

type CsvParseResult = {
    members: Member[];
    issues: SeedIssue[];
    totalDataRows: number;
};

export function parseCSV(content: string): string[][] {
    const rows: string[][] = [];

    let currentCell = "";
    let currentRow: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ";" && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = "";
            continue;
        }

        if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && nextChar === "\n") {
                i++;
            }

            currentRow.push(currentCell.trim());

            if (currentRow.some((cell) => cell !== "")) {
                rows.push(currentRow);
            }

            currentRow = [];
            currentCell = "";
            continue;
        }

        currentCell += char;
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell.trim());

        if (currentRow.some((cell) => cell !== "")) {
            rows.push(currentRow);
        }
    }

    return rows;
}

function calculateAge(dateString: string): string {
    if (!dateString) return "";

    const parts = dateString.split("/");
    if (parts.length !== 3) return "";

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const today = new Date();
    const birthDate = new Date(year, month, day);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    return age.toString();
}

function normalizeBoolean(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === "si" || normalized === "sí" || normalized === "s";
}

/** Columna A (índice 0), con fallback a columna H (índice 7) si A está vacía. */
function resolveNumeroDeSocio(row: string[]): string {
    const colA = (row[0] ?? "").trim();
    if (colA) return colA;
    return (row[7] ?? "").trim();
}

function buildPersonFromRow(row: string[], nombreCol: number, tipoDocCol: number, docCol: number, domCol: number, telCol: number): Person | null {
    const nombre = (row[nombreCol] ?? "").trim();
    if (!nombre) return null;
    return {
        id: randomUUID(),
        nombre,
        tipoDoc: (row[tipoDocCol] ?? "").trim(),
        documento: (row[docCol] ?? "").trim(),
        domicilio: (row[domCol] ?? "").trim(),
        telefono: (row[telCol] ?? "").trim(),
    };
}

function buildMemberFromRow(row: string[], id: string, numeroDeSocio: string, nombre: string): Member {
        const sexo = row[3] ?? "";
        const residencia = row[4] ?? "";
        const nroFamilia = row[5] ?? "";
        const nroFamAFall = row[6] ?? "";
        const planSaludRaw = row[8] ?? "";
        const tipoDoc = row[9] ?? "";
        const documento = row[10] ?? "";
        const cuil = row[11] ?? "";
        const tipoSocio = row[12] ?? "";
        const fuerza = row[13] ?? "";
        const grado = row[14] ?? "";
        const estado = row[15] ?? "";
        const fechaIngreso = row[16] ?? "";
        const fechaBaja = row[19] ?? "";
        const motivoBaja = row[20] ?? "";
        const cobraIAF = row[21] ?? "";
        const pagaPor = row[22] ?? "";
        const fechaNac = row[23] ?? "";
        const edad = fechaNac !== "" ? calculateAge(fechaNac) : "";
        const codPostal = row[25] ?? "";
        const localidad = row[26] ?? "";
        const domicilio = row[27] ?? "";
        const email = row[28] ?? "";
        const telefono = row[29] ?? "";
        const asistencialRaw = row[30] ?? "";
        const planSaludRaw2 = row[31] ?? "";
        const cementerio = row[32] ?? "";
        const fallecidoRaw = row[44] ?? "";

        const asistencial = normalizeBoolean(asistencialRaw);
        const planSalud =
            normalizeBoolean(planSaludRaw) || normalizeBoolean(planSaludRaw2);
        const militar = fuerza.trim().length > 0 || grado.trim().length > 0;
        const fallecido = normalizeBoolean(fallecidoRaw);

        const apoderado1 = buildPersonFromRow(row, 34, 35, 36, 37, 38);
        const apoderado2 = buildPersonFromRow(row, 39, 40, 41, 42, 43);

        return {
            id,
            numeroDeSocio,
            nombre,
            sexo,
            residencia,
            nroFamilia,
            nroFamAFall,
            tipoDoc,
            documento,
            cuil,
            tipoSocio,
            fechaNac,
            edad,
            codPostal,
            localidad,
            domicilio,
            email,
            telefono,
            asistencial,
            planSalud,
            militar,
            fuerza,
            grado,
            estado,
            fechaIngreso,
            fechaBaja,
            motivoBaja,
            cobraIAF,
            pagaPor,
            cementerio,
            fallecido,
            apoderado1,
            apoderado2,
        };
}

export function parseMembersFromCsvWithReport(content: string): CsvParseResult {
    const rows = parseCSV(content);
    const issues: SeedIssue[] = [];
    const membersList: Member[] = [];
    const seenNumeroDeSocio = new Map<string, number>();

    if (rows.length <= 1) {
        return { members: [], issues, totalDataRows: 0 };
    }

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const csvLine = i + 1;

        if (!row || row.length === 0) {
            issues.push({
                csvLine,
                numeroDeSocio: "",
                nombre: "",
                reason: "fila vacía",
                phase: "parse",
            });
            continue;
        }

        const numeroDeSocio = resolveNumeroDeSocio(row);
        const apellido = row[1] ?? "";
        const nombrePart = row[2] ?? "";

        const nombre =
            apellido && nombrePart
                ? `${apellido}, ${nombrePart}`
                : apellido || nombrePart;

        if (!numeroDeSocio) {
            issues.push({
                csvLine,
                numeroDeSocio,
                nombre,
                reason: "numero_de_socio vacío (columnas A y H)",
                phase: "parse",
            });
            continue;
        }

        if (seenNumeroDeSocio.has(numeroDeSocio)) {
            issues.push({
                csvLine,
                numeroDeSocio,
                nombre,
                reason: `numero_de_socio duplicado (primera aparición en fila ${seenNumeroDeSocio.get(numeroDeSocio)})`,
                phase: "parse",
            });
            continue;
        }

        seenNumeroDeSocio.set(numeroDeSocio, csvLine);

        membersList.push(
            buildMemberFromRow(row, randomUUID(), numeroDeSocio, nombre)
        );
    }

    return {
        members: membersList,
        issues,
        totalDataRows: rows.length - 1,
    };
}

export function parseMembersFromCsv(content: string): Member[] {
    return parseMembersFromCsvWithReport(content).members;
}
