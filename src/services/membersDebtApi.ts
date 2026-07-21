import { apiFetch } from "../apiConfig";

export type MembersDebtStatus = {
    members: Record<string, string | null>;
    consideration_years: number;
};

export async function fetchMembersDebtStatus(): Promise<MembersDebtStatus> {
    const response = await apiFetch("/api/members/debt-status");
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al cargar estado de deuda");
    }
    return response.json() as Promise<MembersDebtStatus>;
}
