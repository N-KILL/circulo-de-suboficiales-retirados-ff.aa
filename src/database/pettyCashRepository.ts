import { randomUUID } from "node:crypto";
import { getSql } from "./connection";

export type PettyCashRow = {
    id: string;
    date: string;
    detail: string;
    amount: number;
    type: "ingreso" | "egreso" | "transferencia";
    mode: "efectivo" | "transferencia";
};

export async function migratePettyCashSchema(): Promise<void> {
    const sql = getSql();
    await sql`
        CREATE TABLE IF NOT EXISTS petty_cash (
            id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
            date                DATE            NOT NULL,
            detail              TEXT,
            amount              NUMERIC(12,2)   NOT NULL DEFAULT 0,
            type                VARCHAR(20)     NOT NULL,
            mode                VARCHAR(20)     NOT NULL DEFAULT 'efectivo',
            created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
        )
    `;
    await sql`
        ALTER TABLE petty_cash ADD COLUMN IF NOT EXISTS mode VARCHAR(20) NOT NULL DEFAULT 'efectivo'
    `;
}

export async function getAllMovements(): Promise<PettyCashRow[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT id, date::text as date, detail, amount::float as amount, type, mode
        FROM petty_cash
        ORDER BY date ASC, id ASC
    `;
    return rows as PettyCashRow[];
}

export async function clearAllMovements(): Promise<void> {
    const sql = getSql();
    await sql`TRUNCATE TABLE petty_cash`;
}

export async function insertMovement(movement: {
    date: string;
    detail: string;
    amount: number;
    type: "ingreso" | "egreso" | "transferencia";
    mode: "efectivo" | "transferencia";
}): Promise<void> {
    const sql = getSql();
    await sql`
        INSERT INTO petty_cash (id, date, detail, amount, type, mode)
        VALUES (${randomUUID()}, ${movement.date}, ${movement.detail}, ${movement.amount}, ${movement.type}, ${movement.mode})
    `;
}

export async function insertMovementsBatch(
    movements: {
        date: string;
        detail: string;
        amount: number;
        type: "ingreso" | "egreso" | "transferencia";
        mode: "efectivo" | "transferencia";
    }[]
): Promise<number> {
    if (movements.length === 0) return 0;

    const sql = getSql();
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < movements.length; i += batchSize) {
        const batch = movements.slice(i, i + batchSize);

        const valueStrings: string[] = [];
        const values: any[] = [];

        batch.forEach((m, idx) => {
            const baseIndex = idx * 6;
            valueStrings.push(
                `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`
            );
            values.push(randomUUID());
            values.push(m.date ? m.date : null);
            values.push(m.detail);
            values.push(m.amount);
            values.push(m.type);
            values.push(m.mode);
        });

        const queryText = `
            INSERT INTO petty_cash (id, date, detail, amount, type, mode)
            VALUES ${valueStrings.join(", ")}
        `;

        await sql.query(queryText, values);
        insertedCount += batch.length;
    }

    return insertedCount;
}
