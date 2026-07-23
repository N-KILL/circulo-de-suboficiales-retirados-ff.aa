import React, { useState } from "react";
import { Save, Loader, Plus, Trash2 } from "lucide-react";
import { saveReceiptConcepts, type ReceiptConcept } from "../../services/receiptCopiesConfigApi";

interface ReceiptCopiesConfigProps {
  initialConcepts: ReceiptConcept[];
}

const COPIES_OPTIONS = [
  { value: 1, label: "Original (1)" },
  { value: 2, label: "Duplicado (2)" },
  { value: 3, label: "Triplicado (3)" },
];

const ReceiptCopiesConfig: React.FC<ReceiptCopiesConfigProps> = ({ initialConcepts }) => {
  const [concepts, setConcepts] = useState<ReceiptConcept[]>(() =>
    [...initialConcepts].sort((a, b) => a.type.localeCompare(b.type) || a.sort_order - b.sort_order)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [newType, setNewType] = useState<"ingreso" | "egreso">("ingreso");
  const [newName, setNewName] = useState("");
  const [newCopies, setNewCopies] = useState(1);
  const [newTargetSocios, setNewTargetSocios] = useState(true);
  const [newTargetPersonas, setNewTargetPersonas] = useState(true);

  const ingresoConcepts = concepts.filter((c) => c.type === "ingreso");
  const egresoConcepts = concepts.filter((c) => c.type === "egreso");

  const updateConcept = (id: string, field: keyof ReceiptConcept, value: boolean | number | string) => {
    setConcepts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const updateTarget = (id: string, flag: "socios" | "personas", checked: boolean) => {
    setConcepts((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      let socios = c.target === "socios" || c.target === "ambos";
      let personas = c.target === "personas" || c.target === "ambos";
      if (flag === "socios") socios = checked;
      else personas = checked;
      if (socios && personas) return { ...c, target: "ambos" as const };
      if (socios) return { ...c, target: "socios" as const };
      if (personas) return { ...c, target: "personas" as const };
      return { ...c, target: "socios" as const };
    }));
  };

  const removeConcept = (id: string) => {
    setConcepts((prev) => prev.filter((c) => c.id !== id));
  };

  const addConcept = () => {
    if (!newName.trim()) return;
    const typeConcepts = concepts.filter((c) => c.type === newType);
    const maxOrder = typeConcepts.length > 0 ? Math.max(...typeConcepts.map((c) => c.sort_order)) : 0;
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let target: "socios" | "personas" | "ambos" = "ambos";
    if (newType === "ingreso") {
      if (newTargetSocios && !newTargetPersonas) target = "socios";
      else if (!newTargetSocios && newTargetPersonas) target = "personas";
      else if (!newTargetSocios && !newTargetPersonas) target = "socios";
    }
    setConcepts((prev) => [
      ...prev,
      {
        id: tempId,
        type: newType,
        name: newName.trim(),
        target,
        sort_order: maxOrder + 1,
        active: true,
        copies_to_print: newCopies,
      },
    ]);
    setNewName("");
    setNewCopies(1);
    setNewTargetSocios(true);
    setNewTargetPersonas(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await saveReceiptConcepts(concepts);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const renderTable = (title: string, items: ReceiptConcept[], showTarget: boolean) => (
    <div className={`config-cemetery-table receipt-copies-table${showTarget ? " show-target" : ""}`} style={{ marginBottom: 16 }}>
      <div className="config-cemetery-header">
        <div className="config-cemetery-cell config-cemetery-label">{title}</div>
        {showTarget && <div className="config-cemetery-cell config-cemetery-col-header">Socios</div>}
        {showTarget && <div className="config-cemetery-cell config-cemetery-col-header">Personas</div>}
        <div className="config-cemetery-cell config-cemetery-col-header">Copias</div>
        <div className="config-cemetery-cell config-cemetery-col-header">Activo</div>
        <div className="config-cemetery-cell config-cemetery-col-header"></div>
      </div>
      {items.map((c) => {
        const isSocios = c.target === "socios" || c.target === "ambos";
        const isPersonas = c.target === "personas" || c.target === "ambos";
        return (
          <div key={c.id} className="config-cemetery-row" style={{ opacity: c.active ? 1 : 0.5, alignItems: "center" }}>
            <div className="config-cemetery-cell config-cemetery-row-label">
              <input
                type="text"
                className="config-input"
                value={c.name}
                onChange={(e) => updateConcept(c.id, "name", e.target.value)}
                style={{ fontWeight: 500 }}
              />
            </div>
            {showTarget && (
              <div className="config-cemetery-cell" style={{ justifyContent: "center" }}>
                <input
                  type="checkbox"
                  checked={isSocios}
                  onChange={(e) => updateTarget(c.id, "socios", e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
              </div>
            )}
            {showTarget && (
              <div className="config-cemetery-cell" style={{ justifyContent: "center" }}>
                <input
                  type="checkbox"
                  checked={isPersonas}
                  onChange={(e) => updateTarget(c.id, "personas", e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
              </div>
            )}
            <div className="config-cemetery-cell">
              <select
                className="config-input"
                value={c.copies_to_print}
                onChange={(e) => updateConcept(c.id, "copies_to_print", parseInt(e.target.value, 10))}
              >
                {COPIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="config-cemetery-cell" style={{ justifyContent: "center" }}>
              <input
                type="checkbox"
                checked={c.active}
                onChange={(e) => updateConcept(c.id, "active", e.target.checked)}
                style={{ cursor: "pointer" }}
              />
            </div>
            <div className="config-cemetery-cell" style={{ justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => removeConcept(c.id)}
                className="config-delete-btn"
                title="Eliminar concepto"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
      {items.length === 0 && (
        <div className="config-cemetery-row">
          <div className="config-cemetery-cell" style={{ gridColumn: "1 / -1", color: "var(--muted)", fontStyle: "italic", fontSize: 13 }}>
            No hay conceptos cargados
          </div>
        </div>
      )}
    </div>
  );

  const newTargetSociosDisabled = newType === "egreso";
  const newTargetPersonasDisabled = newType === "egreso";

  return (
    <form onSubmit={handleSave} className="config-form">
      <p className="config-cemetery-subtitle">
        Definí los conceptos de comprobantes, la cantidad de copias por defecto y a quién aplica cada concepto de ingreso.
      </p>

      {renderTable("Conceptos de Ingreso", ingresoConcepts, true)}
      {renderTable("Conceptos de Egreso", egresoConcepts, false)}

      <div className="config-cemetery-table receipt-copies-add" style={{ marginBottom: 16 }}>
        <div className="config-cemetery-header">
          <div className="config-cemetery-cell config-cemetery-label">Agregar nuevo concepto</div>
        </div>
        <div className="config-cemetery-row" style={{ alignItems: "center" }}>
          <div className="config-cemetery-cell">
            <select
              className="config-input"
              value={newType}
              onChange={(e) => setNewType(e.target.value as "ingreso" | "egreso")}
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>
          <div className="config-cemetery-cell">
            <input
              type="text"
              className="config-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del concepto"
            />
          </div>
          {newType === "ingreso" && (
            <>
              <div className="config-cemetery-cell" style={{ justifyContent: "center" }}>
                <label style={{ fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={newTargetSocios}
                    onChange={(e) => setNewTargetSocios(e.target.checked)}
                    disabled={newTargetSociosDisabled}
                    style={{ cursor: "pointer" }}
                  />
                  Socios
                </label>
              </div>
              <div className="config-cemetery-cell" style={{ justifyContent: "center" }}>
                <label style={{ fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={newTargetPersonas}
                    onChange={(e) => setNewTargetPersonas(e.target.checked)}
                    disabled={newTargetPersonasDisabled}
                    style={{ cursor: "pointer" }}
                  />
                  Personas
                </label>
              </div>
            </>
          )}
          <div className="config-cemetery-cell">
            <select
              className="config-input"
              value={newCopies}
              onChange={(e) => setNewCopies(parseInt(e.target.value, 10))}
            >
              {COPIES_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="config-cemetery-cell">
            <button
              type="button"
              className="config-save-btn"
              onClick={addConcept}
              disabled={!newName.trim()}
              style={{ padding: "6px 12px", fontSize: 13 }}
            >
              <Plus size={14} /> Agregar
            </button>
          </div>
        </div>
      </div>

      {error && <div className="config-error">{error}</div>}
      {success && <div className="config-success">Valores guardados correctamente</div>}
      <button type="submit" className="config-save-btn" disabled={saving}>
        {saving ? <><Loader size={16} className="spin" /> Guardando...</> : <><Save size={16} /> Guardar</>}
      </button>
    </form>
  );
};

export default ReceiptCopiesConfig;
