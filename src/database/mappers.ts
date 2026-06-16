import type { Member, Person } from "../models/members";
import type { MemberRow } from "./types";

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
        sexo: member.sexo || null,
        residencia: member.residencia || null,
        nro_familia: member.nroFamilia || null,
        nro_fam_a_fall: member.nroFamAFall || null,
        tipo_doc: member.tipoDoc || null,
        documento: member.documento || null,
        cuil: member.cuil || null,
        tipo_socio: member.tipoSocio || null,
        fecha_nac: member.fechaNac || null,
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
        estado: member.estado || null,
        fecha_ingreso: member.fechaIngreso || null,
        fecha_baja: member.fechaBaja || null,
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
        sexo: row.sexo ?? "",
        residencia: row.residencia ?? "",
        nroFamilia: row.nro_familia ?? "",
        nroFamAFall: row.nro_fam_a_fall ?? "",
        tipoDoc: row.tipo_doc ?? "",
        documento: row.documento ?? "",
        cuil: row.cuil ?? "",
        tipoSocio: row.tipo_socio ?? "",
        fechaNac: row.fecha_nac ?? "",
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
        estado: row.estado ?? "",
        fechaIngreso: row.fecha_ingreso ?? "",
        fechaBaja: row.fecha_baja ?? "",
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
