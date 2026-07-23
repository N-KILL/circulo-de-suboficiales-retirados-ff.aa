import type { Member, Person } from "../models/members.js";
import { getSql } from "./connection.js";
import { upsertPerson } from "./personsRepository.js";
import { memberToRow, rowToMember } from "./mappers.js";
import type { MemberRow, PersonRow } from "./types.js";

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
            apoderado1_id, apoderado2_id
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
            ${row.apoderado1_id}, ${row.apoderado2_id}
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
            apoderado1_id = EXCLUDED.apoderado1_id,
            apoderado2_id = EXCLUDED.apoderado2_id,
            updated_at = NOW()
    `;
}

export async function searchPersons(query: string): Promise<Person[]> {
    const sql = getSql();
    const q = `%${query}%`;
    const rows = await sql`
        SELECT * FROM persons
        WHERE (documento ILIKE ${q} OR nombre ILIKE ${q})
        ORDER BY nombre
        LIMIT 20
    `;
    return (rows as PersonRow[]).map((row) => ({
        id: row.id,
        nombre: row.nombre,
        tipoDoc: row.tipo_doc ?? "",
        documento: row.documento ?? "",
        domicilio: row.domicilio ?? "",
        telefono: row.telefono ?? "",
    }));
}

export async function getAllMembers(): Promise<Member[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT m.*,
               ap1.nombre AS apoderado1_nombre,
               ap1.tipo_doc AS apoderado1_tipo_doc,
               ap1.documento AS apoderado1_documento,
               ap1.domicilio AS apoderado1_domicilio,
               ap1.telefono AS apoderado1_telefono,
               ap2.nombre AS apoderado2_nombre,
               ap2.tipo_doc AS apoderado2_tipo_doc,
               ap2.documento AS apoderado2_documento,
               ap2.domicilio AS apoderado2_domicilio,
               ap2.telefono AS apoderado2_telefono
        FROM members m
        LEFT JOIN persons ap1 ON m.apoderado1_id = ap1.id
        LEFT JOIN persons ap2 ON m.apoderado2_id = ap2.id
        ORDER BY
            NULLIF(regexp_replace(m.numero_de_socio, '[^0-9]', '', 'g'), '')::int NULLS LAST,
            m.numero_de_socio
    `;
    return (rows as MemberRow[]).map(rowToMember);
}

export async function getMemberById(id: string): Promise<Member | null> {
    const sql = getSql();
    const rows = (await sql`
        SELECT m.*,
               ap1.nombre AS apoderado1_nombre,
               ap1.tipo_doc AS apoderado1_tipo_doc,
               ap1.documento AS apoderado1_documento,
               ap1.domicilio AS apoderado1_domicilio,
               ap1.telefono AS apoderado1_telefono,
               ap2.nombre AS apoderado2_nombre,
               ap2.tipo_doc AS apoderado2_tipo_doc,
               ap2.documento AS apoderado2_documento,
               ap2.domicilio AS apoderado2_domicilio,
               ap2.telefono AS apoderado2_telefono
        FROM members m
        LEFT JOIN persons ap1 ON m.apoderado1_id = ap1.id
        LEFT JOIN persons ap2 ON m.apoderado2_id = ap2.id
        WHERE m.id = ${id} LIMIT 1
    `) as MemberRow[];
    const row = rows[0];
    return row ? rowToMember(row) : null;
}

