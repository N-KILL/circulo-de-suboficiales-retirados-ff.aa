import { randomUUID } from "node:crypto";
import { getSql } from "./connection";

export type DueRow = {
    id: string;
    type: "socio" | "cementerio";
    payment_date: string;
    period_start: string | null;
    period_end: string | null;
    member_id: string | null;
    person_id: string | null;
    movement_id: string | null;
    family_group: string | null;
    paid_members: string[] | null;
    created_at: string;
};

export type DueWithDetails = {
    id: string;
    type: "socio" | "cementerio";
    payment_date: string;
    period_start: string | null;
    period_end: string | null;
    member_id: string | null;
    member_nombre: string | null;
    member_numero_de_socio: string | null;
    person_id: string | null;
    person_nombre: string | null;
    movement_id: string | null;
    amount: number | null;
    family_group: string | null;
    paid_members: string[] | null;
    created_at: string;
};

function parsePaidMembers(val: unknown): string[] | null {
    if (!val) return null;
    if (Array.isArray(val)) return val as string[];
    if (typeof val === "string") {
        try { return JSON.parse(val) as string[]; }
        catch { return null; }
    }
    return null;
}

export async function migrateDuesSchema(): Promise<void> {
    const sql = getSql();
    await sql`
        CREATE TABLE IF NOT EXISTS dues (
            id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
            type            VARCHAR(20)     NOT NULL,
            payment_date    DATE            NOT NULL,
            member_id       UUID            REFERENCES members(id) ON DELETE SET NULL,
            person_id       UUID            REFERENCES persons(id) ON DELETE SET NULL,
            movement_id     UUID            REFERENCES petty_cash(id) ON DELETE SET NULL,
            created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
        )
    `;
    await sql`
        CREATE INDEX IF NOT EXISTS idx_dues_member_id ON dues (member_id)
    `;
    await sql`
        CREATE INDEX IF NOT EXISTS idx_dues_person_id ON dues (person_id)
    `;
    await sql`
        CREATE INDEX IF NOT EXISTS idx_dues_type ON dues (type)
    `;
    await sql`
        ALTER TABLE dues ADD COLUMN IF NOT EXISTS family_group VARCHAR(50)
    `;
    await sql`
        ALTER TABLE dues ADD COLUMN IF NOT EXISTS paid_members JSONB DEFAULT '[]'::jsonb
    `;
    await sql`
        ALTER TABLE dues ADD COLUMN IF NOT EXISTS period_start DATE
    `;
    await sql`
        ALTER TABLE dues ADD COLUMN IF NOT EXISTS period_end DATE
    `;
}

export async function insertDue(due: {
    type: "socio" | "cementerio";
    payment_date: string;
    period_start?: string | null;
    period_end?: string | null;
    member_id?: string | null;
    person_id?: string | null;
    movement_id?: string | null;
    family_group?: string | null;
    paid_members?: string[] | null;
}): Promise<string> {
    const sql = getSql();
    const id = randomUUID();
    const paidMembers = due.paid_members && due.paid_members.length > 0
        ? JSON.stringify(due.paid_members)
        : null;
    await sql`
        INSERT INTO dues (id, type, payment_date, period_start, period_end, member_id, person_id, movement_id, family_group, paid_members)
        VALUES (${id}, ${due.type}, ${due.payment_date}, ${due.period_start ?? null}, ${due.period_end ?? null}, ${due.member_id ?? null}, ${due.person_id ?? null}, ${due.movement_id ?? null}, ${due.family_group ?? null}, ${paidMembers})
    `;
    return id;
}

async function mapDues(rows: any): Promise<DueWithDetails[]> {
    return (rows as any[]).map((r: Record<string, unknown>) => ({
        ...r,
        paid_members: parsePaidMembers(r.paid_members),
    })) as DueWithDetails[];
}

