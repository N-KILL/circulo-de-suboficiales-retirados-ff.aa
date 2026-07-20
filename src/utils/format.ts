export function todayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

export function fromDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

export function toCurrency(val: number): string {
  return `$ ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)}`;
}

export function formatCurrency(val: number): string {
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absVal);
  return `${val < 0 ? "- " : ""}$ ${formatted}`;
}

export function formatPeriodsDisplay(periods: string[] | null): string {
  if (!periods || periods.length === 0) return "\u2014";
  const byYear: Record<string, string[]> = {};
  for (const p of periods) {
    const [y, m] = p.split("-");
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(m);
  }
  return Object.entries(byYear)
    .map(([year, months]) => `${year} (Meses: ${months.join(",")})`)
    .join(" ");
}

export function formatRecordDate(dateStr: string): string {
  const iso = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = iso.split("-");
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
}

export function parseMoney(v: string): number {
  return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;
}

export function parseDateYMD(dateStr: string): Date | null {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const nums = parts.map(Number);
    if (nums.some(isNaN)) {
      const fallback = new Date(dateStr);
      return isNaN(fallback.getTime()) ? null : fallback;
    }
    if (parts[0].length === 4) {
      const [y, m, d] = nums;
      return new Date(y, m - 1, d);
    }
    const [d, m, y] = nums;
    return new Date(y, m - 1, d);
  }
  if (parts.length === 2) {
    const [y, m] = parts.map(Number);
    if (!isNaN(y) && !isNaN(m)) return new Date(y, m - 1, 1);
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function calcYearsAgo(dateStr: string): number {
  if (!dateStr) return -1;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return -1;
  let day: number, month: number, year: number;
  if (parts[2].length === 4) {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else if (parts[2].length === 2) {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = 2000 + parseInt(parts[2], 10);
  } else {
    return -1;
  }
  if (isNaN(day) || isNaN(month) || isNaN(year)) return -1;
  const d = new Date(year, month, day);
  const now = new Date();
  let anos = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    anos--;
  }
  return Math.max(0, anos);
}