export async function getMemberByNumeroDeSocio(numero: string): Promise<Member | null> {
    const sql = getSql();
    const rows = (await sql`
        SELECT m.*,
               ap1.nombre AS apoderado1_nombre,
               ap1.tipo_doc AS apoderado1_tipo_doc,
               ap1.documento AS apoderado1_documento,
               ap1.domicilio AS apoderado1_domicilio,
               ap1.telefono AS apoderado1_telefono,
               ap2.nombre AS apoderado2_nombre,
               ap2.tipo_doc AS apoderado2_tipo_doc,
               ap2.documento AS apoderado2_documento,
               ap2.domicilio AS apoderado2_domicilio,
               ap2.telefono AS apoderado2_telefono
        FROM members m
        LEFT JOIN persons ap1 ON m.apoderado1_id = ap1.id
        LEFT JOIN persons ap2 ON m.apoderado2_id = ap2.id
        WHERE m.numero_de_socio = ${numero} LIMIT 1
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

    const resolvedMember = { ...member };

    if (member.apoderado1) {
        const personId = await upsertPerson(member.apoderado1);
        if (personId) {
            resolvedMember.apoderado1 = { ...member.apoderado1, id: personId };
        }
    }
    if (member.apoderado2) {
        const personId = await upsertPerson(member.apoderado2);
        if (personId) {
            resolvedMember.apoderado2 = { ...member.apoderado2, id: personId };
        }
    }

    await upsertMemberQuery(sql, memberToRow(resolvedMember));
}

export async function deleteMemberById(id: string): Promise<void> {
    const sql = getSql();
    await sql`DELETE FROM members WHERE id = ${id}`;
}

function resolveApoderado(
    apoderado: Person,
    seenCache: Map<string, string>,
): Promise<string | null> {
    if (apoderado.documento?.trim()) {
        const doc = apoderado.documento.trim();
        const cached = seenCache.get(doc);
        if (cached) return Promise.resolve(cached);
        return upsertPerson(apoderado).then((id) => {
            if (id) seenCache.set(doc, id);
            return id;
        });
    }
    return upsertPerson(apoderado);
}

export async function insertMembers(members: Member[]): Promise<InsertMembersResult> {
    const issues: SeedIssue[] = [];
    let successCount = 0;

    const seenDocs = new Map<string, string>();

    for (const member of members) {
        try {
            const resolvedMember = { ...member };

            if (member.apoderado1?.nombre?.trim()) {
                const personId = await resolveApoderado(member.apoderado1, seenDocs);
                if (personId) {
                    resolvedMember.apoderado1 = { ...member.apoderado1, id: personId };
                }
            }
            if (member.apoderado2?.nombre?.trim()) {
                const personId = await resolveApoderado(member.apoderado2, seenDocs);
                if (personId) {
                    resolvedMember.apoderado2 = { ...member.apoderado2, id: personId };
                }
            }

            await upsertMemberQuery(getSql(), memberToRow(resolvedMember));
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

export async function getFamilyMembers(memberId: string): Promise<Member[]> {
    const sql = getSql();
    const current = await getMemberById(memberId);
    if (!current) return [];
    let raw = current.nroFamilia?.trim();
    if (!raw) {
        const partes = current.numeroDeSocio.split("/");
        if (partes.length >= 2) raw = partes[0];
    }
    if (!raw) return [];
    const familyGroup = raw.split("/")[0];
    const rows = (await sql`
        SELECT m.*,
               ap1.nombre AS apoderado1_nombre,
               ap1.tipo_doc AS apoderado1_tipo_doc,
               ap1.documento AS apoderado1_documento,
               ap1.domicilio AS apoderado1_domicilio,
               ap1.telefono AS apoderado1_telefono,
               ap2.nombre AS apoderado2_nombre,
               ap2.tipo_doc AS apoderado2_tipo_doc,
               ap2.documento AS apoderado2_documento,
               ap2.domicilio AS apoderado2_domicilio,
               ap2.telefono AS apoderado2_telefono
        FROM members m
        LEFT JOIN persons ap1 ON m.apoderado1_id = ap1.id
        LEFT JOIN persons ap2 ON m.apoderado2_id = ap2.id
        WHERE m.nro_familia LIKE ${familyGroup + "/%"}
           OR m.nro_familia = ${familyGroup}
        ORDER BY m.numero_de_socio
    `) as MemberRow[];
    return rows.map(rowToMember);
}

export async function updateVitalicios(): Promise<number> {
    const sql = getSql();
    const result = await sql`
        UPDATE members
        SET tipo_socio = 'VIT', updated_at = NOW()
        WHERE fallecido = FALSE
          AND (fecha_baja IS NULL OR fecha_baja = '')
          AND tipo_socio IS DISTINCT FROM 'VIT'
          AND edad ~ '^[0-9]+$'
          AND CAST(edad AS INTEGER) >= 80
          AND fecha_ingreso IS NOT NULL
          AND fecha_ingreso != ''
          AND EXTRACT(YEAR FROM AGE(
              CURRENT_DATE,
              CASE
                  WHEN fecha_ingreso ~ '^\d{2}/\d{2}/\d{4}$' THEN TO_DATE(fecha_ingreso, 'DD/MM/YYYY')
                  WHEN fecha_ingreso ~ '^\d{4}-\d{2}-\d{2}$' THEN TO_DATE(fecha_ingreso, 'YYYY-MM-DD')
                  ELSE NULL
              END
          )) >= 35
    `;
    return (result as { rowCount: number }).rowCount ?? 0;
}
