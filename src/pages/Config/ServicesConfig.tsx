import React, { useState, useMemo } from "react";
import { Save, Loader, Plus, Trash2, Pencil, X, Search, ArrowUpDown } from "lucide-react";
import { saveService, updateService, deleteService } from "../../services/servicesApi";
import type { ServiceItem } from "../../services/servicesApi";
import { parseMoney } from "../../utils/format";

interface ServicesConfigProps {
  initialServices: ServiceItem[];
}

const ServicesConfig: React.FC<ServicesConfigProps> = ({ initialServices }) => {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [svcName, setSvcName] = useState("");
  const [svcAmount, setSvcAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);

  const resetForm = () => { setSvcName(""); setSvcAmount(""); setEditServiceId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const amount = parseMoney(svcAmount);
      if (editServiceId) {
        const updated = await updateService(editServiceId, svcName.trim(), amount);
        setServices((prev) => prev.map((s) => (s.id === editServiceId ? updated : s)).sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const created = await saveService(svcName.trim(), amount);
        setServices((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar servicio");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (svc: ServiceItem) => { setSvcName(svc.name); setSvcAmount(svc.amount.toString()); setEditServiceId(svc.id); };

  const handleDelete = async (delId: string) => {
    if (editServiceId === delId) resetForm();
    try {
      await deleteService(delId);
      setServices((prev) => prev.filter((s) => s.id !== delId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar servicio");
    }
  };

  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState<"name" | "amount">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredServices = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    let list = services;
    if (q) {
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      return (a.amount - b.amount) * dir;
    });
    return list;
  }, [services, searchText, sortField, sortDir]);

  return (
    <>
      <form onSubmit={handleSubmit} className="config-form">
        <div className="config-field">
          <label>{editServiceId ? "Nombre del servicio" : "Nuevo servicio"}</label>
          <input type="text" className="config-input" value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="Nombre del servicio" />
        </div>
        <div className="config-field">
          <label>Costo</label>
          <input type="text" className="config-input" value={svcAmount} onChange={(e) => setSvcAmount(e.target.value)} placeholder="0.00" />
        </div>
        {error && <div className="config-error">{error}</div>}
        <div className="config-form-actions">
          <button type="submit" className="config-save-btn" disabled={saving || !svcName.trim()}>
            {saving ? <><Loader size={16} className="spin" /> Guardando...</> : editServiceId ? <><Save size={16} /> Actualizar Servicio</> : <><Plus size={16} /> Agregar Servicio</>}
          </button>
          {editServiceId && (
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
                setSortField(field as "name" | "amount");
                setSortDir(dir as "asc" | "desc");
              }}>
                <option value="name-asc">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="amount-asc">Monto menor</option>
                <option value="amount-desc">Monto mayor</option>
              </select>
            </div>
          </div>
          <div className="services-list custom-scroll">
            {filteredServices.map((svc) => (
              <div key={svc.id} className="service-item">
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600 }}>{svc.name}</span>
                  <span style={{ marginLeft: 12, color: "var(--muted)" }}>
                    $ {svc.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button type="button" onClick={() => handleStartEdit(svc)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--azul-institucional)", padding: 4 }}>
                  <Pencil size={16} />
                </button>
                <button type="button" onClick={() => handleDelete(svc.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545", padding: 4 }}>
                  <Trash2 size={16} />
                </button>
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

export default ServicesConfig;
