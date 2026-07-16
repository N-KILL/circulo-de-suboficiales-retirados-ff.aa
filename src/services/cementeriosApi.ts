import type { Cementerio } from "../models/members";

export interface CementerioGridItem {
    nicho: string;
    cantOcupantes: number;
    arrendatario: string;
    telefono: string;
    pagaPor: string;
    ultimoPago: string;
    fechaDePago: string;
}

export interface CementerioDetalleRecord extends Cementerio {
    personaNombre: string;
    personaDomicilio: string;
}

export async function fetchCementeriosGrid(): Promise<CementerioGridItem[]> {
    const response = await fetch("/api/cementerios");

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "No se pudieron cargar los datos del cementerio");
    }

    return response.json() as Promise<CementerioGridItem[]>;
}

export async function fetchCementeriosByNicho(nicho: string): Promise<CementerioDetalleRecord[]> {
    const response = await fetch(`/api/cementerios?nicho=${encodeURIComponent(nicho)}`);

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "No se pudieron cargar los registros del nicho");
    }

    return response.json() as Promise<CementerioDetalleRecord[]>;
}

export async function fetchCementeriosByOwner(
    ownerId: string,
    isSocio: boolean,
): Promise<Cementerio[]> {
    const response = await fetch(
        `/api/cementerios?ownerId=${encodeURIComponent(ownerId)}&isSocio=${isSocio}`,
    );
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudieron cargar los cementerios del titular");
    }
    return response.json() as Promise<Cementerio[]>;
}

export async function fetchCementerioOwnerIds(): Promise<{ memberIds: string[]; personIds: string[] }> {
    const response = await fetch("/api/cementerios?owners=true");
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudieron cargar los propietarios de cementerio");
    }
    return response.json() as Promise<{ memberIds: string[]; personIds: string[] }>;
}

export async function updateCementerioRecord(
    id: string,
    data: Partial<Cementerio>
): Promise<void> {
    const response = await fetch(`/api/cementerios?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "No se pudo actualizar el registro");
    }
}
