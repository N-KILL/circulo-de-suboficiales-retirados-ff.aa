import type { Member } from "../models/members";
import { getSql } from "./connection";
import { memberToRow, rowToMember } from "./mappers";
import type { MemberRow } from "./types";

export type SeedIssue = {
    csvLine: number;
    numeroDeSocio: string;
    nombre: string;
    reason: string;
    phase: "parse" | "insert";
};

export type InsertMembersResult = {
    successCount: number;
    issues: SeedIssue[];
};

function upsertMemberQuery(
    sql: ReturnType<typeof getSql>,
    row: ReturnType<typeof memberToRow>
) {
    return sql`
        INSERT INTO members (
            id, numero_de_socio, nombre, sexo, residencia, nro_familia,
            nro_fam_a_fall, tipo_doc, documento, cuil, tipo_socio, fecha_nac,
            edad, cod_postal, localidad, domicilio, email, telefono, asistencial,
            plan_salud, militar, fuerza, grado, estado, fecha_ingreso, fecha_baja,
            motivo_baja, cobra_iaf, paga_por, depositar_en, cementerio, fallecido,
            albacea_nombre, albacea_tipo_doc, albacea_documento, albacea_domicilio,
            albacea_telefono, apoderado1_nombre, apoderado1_tipo_doc,
            apoderado1_documento, apoderado1_domicilio, apoderado1_telefono,
            apoderado2_nombre, apoderado2_tipo_doc, apoderado2_documento,
            apoderado2_domicilio, apoderado2_telefono
        ) VALUES (
            ${row.id}, ${row.numero_de_socio}, ${row.nombre}, ${row.sexo},
            ${row.residencia}, ${row.nro_familia}, ${row.nro_fam_a_fall},
            ${row.tipo_doc}, ${row.documento}, ${row.cuil}, ${row.tipo_socio},
            ${row.fecha_nac}, ${row.edad}, ${row.cod_postal}, ${row.localidad},
            ${row.domicilio}, ${row.email}, ${row.telefono}, ${row.asistencial},
            ${row.plan_salud}, ${row.militar}, ${row.fuerza}, ${row.grado},
            ${row.estado}, ${row.fecha_ingreso}, ${row.fecha_baja},
            ${row.motivo_baja}, ${row.cobra_iaf}, ${row.paga_por},
            ${row.depositar_en}, ${row.cementerio}, ${row.fallecido},
            ${row.albacea_nombre}, ${row.albacea_tipo_doc}, ${row.albacea_documento},
            ${row.albacea_domicilio}, ${row.albacea_telefono},
            ${row.apoderado1_nombre}, ${row.apoderado1_tipo_doc},
            ${row.apoderado1_documento}, ${row.apoderado1_domicilio},
            ${row.apoderado1_telefono}, ${row.apoderado2_nombre},
            ${row.apoderado2_tipo_doc}, ${row.apoderado2_documento},
            ${row.apoderado2_domicilio}, ${row.apoderado2_telefono}
        )
        ON CONFLICT (id) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            numero_de_socio = EXCLUDED.numero_de_socio,
            sexo = EXCLUDED.sexo,
            residencia = EXCLUDED.residencia,
            nro_familia = EXCLUDED.nro_familia,
            nro_fam_a_fall = EXCLUDED.nro_fam_a_fall,
            tipo_doc = EXCLUDED.tipo_doc,
            documento = EXCLUDED.documento,
            cuil = EXCLUDED.cuil,
            tipo_socio = EXCLUDED.tipo_socio,
            fecha_nac = EXCLUDED.fecha_nac,
            edad = EXCLUDED.edad,
            cod_postal = EXCLUDED.cod_postal,
            localidad = EXCLUDED.localidad,
            domicilio = EXCLUDED.domicilio,
            email = EXCLUDED.email,
            telefono = EXCLUDED.telefono,
            asistencial = EXCLUDED.asistencial,
            plan_salud = EXCLUDED.plan_salud,
            militar = EXCLUDED.militar,
            fuerza = EXCLUDED.fuerza,
            grado = EXCLUDED.grado,
            estado = EXCLUDED.estado,
            fecha_ingreso = EXCLUDED.fecha_ingreso,
            fecha_baja = EXCLUDED.fecha_baja,
            motivo_baja = EXCLUDED.motivo_baja,
            cobra_iaf = EXCLUDED.cobra_iaf,
            paga_por = EXCLUDED.paga_por,
            depositar_en = EXCLUDED.depositar_en,
            cementerio = EXCLUDED.cementerio,
            fallecido = EXCLUDED.fallecido,
            albacea_nombre = EXCLUDED.albacea_nombre,
            albacea_tipo_doc = EXCLUDED.albacea_tipo_doc,
            albacea_documento = EXCLUDED.albacea_documento,
            albacea_domicilio = EXCLUDED.albacea_domicilio,
            albacea_telefono = EXCLUDED.albacea_telefono,
            apoderado1_nombre = EXCLUDED.apoderado1_nombre,
            apoderado1_tipo_doc = EXCLUDED.apoderado1_tipo_doc,
            apoderado1_documento = EXCLUDED.apoderado1_documento,
            apoderado1_domicilio = EXCLUDED.apoderado1_domicilio,
            apoderado1_telefono = EXCLUDED.apoderado1_telefono,
            apoderado2_nombre = EXCLUDED.apoderado2_nombre,
            apoderado2_tipo_doc = EXCLUDED.apoderado2_tipo_doc,
            apoderado2_documento = EXCLUDED.apoderado2_documento,
            apoderado2_domicilio = EXCLUDED.apoderado2_domicilio,
            apoderado2_telefono = EXCLUDED.apoderado2_telefono,
            updated_at = NOW()
    `;
}

export async function getAllMembers(): Promise<Member[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT *
        FROM members
        ORDER BY
            NULLIF(regexp_replace(numero_de_socio, '[^0-9]', '', 'g'), '')::int NULLS LAST,
            numero_de_socio
    `;
    return (rows as MemberRow[]).map(rowToMember);
}

export async function getMemberById(id: string): Promise<Member | null> {
    const sql = getSql();
    const rows = (await sql`
        SELECT * FROM members WHERE id = ${id} LIMIT 1
    `) as MemberRow[];
    const row = rows[0];
    return row ? rowToMember(row) : null;
}

export async function getMemberByNumeroDeSocio(numero: string): Promise<Member | null> {
    const sql = getSql();
    const rows = (await sql`
        SELECT * FROM members WHERE numero_de_socio = ${numero} LIMIT 1
    `) as MemberRow[];
    const row = rows[0];
    return row ? rowToMember(row) : null;
}

function formatDbError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

export async function upsertMember(member: Member): Promise<void> {
    const sql = getSql();
    await upsertMemberQuery(sql, memberToRow(member));
}

export async function deleteMemberById(id: string): Promise<void> {
    const sql = getSql();
    await sql`DELETE FROM members WHERE id = ${id}`;
}

export async function insertMembers(members: Member[]): Promise<InsertMembersResult> {
    const issues: SeedIssue[] = [];
    let successCount = 0;

    for (const member of members) {
        try {
            await upsertMember(member);
            successCount++;
        } catch (error) {
            issues.push({
                csvLine: 0,
                numeroDeSocio: member.numeroDeSocio,
                nombre: member.nombre,
                reason: `error al insertar en BD: ${formatDbError(error)}`,
                phase: "insert",
            });
        }
    }

    return { successCount, issues };
}
