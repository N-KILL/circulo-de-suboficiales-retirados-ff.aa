export interface ComprobanteRecord {
  id: string;
  movement_id: string;
  receipt_number: number;
  copies_to_print: number;
  detail: string;
  concept: string | null;
  payer_name: string | null;
  created_at: string;
}

export async function fetchComprobanteByMovementId(movementId: string): Promise<ComprobanteRecord | null> {
  const response = await fetch(`/api/comprobante?movementId=${encodeURIComponent(movementId)}`);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "No se pudo cargar el comprobante");
  }

  return response.json() as Promise<ComprobanteRecord | null>;
}

export async function saveComprobante(data: {
  movement_id: string;
  receipt_number: number;
  copies_to_print: number;
  detail: string;
  concept?: string | null;
  payer_name?: string | null;
}): Promise<{ id: string }> {
  const response = await fetch("/api/comprobante", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al guardar el comprobante");
  }

  return response.json() as Promise<{ id: string }>;
}
