export type DuesConfig = {
    id: string;
    member_fee: number;
    cemetery_fee: number;
};

export async function fetchDuesConfig(): Promise<DuesConfig | null> {
    const response = await fetch("/api/dues-config");
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al cargar configuración de montos");
    }
    return response.json() as Promise<DuesConfig | null>;
}

export async function saveDuesConfig(
    member_fee: number,
    cemetery_fee: number,
): Promise<DuesConfig> {
    const response = await fetch("/api/dues-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_fee, cemetery_fee }),
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al guardar configuración de montos");
    }
    return response.json() as Promise<DuesConfig>;
}
