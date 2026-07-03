import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Save, User, Loader, Trash2, Calendar, ExternalLink } from "lucide-react";
import "./NewMember.css";
import { useMembersStore } from "../../../store/membersStore";
import { fetchMemberById, deleteMember, fetchPersons } from "../../../services/membersApi";
import { fetchMembersDebtStatus } from "../../../services/membersDebtApi";
import type { MembersState, Person } from "../../../models/members";

function monthsOwed(lastPeriodEnd: string | null): number {
  if (!lastPeriodEnd) return -1;
  const now = new Date();
  const end = new Date(lastPeriodEnd + "T00:00:00");
  if (end >= now) return 0;
  return (now.getFullYear() - end.getFullYear()) * 12 + (now.getMonth() - end.getMonth());
}

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
  const [debtMonths, setDebtMonths] = useState<number | null>(null);

  const [ap1Results, setAp1Results] = useState<Person[]>([]);
  const [ap2Results, setAp2Results] = useState<Person[]>([]);
  const [ap1Loading, setAp1Loading] = useState(false);
  const [ap2Loading, setAp2Loading] = useState(false);
  const ap1Timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ap2Timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useMembersStore((s: MembersState) => s.form);
  const setField = useMembersStore((s: MembersState) => s.setField);
  const setForm = useMembersStore((s: MembersState) => s.setForm);
  const apoderado1 = useMembersStore((s: MembersState) => s.apoderado1);
  const apoderado2 = useMembersStore((s: MembersState) => s.apoderado2);
  const ap1Search = useMembersStore((s: MembersState) => s.ap1Search);
  const ap1Visible = useMembersStore((s: MembersState) => s.ap1Visible);
  const ap2Search = useMembersStore((s: MembersState) => s.ap2Search);
  const ap2Visible = useMembersStore((s: MembersState) => s.ap2Visible);
  const setApoderado1 = useMembersStore((s: MembersState) => s.setApoderado1);
  const setApoderado2 = useMembersStore((s: MembersState) => s.setApoderado2);
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
      fetchMembersDebtStatus().then((data) => {
        setDebtMonths(monthsOwed(data.members[id] ?? null));
      }).catch(() => {});
    } else {
      reset();
    }
  }, [id]);

  const doSearch = useCallback(async (q: string, setResults: (r: Person[]) => void, setLoading: (v: boolean) => void) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchPersons(q);
      setResults(result);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApSearch = (value: string, which: "ap1" | "ap2") => {
    const timerRef = which === "ap1" ? ap1Timer : ap2Timer;
    const setSearch = which === "ap1" ? setAp1Search : setAp2Search;
    const setResults = which === "ap1" ? setAp1Results : setAp2Results;
    const setLoad = which === "ap1" ? setAp1Loading : setAp2Loading;

    setSearch(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value, setResults, setLoad), 300);
  };

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
      {isEditing && debtMonths !== null && !loading && !fetchError && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            background: debtMonths === -1 || debtMonths === 0 ? "#f0fdf4" : "#fff3cd",
            border: `1px solid ${debtMonths === -1 || debtMonths === 0 ? "#bbf7d0" : "#ffc107"}`,
            color: debtMonths === -1 || debtMonths === 0 ? "#166534" : "#856404",
          }}
        >
          <span style={{ fontWeight: 600 }}>
            {debtMonths === -1
              ? "No disp."
              : debtMonths === 0
                ? "Al día"
                : `Debe ${debtMonths} meses`}
          </span>
          <button
            type="button"
            className="header-btn-sm"
            onClick={() => window.open(`/socios/detalle/${id}`, "_blank")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ExternalLink size={14} />
            Ver detalles
          </button>
        </div>
      )}
      {!loading && !fetchError && (
      <div className="new-member-layout">
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

        <div className="new-member-sidebar">
          {/* Apoderado 1 */}
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
                    placeholder="Buscar por nombre o DNI..."
                    value={ap1Search}
                    onFocus={() => { setAp1Visible(true); if (ap1Search) handleApSearch(ap1Search, "ap1"); }}
                    onChange={(e) => handleApSearch(e.target.value, "ap1")}
                  />
                  <Search size={16} className="input-icon" />
                </div>
                {ap1Visible && (
                  <div className="search-results">
                    {ap1Loading ? (
                      <div className="search-result-item" style={{ justifyContent: "center" }}>
                        <Loader size={14} className="spin" /> Buscando...
                      </div>
                    ) : ap1Search && ap1Results.length === 0 ? (
                      <div className="search-result-item" style={{ justifyContent: "center", color: "var(--muted)" }}>
                        Sin resultados
                      </div>
                    ) : (
                      ap1Results.map((p) => (
                        <div
                          key={p.id || p.documento}
                          className="search-result-item"
                          onClick={() => {
                            setApoderado1(p);
                            setAp1Search("");
                            setAp1Visible(false);
                            setAp1Results([]);
                          }}
                        >
                          <div className="search-result-name">
                            {p.nombre}
                          </div>
                          <div className="search-result-doc">{p.documento}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Apoderado 2 */}
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
                    placeholder="Buscar por nombre o DNI..."
                    value={ap2Search}
                    onFocus={() => { setAp2Visible(true); if (ap2Search) handleApSearch(ap2Search, "ap2"); }}
                    onChange={(e) => handleApSearch(e.target.value, "ap2")}
                  />
                  <Search size={16} className="input-icon" />
                </div>
                {ap2Visible && (
                  <div className="search-results">
                    {ap2Loading ? (
                      <div className="search-result-item" style={{ justifyContent: "center" }}>
                        <Loader size={14} className="spin" /> Buscando...
                      </div>
                    ) : ap2Search && ap2Results.length === 0 ? (
                      <div className="search-result-item" style={{ justifyContent: "center", color: "var(--muted)" }}>
                        Sin resultados
                      </div>
                    ) : (
                      ap2Results.map((p) => (
                        <div
                          key={p.id || p.documento}
                          className="search-result-item"
                          onClick={() => {
                            setApoderado2(p);
                            setAp2Search("");
                            setAp2Visible(false);
                            setAp2Results([]);
                          }}
                        >
                          <div className="search-result-name">
                            {p.nombre}
                          </div>
                          <div className="search-result-doc">{p.documento}</div>
                        </div>
                      ))
                    )}
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
