import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Save } from "lucide-react";
import "./NewMember.css";
import { useMembersStore } from "../../../store/membersStore";
import type { MembersState, Person } from "../../../models/members";

const mockPeople: Person[] = [
  { id: "p1", nombre: "Juan", apellido: "Rodriguez", documento: "12345678" },
  { id: "p2", nombre: "Lucia", apellido: "Fernandez", documento: "23456789" },
  { id: "p3", nombre: "Miguel", apellido: "Lopez", documento: "34567890" },
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
        p.apellido.toLowerCase().includes(q) ||
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
            <h3 className="card-title">Nuevo Socio</h3>

            <div className="form-grid">
              <div className="form-group" style={{ width: 120 }}>
                <label>N°</label>
                <input
                  className="form-control"
                  value={form.nro}
                  onChange={(e) => handleChange("nro", e.target.value)}
                />
              </div>

              <div className="form-group" style={{ width: 140 }}>
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

              <div className="form-group" style={{ width: 140 }}>
                <label>N° de familia</label>
                <input
                  className="form-control"
                  value={form.nroFamilia}
                  onChange={(e) => handleChange("nroFamilia", e.target.value)}
                />
              </div>

              <div className="form-group" style={{ width: 140 }}>
                <label>N° de Fam. A/Fall</label>
                <input
                  className="form-control"
                  value={form.nroFamAFall}
                  onChange={(e) => handleChange("nroFamAFall", e.target.value)}
                />
              </div>
            </div>

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
                <label>Tipo de Doc</label>
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
                <label>Fecha Nac.</label>
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

            <div style={{ marginTop: 16, marginBottom: 12 }}>
              <h4 className="section-title">Asistencial</h4>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  className="form-control-checkbox"
                  checked={form.asistencial}
                  onChange={(e) =>
                    handleChange("asistencial", e.target.checked)
                  }
                />
                Plan Salud (INT)
              </label>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  className="form-control-checkbox"
                  checked={form.militar}
                  onChange={(e) => handleChange("militar", e.target.checked)}
                />
                Solo para militares (habilita campos debajo)
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
          </form>
        </div>

        {/* Right: Sidebar */}
        <div className="new-member-sidebar">
          {/* Albacea Section */}
          <div className="sidebar-section">
            <h4>Albacea</h4>
            {albacea ? (
              <div className="person-card">
                <div>
                  {albacea.nombre} {albacea.apellido}
                </div>
                <div>{albacea.documento}</div>
                <button
                  className="header-btn small"
                  onClick={() => setAlbacea(null)}
                  style={{ marginTop: 8 }}
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
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
                        key={p.id}
                        className="search-result-item"
                        onClick={() => {
                          setAlbacea(p);
                          setAlbSearch("");
                          setAlbVisible(false);
                        }}
                      >
                        <div className="search-result-name">
                          {p.nombre} {p.apellido}
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
                <div>
                  {apoderado1.nombre} {apoderado1.apellido}
                </div>
                <div>{apoderado1.documento}</div>
                <button
                  className="header-btn small"
                  onClick={() => setApoderado1(null)}
                  style={{ marginTop: 8 }}
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
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
                        key={p.id}
                        className="search-result-item"
                        onClick={() => {
                          setApoderado1(p);
                          setAp1Search("");
                          setAp1Visible(false);
                        }}
                      >
                        <div className="search-result-name">
                          {p.nombre} {p.apellido}
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
                <div>
                  {apoderado2.nombre} {apoderado2.apellido}
                </div>
                <div>{apoderado2.documento}</div>
                <button
                  className="header-btn small"
                  onClick={() => setApoderado2(null)}
                  style={{ marginTop: 8 }}
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
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
                        key={p.id}
                        className="search-result-item"
                        onClick={() => {
                          setApoderado2(p);
                          setAp2Search("");
                          setAp2Visible(false);
                        }}
                      >
                        <div className="search-result-name">
                          {p.nombre} {p.apellido}
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

      {/* Action Panel - Bottom */}
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
        <button type="button" className="btn-save" onClick={handleSave}>
          <Save size={16} /> Guardar
        </button>
      </div>
    </div>
  );
};

export default NewMember;
