import { apiFetch } from "../apiConfig";
import type { Cementerio } from "../models/members";

export interface CementerioGridItem {
    nicho: string;
    arrendatario: string;
    socioId: string | null;
    personaId: string | null;
    telefono: string;
    pagaPor: string;
    ultimoPago: string;
    fechaDePago: string;
    tipo: string;
    fechaFallecimiento: string;
}

export interface CementerioDetalleRecord extends Cementerio {
    personaNombre: string;
    personaDomicilio: string;
}

export interface CementerioMovimientoRecord {
    id: string;
    movement_id: string | null;
    cementerio_id: string | null;
    nicho: string;
    tipo: string | null;
    ocupante: string | null;
    anios_pagados: string[];
    importe: number;
    fecha_pago: string;
    member_id: string | null;
    person_id: string | null;
    created_at: string;
}

export async function fetchCementeriosGrid(): Promise<CementerioGridItem[]> {
    const response = await apiFetch("/api/cementerios");

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "No se pudieron cargar los datos del cementerio");
    }

    return response.json() as Promise<CementerioGridItem[]>;
}

export async function fetchCementeriosByNicho(nicho: string): Promise<CementerioDetalleRecord[]> {
    const response = await apiFetch(`/api/cementerios?nicho=${encodeURIComponent(nicho)}`);

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
    const response = await apiFetch(
        `/api/cementerios?ownerId=${encodeURIComponent(ownerId)}&isSocio=${isSocio}`,
    );
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudieron cargar los cementerios del titular");
    }
    return response.json() as Promise<Cementerio[]>;
}

export async function fetchCementerioOwnerIds(): Promise<{ memberIds: string[]; personIds: string[] }> {
    const response = await apiFetch("/api/cementerios?owners=true");
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
    const response = await apiFetch(`/api/cementerios?id=${encodeURIComponent(id)}`, {
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

export async function fetchCementerioMovimientosByMovement(
    movementId: string,
): Promise<CementerioMovimientoRecord[]> {
    const response = await apiFetch(
        `/api/cementerio-movimientos?movementId=${encodeURIComponent(movementId)}`,
    );
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudieron cargar los movimientos de cementerio");
    }
    return response.json() as Promise<CementerioMovimientoRecord[]>;
}

export async function fetchCementerioMovimientosByNicho(
    nicho: string,
    memberId?: string | null,
    personId?: string | null,
): Promise<CementerioMovimientoRecord[]> {
    let url = `/api/cementerio-movimientos?nicho=${encodeURIComponent(nicho)}`;
    if (memberId) url += `&memberId=${encodeURIComponent(memberId)}`;
    if (personId) url += `&personId=${encodeURIComponent(personId)}`;
    const response = await apiFetch(url);
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudieron cargar los movimientos de cementerio");
    }
    return response.json() as Promise<CementerioMovimientoRecord[]>;
}

export async function hasCementerioMovimientosByNicho(
    nicho: string,
): Promise<boolean> {
    const response = await apiFetch(
        `/api/cementerio-movimientos?hasNicho=${encodeURIComponent(nicho)}`,
    );
    if (!response.ok) return false;
    const data = (await response.json()) as { exists: boolean };
    return data.exists;
}

export type CementerioPagoInfo = {
    nicho: string;
    memberId: string | null;
    personId: string | null;
    ultimaFechaPago: string;
};

export async function fetchCementerioPagosMap(): Promise<CementerioPagoInfo[]> {
    const response = await apiFetch("/api/cementerio-movimientos?pagosMap=true");
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudo cargar el mapa de pagos");
    }
    return response.json() as Promise<CementerioPagoInfo[]>;
}

export async function saveCementerioMovimiento(data: {
    movement_id: string;
    cementerio_id?: string | null;
    nicho: string;
    tipo?: string | null;
    ocupante?: string | null;
    anios_pagados: string[];
    importe: number;
    fecha_pago: string;
    member_id?: string | null;
    person_id?: string | null;
}): Promise<string> {
    const response = await apiFetch("/api/cementerio-movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudo guardar el movimiento de cementerio");
    }
    const result = (await response.json()) as { id: string };
    return result.id;
}
