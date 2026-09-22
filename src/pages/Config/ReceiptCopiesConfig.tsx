import React, { useState } from "react";
import { Save, Loader, Plus, Trash2 } from "lucide-react";
import { saveReceiptConcepts, type ReceiptConcept } from "../../services/receiptCopiesConfigApi";
import Modal from "../../components/ui/Modal";

interface ReceiptCopiesConfigProps {
  initialConcepts: ReceiptConcept[];
}

const COPIES_OPTIONS = [
  { value: 1, label: "Original (1)" },
  { value: 2, label: "Duplicado (2)" },
  { value: 3, label: "Triplicado (3)" },
];

const BASE_INGRESO = ["Cuota Socio", "Servicios", "Cementerio"].map((n) => n.toLowerCase());
const BASE_EGRESO = ["Servicios Varios", "Pago de servicio externo", "Otros", "Adelanto de haberes", "Pago de haberes"].map((n) => n.toLowerCase());

function isBaseConcept(name: string, type: "ingreso" | "egreso"): boolean {
  const key = name.toLowerCase();
  return type === "ingreso" ? BASE_INGRESO.includes(key) : BASE_EGRESO.includes(key);
}

type ConceptChange = {
  id: string;
  name: string;
  type: "ingreso" | "egreso";
  details: string[];
  base: boolean;
};

type ChangesSummary = {
  added: ConceptChange[];
  removed: ConceptChange[];
  modified: ConceptChange[];
};

function typeLabel(type: "ingreso" | "egreso"): string {
  return type === "ingreso" ? "Ingreso" : "Egreso";
}

function targetLabel(target: "socios" | "personas" | "ambos"): string {
  if (target === "socios") return "Solo socios";
  if (target === "personas") return "Solo terceros";
  return "Socios y terceros";
}

function computeChanges(initialConcepts: ReceiptConcept[], concepts: ReceiptConcept[]): ChangesSummary {
  const initialMap = new Map(initialConcepts.map((c) => [c.id, c]));
  const currentMap = new Map(concepts.map((c) => [c.id, c]));

  const added: ConceptChange[] = concepts
    .filter((c) => !initialMap.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, type: c.type, details: [], base: isBaseConcept(c.name, c.type) }));

  const removed: ConceptChange[] = initialConcepts
    .filter((c) => !currentMap.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, type: c.type, details: [], base: isBaseConcept(c.name, c.type) }));

  const modified: ConceptChange[] = [];
  for (const init of initialConcepts) {
    const cur = currentMap.get(init.id);
    if (!cur) continue;
    const details: string[] = [];
    if (cur.name !== init.name) details.push(`Nombre: "${init.name}" → "${cur.name}"`);
    if (cur.copies_to_print !== init.copies_to_print) details.push(`Copias: ${init.copies_to_print} → ${cur.copies_to_print}`);
    if (cur.active !== init.active) details.push(`Activo: ${init.active ? "Sí" : "No"} → ${cur.active ? "Sí" : "No"}`);
    if (cur.target !== init.target) details.push(`Destino: ${targetLabel(init.target)} → ${targetLabel(cur.target)}`);
    if (details.length > 0) {
      modified.push({ id: cur.id, name: cur.name, type: cur.type, details, base: isBaseConcept(init.name, init.type) });
    }
  }

  return { added, removed, modified };
}

