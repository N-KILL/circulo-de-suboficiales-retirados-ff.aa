import { randomUUID } from "node:crypto";
import { getSql } from "./connection";

export type PettyCashRow = {
    id: string;
    date: string;
    detail: string;
    amount: number;
    type: "ingreso" | "egreso" | "transferencia";
};

export async function getAllMovements(): Promise<PettyCashRow[]> {
    const sql = getSql();
    // Return sorted ascending so the frontend or store can compute running balance from the beginning.
    const rows = await sql`
        SELECT id, date::text as date, detail, amount::float as amount, type 
        FROM petty_cash 
        ORDER BY date ASC, id ASC
    `;
    return rows as PettyCashRow[];
}

export async function clearAllMovements(): Promise<void> {
    const sql = getSql();
    await sql`TRUNCATE TABLE petty_cash`;
}

export async function insertMovementsBatch(
    movements: { date: string; detail: string; amount: number; type: "ingreso" | "egreso" | "transferencia" }[]
): Promise<number> {
    if (movements.length === 0) return 0;

    const sql = getSql();
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < movements.length; i += batchSize) {
        const batch = movements.slice(i, i + batchSize);
        
        // Build parameterized query dynamically to be safe and fast
        // VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ...
        const valueStrings: string[] = [];
        const values: any[] = [];
        
        batch.forEach((m, idx) => {
            const baseIndex = idx * 5;
            valueStrings.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`);
            // Explicitly generate uuid in code
            values.push(randomUUID());
            // Format date string to match Postgres DATE format, handle empty date as null
            values.push(m.date ? m.date : null);
            values.push(m.detail);
            values.push(m.amount);
            values.push(m.type);
        });

        const queryText = `
            INSERT INTO petty_cash (id, date, detail, amount, type)
            VALUES ${valueStrings.join(", ")}
        `;

        await sql.query(queryText, values);
        insertedCount += batch.length;
    }

    return insertedCount;
}
