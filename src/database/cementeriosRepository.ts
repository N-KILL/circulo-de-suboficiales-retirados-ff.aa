import type { Cementerio } from "../models/members";
import { getSql } from "./connection";
import type { CementerioRow } from "./types";

export type CementerioSeedIssue = {
    csvLine: number;
    arrendatario: string;
    nicho: string;
    reason: string;
    phase: "parse" | "insert";
};

export type InsertCementeriosResult = {
    successCount: number;
    issues: CementerioSeedIssue[];
};

export async function searchMemberByNombre(nombre: string): Promise<{ id: string; numero_de_socio: string } | null> {
    const sql = getSql();

    const exact = await sql`
        SELECT id, numero_de_socio FROM members
        WHERE nombre = ${nombre.trim()}
        LIMIT 1
    ` as { id: string; numero_de_socio: string }[];
    if (exact.length > 0) return exact[0];

    const normalized = nombre.trim().replace(/\s+/g, " ");
    const ilike = await sql`
        SELECT id, numero_de_socio FROM members
        WHERE REPLACE(nombre, '  ', ' ') ILIKE ${normalized}
        LIMIT 1
    ` as { id: string; numero_de_socio: string }[];
    if (ilike.length > 0) return ilike[0];

    const fuzzy = await sql`
        SELECT id, numero_de_socio FROM members
        WHERE nombre ILIKE ${`%${normalized}%`}
        LIMIT 1
    ` as { id: string; numero_de_socio: string }[];
    if (fuzzy.length > 0) return fuzzy[0];

    return null;
}

export function rowToCementerio(row: CementerioRow): Cementerio {
    return {
        id: row.id,
        nicho: row.nicho ?? "",
        folio: row.folio ?? "",
        tipo: row.tipo ?? "",
        ocupante: row.ocupante ?? "",
        numeroOrden: row.numero_orden ?? "",
        tieneLapida: row.tiene_lapida,
        esSocio: row.es_socio,
        socioId: row.socio_id,
        personaId: row.persona_id,
        pagaPor: row.paga_por ?? "",
        anioDeGracia: row.anio_de_gracia ?? "",
        contratoNro: row.contrato_nro ?? "",
        contratoPorAnios: row.contrato_por_anios ?? "",
        anioVencContrato: row.anio_venc_contrato ?? "",
        ultimoPago: row.ultimo_pago ?? "",
        planDePago: row.plan_de_pago ?? "",
        fechaDePago: row.fecha_de_pago ?? "",
        telefono: row.telefono ?? "",
        nombreAlternativo: row.nombre_alternativo ?? "",
        fechaFallecimiento: row.fecha_fallecimiento ?? "",
        reducir: "",
        debeAnios: "",
    };
}

export function cementerioToRow(cementerio: Cementerio) {
    return {
        id: cementerio.id,
        nicho: cementerio.nicho || null,
        folio: cementerio.folio || null,
        tipo: cementerio.tipo || null,
        ocupante: cementerio.ocupante || null,
        numero_orden: cementerio.numeroOrden || null,
        tiene_lapida: cementerio.tieneLapida,
        es_socio: cementerio.esSocio,
        socio_id: cementerio.socioId ?? null,
        persona_id: cementerio.personaId ?? null,
        paga_por: cementerio.pagaPor || null,
        anio_de_gracia: cementerio.anioDeGracia || null,
        contrato_nro: cementerio.contratoNro || null,
        contrato_por_anios: cementerio.contratoPorAnios || null,
        anio_venc_contrato: cementerio.anioVencContrato || null,
        ultimo_pago: cementerio.ultimoPago || null,
        plan_de_pago: cementerio.planDePago || null,
        fecha_de_pago: cementerio.fechaDePago || null,
        telefono: cementerio.telefono || null,
        nombre_alternativo: cementerio.nombreAlternativo || null,
        fecha_fallecimiento: cementerio.fechaFallecimiento || null,
    };
}

function formatDbError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

export type CementerioGridItem = {
    nicho: string;
    cantOcupantes: number;
    arrendatario: string;
    telefono: string;
    pagaPor: string;
    ultimoPago: string;
    fechaDePago: string;
};

