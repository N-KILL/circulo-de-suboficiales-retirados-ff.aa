export interface Movement {
    id: string;
    date: string;
    detail: string;
    amount: number;
    type: "ingreso" | "egreso" | "transferencia";
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
