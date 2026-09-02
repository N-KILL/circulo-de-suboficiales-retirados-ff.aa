import { randomUUID } from "node:crypto";
import { getSql } from "./connection.js";

export type CementerioMovimientoRecord = {
    id: string;
    movement_id: string | null;
    cementerio_id: string | null;
    nicho: string;
    tipo: string | null;
    ocupante: string | null;
    anios_pagados: string[];
    importe: number;
    fecha_pago: string;
    member_id: string | null;
    person_id: string | null;
    created_at: string;
};

export async function getCementerioMovimientosByMovement(movementId: string): Promise<CementerioMovimientoRecord[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT
            cm.id::text,
            cm.movement_id::text,
            cm.cementerio_id::text,
            cm.nicho,
            cm.tipo,
            cm.ocupante,
            cm.anios_pagados,
            cm.importe::float,
            cm.fecha_pago::text,
            cm.member_id::text,
            cm.person_id::text,
            cm.created_at::text
        FROM cementerio_movimientos cm
        WHERE cm.movement_id = ${movementId}
        ORDER BY cm.nicho, cm.created_at
    `;
    return (rows as unknown as CementerioMovimientoRecord[]).map((r) => ({
        id: r.id,
        movement_id: r.movement_id,
        cementerio_id: r.cementerio_id,
        nicho: r.nicho ?? "",
        tipo: r.tipo ?? null,
        ocupante: r.ocupante ?? null,
        anios_pagados: r.anios_pagados ?? [],
        importe: r.importe ?? 0,
        fecha_pago: r.fecha_pago ?? "",
        member_id: r.member_id,
        person_id: r.person_id,
        created_at: r.created_at,
    }));
}

export async function getCementerioMovimientosByNicho(nicho: string): Promise<CementerioMovimientoRecord[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT
            cm.id::text,
            cm.movement_id::text,
            cm.cementerio_id::text,
            cm.nicho,
            cm.tipo,
            cm.ocupante,
            cm.anios_pagados,
            cm.importe::float,
            cm.fecha_pago::text,
            cm.member_id::text,
            cm.person_id::text,
            cm.created_at::text
        FROM cementerio_movimientos cm
        LEFT JOIN petty_cash pc ON cm.movement_id = pc.id
        WHERE cm.nicho = ${nicho}
          AND (pc.anulado = false OR cm.movement_id IS NULL)
        ORDER BY cm.fecha_pago DESC, cm.created_at DESC
    `;
    return (rows as unknown as CementerioMovimientoRecord[]).map((r) => ({
        id: r.id,
        movement_id: r.movement_id,
        cementerio_id: r.cementerio_id,
        nicho: r.nicho ?? "",
        tipo: r.tipo ?? null,
        ocupante: r.ocupante ?? null,
        anios_pagados: r.anios_pagados ?? [],
        importe: r.importe ?? 0,
        fecha_pago: r.fecha_pago ?? "",
        member_id: r.member_id,
        person_id: r.person_id,
        created_at: r.created_at,
    }));
}

