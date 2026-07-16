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
    return (rows as any[]).map((r) => ({
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
        WHERE cm.nicho = ${nicho}
        ORDER BY cm.fecha_pago DESC, cm.created_at DESC
    `;
    return (rows as any[]).map((r) => ({
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
    return id;
}

export async function deleteCementerioMovimientosByMovement(movementId: string): Promise<void> {
    const sql = getSql();
    await sql`DELETE FROM cementerio_movimientos WHERE movement_id = ${movementId}`;
}

export async function hasCementerioMovimientosByNicho(nicho: string): Promise<boolean> {
    const sql = getSql();
    const rows = await sql`SELECT 1 FROM cementerio_movimientos WHERE nicho = ${nicho} LIMIT 1` as unknown[];
    return rows.length > 0;
}
