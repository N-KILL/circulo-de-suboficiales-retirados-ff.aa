export type ExternalServiceItem = {
    id: string;
    name: string;
    phone: string | null;
    description: string | null;
    frequency: string;
    start_month: number | null;
    active: boolean;
    created_at: string;
    updated_at: string;
};

export type ExternalServicePaymentItem = {
    id: string;
    service_id: string;
    month: number;
    year: number;
    amount: number | null;
    movement_id: string | null;
    created_at: string;
};

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Error ${response.status}`);
    }
    return response.json() as Promise<T>;
}

export async function fetchExternalServices(): Promise<ExternalServiceItem[]> {
    const response = await fetch("/api/external-services");
    return handleResponse<ExternalServiceItem[]>(response);
}

export async function saveExternalService(name: string, phone: string | null, description: string | null, frequency: string, startMonth: number | null): Promise<ExternalServiceItem> {
    const response = await fetch("/api/external-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, description, frequency, start_month: startMonth }),
    });
    return handleResponse<ExternalServiceItem>(response);
}

export async function updateExternalService(id: string, name: string, phone: string | null, description: string | null, frequency: string, startMonth: number | null, active: boolean): Promise<ExternalServiceItem> {
    const response = await fetch("/api/external-services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, phone, description, frequency, start_month: startMonth, active }),
    });
    return handleResponse<ExternalServiceItem>(response);
}

export async function deleteExternalService(id: string): Promise<void> {
    const response = await fetch(`/api/external-services?id=${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al eliminar");
    }
}

export async function fetchExternalServicePayments(year: number): Promise<ExternalServicePaymentItem[]> {
    const response = await fetch(`/api/external-service-payments?year=${year}`);
    return handleResponse<ExternalServicePaymentItem[]>(response);
}

export async function saveExternalServicePayment(serviceId: string, month: number, year: number, amount: number | null, movementId: string | null): Promise<ExternalServicePaymentItem> {
    const response = await fetch("/api/external-service-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId, month, year, amount, movement_id: movementId }),
    });
    return handleResponse<ExternalServicePaymentItem>(response);
}

export async function deleteExternalServicePayment(serviceId: string, month: number, year: number): Promise<void> {
    const response = await fetch("/api/external-service-payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId, month, year }),
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al eliminar");
    }
}
