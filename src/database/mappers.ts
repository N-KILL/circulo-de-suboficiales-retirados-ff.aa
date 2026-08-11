import type { Member, Person, ServiceRecord } from "../models/members.js";
import type { MemberRow, ServiceRecordWithDetails } from "./types.js";

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
    EN_SERVICIO: "En servicio",
    "(R)":       "Retirado",
    RET:         "Retirado",
    Baja:        "Baja",
    PENS:        "Pensionado",
};

const displayToEstado: Record<string, string> = {
    "En servicio": "EN_SERVICIO",
    Retirado:      "RET",
    Baja:          "Baja",
    Pensionado:    "PENS",
};

// ── Tipo de socio ─────────────────────────────────────
const tipoSocioToDisplay: Record<string, string> = {
    ACT:          "Activo",
    "ACT A":      "Activo Tipo A",
    'ACT "A"':    "Activo Tipo A",
    ADH:          "Adherente",
    HON:          "Honorario",
    PART:         "Participante",
    VIT:          "Vitalicio",
};

const displayToTipoSocio: Record<string, string> = {
    Activo:         "ACT",
    "Activo Tipo A": 'ACT "A"',
    Adherente:      "ADH",
    Honorario:      "HON",
    Participante:  "PART",
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
    prefix: "apoderado1" | "apoderado2"
): Person | null {
    const nombre = row[`${prefix}_nombre`];
    if (!nombre?.trim()) return null;

    const idKey = `${prefix}_id` as keyof MemberRow;

    return {
        id: (row[idKey] as string | null) ?? "",
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
        apoderado1_id: member.apoderado1?.id ?? null,
        apoderado2_id: member.apoderado2?.id ?? null,
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
        apoderado1: personFromRow(row, "apoderado1"),
        apoderado2: personFromRow(row, "apoderado2"),
    };
}

export function rowToServiceRecord(row: ServiceRecordWithDetails): ServiceRecord {
    return {
        id: row.id,
        serviceId: row.service_id,
        serviceName: row.service_name,
        serviceAmount: row.service_amount,
        memberId: row.member_id,
        memberNombre: row.member_nombre,
        memberNumeroDeSocio: row.member_numero_de_socio,
        personId: row.person_id,
        personNombre: row.person_nombre,
        movementId: row.movement_id,
        movementAmount: row.movement_amount,
        amount: row.amount,
        date: row.date,
        serviceDate: row.service_date,
        detail: row.detail ?? "",
    };
}
