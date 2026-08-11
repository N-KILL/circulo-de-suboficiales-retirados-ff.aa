import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader, Trash2 } from "lucide-react";
import "../../Members/NewMember/NewMember.css";
import { usePersonFormStore } from "../../../store/personFormStore";
import { fetchPersonById, deletePerson, fetchPersonMembers } from "../../../services/personsApi";
import type { PersonMember } from "../../../services/personsApi";
import type { Person } from "../../../models/members";

const NewPerson: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(isEditing);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [linkedMembers, setLinkedMembers] = useState<PersonMember[]>([]);

  const form = usePersonFormStore((s) => s.form);
  const setField = usePersonFormStore((s) => s.setField);
  const setForm = usePersonFormStore((s) => s.setForm);
  const save = usePersonFormStore((s) => s.save);
  const reset = usePersonFormStore((s) => s.reset);

  useEffect(() => {
    if (id) {
      let mounted = true;
      fetchPersonById(id)
        .then((person) => { if (mounted) { setFetchError(null); setForm(person); } })
        .catch((err) => { if (mounted) setFetchError(err instanceof Error ? err.message : "Error al cargar persona") })
        .finally(() => { if (mounted) setLoading(false); });
      fetchPersonMembers(id)
        .then((members) => { if (mounted) setLinkedMembers(members); })
        .catch(() => { if (mounted) setLinkedMembers([]); });
      return () => { mounted = false; };
    } else {
      reset();
    }
  }, [id, setForm, reset]);

  const handleChange = (key: keyof Person, value: Person[keyof Person]) => setField(key, value);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await save();
      navigate("/personas");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setSaveError(null);
    try {
      await deletePerson(id);
      setShowConfirmDelete(false);
      navigate("/personas");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al eliminar");
      setShowConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="new-member-container">
        <div className="treasury-header-row">
          <h2>Editar persona</h2>
        </div>
        <div className="table-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 32 }}>
          <Loader size={20} className="spin" />
          <span style={{ color: "var(--muted)" }}>Cargando datos de la persona...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="new-member-container">
      <div className="treasury-header-row">
        <button
          onClick={() => navigate("/personas")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none",
            color: "var(--azul-institucional)", fontWeight: 600,
            cursor: "pointer", padding: "4px 0", fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          <ArrowLeft size={18} /> Volver a Personas
        </button>
      </div>
      {fetchError && (
        <div className="table-card" style={{ padding: 20, color: "var(--danger, #dc3545)" }}>
          {fetchError}
        </div>
      )}
      {!fetchError && isEditing && linkedMembers.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
            Socio{linkedMembers.length > 1 ? "s" : ""} donde es apoderado ({linkedMembers.length}):
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {linkedMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => navigate(`/socios/editar/${m.id}`)}
                style={{
                  cursor: "pointer",
                  fontSize: 13,
                  padding: "3px 8px",
                  borderRadius: 4,
                  display: "flex",
                  gap: 12,
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-claro)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--card-bg)")}
              >
                <span style={{ fontWeight: 600, color: "var(--azul-institucional)", minWidth: 60 }}>
                  {m.numeroDeSocio}
                </span>
                <span style={{ color: "var(--text)" }}>{m.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!fetchError && (
        <div className="new-member-layout" style={{ gridTemplateColumns: "1fr" }}>
          <div className="new-member-form-section">
            <form onSubmit={handleSave} className="card-custom">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Nombre y Apellido</label>
                  <input
                    className="form-control"
                    value={form.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Tipo de Documento</label>
                  <select
                    className="form-control"
                    value={form.tipoDoc}
                    onChange={(e) => handleChange("tipoDoc", e.target.value)}
                  >
                    <option>DNI</option>
                    <option>LE</option>
                    <option>LC</option>
                    <option>Pasaporte</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Documento</label>
                  <input
                    className="form-control"
                    value={form.documento}
                    onChange={(e) => handleChange("documento", e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Domicilio</label>
                  <input
                    className="form-control"
                    value={form.domicilio}
                    onChange={(e) => handleChange("domicilio", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    className="form-control"
                    value={form.telefono}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                  />
                </div>
              </div>

              {saveError && (
                <div className="form-error">{saveError}</div>
              )}
              <div className="form-actions-panel">
                {isEditing && (
                  <button
                    type="button"
                    className="btn-delete"
                    disabled={saving}
                    onClick={() => setShowConfirmDelete(true)}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                )}
                <button
                  type="button"
                  className="btn-cancel"
                  disabled={saving}
                  onClick={() => {
                    reset();
                    navigate("/personas");
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? (
                    <><Loader size={16} className="spin" /> Guardando...</>
                  ) : (
                    <><Save size={16} /> {isEditing ? "Actualizar" : "Guardar"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3>Eliminar persona</h3>
            <p>
              ¿Estás seguro de que querés eliminar a <strong>{form.nombre}</strong>?
            </p>
            <p className="confirm-warning">Esta acción no se puede deshacer.</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-cancel"
                disabled={deleting}
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-delete confirm-btn"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? (
                  <><Loader size={16} className="spin" /> Eliminando...</>
                ) : (
                  <>Eliminar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewPerson;
