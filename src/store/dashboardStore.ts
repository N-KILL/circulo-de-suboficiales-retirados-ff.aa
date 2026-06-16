import { create } from 'zustand';
import { fetchMovements } from '../services/movementsApi';
import { fetchInitialBalances } from '../services/initialBalancesApi';
import type { Movement } from '../services/movementsApi';

export type Transaction = {
  title: string;
  subtitle: string;
  date: string;
  amount: string;
  type: 'ingreso' | 'egreso' | 'transferencia';
};

export type DashboardStats = {
  saldo: string;
  saldoTrend: string;
  ingresos: string;
  ingresosTrend: string;
  egresos: string;
  egresosTrend: string;
  resultado: string;
  resultadoTrend: string;
  monthLabel: string;
};

type DashboardState = {
  stats: DashboardStats | null;
  transactions: Transaction[];
  isLoading: boolean;
  selectedCaja: 'banco' | 'caja_chica';
  setSelectedCaja: (caja: 'banco' | 'caja_chica') => void;
  fetchData: () => Promise<void>;
};

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function formatCurrency(val: number): string {
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absVal);
  return `${val < 0 ? "- " : ""}$ ${formatted}`;
}

function computeStats(
  movements: Movement[],
  initialBanco: number,
  initialCajaChica: number,
  selectedCaja: 'banco' | 'caja_chica'
) {
  const isBanco = selectedCaja === 'banco';
  const initial = isBanco ? initialBanco : initialCajaChica;

  // Filter movements by mode
  const filtered = movements.filter((m) =>
    isBanco ? m.mode === 'transferencia' : m.mode === 'efectivo'
  );

  // Total balance
  let totalBalance = initial;
  for (const m of filtered) {
    if (m.type === 'ingreso') totalBalance += m.amount;
    else if (m.type === 'egreso') totalBalance -= m.amount;
  }

  // Latest month
  const latestMove = filtered.length > 0 ? filtered[filtered.length - 1] : null;
  let monthLabel = 'Sin datos';
  let latestYear = 0;
  let latestMonth = 0;

  if (latestMove) {
    const d = new Date(latestMove.date + 'T12:00:00');
    latestYear = d.getFullYear();
    latestMonth = d.getMonth();
    monthLabel = `${MONTHS_ES[latestMonth]} ${latestYear}`;
  }

  // Monthly incomes/expenses
  let monthlyIncomes = 0;
  let monthlyExpenses = 0;
  for (const m of filtered) {
    const d = new Date(m.date + 'T12:00:00');
    if (d.getFullYear() === latestYear && d.getMonth() === latestMonth) {
      if (m.type === 'ingreso') monthlyIncomes += m.amount;
      else if (m.type === 'egreso') monthlyExpenses += m.amount;
    }
  }
  const monthlyResult = monthlyIncomes - monthlyExpenses;

  // Recent transactions
  const sliced = filtered.slice(-15).reverse();
  const transactions: Transaction[] = sliced.map((m) => {
    const parts = m.date.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : m.date;
    const modalidad = m.mode === 'efectivo' ? 'Efectivo' : 'Transferencia';
    let subtitle = '';
    let amountStr = '';
    if (m.type === 'ingreso') {
      subtitle = `Ingreso • ${modalidad}`;
      amountStr = formatCurrency(m.amount);
    } else if (m.type === 'egreso') {
      subtitle = `Egreso • ${modalidad}`;
      amountStr = `- ${formatCurrency(m.amount)}`;
    } else {
      subtitle = 'Transferencia • Interno';
      amountStr = formatCurrency(m.amount);
    }
    return { title: m.detail, subtitle, date: formattedDate, amount: amountStr, type: m.type };
  });

  return {
    stats: {
      saldo: formatCurrency(totalBalance),
      saldoTrend: '3,2%',
      ingresos: formatCurrency(monthlyIncomes),
      ingresosTrend: '12,5%',
      egresos: formatCurrency(monthlyExpenses),
      egresosTrend: '8,7%',
      resultado: formatCurrency(monthlyResult),
      resultadoTrend: '15,3%',
      monthLabel,
    },
    transactions,
  };
}

let cachedMovements: Movement[] = [];
let cachedInitialBanco = 0;
let cachedInitialCajaChica = 0;

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  transactions: [],
  isLoading: false,
  selectedCaja: 'banco',

  setSelectedCaja: (caja: 'banco' | 'caja_chica') => {
    set({ selectedCaja: caja });
    const { stats, transactions } = computeStats(
      cachedMovements,
      cachedInitialBanco,
      cachedInitialCajaChica,
      caja
    );
    set({ stats, transactions });
  },

  fetchData: async () => {
    set({ isLoading: true });

    try {
      const [movements, balances] = await Promise.all([
        fetchMovements(),
        fetchInitialBalances(),
      ]);

      cachedMovements = movements;
      cachedInitialBanco = balances?.banco ?? 0;
      cachedInitialCajaChica = balances?.caja_chica ?? 0;

      const { selectedCaja } = get();
      const { stats, transactions } = computeStats(
        movements,
        cachedInitialBanco,
        cachedInitialCajaChica,
        selectedCaja
      );

      set({ stats, transactions, isLoading: false });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      set({
        stats: {
          saldo: formatCurrency(0),
          saldoTrend: '0%',
          ingresos: formatCurrency(0),
          ingresosTrend: '0%',
          egresos: formatCurrency(0),
          egresosTrend: '0%',
          resultado: formatCurrency(0),
          resultadoTrend: '0%',
          monthLabel: 'Error',
        },
        transactions: [],
        isLoading: false,
      });
    }
  },
}));
