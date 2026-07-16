export type ServiceRecordItem = {
    id: string;
    service_id: string | null;
    service_name: string | null;
    service_amount: number | null;
    member_id: string | null;
    member_nombre: string | null;
    member_numero_de_socio: string | null;
    person_id: string | null;
    person_nombre: string | null;
    movement_id: string | null;
    movement_amount: number | null;
    amount: number;
    date: string;
    service_date: string | null;
    detail: string | null;
};

export async function fetchServiceRecords(): Promise<ServiceRecordItem[]> {
    const response = await fetch("/api/service-records");
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al cargar registros de servicios");
    }
    return response.json() as Promise<ServiceRecordItem[]>;
}

export async function fetchServiceRecordById(id: string): Promise<ServiceRecordItem> {
    const response = await fetch(`/api/service-records?id=${encodeURIComponent(id)}`);
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al cargar registro de servicio");
    }
    return response.json() as Promise<ServiceRecordItem>;
}

export async function fetchServiceRecordsByMember(memberId: string): Promise<ServiceRecordItem[]> {
    const response = await fetch(`/api/service-records?memberId=${encodeURIComponent(memberId)}`);
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al cargar registros de servicios del socio");
    }
    return response.json() as Promise<ServiceRecordItem[]>;
}

export async function fetchServiceRecordsByPerson(personId: string): Promise<ServiceRecordItem[]> {
    const response = await fetch(`/api/service-records?personId=${encodeURIComponent(personId)}`);
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al cargar registros de servicios de la persona");
    }
    return response.json() as Promise<ServiceRecordItem[]>;
}

export async function fetchServiceRecordsByMovement(movementId: string): Promise<ServiceRecordItem[]> {
    const response = await fetch(`/api/service-records?movementId=${encodeURIComponent(movementId)}`);
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al cargar registros de servicios del movimiento");
    }
    return response.json() as Promise<ServiceRecordItem[]>;
}

export async function saveServiceRecord(data: {
    service_id: string;
    member_id?: string | null;
    person_id?: string | null;
    movement_id?: string | null;
    amount: number;
    date: string;
    service_date?: string | null;
    detail?: string | null;
}): Promise<ServiceRecordItem> {
    const response = await fetch("/api/service-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al guardar registro de servicio");
    }
    return response.json() as Promise<ServiceRecordItem>;
}

export async function updateServiceRecord(id: string, data: {
    service_id?: string;
    member_id?: string | null;
    person_id?: string | null;
    movement_id?: string | null;
    amount?: number;
    date?: string;
    service_date?: string | null;
    detail?: string | null;
}): Promise<ServiceRecordItem> {
    const response = await fetch("/api/service-records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al actualizar registro de servicio");
    }
    return response.json() as Promise<ServiceRecordItem>;
}

export async function deleteServiceRecord(id: string): Promise<void> {
    const response = await fetch(`/api/service-records?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Error al eliminar registro de servicio");
    }
}
