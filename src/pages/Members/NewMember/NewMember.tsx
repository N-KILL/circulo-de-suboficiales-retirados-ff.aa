import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Save, User, Loader, Trash2, Calendar } from "lucide-react";
import "./NewMember.css";
import { useMembersStore } from "../../../store/membersStore";
import { fetchMemberById, deleteMember } from "../../../services/membersApi";
import type { MembersState, Person } from "../../../models/members";

const mockPeople: Person[] = [
  { nombre: "Juan", tipoDoc: "", documento: "12345678", domicilio: "", telefono: "3581234567" },
  { nombre: "Lucia", tipoDoc: "", documento: "23456789", domicilio: "", telefono: "3581234567" },
  { nombre: "Miguel", tipoDoc: "", documento: "34567890", domicilio: "", telefono: "3581234567" },
];

const NewMember: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // store selectors
  const form = useMembersStore((s: MembersState) => s.form);
  const setField = useMembersStore((s: MembersState) => s.setField);
  const setForm = useMembersStore((s: MembersState) => s.setForm);
  const albacea = useMembersStore((s: MembersState) => s.albacea);
  const apoderado1 = useMembersStore((s: MembersState) => s.apoderado1);
  const apoderado2 = useMembersStore((s: MembersState) => s.apoderado2);
  const albSearch = useMembersStore((s: MembersState) => s.albSearch);
  const albVisible = useMembersStore((s: MembersState) => s.albVisible);
  const ap1Search = useMembersStore((s: MembersState) => s.ap1Search);
  const ap1Visible = useMembersStore((s: MembersState) => s.ap1Visible);
  const ap2Search = useMembersStore((s: MembersState) => s.ap2Search);
  const ap2Visible = useMembersStore((s: MembersState) => s.ap2Visible);
  const setAlbacea = useMembersStore((s: MembersState) => s.setAlbacea);
  const setApoderado1 = useMembersStore((s: MembersState) => s.setApoderado1);
  const setApoderado2 = useMembersStore((s: MembersState) => s.setApoderado2);
  const setAlbSearch = useMembersStore((s: MembersState) => s.setAlbSearch);
  const setAlbVisible = useMembersStore((s: MembersState) => s.setAlbVisible);
  const setAp1Search = useMembersStore((s: MembersState) => s.setAp1Search);
  const setAp1Visible = useMembersStore((s: MembersState) => s.setAp1Visible);
  const setAp2Search = useMembersStore((s: MembersState) => s.setAp2Search);
  const setAp2Visible = useMembersStore((s: MembersState) => s.setAp2Visible);
  const save = useMembersStore((s: MembersState) => s.save);
  const reset = useMembersStore((s: MembersState) => s.reset);

  const loadMember = useCallback(async (memberId: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const member = await fetchMemberById(memberId);
      setForm(member);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Error al cargar socio");
    } finally {
      setLoading(false);
    }
  }, [setForm]);

  useEffect(() => {
    if (id) {
      loadMember(id);
    } else {
      reset();
    }
  }, [id]);

  const filteredPeople = useMemo(() => {
    const q = (albSearch || ap1Search || ap2Search).toLowerCase().trim();
    if (!q) return mockPeople;
    return mockPeople.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.documento.includes(q),
    );
  }, [albSearch, ap1Search, ap2Search]);

  const handleChange = (key: string, value: any) => setField(key as any, value);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await save();
      navigate(-1);
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
      await deleteMember(id);
      setShowConfirmDelete(false);
      navigate(-1);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al eliminar");
      setShowConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="new-member-container">
      <div className="treasury-header-row">
        <h2>{isEditing ? "Editar socio" : "Nuevo socio"}</h2>
      </div>
      {loading && (
        <div className="table-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 32 }}>
          <Loader size={20} className="spin" />
          <span style={{ color: "var(--muted)" }}>Cargando datos del socio...</span>
        </div>
      )}
      {fetchError && (
        <div className="table-card" style={{ padding: 20, color: "var(--danger, #dc3545)" }}>
          {fetchError}
        </div>
      )}
      {!loading && !fetchError && (
      <div className="new-member-layout">
        {/* Left: Form */}
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

            <div className="form-grid form-grid-4">
              <div className="form-group">
                <label>N°</label>
                <input
                  className="form-control"
                  value={form.numeroDeSocio}
                  onChange={(e) => handleChange("numeroDeSocio", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Sexo</label>
                <select
                  className="form-control"
                  value={form.sexo}
                  onChange={(e) => handleChange("sexo", e.target.value)}
                >
                  <option value="">-</option>
                  <option>Masculino</option>
                  <option>Femenino</option>
                  <option>Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>N° de familia</label>
                <input
                  className="form-control"
                  value={form.nroFamilia}
                  onChange={(e) => handleChange("nroFamilia", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>N° de Fam. A/Fall</label>
                <input
                  className="form-control"
                  value={form.nroFamAFall}
                  onChange={(e) => handleChange("nroFamAFall", e.target.value)}
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

              <div className="form-group">
                <label>N° de Cuil</label>
                <input
                  className="form-control"
                  value={form.cuil}
                  onChange={(e) => handleChange("cuil", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Tipo de Socio</label>
                <select
                  className="form-control"
                  value={form.tipoSocio}
                  onChange={(e) => handleChange("tipoSocio", e.target.value)}
                >
                  <option value="">-</option>
                  <option>Activo</option>
                  <option>Activo Tipo A</option>
                  <option>Adherente</option>
                  <option>Honorario</option>
                  <option>Part</option>
                  <option>Vitalicio</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fecha Nacimiento</label>
                <div className="input-with-icon">
                  <input
                    type="date"
                    className="form-control"
                    value={form.fechaNac}
                    onChange={(e) => handleChange("fechaNac", e.target.value)}
                    id="fecha-nac"
                  />
                  <button
                    type="button"
                    className="date-picker-btn"
                    onClick={() => {
                      const el = document.getElementById("fecha-nac") as HTMLInputElement | null;
                      if (el) { el.focus(); el.showPicker?.(); }
                    }}
                  >
                    <Calendar size={18} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Cod. Postal</label>
                <input
                  className="form-control"
                  value={form.codPostal}
                  onChange={(e) => handleChange("codPostal", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Localidad</label>
                <input
                  className="form-control"
                  value={form.localidad}
                  onChange={(e) => handleChange("localidad", e.target.value)}
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

              <div className="form-group full-width">
                <label>Residencia</label>
                <input
                  className="form-control"
                  value={form.residencia}
                  onChange={(e) => handleChange("residencia", e.target.value)}
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

                  <div className="form-grid">
              <div className="form-group">
                <label>Fecha de ingreso</label>
                <div className="input-with-icon">
                  <input
                    type="date"
                    className="form-control"
                    value={form.fechaIngreso}
                    onChange={(e) => handleChange("fechaIngreso", e.target.value)}
                    id="fecha-ingreso"
                  />
                  <button
                    type="button"
                    className="date-picker-btn"
                    onClick={() => {
                      const el = document.getElementById("fecha-ingreso") as HTMLInputElement | null;
                      if (el) { el.focus(); el.showPicker?.(); }
                    }}
                  >
                    <Calendar size={18} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Cobra IAF</label>
                <select
                  className="form-control"
                  value={form.cobraIAF}
                  onChange={(e) => handleChange("cobraIAF", e.target.value)}
                >
                  <option>No</option>
                  <option>Si</option>
                </select>
              </div>

              <div className="form-group">
                <label>Paga por</label>
                <input
                  className="form-control"
                  value={form.pagaPor}
                  onChange={(e) => handleChange("pagaPor", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Depositar en</label>
                <input
                  className="form-control"
                  value={form.depositarEn}
                  onChange={(e) => handleChange("depositarEn", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Cementerio</label>
                <input
                  className="form-control"
                  value={form.cementerio}
                  onChange={(e) => handleChange("cementerio", e.target.value)}
                />
              </div>
            </div>

            <div className="optional-section">
              <h4 className="section-title">Opcionales</h4>
              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="form-control-checkbox"
                    checked={form.planSalud}
                    onChange={(e) =>
                      handleChange("planSalud", e.target.checked)
                    }
                  />
                  Plan Salud (INT)
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="form-control-checkbox"
                    checked={form.asistencial}
                    onChange={(e) =>
                      handleChange("asistencial", e.target.checked)
                    }
                  />
                  Asistencial
                </label>
              </div>
            </div>

            <div className="military-section-toggle">
              <h4 className="section-title">Solo para militares</h4>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="form-control-checkbox"
                  checked={form.militar}
                  onChange={(e) => handleChange("militar", e.target.checked)}
                />
                Militar
              </label>
            </div>

            {form.militar && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Fuerza</label>
                  <input
                    className="form-control"
                    value={form.fuerza}
                    onChange={(e) => handleChange("fuerza", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Grado</label>
                  <input
                    className="form-control"
                    value={form.grado}
                    onChange={(e) => handleChange("grado", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select
                    className="form-control"
                    value={form.estado}
                    onChange={(e) => handleChange("estado", e.target.value)}
                  >
                    <option value="">-</option>
                    <option>En servicio</option>
                    <option>Retirado</option>
                    <option>Baja</option>
                    <option>Pensionado</option>
                  </select>
                </div>
              </div>
            )}

      

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
                  navigate(-1);
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

            {showConfirmDelete && (
              <div className="confirm-overlay">
                <div className="confirm-dialog">
                  <h3>Eliminar socio</h3>
                  <p>
                    ¿Estás seguro de que querés eliminar al socio <strong>{form.nombre}</strong> (N° {form.numeroDeSocio})?
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
          </form>
        </div>

        {/* Right: Sidebar */}
        <div className="new-member-sidebar">
          {/* Albacea Section */}
          <div className="sidebar-section">
            <h4>Albacea</h4>
            {albacea ? (
              <div className="person-card">
                <div className="person-card-header">
                  <div className="person-avatar">
                    <User size={20} />
                  </div>
                  <div className="person-info">
                    <span className="person-name">
                      {albacea.nombre}
                    </span>
                    <span className="person-doc">DNI: {albacea.documento}</span>
                  </div>
                </div>
                <button
                  className="header-btn small btn-remove"
                  onClick={() => setAlbacea(null)}
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="search-wrapper">
                <div className="input-with-icon">
                  <input
                    className="search-input"
                    placeholder="Buscar persona..."
                    value={albSearch}
                    onFocus={() => setAlbVisible(true)}
                    onChange={(e) => setAlbSearch(e.target.value)}
                  />
                  <Search size={16} className="input-icon" />
                </div>
                {albVisible && (
                  <div className="search-results">
                    {(albSearch ? filteredPeople : mockPeople).map((p) => (
                      <div
                        key={p.documento}
                        className="search-result-item"
                        onClick={() => {
                          setAlbacea(p);
                          setAlbSearch("");
                          setAlbVisible(false);
                        }}
                      >
                        <div className="search-result-name">
                          {p.nombre}
                        </div>
                        <div className="search-result-doc">{p.documento}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Apoderado 1 Section */}
          <div className="sidebar-section">
            <h4>Apoderado 1</h4>
            {apoderado1 ? (
              <div className="person-card">
                <div className="person-card-header">
                  <div className="person-avatar">
                    <User size={20} />
                  </div>
                  <div className="person-info">
                    <span className="person-name">
                      {apoderado1.nombre}
                    </span>
                    <span className="person-doc">
                      DNI: {apoderado1.documento}
                    </span>
                  </div>
                </div>
                <button
                  className="header-btn small btn-remove"
                  onClick={() => setApoderado1(null)}
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="search-wrapper">
                <div className="input-with-icon">
                  <input
                    className="search-input"
                    placeholder="Buscar persona..."
                    value={ap1Search}
                    onFocus={() => setAp1Visible(true)}
                    onChange={(e) => setAp1Search(e.target.value)}
                  />
                  <Search size={16} className="input-icon" />
                </div>
                {ap1Visible && (
                  <div className="search-results">
                    {(ap1Search ? filteredPeople : mockPeople).map((p) => (
                      <div
                        key={p.documento}
                        className="search-result-item"
                        onClick={() => {
                          setApoderado1(p);
                          setAp1Search("");
                          setAp1Visible(false);
                        }}
                      >
                        <div className="search-result-name">
                          {p.nombre}
                        </div>
                        <div className="search-result-doc">{p.documento}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Apoderado 2 Section */}
          <div className="sidebar-section">
            <h4>Apoderado 2</h4>
            {apoderado2 ? (
              <div className="person-card">
                <div className="person-card-header">
                  <div className="person-avatar">
                    <User size={20} />
                  </div>
                  <div className="person-info">
                    <span className="person-name">
                      {apoderado2.nombre}
                    </span>
                    <span className="person-doc">
                      DNI: {apoderado2.documento}
                    </span>
                  </div>
                </div>
                <button
                  className="header-btn small btn-remove"
                  onClick={() => setApoderado2(null)}
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="search-wrapper">
                <div className="input-with-icon">
                  <input
                    className="search-input"
                    placeholder="Buscar persona..."
                    value={ap2Search}
                    onFocus={() => setAp2Visible(true)}
                    onChange={(e) => setAp2Search(e.target.value)}
                  />
                  <Search size={16} className="input-icon" />
                </div>
                {ap2Visible && (
                  <div className="search-results">
                    {(ap2Search ? filteredPeople : mockPeople).map((p) => (
                      <div
                        key={p.documento}
                        className="search-result-item"
                        onClick={() => {
                          setApoderado2(p);
                          setAp2Search("");
                          setAp2Visible(false);
                        }}
                      >
                        <div className="search-result-name">
                          {p.nombre}
                        </div>
                        <div className="search-result-doc">{p.documento}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default NewMember;
