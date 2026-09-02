import React, { useRef, useState } from "react";
import { Search, User, Loader } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { fetchAllPersons, fetchPersonById, savePerson } from "../../../services/personsApi";
import type { Person } from "../../../models/members";

interface ProviderPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonSaved: (person: Person) => void;
}

type Mode = "add" | "edit";

const emptyForm = (): Person => ({
  id: crypto.randomUUID(),
  nombre: "",
  tipoDoc: "DNI",
  documento: "",
  domicilio: "",
  telefono: "",
  brindaServicios: true,
});

interface ContentProps {
  onClose: () => void;
  onPersonSaved: (person: Person) => void;
}

const ProviderPersonModalContent: React.FC<ContentProps> = ({ onClose, onPersonSaved }) => {
  const [mode, setMode] = useState<Mode>("add");
  const [form, setForm] = useState<Person>(emptyForm());
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allPersons = useRef<Person[]>([]);
  const fetchedAll = useRef(false);

  const handleField = (key: keyof Person, value: Person[keyof Person]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const doSearch = (value: string) => {
    const s = value.toLowerCase().trim();
    if (!allPersons.current.length && !fetchedAll.current) {
      fetchAllPersons()
        .then((list) => {
          allPersons.current = list;
          fetchedAll.current = true;
          setSearchResults(list.filter(
            (p) => p.nombre.toLowerCase().includes(s) || p.documento.includes(s)
          ));
        })
        .catch(() => setSearchResults([]));
      return;
    }
    setSearchResults(allPersons.current.filter(
      (p) => p.nombre.toLowerCase().includes(s) || p.documento.includes(s)
    ));
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setSelectedForEdit(null);
    if (value.trim() === "") {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setShowDropdown(true);
    doSearch(value);
  };

  const selectForEdit = async (p: Person) => {
    setLoading(true);
    setError(null);
    try {
      const full = p.id ? await fetchPersonById(p.id) : p;
      setSelectedForEdit(p);
      setForm({ ...full, brindaServicios: true });
      setSearchText(p.nombre);
      setShowDropdown(false);
      setMode("edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la persona");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const personToSave = { ...form, brindaServicios: true };
      await savePerson(personToSave);
      onPersonSaved(personToSave);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la persona");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={mode === "add" ? "Agregar persona" : "Modificar persona"} maxWidth={520}>
      <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn-cancel"
            style={{ flex: 1, background: mode === "add" ? "var(--azul-institucional)" : "transparent", color: mode === "add" ? "#fff" : "var(--text)", border: "1px solid var(--border)", fontWeight: 600 }}
            onClick={() => { setMode("add"); setError(null); setForm(emptyForm()); setSearchText(""); setSelectedForEdit(null); setShowDropdown(false); }}
          >
            Agregar
          </button>
          <button
            type="button"
            className="btn-cancel"
            style={{ flex: 1, background: mode === "edit" ? "var(--azul-institucional)" : "transparent", color: mode === "edit" ? "#fff" : "var(--text)", border: "1px solid var(--border)", fontWeight: 600 }}
            onClick={() => { setMode("edit"); setError(null); }}
          >
            Modificar
          </button>
        </div>

        {error && (
          <div className="error-banner" style={{ fontSize: 13, color: "var(--danger, #dc3545)" }}>
            {error}
          </div>
        )}

        {mode === "edit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label>Buscar persona para modificar</label>
            <div style={{ position: "relative" }}>
              <div className="input-with-icon">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre o documento..."
                  value={searchText}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => { if (searchText.trim()) setShowDropdown(true); }}
                  disabled={loading}
                />
                <Search size={18} className="input-icon" />
              </div>
              {showDropdown && searchResults.length > 0 && (
                <div className="member-dropdown" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20 }}>
                  {searchResults.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className="member-dropdown-item"
                      onClick={() => selectForEdit(p)}
                    >
                      <User size={16} />
                      <div className="member-dropdown-info">
                        <span className="member-dropdown-name">{p.nombre}</span>
                        <span className="member-dropdown-detail">{p.tipoDoc} {p.documento}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedForEdit && (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Modificando: <strong>{selectedForEdit.nombre}</strong>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-group">
            <label>Nombre y Apellido <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              value={form.nombre}
              onChange={(e) => handleField("nombre", e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label>Tipo de Documento</label>
              <select
                className="form-control"
                value={form.tipoDoc}
                onChange={(e) => handleField("tipoDoc", e.target.value)}
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
                type="text"
                className="form-control"
                value={form.documento}
                onChange={(e) => handleField("documento", e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Domicilio</label>
            <input
              type="text"
              className="form-control"
              value={form.domicilio}
              onChange={(e) => handleField("domicilio", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="text"
              className="form-control"
              value={form.telefono}
              onChange={(e) => handleField("telefono", e.target.value)}
            />
          </div>

          <div
            className="form-group"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--azul-institucional-soft, #eef4fb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}
          >
            <input
              type="checkbox"
              checked={Boolean(form.brindaServicios)}
              onChange={(e) => handleField("brindaServicios", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--azul-institucional)" }}
            />
            <label style={{ margin: 0, fontWeight: 600, cursor: "pointer" }}>
              Brinda servicios
            </label>
          </div>

          {mode === "edit" && (
            <div style={{ fontSize: 13, color: "var(--muted, #6b7280)", background: "#fff8e1", border: "1px solid #f0d98c", borderRadius: 8, padding: "10px 12px" }}>
              Al guardar, esta persona quedará marcada como que <strong>brinda servicios</strong>.
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={saving || !form.nombre.trim()}>
              {saving ? <><Loader size={16} className="spin" /> Guardando...</> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const ProviderPersonModal: React.FC<ProviderPersonModalProps> = ({ isOpen, onClose, onPersonSaved }) => {
  if (!isOpen) return null;
  return (
    <ProviderPersonModalContent
      onClose={onClose}
      onPersonSaved={onPersonSaved}
    />
  );
};

export default ProviderPersonModal;
