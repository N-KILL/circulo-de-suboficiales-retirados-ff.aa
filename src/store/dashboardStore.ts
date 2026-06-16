import { create } from 'zustand';
import { fetchMovements } from '../services/movementsApi';

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
  fetchData: () => Promise<void>;
};

const INITIAL_BALANCE = 0;

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

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  transactions: [],
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });

    try {
      const movements = await fetchMovements();

      if (movements.length === 0) {
        set({
          stats: {
            saldo: formatCurrency(INITIAL_BALANCE),
            saldoTrend: "0%",
            ingresos: formatCurrency(0),
            ingresosTrend: "0%",
            egresos: formatCurrency(0),
            egresosTrend: "0%",
            resultado: formatCurrency(0),
            resultadoTrend: "0%",
            monthLabel: "Sin datos"
          },
          transactions: [],
          isLoading: false
        });
        return;
      }

      // 1. Calculate overall balance (saldo)
      let totalBalance = INITIAL_BALANCE;
      for (const m of movements) {
        if (m.type === "ingreso") {
          totalBalance += m.amount;
        } else if (m.type === "egreso") {
          totalBalance -= m.amount;
        }
      }

      // 2. Identify the latest month with data
      const latestMove = movements[movements.length - 1];
      const latestDate = new Date(latestMove.date + "T12:00:00");
      const latestYear = latestDate.getFullYear();
      const latestMonth = latestDate.getMonth();
      const monthLabel = `${MONTHS_ES[latestMonth]} ${latestYear}`;

      // 3. Compute stats for the latest month (June 2026)
      let monthlyIncomes = 0;
      let monthlyExpenses = 0;
      for (const m of movements) {
        const d = new Date(m.date + "T12:00:00");
        if (d.getFullYear() === latestYear && d.getMonth() === latestMonth) {
          if (m.type === "ingreso") {
            monthlyIncomes += m.amount;
          } else if (m.type === "egreso") {
            monthlyExpenses += m.amount;
          }
        }
      }
      const monthlyResult = monthlyIncomes - monthlyExpenses;

      // 4. Format recent transactions (last 15, descending)
      const last15 = movements.slice(-15).reverse();
      const mappedTx: Transaction[] = last15.map((m) => {
        const parts = m.date.split("-");
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : m.date;
        
        let subtitle = "";
        let amountStr = "";
        if (m.type === "ingreso") {
          subtitle = "Ingreso • Caja";
          amountStr = formatCurrency(m.amount);
        } else if (m.type === "egreso") {
          subtitle = "Egreso • Caja";
          amountStr = `- ${formatCurrency(m.amount)}`;
        } else {
          subtitle = "Transferencia • Caja";
          amountStr = formatCurrency(m.amount);
        }

        return {
          title: m.detail,
          subtitle: subtitle,
          date: formattedDate,
          amount: amountStr,
          type: m.type
        };
      });

      // 5. Update state
      set({
        stats: {
          saldo: formatCurrency(totalBalance),
          saldoTrend: "3,2%", // Mock trend
          ingresos: formatCurrency(monthlyIncomes),
          ingresosTrend: "12,5%", // Mock trend
          egresos: formatCurrency(monthlyExpenses),
          egresosTrend: "8,7%", // Mock trend
          resultado: formatCurrency(monthlyResult),
          resultadoTrend: "15,3%", // Mock trend
          monthLabel
        },
        transactions: mappedTx,
        isLoading: false
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      set({
        stats: {
          saldo: formatCurrency(INITIAL_BALANCE),
          saldoTrend: "0%",
          ingresos: formatCurrency(0),
          ingresosTrend: "0%",
          egresos: formatCurrency(0),
          egresosTrend: "0%",
          resultado: formatCurrency(0),
          resultadoTrend: "0%",
          monthLabel: "Error"
        },
        transactions: [],
        isLoading: false
      });
    }
  }
}));
