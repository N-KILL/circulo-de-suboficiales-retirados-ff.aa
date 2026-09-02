import { invalidateMembersDebtStatus } from "./membersDebtApi";

export type DebtWithDetails = {
  id: string;
  member_id: string | null;
  person_id: string | null;
  type: string;
  description: string | null;
  amount: number;
  movement_id: string | null;
  date: string;
  created_at: string;
  member_nombre: string | null;
  member_numero_de_socio: string | null;
  person_nombre: string | null;
};

export async function fetchDebtsByMember(memberId: string): Promise<DebtWithDetails[]> {
  const response = await fetch(`/api/debts?memberId=${encodeURIComponent(memberId)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al cargar deudas del socio");
  }
  return response.json() as Promise<DebtWithDetails[]>;
}

export async function fetchDebtsByPerson(personId: string): Promise<DebtWithDetails[]> {
  const response = await fetch(`/api/debts?personId=${encodeURIComponent(personId)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al cargar deudas de la persona");
  }
  return response.json() as Promise<DebtWithDetails[]>;
}

export async function fetchBalanceByMember(memberId: string): Promise<number> {
  if (!memberId) return 0;
  const response = await fetch(`/api/debts/balance?memberId=${encodeURIComponent(memberId)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al cargar saldo del socio");
  }
  const result = (await response.json()) as { balance: number };
  return result.balance;
}

export async function fetchBalanceByPerson(personId: string): Promise<number> {
  if (!personId) return 0;
  const response = await fetch(`/api/debts/balance?personId=${encodeURIComponent(personId)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al cargar saldo de la persona");
  }
  const result = (await response.json()) as { balance: number };
  return result.balance;
}

export async function saveDebt(data: {
  member_id?: string | null;
  person_id?: string | null;
  type: string;
  description?: string | null;
  amount: number;
  movement_id?: string | null;
  date: string;
}): Promise<string> {
  const response = await fetch("/api/debts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al guardar la deuda");
  }
  const result = (await response.json()) as { id: string };
  invalidateMembersDebtStatus();
  return result.id;
}
