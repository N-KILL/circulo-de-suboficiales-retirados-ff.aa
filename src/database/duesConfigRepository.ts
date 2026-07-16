import { getSql } from "./connection";

const SINGLETON_ID = "00000000-0000-0000-0000-000000000002";

type PricingRow = {
    id: string;
    member_fee: number;
    consideration_years: number;
    nicho_member_fee: number;
    nicho_non_member_fee: number;
    urna_member_fee: number;
    urna_non_member_fee: number;
    bolsa_member_fee: number;
    bolsa_non_member_fee: number;
};

export type DuesConfig = {
    id: string;
    member_fee: number;
    consideration_years: number;
    nicho_member_fee: number;
    nicho_non_member_fee: number;
    urna_member_fee: number;
    urna_non_member_fee: number;
    bolsa_member_fee: number;
    bolsa_non_member_fee: number;
};

export async function ensurePricingTable(): Promise<void> {
    const sql = getSql();
    await sql`
        CREATE TABLE IF NOT EXISTS pricing (
            id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
            member_fee              NUMERIC(12,2)   NOT NULL DEFAULT 0,
            consideration_years     INT             NOT NULL DEFAULT 0,
            nicho_member_fee        NUMERIC(12,2)   NOT NULL DEFAULT 0,
            nicho_non_member_fee    NUMERIC(12,2)   NOT NULL DEFAULT 0,
            urna_member_fee         NUMERIC(12,2)   NOT NULL DEFAULT 0,
            urna_non_member_fee     NUMERIC(12,2)   NOT NULL DEFAULT 0,
            bolsa_member_fee        NUMERIC(12,2)   NOT NULL DEFAULT 0,
            bolsa_non_member_fee    NUMERIC(12,2)   NOT NULL DEFAULT 0,
            updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
        )
    `;
    await sql`
        ALTER TABLE pricing ADD COLUMN IF NOT EXISTS consideration_years INT NOT NULL DEFAULT 0
    `.catch(() => {});
    await sql`
        ALTER TABLE pricing ADD COLUMN IF NOT EXISTS nicho_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0
    `.catch(() => {});
    await sql`
        ALTER TABLE pricing ADD COLUMN IF NOT EXISTS nicho_non_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0
    `.catch(() => {});
    await sql`
        ALTER TABLE pricing ADD COLUMN IF NOT EXISTS urna_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0
    `.catch(() => {});
    await sql`
        ALTER TABLE pricing ADD COLUMN IF NOT EXISTS urna_non_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0
    `.catch(() => {});
    await sql`
        ALTER TABLE pricing ADD COLUMN IF NOT EXISTS bolsa_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0
    `.catch(() => {});
    await sql`
        ALTER TABLE pricing ADD COLUMN IF NOT EXISTS bolsa_non_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0
    `.catch(() => {});
}

function mapRow(row: PricingRow): DuesConfig {
    return {
        id: row.id,
        member_fee: row.member_fee,
        consideration_years: row.consideration_years,
        nicho_member_fee: row.nicho_member_fee,
        nicho_non_member_fee: row.nicho_non_member_fee,
        urna_member_fee: row.urna_member_fee,
        urna_non_member_fee: row.urna_non_member_fee,
        bolsa_member_fee: row.bolsa_member_fee,
        bolsa_non_member_fee: row.bolsa_non_member_fee,
    };
}

export async function getDuesConfig(): Promise<DuesConfig | null> {
    await ensurePricingTable();
    const sql = getSql();
    const rows = (await sql`
        SELECT id,
            member_fee::float as member_fee,
            consideration_years,
            nicho_member_fee::float as nicho_member_fee,
            nicho_non_member_fee::float as nicho_non_member_fee,
            urna_member_fee::float as urna_member_fee,
            urna_non_member_fee::float as urna_non_member_fee,
            bolsa_member_fee::float as bolsa_member_fee,
            bolsa_non_member_fee::float as bolsa_non_member_fee
        FROM pricing
        LIMIT 1
    `) as PricingRow[];
    if (!rows[0]) return null;
    return mapRow(rows[0]);
}

export async function upsertDuesConfig(
    member_fee: number,
    consideration_years: number = 0,
    nicho_member_fee: number = 0,
    nicho_non_member_fee: number = 0,
    urna_member_fee: number = 0,
    urna_non_member_fee: number = 0,
    bolsa_member_fee: number = 0,
    bolsa_non_member_fee: number = 0,
): Promise<DuesConfig> {
    await ensurePricingTable();
    const sql = getSql();
    const rows = (await sql`
        INSERT INTO pricing (id, member_fee, consideration_years,
            nicho_member_fee, nicho_non_member_fee,
            urna_member_fee, urna_non_member_fee,
            bolsa_member_fee, bolsa_non_member_fee)
        VALUES (${SINGLETON_ID}, ${member_fee}, ${consideration_years},
            ${nicho_member_fee}, ${nicho_non_member_fee},
            ${urna_member_fee}, ${urna_non_member_fee},
            ${bolsa_member_fee}, ${bolsa_non_member_fee})
        ON CONFLICT (id) DO UPDATE SET
            member_fee = EXCLUDED.member_fee,
            consideration_years = EXCLUDED.consideration_years,
            nicho_member_fee = EXCLUDED.nicho_member_fee,
            nicho_non_member_fee = EXCLUDED.nicho_non_member_fee,
            urna_member_fee = EXCLUDED.urna_member_fee,
            urna_non_member_fee = EXCLUDED.urna_non_member_fee,
            bolsa_member_fee = EXCLUDED.bolsa_member_fee,
            bolsa_non_member_fee = EXCLUDED.bolsa_non_member_fee,
            updated_at = NOW()
        RETURNING id,
            member_fee::float as member_fee,
            consideration_years,
            nicho_member_fee::float as nicho_member_fee,
            nicho_non_member_fee::float as nicho_non_member_fee,
            urna_member_fee::float as urna_member_fee,
            urna_non_member_fee::float as urna_non_member_fee,
            bolsa_member_fee::float as bolsa_member_fee,
            bolsa_non_member_fee::float as bolsa_non_member_fee
    `) as PricingRow[];
    return mapRow(rows[0]);
}
