import React from "react";

const NewExpense: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--muted)",
        gap: 12,
      }}
    >
      <h2 style={{ color: "var(--azul-armada)", margin: 0 }}>Nuevo Egreso</h2>
      <p style={{ margin: 0 }}>Próximamente</p>
    </div>
  );
};

export default NewExpense;
