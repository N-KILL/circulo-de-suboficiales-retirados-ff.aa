export type ServiceItem = {
    id: string;
    name: string;
    amount: number;
};

import { getOrFetch, invalidate, CACHE_KEY } from "./apiCache";

export async function fetchServices(): Promise<ServiceItem[]> {
    return getOrFetch(CACHE_KEY.services, async () => {
        const response = await fetch("/api/services");
        if (!response.ok) {
            const body = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(body?.error ?? "Error al cargar servicios");
        }
        return response.json() as Promise<ServiceItem[]>;
    });
}

export async function saveService(name: string, amount: number): Promise<ServiceItem> {
    const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, amount }),
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al guardar servicio");
    }
    const data = (await response.json()) as ServiceItem;
    invalidate(CACHE_KEY.services);
    return data;
}

export async function updateService(id: string, name: string, amount: number): Promise<ServiceItem> {
    const response = await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, amount }),
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al actualizar servicio");
    }
    const data = (await response.json()) as ServiceItem;
    invalidate(CACHE_KEY.services);
    return data;
}

export async function deleteService(id: string): Promise<void> {
    const response = await fetch(`/api/services?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al eliminar servicio");
    }
    invalidate(CACHE_KEY.services);
}
