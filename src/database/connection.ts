import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | null = null;

function normalizeDatabaseUrl(raw: string): string {
    const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");

    if (trimmed.startsWith("postgres://")) {
        return trimmed.replace("postgres://", "postgresql://");
    }

    return trimmed;
}

export function getDatabaseUrl(): string {
    const raw = process.env.DATABASE_URL;
    if (!raw?.trim()) {
        throw new Error(
            "DATABASE_URL no está configurada. Agregala en tu archivo .env"
        );
    }

    const url = normalizeDatabaseUrl(raw);

    if (!url.startsWith("postgresql://") || !url.includes("@")) {
        throw new Error(
            "DATABASE_URL tiene un formato inválido. En Neon: Dashboard → tu proyecto → Connect → copiá la connection string completa (postgresql://...)"
        );
    }

    return url;
}

export function getSql() {
    if (!sql) {
        sql = neon(getDatabaseUrl());
    }
    return sql;
}