export async function getCementerioMovimientosByNichoAndArrendatario(
    nicho: string,
    memberId: string | null,
    personId: string | null,
): Promise<CementerioMovimientoRecord[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT
            cm.id::text,
            cm.movement_id::text,
            cm.cementerio_id::text,
            cm.nicho,
            cm.tipo,
            cm.ocupante,
            cm.anios_pagados,
            cm.importe::float,
            cm.fecha_pago::text,
            cm.member_id::text,
            cm.person_id::text,
            cm.created_at::text
        FROM cementerio_movimientos cm
        LEFT JOIN petty_cash pc ON cm.movement_id = pc.id
        WHERE cm.nicho = ${nicho}
          AND cm.member_id IS NOT DISTINCT FROM ${memberId}
          AND cm.person_id IS NOT DISTINCT FROM ${personId}
          AND (pc.anulado = false OR cm.movement_id IS NULL)
        ORDER BY cm.fecha_pago DESC, cm.created_at DESC
    `;
    return (rows as unknown as CementerioMovimientoRecord[]).map((r) => ({
        id: r.id,
        movement_id: r.movement_id,
        cementerio_id: r.cementerio_id,
        nicho: r.nicho ?? "",
        tipo: r.tipo ?? null,
        ocupante: r.ocupante ?? null,
        anios_pagados: r.anios_pagados ?? [],
        importe: r.importe ?? 0,
        fecha_pago: r.fecha_pago ?? "",
        member_id: r.member_id,
        person_id: r.person_id,
        created_at: r.created_at,
    }));
}

function extractYear(value: string | null | undefined): number | null {
    if (!value) return null;
    const m = String(value).match(/(\d{4})/);
    if (!m) return null;
    const year = parseInt(m[1], 10);
    return Number.isFinite(year) ? year : null;
}

function maxYearPaid(anios: string[] | undefined): number | null {
    let max: number | null = null;
    for (const a of anios ?? []) {
        const year = extractYear(a);
        if (year !== null && (max === null || year > max)) max = year;
    }
    return max;
}

export async function insertCementerioMovimiento(data: {
    movement_id: string;
    cementerio_id: string;
    nicho: string;
    tipo: string | null;
    ocupante: string | null;
    anios_pagados: string[];
    importe: number;
    fecha_pago: string;
    member_id: string | null;
    person_id: string | null;
}): Promise<string> {
    const sql = getSql();
    const id = randomUUID();
    await sql`
        INSERT INTO cementerio_movimientos
            (id, movement_id, cementerio_id, nicho, tipo, ocupante, anios_pagados, importe, fecha_pago, member_id, person_id)
        VALUES
            (${id}, ${data.movement_id}, ${data.cementerio_id}, ${data.nicho}, ${data.tipo ?? null},
             ${data.ocupante ?? null}, ${data.anios_pagados}, ${data.importe}, ${data.fecha_pago},
             ${data.member_id ?? null}, ${data.person_id ?? null})
    `;

    const maxYear = maxYearPaid(data.anios_pagados);
    if (maxYear !== null && data.nicho) {
        const existing = data.cementerio_id
            ? await sql`SELECT ultimo_pago FROM cementerios WHERE id = ${data.cementerio_id}`
            : await sql`SELECT ultimo_pago FROM cementerios WHERE nicho = ${data.nicho}`;
        const rows = existing as { ultimo_pago: string | null }[];
        const currentYear = rows.length > 0
            ? Math.max(...rows.map((r) => extractYear(r.ultimo_pago) ?? 0))
            : 0;
        if (maxYear > currentYear) {
            if (data.cementerio_id) {
                await sql`
                    UPDATE cementerios
                    SET ultimo_pago = ${String(maxYear)},
                        fecha_de_pago = ${data.fecha_pago},
                        updated_at = NOW()
                    WHERE id = ${data.cementerio_id}
                `;
            } else {
                await sql`
                    UPDATE cementerios
                    SET ultimo_pago = ${String(maxYear)},
                        fecha_de_pago = ${data.fecha_pago},
                        updated_at = NOW()
                    WHERE nicho = ${data.nicho}
                `;
            }
        }
    }

    return id;
}

export async function deleteCementerioMovimientosByMovement(movementId: string): Promise<void> {
    const sql = getSql();

    const affected = await sql`
        SELECT DISTINCT nicho FROM cementerio_movimientos WHERE movement_id = ${movementId}
    ` as { nicho: string }[];

    await sql`DELETE FROM cementerio_movimientos WHERE movement_id = ${movementId}`;

    for (const row of affected) {
        const remaining = await sql`
            SELECT anios_pagados
            FROM cementerio_movimientos cm
            LEFT JOIN petty_cash pc ON cm.movement_id = pc.id
            WHERE cm.nicho = ${row.nicho}
              AND (pc.anulado = false OR cm.movement_id IS NULL)
            ORDER BY cm.fecha_pago DESC
        ` as { anios_pagados: string[] }[];

        let bestYear: number | null = null;
        for (const r of remaining) {
            const y = maxYearPaid(r.anios_pagados);
            if (y !== null && (bestYear === null || y > bestYear)) bestYear = y;
        }

        const lastFecha = remaining.length > 0 ? remaining[0].anios_pagados : null;
        const lastPagoFecha = lastFecha ? bestYear !== null ? String(bestYear) : null : null;

        await sql`
            UPDATE cementerios
            SET ultimo_pago = ${lastPagoFecha},
                updated_at = NOW()
            WHERE nicho = ${row.nicho}
        `;
    }
}

export async function hasCementerioMovimientosByNicho(nicho: string): Promise<boolean> {
    const sql = getSql();
    const rows = await sql`
        SELECT 1
        FROM cementerio_movimientos cm
        LEFT JOIN petty_cash pc ON cm.movement_id = pc.id
        WHERE cm.nicho = ${nicho}
          AND (pc.anulado = false OR cm.movement_id IS NULL)
        LIMIT 1
    ` as unknown[];
    return rows.length > 0;
}

export type CementerioPagoInfo = {
    nicho: string;
    memberId: string | null;
    personId: string | null;
    ultimaFechaPago: string;
};

export async function getCementerioPagosMap(): Promise<CementerioPagoInfo[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT
            cm.nicho,
            cm.member_id,
            cm.person_id,
            MAX(cm.fecha_pago) AS ultima_fecha_pago
        FROM cementerio_movimientos cm
        LEFT JOIN petty_cash pc ON cm.movement_id = pc.id
        WHERE (pc.anulado = false OR cm.movement_id IS NULL)
        GROUP BY cm.nicho, cm.member_id, cm.person_id
    ` as { nicho: string; member_id: string | null; person_id: string | null; ultima_fecha_pago: string }[];
    return rows.map((r) => ({
        nicho: r.nicho ?? "",
        memberId: r.member_id ?? null,
        personId: r.person_id ?? null,
        ultimaFechaPago: r.ultima_fecha_pago ?? "",
    }));
}
