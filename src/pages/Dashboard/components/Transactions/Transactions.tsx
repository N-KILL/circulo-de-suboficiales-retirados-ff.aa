import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useDashboardStore } from "../../../../store/dashboardStore";
import "./Transactions.css";

const Transactions: React.FC = () => {
  const items = useDashboardStore(state => state.transactions);

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "16px" }}>Últimos Movimientos</div>
        <div className="muted" style={{ fontSize: "13px", cursor: "pointer" }}>Ver todos</div>
      </div>

      <div className="transactions-list" style={{ flex: 1, justifyContent: "space-between" }}>
        {items.map((it, i) => {
          const isIngreso = it.type === "ingreso";
          return (
            <div className="txn-item" key={i}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: isIngreso ? "#e6f4ea" : "#fef3e5",
                  color: isIngreso ? "var(--verde-exito)" : "#b97b37",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {isIngreso ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{it.title}</div>
                  <div className="muted" style={{ fontSize: "12px", marginTop: "2px" }}>
                    {it.subtitle}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="muted" style={{ fontSize: "12px", marginBottom: "2px" }}>
                  {it.date}
                </div>
                <div
                  style={{
                    color: isIngreso ? "var(--verde-exito)" : "var(--rojo-alerta)",
                    fontWeight: 600,
                    fontSize: "14px"
                  }}
                >
                  {it.amount}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default Transactions;
