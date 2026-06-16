import React from "react";
import { ArrowDown, ArrowUp, ArrowLeftRight } from "lucide-react";
import { useDashboardStore } from "../../../../store/dashboardStore";
import "./Transactions.css";

const Transactions: React.FC = () => {
  const items = useDashboardStore(state => state.transactions);

  return (
    <div className="card transactions-card">
      <div className="transactions-header">
        <div className="transactions-title">Últimos Movimientos</div>
        <a href="/tesoreria/movimientos" className="muted transactions-ver-todos">Ver todos</a>
      </div>

      <div className="transactions-list custom-scroll">
        {items.map((it, i) => {
          const isIngreso = it.type === "ingreso";
          const isEgreso = it.type === "egreso";
          return (
            <div className={`txn-item ${isIngreso ? "txn-ingreso" : isEgreso ? "txn-egreso" : "txn-transferencia"}`} key={i}>
              <div className="txn-left">
                <div className="txn-icon">
                  {isIngreso ? (
                    <ArrowDown size={18} />
                  ) : isEgreso ? (
                    <ArrowUp size={18} />
                  ) : (
                    <ArrowLeftRight size={18} />
                  )}
                </div>
                <div className="txn-info">
                  <div className="txn-title">{it.title}</div>
                  <div className="muted txn-subtitle">{it.subtitle}</div>
                </div>
              </div>
              <div className="txn-right">
                <div className="muted txn-date">{it.date}</div>
                <div className="txn-amount">{it.amount}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Transactions;
