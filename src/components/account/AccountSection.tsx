import React, { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { fetchDebtsByMember, fetchDebtsByPerson, fetchBalanceByMember, fetchBalanceByPerson } from "../../services/debtsApi";
import { formatCurrency, toDisplayDate } from "../../utils/format";
import type { DebtWithDetails } from "../../services/debtsApi";
import "../../pages/Treasury/TreasuryTables.css";
import "./AccountSection.css";

interface AccountSectionProps {
  memberId?: string;
  personId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  cuota_socio: "Cuota Socio",
  cuota_cementerio: "Cuota Cementerio",
  servicio: "Servicio",
  ajuste: "Ajuste",
  otro: "Otro",
};

const AccountSection: React.FC<AccountSectionProps> = ({ memberId, personId }) => {
  const [debts, setDebts] = useState<DebtWithDetails[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId && !personId) return;
    let mounted = true;

    const fetchData = async () => {
      try {
        const [debtsData, balanceData] = await Promise.all([
          memberId
            ? fetchDebtsByMember(memberId)
            : fetchDebtsByPerson(personId!),
          memberId
            ? fetchBalanceByMember(memberId)
            : fetchBalanceByPerson(personId!),
        ]);
        if (mounted) {
          setDebts(debtsData);
          setBalance(balanceData);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [memberId, personId]);

  if (loading) {
    return (
      <div className="account-section-loading">
        <Loader size={16} className="spin" /> Cargando cuenta...
      </div>
    );
  }

  const balanceClass = balance > 0 ? "balance-positive" : balance < 0 ? "balance-negative" : "balance-zero";

  return (
    <div className="detalle-card">
      <div className="detalle-section-header">
        <h3 className="detalle-section-title">Cuenta Corriente</h3>
        <div className={`account-balance ${balanceClass}`}>
          Saldo: {formatCurrency(balance)}
        </div>
      </div>

      {debts.length === 0 ? (
        <p className="detalle-empty">No hay movimientos en la cuenta.</p>
      ) : (
        <div className="table-wrapper">
          <table className="treasury-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Importe</th>
                <th>Movimiento</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => (
                <tr key={d.id}>
                  <td>{toDisplayDate(d.date)}</td>
                  <td>{TYPE_LABELS[d.type] ?? d.type}</td>
                  <td>{d.description || "—"}</td>
                  <td className={d.amount >= 0 ? "amount-ingreso" : "amount-egreso"}>
                    {formatCurrency(d.amount)}
                  </td>
                  <td>{d.movement_id ? d.movement_id.slice(0, 8) + "…" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AccountSection;