const ReceiptCopiesConfig: React.FC<ReceiptCopiesConfigProps> = ({ initialConcepts }) => {
  const [concepts, setConcepts] = useState<ReceiptConcept[]>(() =>
    [...initialConcepts].sort((a, b) => a.type.localeCompare(b.type) || a.sort_order - b.sort_order)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Valores guardados correctamente");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ChangesSummary>({ added: [], removed: [], modified: [] });

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const changes = computeChanges(initialConcepts, concepts);
    if (changes.added.length === 0 && changes.removed.length === 0 && changes.modified.length === 0) {
      setSuccessMsg("No hay cambios para guardar");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }
    setPendingChanges(changes);
    setConfirmOpen(true);
  };

  const runSave = async () => {
    setConfirmOpen(false);
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const saved = await saveReceiptConcepts(concepts);
      setConcepts(saved);
      setSuccessMsg("Valores guardados correctamente");
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
        {showTarget && <div className="config-cemetery-cell config-cemetery-col-header">Terceros</div>}
        <div className="config-cemetery-cell config-cemetery-col-header">Copias</div>
        <div className="config-cemetery-cell config-cemetery-col-header">Activo</div>
        <div className="config-cemetery-cell config-cemetery-col-header"></div>
      </div>
      {items.map((c) => {
        const isSocios = c.target === "socios" || c.target === "ambos";
        const isPersonas = c.target === "personas" || c.target === "ambos";
        const isBase = isBaseConcept(c.name, c.type);
        return (
          <div key={c.id} className="config-cemetery-row" style={{ opacity: c.active ? 1 : 0.5, alignItems: "center" }}>
            <div className="config-cemetery-cell config-cemetery-row-label">
              <input autoComplete="off"
                type="text"
                className="config-input"
                value={c.name}
                onChange={(e) => updateConcept(c.id, "name", e.target.value)}
                style={{ fontWeight: 500 }}
                readOnly={isBase}
                disabled={isBase}
                title={isBase ? "Concepto base, no se puede modificar" : undefined}
              />
            </div>
            {showTarget && (
              <div className="config-cemetery-cell" style={{ justifyContent: "center" }}>
                <input autoComplete="off"
                  type="checkbox"
                  checked={isSocios}
                  onChange={(e) => updateTarget(c.id, "socios", e.target.checked)}
                  style={{ cursor: "pointer" }}
                  disabled={isBase}
                  title={isBase ? "Concepto base" : undefined}
                />
              </div>
            )}
            {showTarget && (
              <div className="config-cemetery-cell" style={{ justifyContent: "center" }}>
                <input autoComplete="off"
                  type="checkbox"
                  checked={isPersonas}
                  onChange={(e) => updateTarget(c.id, "personas", e.target.checked)}
                  style={{ cursor: "pointer" }}
                  disabled={isBase}
                  title={isBase ? "Concepto base" : undefined}
                />
              </div>
            )}
            <div className="config-cemetery-cell">
              <select autoComplete="off"
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
              <input autoComplete="off"
                type="checkbox"
                checked={c.active}
                onChange={(e) => updateConcept(c.id, "active", e.target.checked)}
                style={{ cursor: "pointer" }}
                disabled={isBase}
                title={isBase ? "Concepto base, no se puede desactivar" : undefined}
              />
            </div>
            <div className="config-cemetery-cell" style={{ justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => removeConcept(c.id)}
                className="config-delete-btn"
                title={isBase ? "Concepto base, no se puede eliminar" : "Eliminar concepto"}
                disabled={isBase}
                style={isBase ? { opacity: 0.3, cursor: "not-allowed" } : undefined}
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
      <p className="config-cemetery-subtitle" style={{ color: "var(--muted)", fontSize: 12 }}>
        Los conceptos base (Cuota Socio, Servicios, Cementerio, Servicios Varios, Pago de servicio externo, Otros, Adelanto de haberes y Pago de haberes) no se pueden modificar ni eliminar; solo se puede cambiar la cantidad de copias.
      </p>

      {renderTable("Conceptos de Ingreso", ingresoConcepts, true)}
      {renderTable("Conceptos de Egreso", egresoConcepts, false)}

      <div className="config-cemetery-table receipt-copies-add" style={{ marginBottom: 16 }}>
        <div className="config-cemetery-header">
          <div className="config-cemetery-cell config-cemetery-label">Agregar nuevo concepto</div>
        </div>
        <div className="config-cemetery-row" style={{ alignItems: "center" }}>
          <div className="config-cemetery-cell">
            <select autoComplete="off"
              className="config-input"
              value={newType}
              onChange={(e) => setNewType(e.target.value as "ingreso" | "egreso")}
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>
          <div className="config-cemetery-cell">
            <input autoComplete="off"
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
                  <input autoComplete="off"
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
                  <input autoComplete="off"
                    type="checkbox"
                    checked={newTargetPersonas}
                    onChange={(e) => setNewTargetPersonas(e.target.checked)}
                    disabled={newTargetPersonasDisabled}
                    style={{ cursor: "pointer" }}
                  />
Terceros
                </label>
              </div>
            </>
          )}
          <div className="config-cemetery-cell">
            <select autoComplete="off"
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
      {success && <div className="config-success">{successMsg}</div>}
      <button type="submit" className="config-save-btn" disabled={saving}>
        {saving ? <><Loader size={16} className="spin" /> Guardando...</> : <><Save size={16} /> Guardar</>}
      </button>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar cambios">
        <div className="config-confirm-body">
          <p className="config-confirm-intro">
            ¿Está seguro que quiere guardar los siguientes cambios?
          </p>

          {pendingChanges.removed.length > 0 && (
            <div className="config-confirm-section">
              <div className="config-confirm-title config-confirm-title-removed">
                Eliminar conceptos ({pendingChanges.removed.length})
              </div>
              <ul className="config-confirm-list">
                {pendingChanges.removed.map((c) => (
                  <li key={c.id} className="config-confirm-item">
                    <span className="config-confirm-badge config-confirm-badge-removed">Eliminar</span>
                    <span className="config-confirm-name">{c.name}</span>
                    <span className="config-confirm-type">{typeLabel(c.type)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pendingChanges.added.length > 0 && (
            <div className="config-confirm-section">
              <div className="config-confirm-title config-confirm-title-added">
                Agregar conceptos ({pendingChanges.added.length})
              </div>
              <ul className="config-confirm-list">
                {pendingChanges.added.map((c) => (
                  <li key={c.id} className="config-confirm-item">
                    <span className="config-confirm-badge config-confirm-badge-added">Agregar</span>
                    <span className="config-confirm-name">{c.name}</span>
                    <span className="config-confirm-type">{typeLabel(c.type)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pendingChanges.modified.length > 0 && (
            <div className="config-confirm-section">
              <div className="config-confirm-title config-confirm-title-modified">
                Modificar conceptos ({pendingChanges.modified.length})
              </div>
              <ul className="config-confirm-list">
                {pendingChanges.modified.map((c) => (
                  <li key={c.id} className="config-confirm-item config-confirm-item-col">
                    <div className="config-confirm-item-top">
                      <span className="config-confirm-badge config-confirm-badge-modified">Modificar</span>
                      <span className="config-confirm-name">{c.name}</span>
                      <span className="config-confirm-type">{typeLabel(c.type)}</span>
                      {c.base && <span className="config-confirm-base">base</span>}
                    </div>
                    <ul className="config-confirm-details">
                      {c.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="config-confirm-actions">
          <button type="button" className="config-cancel-btn" onClick={() => setConfirmOpen(false)} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className={pendingChanges.removed.length > 0 ? "config-save-btn config-save-danger" : "config-save-btn"}
            onClick={runSave}
            disabled={saving}
          >
            {saving ? <><Loader size={16} className="spin" /> Guardando...</> : <><Save size={16} /> {pendingChanges.removed.length > 0 ? "Eliminar y guardar" : "Guardar cambios"}</>}
          </button>
        </div>
      </Modal>
    </form>
  );
};

export default ReceiptCopiesConfig;
