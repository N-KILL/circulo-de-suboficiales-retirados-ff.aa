import React, { useEffect, useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import TablePagination from "../../components/TablePagination/TablePagination";
import "../Treasury/TreasuryTables.css";
import { usePersonsListStore } from "../../store/personsListStore";

const Persons: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const allPersons = usePersonsListStore((s) => s.allPersons);
  const searchText = usePersonsListStore((s) => s.searchText);
  const currentPage = usePersonsListStore((s) => s.currentPage);
  const rowsPerPage = usePersonsListStore((s) => s.rowsPerPage);
  const isLoading = usePersonsListStore((s) => s.isLoading);
  const error = usePersonsListStore((s) => s.error);
  const loadPersons = usePersonsListStore((s) => s.loadPersons);
  const setSearchText = usePersonsListStore((s) => s.setSearchText);
  const setCurrentPage = usePersonsListStore((s) => s.setCurrentPage);
  const setRowsPerPage = usePersonsListStore((s) => s.setRowsPerPage);

  const [sortBy, setSortBy] = useState<"nombre" | "brindaServicios" | "noBrindaServicios">("nombre");

  useEffect(() => {
    void loadPersons();
  }, [loadPersons, location.key]);

  const filtered = useMemo(() => {
    const s = searchText.toLowerCase().trim();
    if (!s) return allPersons;
    return allPersons.filter(
      (p) =>
        p.nombre.toLowerCase().includes(s) ||
        p.documento.includes(s) ||
        p.telefono.includes(s),
    );
  }, [allPersons, searchText]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "brindaServicios") {
      list.sort((a, b) => {
        const av = a.brindaServicios ? 1 : 0;
        const bv = b.brindaServicios ? 1 : 0;
        if (av !== bv) return bv - av;
        return a.nombre.localeCompare(b.nombre);
      });
    } else if (sortBy === "noBrindaServicios") {
      list.sort((a, b) => {
        const av = a.brindaServicios ? 1 : 0;
        const bv = b.brindaServicios ? 1 : 0;
        if (av !== bv) return av - bv;
        return a.nombre.localeCompare(b.nombre);
      });
    } else {
      list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    return list;
  }, [filtered, sortBy]);

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="treasury-container">
      <div className="treasury-header-row">
        <h2></h2>
        <button
          className="header-btn"
          onClick={() => navigate("/terceros/nuevo")}
        >
          <UserPlus size={16} />
          Agregar tercero
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input autoComplete="off"
            type="text"
            className="search-input"
            placeholder="Buscar por nombre, documento o teléfono..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="filter-item" style={{ marginLeft: "auto", width: 240 }}>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as typeof sortBy);
              setCurrentPage(1);
            }}
          >
            <option value="nombre">Ordenar por nombre</option>
            <option value="brindaServicios">Brinda servicios (primero)</option>
            <option value="noBrindaServicios">Brinda servicios (último)</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="treasury-table">
            <colgroup>
              <col className="column-nombre" />
              <col style={{ width: 120 }} />
              <col style={{ width: 140 }} />
              <col className="column-domicilio" />
              <col style={{ width: 140 }} />
              <col style={{ width: 100 }} />
            </colgroup>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo Doc.</th>
                <th>Documento</th>
                <th>Domicilio</th>
                <th>Teléfono</th>
                <th>Servicios</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                    Cargando terceros...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                    {error}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                    No se encontraron terceros.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/terceros/editar/${p.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{p.nombre}</td>
                    <td>{p.tipoDoc}</td>
                    <td>{p.documento}</td>
                    <td>{p.domicilio}</td>
                    <td>{p.telefono}</td>
                    <td>{p.brindaServicios ? <span className="badge badge-servicio">Proveedor</span> : "—"}</td>
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
          itemLabel="terceros"
          onPageChange={(p) => setCurrentPage(Math.min(Math.max(1, p), totalPages))}
          onRowsPerPageChange={setRowsPerPage}
        />
      </div>
    </div>
  );
};

export default Persons;