export async function getAllCementeriosGrid(): Promise<CementerioGridItem[]> {
    const sql = getSql();
    type Raw = {
        nicho: string;
        cant_ocupantes: number;
        arrendatario: string;
        telefono: string;
        paga_por: string;
        ultimo_pago: string;
        fecha_de_pago: string;
    };
    const rows = await sql`
        SELECT
            c.nicho,
            COUNT(*)::int AS cant_ocupantes,
            COALESCE(p.nombre, m.nombre) AS arrendatario,
            MAX(c.telefono) AS telefono,
            MAX(c.paga_por) AS paga_por,
            MAX(c.ultimo_pago) AS ultimo_pago,
            MAX(c.fecha_de_pago) AS fecha_de_pago
        FROM cementerios c
        LEFT JOIN persons p ON c.persona_id = p.id
        LEFT JOIN members m ON c.socio_id = m.id
        GROUP BY c.nicho, COALESCE(p.nombre, m.nombre)
        ORDER BY c.nicho
    ` as Raw[];
    return rows.map((r) => ({
        nicho: r.nicho ?? "",
        cantOcupantes: r.cant_ocupantes,
        arrendatario: r.arrendatario ?? "",
        telefono: r.telefono ?? "",
        pagaPor: r.paga_por ?? "",
        ultimoPago: r.ultimo_pago ?? "",
        fechaDePago: r.fecha_de_pago ?? "",
    }));
}

export type CementerioDetalleRecord = Cementerio & { personaNombre: string; personaDomicilio: string };

