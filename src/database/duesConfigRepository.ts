import { getSql } from "./connection";

const SINGLETON_ID = "00000000-0000-0000-0000-000000000002";

type PricingRow = {
    id: string;
    member_fee: number;
    cemetery_fee: number;
};

export type DuesConfig = {
    id: string;
    member_fee: number;
    cemetery_fee: number;
};

export async function ensurePricingTable(): Promise<void> {
    const sql = getSql();
    await sql`
        CREATE TABLE IF NOT EXISTS pricing (
            id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
            member_fee      NUMERIC(12,2)   NOT NULL DEFAULT 0,
            cemetery_fee    NUMERIC(12,2)   NOT NULL DEFAULT 0,
            updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
        )
    `;
}

export async function getDuesConfig(): Promise<DuesConfig | null> {
    await ensurePricingTable();
    const sql = getSql();
    const rows = (await sql`
        SELECT id, member_fee::float as member_fee, cemetery_fee::float as cemetery_fee
        FROM pricing
        LIMIT 1
    `) as PricingRow[];
    if (!rows[0]) return null;
    return {
        id: rows[0].id,
        member_fee: rows[0].member_fee,
        cemetery_fee: rows[0].cemetery_fee,
    };
}

export async function upsertDuesConfig(
    member_fee: number,
    cemetery_fee: number,
): Promise<DuesConfig> {
    await ensurePricingTable();
    const sql = getSql();
    const rows = (await sql`
        INSERT INTO pricing (id, member_fee, cemetery_fee)
        VALUES (${SINGLETON_ID}, ${member_fee}, ${cemetery_fee})
        ON CONFLICT (id) DO UPDATE SET
            member_fee = EXCLUDED.member_fee,
            cemetery_fee = EXCLUDED.cemetery_fee,
            updated_at = NOW()
        RETURNING id, member_fee::float as member_fee, cemetery_fee::float as cemetery_fee
    `) as PricingRow[];
    return {
        id: rows[0].id,
        member_fee: rows[0].member_fee,
        cemetery_fee: rows[0].cemetery_fee,
    };
}
