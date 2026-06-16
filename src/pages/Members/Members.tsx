import React, { useEffect, useMemo } from "react";
import { Search, UserPlus, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TablePagination from "../../components/TablePagination/TablePagination";
import "../Treasury/TreasuryTables.css";
import { useMembersListStore } from "../../store/membersListStore";

const Members: React.FC = () => {
  const navigate = useNavigate();

  const searchText = useMembersListStore((s) => s.searchText);
  const showFallecidos = useMembersListStore((s) => s.showFallecidos);
  const currentPage = useMembersListStore((s) => s.currentPage);
  const rowsPerPage = useMembersListStore((s) => s.rowsPerPage);
  const allMembers = useMembersListStore((s) => s.allMembers);
  const isLoading = useMembersListStore((s) => s.isLoading);
  const error = useMembersListStore((s) => s.error);
  const loadMembers = useMembersListStore((s) => s.loadMembers);
  const setSearchText = useMembersListStore((s) => s.setSearchText);
  const setShowFallecidos = useMembersListStore((s) => s.setShowFallecidos);
  const setCurrentPage = useMembersListStore((s) => s.setCurrentPage);
  const setRowsPerPage = useMembersListStore((s) => s.setRowsPerPage);

  useEffect(() => {
    if (allMembers.length === 0 && !isLoading && !error) {
      void loadMembers();
    }
  }, [allMembers.length, isLoading, error, loadMembers]);

  const filtered = useMemo(() => {
    const s = searchText.toLowerCase().trim();
    const list = allMembers.filter((m) => {
      const matchSearch =
        !s ||
        m.nombre.toLowerCase().includes(s) ||
        m.documento.includes(s) ||
        m.numeroDeSocio.includes(s);
      const matchFallecido = showFallecidos ? true : !m.fallecido;
      return matchSearch && matchFallecido;
    });
    return list.sort((a, b) => {
      const na = parseInt(a.numeroDeSocio.replace(/\D/g, ""), 10) || 0;
      const nb = parseInt(b.numeroDeSocio.replace(/\D/g, ""), 10) || 0;
      return na - nb;
    });
  }, [allMembers, searchText, showFallecidos]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="treasury-container">
      <div className="treasury-header-row">
        <h2></h2>
        <button
          className="header-btn"
          onClick={() => navigate("/socios/nuevo")}
        >
          <UserPlus size={16} />
          Agregar socio
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre o número de socio..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div
          className="filter-item"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <input
            id="fallecidos"
            type="checkbox"
            checked={showFallecidos}
            onChange={(e) => setShowFallecidos(e.target.checked)}
          />
          <label htmlFor="fallecidos" style={{ userSelect: "none" }}>
            Mostrar fallecidos
          </label>
        </div>
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="treasury-table">
            <colgroup>
              <col className="column-socio" />
              <col className="column-nombre" />
              <col className="column-telefono" />
              <col className="column-tipo" />
              <col className="column-documento" />
              <col className="column-localidad" />
              <col className="column-domicilio" />
            </colgroup>
            <thead>
              <tr>
                <th>Nº Socio</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Localidad</th>
                <th>Dirección/Residencia</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "var(--muted)",
                    }}
                  >
                    Cargando socios...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "var(--muted)",
                    }}
                  >
                    {error}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "var(--muted)",
                    }}
                  >
                    No se encontraron socios con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginated.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => navigate(`/socios/${m.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{m.numeroDeSocio}</td>
                    <td>
                      {m.nombre}
                      {m.fallecido && (
                        <span style={{ color: "var(--muted)", marginLeft: 8 }}>
                          †
                        </span>
                      )}
                    </td>
                    <td>{m.telefono}</td>
                    <td>{m.tipoSocio}</td>
                    <td>{m.documento}</td>
                    <td>{m.localidad}</td>
                    <td>
                      {m.residencia ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {m.domicilio || ""}
                          <span
                            title={m.residencia}
                            style={{ cursor: "help", display: "inline-flex" }}
                          >
                            <Home
                              size={14}
                              strokeWidth={1.5}
                              color="var(--muted)"
                            />
                          </span>
                        </span>
                      ) : (
                        m.domicilio
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={safePage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          itemLabel="socios"
          onPageChange={(p) =>
            setCurrentPage(Math.min(Math.max(1, p), totalPages))
          }
          onRowsPerPageChange={setRowsPerPage}
        />
      </div>
    </div>
  );
};

export default Members;
