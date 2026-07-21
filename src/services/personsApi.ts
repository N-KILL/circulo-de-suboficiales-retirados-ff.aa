import { apiFetch } from "../apiConfig";
import type { Person } from "../models/members";

export type PersonMember = {
    id: string;
    numeroDeSocio: string;
    nombre: string;
};

export async function fetchAllPersons(): Promise<Person[]> {
    const response = await apiFetch("/api/persons");

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudieron cargar las personas");
    }

    return response.json() as Promise<Person[]>;
}

export async function fetchPersonById(id: string): Promise<Person> {
    const response = await apiFetch(`/api/person?id=${encodeURIComponent(id)}`);

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudo cargar la persona");
    }

    return response.json() as Promise<Person>;
}

export async function savePerson(person: Person): Promise<void> {
    const response = await apiFetch("/api/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(person),
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al guardar la persona");
    }
}

export async function fetchPersonMembers(personId: string): Promise<PersonMember[]> {
    const response = await apiFetch(`/api/person-members?personId=${encodeURIComponent(personId)}`);
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al obtener miembros de la persona");
    }
    return response.json() as Promise<PersonMember[]>;
}

export async function deletePerson(id: string): Promise<void> {
    const response = await apiFetch(`/api/person?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al eliminar la persona");
    }
}
