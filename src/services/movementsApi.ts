export interface DueLink {
    id: string;
    type: "socio" | "cementerio";
    payment_date: string;
    period_start: string | null;
    period_end: string | null;
    member_id: string | null;
    member_nombre: string | null;
    person_id: string | null;
    person_nombre: string | null;
    family_group: string | null;
    paid_members: string[] | null;
}

export interface Movement {
    id: string;
    date: string;
    detail: string;
    amount: number;
    type: "ingreso" | "egreso" | "transferencia";
    mode: "efectivo" | "transferencia";
    concept?: string | null;
    linked_due?: DueLink | null;
}

export async function fetchMovements(): Promise<Movement[]> {
    const response = await fetch("/api/movements");

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "No se pudieron cargar los movimientos de caja");
    }

    return response.json() as Promise<Movement[]>;
}

export async function fetchMovementById(id: string): Promise<Movement> {
    const response = await fetch(`/api/movement?id=${encodeURIComponent(id)}`);

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "No se pudo cargar el movimiento");
    }

    return response.json() as Promise<Movement>;
}

export async function updateMovement(
    id: string,
    data: Partial<Pick<Movement, "date" | "detail" | "amount" | "type" | "mode" | "concept">> & { due?: Record<string, any> }
): Promise<void> {
    const response = await fetch(`/api/movement?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "No se pudo actualizar el movimiento");
    }
}

export async function deleteMovement(id: string): Promise<void> {
    const response = await fetch(`/api/movement?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "No se pudo eliminar el movimiento");
    }
}
