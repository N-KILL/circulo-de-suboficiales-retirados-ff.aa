import type { Member, Person } from "../models/members";
import type { MemberRow } from "./types";

// ── Sexo ──────────────────────────────────────────────
const sexoToDisplay: Record<string, string> = {
    M: "Masculino", m: "Masculino",
    F: "Femenino",  f: "Femenino",
};

const displayToSexo: Record<string, string> = {
    Masculino: "M",
    Femenino: "F",
};

// ── Estado (militar) ───────────────────────────────────
const estadoToDisplay: Record<string, string> = {
    "":     "En servicio",
    "(R)":  "Retirado",
    RET:    "Retirado",
    Baja:   "Baja",
    PENS:   "Pensionado",
};

const displayToEstado: Record<string, string> = {
    "En servicio": "",
    Retirado:      "RET",
    Baja:          "Baja",
    Pensionado:    "PENS",
};

// ── Tipo de socio ─────────────────────────────────────
const tipoSocioToDisplay: Record<string, string> = {
    ACT:   "Activo",
    "ACT A": "Activo Tipo A",
    ADH:   "Adherente",
    HON:   "Honorario",
    PART:  "Part",
    VIT:   "Vitalicio",
};

const displayToTipoSocio: Record<string, string> = {
    Activo:         "ACT",
    "Activo Tipo A": "ACT A",
    Adherente:      "ADH",
    Honorario:      "HON",
    Part:           "PART",
    Vitalicio:      "VIT",
};

// ── Fechas (DD/MM/YYYY ↔ YYYY-MM-DD) ──────────────────
function fechaToDisplay(value: string | null | undefined): string {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
        const [, d, mo, y] = m;
        return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return value;
}

function fechaToDb(value: string | null | undefined): string | null {
    if (!value) return null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
        const [, y, mo, d] = m;
        return `${d.padStart(2, "0")}/${mo.padStart(2, "0")}/${y}`;
    }
    return value;
}

function personFromRow(
    row: MemberRow,
    prefix: "albacea" | "apoderado1" | "apoderado2"
): Person | null {
    const nombre = row[`${prefix}_nombre`];
    if (!nombre?.trim()) return null;

    return {
        nombre,
        tipoDoc: row[`${prefix}_tipo_doc`] ?? "",
        documento: row[`${prefix}_documento`] ?? "",
        domicilio: row[`${prefix}_domicilio`] ?? "",
        telefono: row[`${prefix}_telefono`] ?? "",
    };
}

export function memberToRow(member: Member) {
    return {
        id: member.id,
        numero_de_socio: member.numeroDeSocio,
        nombre: member.nombre,
        sexo: displayToSexo[member.sexo] ?? (member.sexo || null),
        residencia: member.residencia || null,
        nro_familia: member.nroFamilia || null,
        nro_fam_a_fall: member.nroFamAFall || null,
        tipo_doc: member.tipoDoc || null,
        documento: member.documento || null,
        cuil: member.cuil || null,
        tipo_socio: displayToTipoSocio[member.tipoSocio] ?? (member.tipoSocio || null),
        fecha_nac: fechaToDb(member.fechaNac),
        edad: member.edad || null,
        cod_postal: member.codPostal || null,
        localidad: member.localidad || null,
        domicilio: member.domicilio || null,
        email: member.email || null,
        telefono: member.telefono || null,
        asistencial: member.asistencial,
        plan_salud: member.planSalud,
        militar: member.militar,
        fuerza: member.fuerza || null,
        grado: member.grado || null,
        estado: displayToEstado[member.estado] ?? (member.estado || null),
        fecha_ingreso: fechaToDb(member.fechaIngreso),
        fecha_baja: fechaToDb(member.fechaBaja),
        motivo_baja: member.motivoBaja || null,
        cobra_iaf: member.cobraIAF || null,
        paga_por: member.pagaPor || null,
        depositar_en: member.depositarEn || null,
        cementerio: member.cementerio || null,
        fallecido: member.fallecido,
        albacea_nombre: member.albacea?.nombre ?? null,
        albacea_tipo_doc: member.albacea?.tipoDoc ?? null,
        albacea_documento: member.albacea?.documento ?? null,
        albacea_domicilio: member.albacea?.domicilio ?? null,
        albacea_telefono: member.albacea?.telefono ?? null,
        apoderado1_nombre: member.apoderado1?.nombre ?? null,
        apoderado1_tipo_doc: member.apoderado1?.tipoDoc ?? null,
        apoderado1_documento: member.apoderado1?.documento ?? null,
        apoderado1_domicilio: member.apoderado1?.domicilio ?? null,
        apoderado1_telefono: member.apoderado1?.telefono ?? null,
        apoderado2_nombre: member.apoderado2?.nombre ?? null,
        apoderado2_tipo_doc: member.apoderado2?.tipoDoc ?? null,
        apoderado2_documento: member.apoderado2?.documento ?? null,
        apoderado2_domicilio: member.apoderado2?.domicilio ?? null,
        apoderado2_telefono: member.apoderado2?.telefono ?? null,
    };
}

export function rowToMember(row: MemberRow): Member {
    return {
        id: row.id,
        numeroDeSocio: row.numero_de_socio,
        nombre: row.nombre,
        sexo: sexoToDisplay[row.sexo ?? ""] ?? row.sexo ?? "",
        residencia: row.residencia ?? "",
        nroFamilia: row.nro_familia ?? "",
        nroFamAFall: row.nro_fam_a_fall ?? "",
        tipoDoc: row.tipo_doc ?? "",
        documento: row.documento ?? "",
        cuil: row.cuil ?? "",
        tipoSocio: tipoSocioToDisplay[row.tipo_socio ?? ""] ?? row.tipo_socio ?? "",
        fechaNac: fechaToDisplay(row.fecha_nac),
        edad: row.edad ?? "",
        codPostal: row.cod_postal ?? "",
        localidad: row.localidad ?? "",
        domicilio: row.domicilio ?? "",
        email: row.email ?? "",
        telefono: row.telefono ?? "",
        asistencial: row.asistencial,
        planSalud: row.plan_salud,
        militar: row.militar,
        fuerza: row.fuerza ?? "",
        grado: row.grado ?? "",
        estado: estadoToDisplay[row.estado ?? ""] ?? row.estado ?? "",
        fechaIngreso: fechaToDisplay(row.fecha_ingreso),
        fechaBaja: fechaToDisplay(row.fecha_baja),
        motivoBaja: row.motivo_baja ?? "",
        cobraIAF: row.cobra_iaf ?? "",
        pagaPor: row.paga_por ?? "",
        depositarEn: row.depositar_en ?? undefined,
        cementerio: row.cementerio ?? "",
        fallecido: row.fallecido,
        albacea: personFromRow(row, "albacea"),
        apoderado1: personFromRow(row, "apoderado1"),
        apoderado2: personFromRow(row, "apoderado2"),
    };
}
