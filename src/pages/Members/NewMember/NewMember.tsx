import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Save, User } from "lucide-react";
import "./NewMember.css";
import { useMembersStore } from "../../../store/membersStore";
import type { MembersState, Person } from "../../../models/members";

const mockPeople: Person[] = [
  { nombre: "Juan", tipoDoc: "", documento: "12345678", domicilio: "", telefono: "3581234567" },
  { nombre: "Lucia", tipoDoc: "", documento: "23456789", domicilio: "", telefono: "3581234567" },
  { nombre: "Miguel", tipoDoc: "", documento: "34567890", domicilio: "", telefono: "3581234567" },
];

const NewMember: React.FC = () => {
  const navigate = useNavigate();

  // store selectors
  const form = useMembersStore((s: MembersState) => s.form);
  const setField = useMembersStore((s: MembersState) => s.setField);
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

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    save();
    navigate(-1);
  };

  return (
    <div className="new-member-container">
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
                  onChange={(e) => handleChange("nro", e.target.value)}
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
                  <option>Honorario</option>
                  <option>Vitalicio</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fecha Nacimiento</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.fechaNac}
                  onChange={(e) => handleChange("fechaNac", e.target.value)}
                />
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
                <input
                  type="date"
                  className="form-control"
                  value={form.fechaIngreso}
                  onChange={(e) => handleChange("fechaIngreso", e.target.value)}
                />
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
                  </select>
                </div>
              </div>
            )}

      

            <div className="form-actions-panel">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  reset();
                  navigate(-1);
                }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-save">
                <Save size={16} /> Guardar
              </button>
            </div>
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
    </div>
  );
};

export default NewMember;
