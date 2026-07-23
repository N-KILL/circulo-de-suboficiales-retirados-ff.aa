export type ReceiptConcept = {
    id: string;
    type: "ingreso" | "egreso";
    name: string;
    target: "socios" | "personas" | "ambos";
    sort_order: number;
    active: boolean;
    copies_to_print: number;
};

export type ReceiptCopiesDefaults = Record<string, number>;

export async function fetchReceiptConcepts(): Promise<ReceiptConcept[]> {
    const response = await fetch("/api/receipt-copies-config");
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al cargar conceptos de comprobantes");
    }
    const data = (await response.json()) as { concepts: ReceiptConcept[] } | null;
    return data?.concepts ?? [];
}

export async function saveReceiptConcepts(
    concepts: ReceiptConcept[],
): Promise<ReceiptConcept[]> {
    const response = await fetch("/api/receipt-copies-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concepts }),
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al guardar conceptos de comprobantes");
    }
    const data = (await response.json()) as { concepts: ReceiptConcept[] };
    return data.concepts;
}

export async function fetchReceiptCopiesConfig(): Promise<{ defaults: ReceiptCopiesDefaults } | null> {
    const concepts = await fetchReceiptConcepts();
    const defaults: ReceiptCopiesDefaults = {};
    for (const c of concepts) {
        if (c.active) defaults[c.name] = c.copies_to_print;
    }
    return { defaults };
}