export async function getDuesByMember(memberId: string): Promise<DueWithDetails[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT
            d.id,
            d.type,
            d.payment_date::text as payment_date,
            d.period_start::text as period_start,
            d.period_end::text as period_end,
            d.member_id,
            m.nombre AS member_nombre,
            m.numero_de_socio AS member_numero_de_socio,
            d.person_id,
            p.nombre AS person_nombre,
            d.movement_id,
            pc.amount::float AS amount,
            d.family_group,
            d.paid_members,
            d.created_at::text as created_at
        FROM dues d
        LEFT JOIN members m ON d.member_id = m.id
        LEFT JOIN persons p ON d.person_id = p.id
        LEFT JOIN petty_cash pc ON d.movement_id = pc.id
        WHERE d.member_id = ${memberId}
           OR d.paid_members::jsonb ? ${memberId}
        ORDER BY d.payment_date DESC, d.created_at DESC
    `;
    return mapDues(rows);
}

export async function getDuesByPerson(personId: string): Promise<DueWithDetails[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT
            d.id,
            d.type,
            d.payment_date::text as payment_date,
            d.period_start::text as period_start,
            d.period_end::text as period_end,
            d.member_id,
            m.nombre AS member_nombre,
            m.numero_de_socio AS member_numero_de_socio,
            d.person_id,
            p.nombre AS person_nombre,
            d.movement_id,
            pc.amount::float AS amount,
            d.family_group,
            d.paid_members,
            d.created_at::text as created_at
        FROM dues d
        LEFT JOIN members m ON d.member_id = m.id
        LEFT JOIN persons p ON d.person_id = p.id
        LEFT JOIN petty_cash pc ON d.movement_id = pc.id
        WHERE d.person_id = ${personId}
        ORDER BY d.payment_date DESC, d.created_at DESC
    `;
    return mapDues(rows);
}

export async function getAllDues(): Promise<DueWithDetails[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT
            d.id,
            d.type,
            d.payment_date::text as payment_date,
            d.period_start::text as period_start,
            d.period_end::text as period_end,
            d.member_id,
            m.nombre AS member_nombre,
            m.numero_de_socio AS member_numero_de_socio,
            d.person_id,
            p.nombre AS person_nombre,
            d.movement_id,
            pc.amount::float AS amount,
            d.family_group,
            d.paid_members,
            d.created_at::text as created_at
        FROM dues d
        LEFT JOIN members m ON d.member_id = m.id
        LEFT JOIN persons p ON d.person_id = p.id
        LEFT JOIN petty_cash pc ON d.movement_id = pc.id
        ORDER BY d.payment_date DESC, d.created_at DESC
    `;
    return mapDues(rows);
}

export async function getDueByMovementId(movementId: string): Promise<DueWithDetails | null> {
    const sql = getSql();
    const rows = await sql`
        SELECT
            d.id,
            d.type,
            d.payment_date::text as payment_date,
            d.period_start::text as period_start,
            d.period_end::text as period_end,
            d.member_id,
            m.nombre AS member_nombre,
            m.numero_de_socio AS member_numero_de_socio,
            d.person_id,
            p.nombre AS person_nombre,
            d.movement_id,
            pc.amount::float AS amount,
            d.family_group,
            d.paid_members,
            d.created_at::text as created_at
        FROM dues d
        LEFT JOIN members m ON d.member_id = m.id
        LEFT JOIN persons p ON d.person_id = p.id
        LEFT JOIN petty_cash pc ON d.movement_id = pc.id
        WHERE d.movement_id = ${movementId}
        LIMIT 1
    `;
    const mapped = await mapDues(rows);
    return mapped.length > 0 ? mapped[0] : null;
}

export async function deleteDueByMovementId(movementId: string): Promise<boolean> {
    const sql = getSql();
    const result = await sql`
        DELETE FROM dues WHERE movement_id = ${movementId}
    `;
    return (result as any)?.count > 0;
}

export async function updateDueByMovementId(
    movementId: string,
    data: { period_start?: string | null; period_end?: string | null; paid_members?: string[] | null }
): Promise<void> {
    const sql = getSql();
    const paidMembers = data.paid_members && data.paid_members.length > 0
        ? JSON.stringify(data.paid_members)
        : null;
    await sql`
        UPDATE dues SET
            period_start = COALESCE(${data.period_start ?? null}, period_start),
            period_end = COALESCE(${data.period_end ?? null}, period_end),
            paid_members = COALESCE(${paidMembers}, paid_members)
        WHERE movement_id = ${movementId}
    `;
}

export async function getDuesByMemberWithCemeteryCheck(memberId: string): Promise<{
    hasCementerio: boolean;
    dues: DueWithDetails[];
}> {
    const sql = getSql();
    const [cementerioResult, dues] = await Promise.all([
        sql`SELECT COUNT(*)::int AS count FROM cementerios WHERE socio_id = ${memberId}` as unknown as { count: number }[],
        getDuesByMember(memberId),
    ]);
    return {
        hasCementerio: cementerioResult[0]?.count > 0,
        dues,
    };
}
