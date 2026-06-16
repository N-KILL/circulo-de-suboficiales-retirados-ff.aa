import type { Member } from "../models/members";

export async function fetchMembers(): Promise<Member[]> {
    const response = await fetch("/api/members");

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "No se pudieron cargar los socios");
    }

    return response.json() as Promise<Member[]>;
}
