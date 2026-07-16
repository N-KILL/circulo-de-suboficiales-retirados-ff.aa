import { getSql } from "./connection.js";

const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

export type InitialBalances = {
    id: string;
    caja_chica: number;
    banco: number;
};

export async function ensureInitialBalancesTable(): Promise<void> {
    const sql = getSql();
    await sql`
        CREATE TABLE IF NOT EXISTS initial_balances (
            id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
            caja_chica  NUMERIC(12,2)   NOT NULL DEFAULT 0,
            banco       NUMERIC(12,2)   NOT NULL DEFAULT 0,
            updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
        )
    `;
}

export async function getInitialBalances(): Promise<InitialBalances | null> {
    await ensureInitialBalancesTable();
    const sql = getSql();
    const rows = (await sql`
        SELECT id, caja_chica::float as caja_chica, banco::float as banco
        FROM initial_balances
        LIMIT 1
    `) as InitialBalances[];
    const row = rows[0];
    return row ?? null;
}

export async function upsertInitialBalances(
    caja_chica: number,
    banco: number
): Promise<InitialBalances> {
    await ensureInitialBalancesTable();
    const sql = getSql();
    const rows = (await sql`
        INSERT INTO initial_balances (id, caja_chica, banco)
        VALUES (${SINGLETON_ID}, ${caja_chica}, ${banco})
        ON CONFLICT (id) DO UPDATE SET
            caja_chica = EXCLUDED.caja_chica,
            banco = EXCLUDED.banco,
            updated_at = NOW()
        RETURNING id, caja_chica::float as caja_chica, banco::float as banco
    `) as InitialBalances[];
    return rows[0];
}
