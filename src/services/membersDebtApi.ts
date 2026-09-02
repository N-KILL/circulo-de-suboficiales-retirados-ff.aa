export type MembersDebtStatus = {
    members: Record<string, string | null>;
    consideration_years: number;
};

import { getOrFetch, invalidate, CACHE_KEY } from "./apiCache";

export async function fetchMembersDebtStatus(): Promise<MembersDebtStatus> {
    return getOrFetch(CACHE_KEY.membersDebtStatus, async () => {
        const response = await fetch("/api/members/debt-status");
        if (!response.ok) {
            const body = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(body?.error ?? "Error al cargar estado de deuda");
        }
        return response.json() as Promise<MembersDebtStatus>;
    });
}

export function invalidateMembersDebtStatus(): void {
    invalidate(CACHE_KEY.membersDebtStatus);
}
