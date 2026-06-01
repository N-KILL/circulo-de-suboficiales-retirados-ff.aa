import React, { useMemo, useState, useEffect } from "react";
import { Search, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TablePagination from "../../components/TablePagination/TablePagination";
import "../Treasury/TreasuryTables.css";

type Member = {
  id: string;
  numero: string;
  nombre: string;
  cuota: "Paga" | "Debe";
  fallecido: boolean;
  telefono?: string;
  email?: string;
};

const Members: React.FC = () => {
  const navigate = useNavigate();

  const members: Member[] = [
    {
      id: "1",
      numero: "0001",
      nombre: "Pérez, Juan Carlos",
      cuota: "Paga",
      fallecido: false,
      telefono: "11-1234-5678",
      email: "juan.perez@example.com",
    },
    {
      id: "2",
      numero: "0002",
      nombre: "González, Roberto",
      cuota: "Debe",
      fallecido: false,
      telefono: "11-2222-3333",
      email: "roberto.g@example.com",
    },
    {
      id: "3",
      numero: "0003",
      nombre: "Ramirez, María",
      cuota: "Paga",
      fallecido: false,
      telefono: "11-4444-5555",
      email: "maria.ramirez@example.com",
    },
    {
      id: "4",
      numero: "0004",
      nombre: "Ortega, Hugo",
      cuota: "Debe",
      fallecido: true,
      telefono: "11-6666-7777",
      email: "",
    },
    {
      id: "5",
      numero: "0005",
      nombre: "Nuñez, Estela",
      cuota: "Paga",
      fallecido: false,
      telefono: "11-8888-9999",
      email: "estela.nu@example.com",
    },
  ];

  const [searchText, setSearchText] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [showFallecidos, setShowFallecidos] = useState(false);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const filtered = useMemo(() => {
    const s = searchText.toLowerCase().trim();
    return members.filter((m) => {
      const matchSearch =
        !s ||
        m.nombre.toLowerCase().includes(s) ||
        m.numero.toLowerCase().includes(s);
      const matchEstado = estadoFilter === "Todos" || m.cuota === estadoFilter;
      const matchFallecido = showFallecidos ? true : !m.fallecido;
      return matchSearch && matchEstado && matchFallecido;
    });
  }, [searchText, estadoFilter, showFallecidos]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, estadoFilter, showFallecidos]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [rowsPerPage, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
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

        <div className="filter-item">
          <select
            className="filter-select"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option>Todos</option>
            <option>Paga</option>
            <option>Debe</option>
          </select>
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
            <thead>
              <tr>
                <th>Nº Socio</th>
                <th>Nombre</th>
                <th>Estado cuota</th>
                <th>Teléfono</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
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
                    <td>{m.numero}</td>
                    <td>
                      {m.nombre}{" "}
                      {m.fallecido && (
                        <span style={{ color: "var(--muted)", marginLeft: 8 }}>
                          †
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${m.cuota === "Paga" ? "badge-ingreso" : "badge-egreso"}`}
                      >
                        {m.cuota}
                      </span>
                    </td>
                    <td>{m.telefono}</td>
                    <td>{m.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          itemLabel="socios"
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default Members;
