import type { Member, Person } from "../models/members";
import { getOrFetch, invalidate, CACHE_KEY } from "./apiCache";

export async function fetchMembers(): Promise<Member[]> {
    return getOrFetch(CACHE_KEY.members, async () => {
        const response = await fetch("/api/members");

        if (!response.ok) {
            const body = (await response.json().catch(() => null)) as {
                error?: string;
            } | null;
            throw new Error(body?.error ?? "No se pudieron cargar los socios");
        }

        return response.json() as Promise<Member[]>;
    });
}

export async function fetchMemberById(id: string): Promise<Member> {
    const response = await fetch(`/api/member?id=${encodeURIComponent(id)}`);

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "No se pudo cargar el socio");
    }

    return response.json() as Promise<Member>;
}

export async function saveMember(member: Member): Promise<void> {
    const response = await fetch("/api/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "Error al guardar el socio");
    }

    invalidate(CACHE_KEY.members);
}

export async function fetchPersons(query: string): Promise<Person[]> {
    const response = await fetch(`/api/persons?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al buscar personas");
    }

    return response.json() as Promise<Person[]>;
}

export async function fetchActiveMembers(query: string): Promise<Member[]> {
    const response = await fetch(`/api/members/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al buscar socios activos");
    }
    return response.json() as Promise<Member[]>;
}

export async function deleteMember(id: string): Promise<void> {
    const response = await fetch(`/api/member?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "Error al eliminar el socio");
    }

    invalidate(CACHE_KEY.members);
}
