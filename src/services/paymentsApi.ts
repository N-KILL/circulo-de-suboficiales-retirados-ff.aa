export interface PaymentData {
  date: string;
  detail: string;
  amount: number;
  type: "ingreso";
  mode: "efectivo" | "transferencia";
}

export async function savePayment(payment: PaymentData): Promise<void> {
  const response = await fetch("/api/payment", {
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
}
