export interface InitialBalances {
    id: string;
    caja_chica: number;
    banco: number;
    comprobante_ingreso: number;
    comprobante_egreso: number;
}

export async function fetchInitialBalances(): Promise<InitialBalances | null> {
    const response = await fetch("/api/initial-balances");

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "Error al cargar valores iniciales");
    }

    return response.json() as Promise<InitialBalances | null>;
}

export async function saveInitialBalances(
    caja_chica: number,
    banco: number,
    comprobante_ingreso?: number,
    comprobante_egreso?: number,
): Promise<InitialBalances> {
    const response = await fetch("/api/initial-balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caja_chica, banco, comprobante_ingreso, comprobante_egreso }),
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "Error al guardar valores iniciales");
    }

    return response.json() as Promise<InitialBalances>;
}

export async function fetchNextReceipt(type: "ingreso" | "egreso"): Promise<number> {
    const response = await fetch("/api/receipt/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(body?.error ?? "Error al obtener número de comprobante");
    }

    const data = (await response.json()) as { receipt_number: number };
    return data.receipt_number;
}
