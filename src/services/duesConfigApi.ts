export type DuesConfig = {
    id: string;
    member_fee: number;
    consideration_years: number;
    nicho_member_fee: number;
    nicho_non_member_fee: number;
    urna_member_fee: number;
    urna_non_member_fee: number;
    bolsa_member_fee: number;
    bolsa_non_member_fee: number;
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
    consideration_years: number = 0,
    nicho_member_fee: number = 0,
    nicho_non_member_fee: number = 0,
    urna_member_fee: number = 0,
    urna_non_member_fee: number = 0,
    bolsa_member_fee: number = 0,
    bolsa_non_member_fee: number = 0,
): Promise<DuesConfig> {
    const response = await fetch("/api/dues-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            member_fee, consideration_years,
            nicho_member_fee, nicho_non_member_fee,
            urna_member_fee, urna_non_member_fee,
            bolsa_member_fee, bolsa_non_member_fee,
        }),
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al guardar configuración de montos");
    }
    return response.json() as Promise<DuesConfig>;
}
