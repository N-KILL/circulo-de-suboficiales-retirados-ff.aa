import React, { useState, useMemo } from "react";
import { Save, Loader, Plus, Trash2, Pencil, X, Search, ArrowUpDown } from "lucide-react";
import {
  saveExternalService,
  updateExternalService,
  deleteExternalService,
  type ExternalServiceItem,
} from "../../services/externalServicesApi";

const FRECUENCIAS = [
  { value: "unico", label: "Único" },
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

const FRECUENCIA_LABEL: Record<string, string> = Object.fromEntries(
  FRECUENCIAS.map((f) => [f.value, f.label])
);

export { FRECUENCIAS, FRECUENCIA_LABEL };

interface ExternalServicesConfigProps {
  initialServices: ExternalServiceItem[];
}

const MESES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ExternalServicesConfig: React.FC<ExternalServicesConfigProps> = ({ initialServices }) => {
  const [services, setServices] = useState<ExternalServiceItem[]>(initialServices);
  const [svcName, setSvcName] = useState("");
  const [svcPhone, setSvcPhone] = useState("");
  const [svcDescription, setSvcDescription] = useState("");
  const [svcFrequency, setSvcFrequency] = useState("mensual");
  const [svcStartMonth, setSvcStartMonth] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editActive, setEditActive] = useState(true);

  const resetForm = () => {
    setSvcName("");
    setSvcPhone("");
    setSvcDescription("");
    setSvcFrequency("mensual");
    setSvcStartMonth(null);
    setEditId(null);
    setEditActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const phone = svcPhone.trim() || null;
      const desc = svcDescription.trim() || null;
      const sm = svcFrequency === "mensual" || svcFrequency === "unico" || svcFrequency === "semanal" || svcFrequency === "quincenal" ? null : svcStartMonth;
      if (editId) {
        const updated = await updateExternalService(editId, svcName.trim(), phone, desc, svcFrequency, sm, editActive);
        setServices((prev) => prev.map((s) => (s.id === editId ? updated : s)).sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const created = await saveExternalService(svcName.trim(), phone, desc, svcFrequency, sm);
        setServices((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar servicio");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (svc: ExternalServiceItem) => {
    setSvcName(svc.name);
    setSvcPhone(svc.phone ?? "");
    setSvcDescription(svc.description ?? "");
    setSvcFrequency(svc.frequency ?? "mensual");
    setSvcStartMonth(svc.start_month ?? null);
    setEditId(svc.id);
    setEditActive(svc.active);
  };

  const handleDelete = async (delId: string) => {
    if (editId === delId) resetForm();
    try {
      await deleteExternalService(delId);
      setServices((prev) => prev.filter((s) => s.id !== delId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar servicio");
    }
  };

  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState<"name" | "frequency">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredServices = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    let list = services;
    if (q) {
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      return (a.frequency ?? "").localeCompare(b.frequency ?? "") * dir;
    });
    return list;
  }, [services, searchText, sortField, sortDir]);

  return (
    <>
      <form onSubmit={handleSubmit} className="config-form">
        <div className="config-field">
          <label>{editId ? "Nombre del servicio" : "Nuevo servicio externo"}</label>
          <input type="text" className="config-input" value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="Ej: Luz, Agua, Gas..." />
        </div>
        <div className="config-field">
          <label>Tipo de pago</label>
          <select className="config-input" value={svcFrequency} onChange={(e) => setSvcFrequency(e.target.value)}>
            {FRECUENCIAS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        {!["mensual", "unico", "semanal", "quincenal"].includes(svcFrequency) && (
          <div className="config-field">
            <label>Mes de inicio de pagos</label>
            <select
              className="config-input"
              value={svcStartMonth ?? ""}
              onChange={(e) => setSvcStartMonth(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Sin definir</option>
              {MESES.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        )}
        <div className="config-field">
          <label>Teléfono (opcional)</label>
          <input type="text" className="config-input" value={svcPhone} onChange={(e) => setSvcPhone(e.target.value)} placeholder="Número de contacto..." />
        </div>
        <div className="config-field">
          <label>Descripción (opcional)</label>
          <input type="text" className="config-input" value={svcDescription} onChange={(e) => setSvcDescription(e.target.value)} placeholder="Detalle del servicio..." />
        </div>
        {editId && (
          <div className="config-field">
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              Activo
            </label>
          </div>
        )}
        {error && <div className="config-error">{error}</div>}
        <div className="config-form-actions">
          <button type="submit" className="config-save-btn" disabled={saving || !svcName.trim()}>
            {saving ? <><Loader size={16} className="spin" /> Guardando...</> : editId ? <><Save size={16} /> Actualizar</> : <><Plus size={16} /> Agregar</>}
          </button>
          {editId && (
            <button type="button" className="config-save-btn" onClick={resetForm} style={{ background: "#6c757d" }}>
              <X size={16} /> Cancelar
            </button>
          )}
        </div>
      </form>

      {services.length > 0 && (
        <div className="svc-list-wrapper">
          <div className="svc-list-toolbar">
            <div className="svc-list-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="svc-list-sort">
              <ArrowUpDown size={14} />
              <select value={`${sortField}-${sortDir}`} onChange={(e) => {
                const [field, dir] = e.target.value.split("-");
                setSortField(field as "name" | "frequency");
                setSortDir(dir as "asc" | "desc");
              }}>
                <option value="name-asc">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="frequency-asc">Frecuencia A-Z</option>
                <option value="frequency-desc">Frecuencia Z-A</option>
              </select>
            </div>
          </div>
          <div className="services-list custom-scroll">
            {filteredServices.map((svc) => (
              <div key={svc.id} className="service-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{svc.name}</span>
                  <span style={{ fontSize: 11, color: "var(--azul-institucional)", background: "var(--gris-claro)", padding: "1px 6px", borderRadius: 4 }}>
                    {FRECUENCIA_LABEL[svc.frequency] ?? svc.frequency}
                  </span>
                  {svc.phone && <span style={{ fontSize: 12, color: "var(--muted)" }}>{svc.phone}</span>}
                  {!svc.active && (
                    <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>inactivo</span>
                  )}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    <button type="button" onClick={() => handleStartEdit(svc)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--azul-institucional)", padding: 4 }}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => handleDelete(svc.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545", padding: 4 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {svc.description && (
                  <span style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{svc.description}</span>
                )}
              </div>
            ))}
            {filteredServices.length === 0 && (
              <div className="svc-list-empty">No se encontraron servicios</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ExternalServicesConfig;
