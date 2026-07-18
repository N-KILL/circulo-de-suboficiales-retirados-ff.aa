import { getSql } from "./connection.js";

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
    asistencial_fee: number;
    plan_salud_fee: number;
    fee_act: number;
    fee_act_a: number;
    fee_adh: number;
    fee_part: number;
    fee_vit: number;
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
    asistencial_fee: number;
    plan_salud_fee: number;
    fee_act: number;
    fee_act_a: number;
    fee_adh: number;
    fee_part: number;
    fee_vit: number;
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
            asistencial_fee         NUMERIC(12,2)   NOT NULL DEFAULT 0,
            plan_salud_fee          NUMERIC(12,2)   NOT NULL DEFAULT 0,
            fee_act                 NUMERIC(12,2)   NOT NULL DEFAULT 0,
            fee_act_a               NUMERIC(12,2)   NOT NULL DEFAULT 0,
            fee_adh                 NUMERIC(12,2)   NOT NULL DEFAULT 0,
            fee_part                NUMERIC(12,2)   NOT NULL DEFAULT 0,
            fee_vit                 NUMERIC(12,2)   NOT NULL DEFAULT 0,
            updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
        )
    `;
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS consideration_years INT NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS nicho_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS nicho_non_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS urna_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS urna_non_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS bolsa_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS bolsa_non_member_fee NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS asistencial_fee NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS plan_salud_fee NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS fee_act NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS fee_act_a NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS fee_adh NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS fee_part NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
    await sql`ALTER TABLE pricing ADD COLUMN IF NOT EXISTS fee_vit NUMERIC(12,2) NOT NULL DEFAULT 0`.catch(() => {});
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
        asistencial_fee: row.asistencial_fee,
        plan_salud_fee: row.plan_salud_fee,
        fee_act: row.fee_act,
        fee_act_a: row.fee_act_a,
        fee_adh: row.fee_adh,
        fee_part: row.fee_part,
        fee_vit: row.fee_vit,
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
            bolsa_non_member_fee::float as bolsa_non_member_fee,
            asistencial_fee::float as asistencial_fee,
            plan_salud_fee::float as plan_salud_fee,
            fee_act::float as fee_act,
            fee_act_a::float as fee_act_a,
            fee_adh::float as fee_adh,
            fee_part::float as fee_part,
            fee_vit::float as fee_vit
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
    asistencial_fee: number = 0,
    plan_salud_fee: number = 0,
    fee_act: number = 0,
    fee_act_a: number = 0,
    fee_adh: number = 0,
    fee_part: number = 0,
    fee_vit: number = 0,
): Promise<DuesConfig> {
    await ensurePricingTable();
    const sql = getSql();
    const rows = (await sql`
        INSERT INTO pricing (id, member_fee, consideration_years,
            nicho_member_fee, nicho_non_member_fee,
            urna_member_fee, urna_non_member_fee,
            bolsa_member_fee, bolsa_non_member_fee,
            asistencial_fee, plan_salud_fee,
            fee_act, fee_act_a, fee_adh, fee_part, fee_vit)
        VALUES (${SINGLETON_ID}, ${member_fee}, ${consideration_years},
            ${nicho_member_fee}, ${nicho_non_member_fee},
            ${urna_member_fee}, ${urna_non_member_fee},
            ${bolsa_member_fee}, ${bolsa_non_member_fee},
            ${asistencial_fee}, ${plan_salud_fee},
            ${fee_act}, ${fee_act_a}, ${fee_adh}, ${fee_part}, ${fee_vit})
        ON CONFLICT (id) DO UPDATE SET
            member_fee = EXCLUDED.member_fee,
            consideration_years = EXCLUDED.consideration_years,
            nicho_member_fee = EXCLUDED.nicho_member_fee,
            nicho_non_member_fee = EXCLUDED.nicho_non_member_fee,
            urna_member_fee = EXCLUDED.urna_member_fee,
            urna_non_member_fee = EXCLUDED.urna_non_member_fee,
            bolsa_member_fee = EXCLUDED.bolsa_member_fee,
            bolsa_non_member_fee = EXCLUDED.bolsa_non_member_fee,
            asistencial_fee = EXCLUDED.asistencial_fee,
            plan_salud_fee = EXCLUDED.plan_salud_fee,
            fee_act = EXCLUDED.fee_act,
            fee_act_a = EXCLUDED.fee_act_a,
            fee_adh = EXCLUDED.fee_adh,
            fee_part = EXCLUDED.fee_part,
            fee_vit = EXCLUDED.fee_vit,
            updated_at = NOW()
        RETURNING id,
            member_fee::float as member_fee,
            consideration_years,
            nicho_member_fee::float as nicho_member_fee,
            nicho_non_member_fee::float as nicho_non_member_fee,
            urna_member_fee::float as urna_member_fee,
            urna_non_member_fee::float as urna_non_member_fee,
            bolsa_member_fee::float as bolsa_member_fee,
            bolsa_non_member_fee::float as bolsa_non_member_fee,
            asistencial_fee::float as asistencial_fee,
            plan_salud_fee::float as plan_salud_fee,
            fee_act::float as fee_act,
            fee_act_a::float as fee_act_a,
            fee_adh::float as fee_adh,
            fee_part::float as fee_part,
            fee_vit::float as fee_vit
    `) as PricingRow[];
    return mapRow(rows[0]);
}
