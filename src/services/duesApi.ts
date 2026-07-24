export type DueWithDetails = {
  id: string;
  type: "socio" | "cementerio";
  payment_date: string;
  period: string[] | null;
  member_id: string | null;
  member_nombre: string | null;
  member_numero_de_socio: string | null;
  person_id: string | null;
  person_nombre: string | null;
  movement_id: string | null;
  amount: number | null;
  family_group: string | null;
  paid_members: string[] | null;
  created_at: string;
};

export type MemberCemeteryCheck = {
  hasCementerio: boolean;
  dues: DueWithDetails[];
};

export async function fetchDuesByMember(memberId: string): Promise<DueWithDetails[]> {
  if (!memberId) return [];
  const response = await fetch(`/api/dues?memberId=${encodeURIComponent(memberId)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al cargar cuotas del socio");
  }
  return response.json() as Promise<DueWithDetails[]>;
}

export async function fetchMemberCemeteryCheck(memberId: string): Promise<MemberCemeteryCheck> {
  if (!memberId) return { hasCementerio: false, dues: [] };
  const response = await fetch(`/api/dues?memberId=${encodeURIComponent(memberId)}&check=cementerio`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al verificar cementerio del socio");
  }
  return response.json() as Promise<MemberCemeteryCheck>;
}

export async function fetchDuesByPerson(personId: string): Promise<DueWithDetails[]> {
  const response = await fetch(`/api/dues?personId=${encodeURIComponent(personId)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al cargar cuotas de la persona");
  }
  return response.json() as Promise<DueWithDetails[]>;
}

export async function fetchAllDues(): Promise<DueWithDetails[]> {
  const response = await fetch("/api/dues");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al cargar cuotas");
  }
  return response.json() as Promise<DueWithDetails[]>;
}

export async function saveDue(data: {
  type: "socio" | "cementerio";
  payment_date: string;
  period?: string[] | null;
  member_id?: string | null;
  person_id?: string | null;
  movement_id?: string | null;
  family_group?: string | null;
  paid_members?: string[] | null;
}): Promise<string> {
  const response = await fetch("/api/dues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al guardar la cuota");
  }
  const result = (await response.json()) as { id: string };
  return result.id;
}

export async function fetchFamilyMembers(memberId: string): Promise<import("../models/members").Member[]> {
  if (!memberId) return [];
  const response = await fetch(`/api/members/family?memberId=${encodeURIComponent(memberId)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Error al cargar grupo familiar");
  }
  return response.json() as Promise<import("../models/members").Member[]>;
}

export function getFamilyGroup(numeroDeSocio: string): string | null {
  const partes = numeroDeSocio.split("/");
  return partes.length >= 2 ? partes[0] : null;
}
