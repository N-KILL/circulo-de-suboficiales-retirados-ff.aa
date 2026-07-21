import { apiFetch } from "../apiConfig";

export interface PaymentData {
  date: string;
  detail: string;
  amount: number;
  type: "ingreso" | "egreso";
  mode: "efectivo" | "transferencia";
  concept?: string | null;
}

export async function savePayment(payment: PaymentData): Promise<{ id: string }> {
  const response = await apiFetch("/api/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payment),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Error al guardar el pago");
  }

  return response.json() as Promise<{ id: string }>;
}