export async function getCementeriosByNicho(nicho: string): Promise<CementerioDetalleRecord[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT
            c.*,
            COALESCE(p.nombre, m.nombre) AS persona_nombre,
            COALESCE(p.domicilio, CONCAT(m.domicilio, ' (', m.localidad, ')')) AS persona_domicilio
        FROM cementerios c
        LEFT JOIN persons p ON c.persona_id = p.id
        LEFT JOIN members m ON c.socio_id = m.id
        WHERE c.nicho = ${nicho}
        ORDER BY c.created_at
    ` as (CementerioRow & { persona_nombre: string; persona_domicilio: string })[];
    return rows.map((r) => ({
        ...rowToCementerio(r),
        personaNombre: r.persona_nombre ?? "",
        personaDomicilio: r.persona_domicilio ?? "",
    }));
}

export async function updateCementerio(
    id: string,
    data: Partial<Omit<Cementerio, "id" | "reducir" | "debeAnios">>
): Promise<void> {
    const sql = getSql();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nicho !== undefined) { fields.push(`nicho = $${idx++}`); values.push(data.nicho || null); }
    if (data.folio !== undefined) { fields.push(`folio = $${idx++}`); values.push(data.folio || null); }
    if (data.tipo !== undefined) { fields.push(`tipo = $${idx++}`); values.push(data.tipo || null); }
    if (data.ocupante !== undefined) { fields.push(`ocupante = $${idx++}`); values.push(data.ocupante || null); }
    if (data.numeroOrden !== undefined) { fields.push(`numero_orden = $${idx++}`); values.push(data.numeroOrden || null); }
    if (data.tieneLapida !== undefined) { fields.push(`tiene_lapida = $${idx++}`); values.push(data.tieneLapida); }
    if (data.esSocio !== undefined) { fields.push(`es_socio = $${idx++}`); values.push(data.esSocio); }
    if (data.socioId !== undefined) { fields.push(`socio_id = $${idx++}`); values.push(data.socioId ?? null); }
    if (data.personaId !== undefined) { fields.push(`persona_id = $${idx++}`); values.push(data.personaId ?? null); }
    if (data.pagaPor !== undefined) { fields.push(`paga_por = $${idx++}`); values.push(data.pagaPor || null); }
    if (data.anioDeGracia !== undefined) { fields.push(`anio_de_gracia = $${idx++}`); values.push(data.anioDeGracia || null); }
    if (data.contratoNro !== undefined) { fields.push(`contrato_nro = $${idx++}`); values.push(data.contratoNro || null); }
    if (data.contratoPorAnios !== undefined) { fields.push(`contrato_por_anios = $${idx++}`); values.push(data.contratoPorAnios || null); }
    if (data.anioVencContrato !== undefined) { fields.push(`anio_venc_contrato = $${idx++}`); values.push(data.anioVencContrato || null); }
    if (data.ultimoPago !== undefined) { fields.push(`ultimo_pago = $${idx++}`); values.push(data.ultimoPago || null); }
    if (data.planDePago !== undefined) { fields.push(`plan_de_pago = $${idx++}`); values.push(data.planDePago || null); }
    if (data.fechaDePago !== undefined) { fields.push(`fecha_de_pago = $${idx++}`); values.push(data.fechaDePago || null); }
    if (data.telefono !== undefined) { fields.push(`telefono = $${idx++}`); values.push(data.telefono || null); }
    if (data.nombreAlternativo !== undefined) { fields.push(`nombre_alternativo = $${idx++}`); values.push(data.nombreAlternativo || null); }
    if (data.fechaFallecimiento !== undefined) { fields.push(`fecha_fallecimiento = $${idx++}`); values.push(data.fechaFallecimiento || null); }

    fields.push(`updated_at = NOW()`);

    await sql.unsafe(
        `UPDATE cementerios SET ${fields.join(", ")} WHERE id = $${idx}`,
    );
}

export async function insertCementerios(cementerios: Cementerio[]): Promise<InsertCementeriosResult> {
    const issues: CementerioSeedIssue[] = [];
    let successCount = 0;

    for (const c of cementerios) {
        try {
            const row = cementerioToRow(c);
            const sql = getSql();
            await sql`
                INSERT INTO cementerios (
                    id, nicho, folio, tipo, ocupante, numero_orden, tiene_lapida, es_socio,
                    socio_id, persona_id, paga_por, anio_de_gracia, contrato_nro,
                    contrato_por_anios, anio_venc_contrato, ultimo_pago,
                    plan_de_pago, fecha_de_pago, telefono, nombre_alternativo,
                    fecha_fallecimiento
                ) VALUES (
                    ${row.id}, ${row.nicho}, ${row.folio}, ${row.tipo},
                    ${row.ocupante}, ${row.numero_orden}, ${row.tiene_lapida}, ${row.es_socio},
                    ${row.socio_id}, ${row.persona_id}, ${row.paga_por},
                    ${row.anio_de_gracia}, ${row.contrato_nro}, ${row.contrato_por_anios},
                    ${row.anio_venc_contrato}, ${row.ultimo_pago},
                    ${row.plan_de_pago}, ${row.fecha_de_pago}, ${row.telefono},
                    ${row.nombre_alternativo}, ${row.fecha_fallecimiento}
                )
                ON CONFLICT (id) DO UPDATE SET
                    nicho = EXCLUDED.nicho,
                    folio = EXCLUDED.folio,
                    tipo = EXCLUDED.tipo,
                    ocupante = EXCLUDED.ocupante,
                    numero_orden = EXCLUDED.numero_orden,
                    tiene_lapida = EXCLUDED.tiene_lapida,
                    es_socio = EXCLUDED.es_socio,
                    socio_id = EXCLUDED.socio_id,
                    persona_id = EXCLUDED.persona_id,
                    paga_por = EXCLUDED.paga_por,
                    anio_de_gracia = EXCLUDED.anio_de_gracia,
                    contrato_nro = EXCLUDED.contrato_nro,
                    contrato_por_anios = EXCLUDED.contrato_por_anios,
                    anio_venc_contrato = EXCLUDED.anio_venc_contrato,
                    ultimo_pago = EXCLUDED.ultimo_pago,
                    plan_de_pago = EXCLUDED.plan_de_pago,
                    fecha_de_pago = EXCLUDED.fecha_de_pago,
                    telefono = EXCLUDED.telefono,
                    nombre_alternativo = EXCLUDED.nombre_alternativo,
                    fecha_fallecimiento = EXCLUDED.fecha_fallecimiento,
                    updated_at = NOW()
            `;
            successCount++;
        } catch (error) {
            issues.push({
                csvLine: 0,
                arrendatario: "",
                nicho: c.nicho,
                reason: `error al insertar en BD: ${formatDbError(error)}`,
                phase: "insert",
            });
        }
    }

    return { successCount, issues };
}
