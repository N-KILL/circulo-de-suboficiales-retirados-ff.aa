import { create } from 'zustand';

export type Transaction = {
  title: string;
  subtitle: string;
  date: string;
  amount: string;
  type: 'ingreso' | 'egreso';
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
};

type DashboardState = {
  stats: DashboardStats | null;
  transactions: Transaction[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  transactions: [],
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    set({
      stats: {
        saldo: "$ 4.785.250,00",
        saldoTrend: "3,2%",
        ingresos: "$ 2.560.000,00",
        ingresosTrend: "12,5%",
        egresos: "$ 1.235.750,00",
        egresosTrend: "8,7%",
        resultado: "$ 1.324.250,00",
        resultadoTrend: "15,3%"
      },
      transactions: [
        { title: "Cuota Social - Abril 2024", subtitle: "Ingreso • Cuotas Sociales", date: "19/05/2024", amount: "$ 150.000,00", type: "ingreso" },
        { title: "Pago Servicio de Luz", subtitle: "Egreso • Servicios", date: "18/05/2024", amount: "- $ 48.750,00", type: "egreso" },
        { title: "Donación Socio", subtitle: "Ingreso • Donaciones", date: "17/05/2024", amount: "$ 75.000,00", type: "ingreso" },
        { title: "Compra de Insumos", subtitle: "Egreso • Administración", date: "16/05/2024", amount: "- $ 32.400,00", type: "egreso" },
        { title: "Cuota Social - Abril 2024", subtitle: "Ingreso • Cuotas Sociales", date: "15/05/2024", amount: "$ 150.000,00", type: "ingreso" },
        { title: "Cuota Social - Abril 2024", subtitle: "Ingreso • Cuotas Sociales", date: "19/05/2024", amount: "$ 150.000,00", type: "ingreso" },
        { title: "Pago Servicio de Luz", subtitle: "Egreso • Servicios", date: "18/05/2024", amount: "- $ 48.750,00", type: "egreso" },
        { title: "Donación Socio", subtitle: "Ingreso • Donaciones", date: "17/05/2024", amount: "$ 75.000,00", type: "ingreso" },
        { title: "Compra de Insumos", subtitle: "Egreso • Administración", date: "16/05/2024", amount: "- $ 32.400,00", type: "egreso" },
        { title: "Cuota Social - Abril 2024", subtitle: "Ingreso • Cuotas Sociales", date: "15/05/2024", amount: "$ 150.000,00", type: "ingreso" },
        { title: "Cuota Social - Abril 2024", subtitle: "Ingreso • Cuotas Sociales", date: "19/05/2024", amount: "$ 150.000,00", type: "ingreso" },
        { title: "Pago Servicio de Luz", subtitle: "Egreso • Servicios", date: "18/05/2024", amount: "- $ 48.750,00", type: "egreso" },
        { title: "Donación Socio", subtitle: "Ingreso • Donaciones", date: "17/05/2024", amount: "$ 75.000,00", type: "ingreso" },
        { title: "Compra de Insumos", subtitle: "Egreso • Administración", date: "16/05/2024", amount: "- $ 32.400,00", type: "egreso" },
        { title: "Cuota Social - Abril 2024", subtitle: "Ingreso • Cuotas Sociales", date: "15/05/2024", amount: "$ 150.000,00", type: "ingreso" },
      ],
      isLoading: false
    });
  }
}));
