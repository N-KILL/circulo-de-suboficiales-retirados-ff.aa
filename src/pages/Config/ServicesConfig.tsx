import React, { useState } from "react";
import { Save, Loader, Plus, Trash2, Pencil, X } from "lucide-react";
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

  return (
    <div className="config-card">
      <h3>Servicios</h3>
      <p className="config-description">
        Gestioná los servicios disponibles para cobrar. Se mostrarán en el formulario de nuevo movimiento.
      </p>
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
        <div className="services-list">
          {services.map((svc) => (
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
        </div>
      )}
    </div>
  );
};

export default ServicesConfig;
