import React, { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Home, Eye } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import TablePagination from "../../components/TablePagination/TablePagination";
import "../Treasury/TreasuryTables.css";
import { useMembersListStore } from "../../store/membersListStore";
import { fetchMembersDebtStatus } from "../../services/membersDebtApi";

function monthsOwed(lastPeriodEnd: string | null): number {
  if (!lastPeriodEnd) return -1;
  const now = new Date();
  const end = new Date(lastPeriodEnd + "T00:00:00");
  if (end >= now) return 0;
  return (now.getFullYear() - end.getFullYear()) * 12 + (now.getMonth() - end.getMonth());
}

const Members: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchText = useMembersListStore((s) => s.searchText);
  const showFallecidos = useMembersListStore((s) => s.showFallecidos);
  const pagaPorFilter = useMembersListStore((s) => s.pagaPorFilter);
  const currentPage = useMembersListStore((s) => s.currentPage);
  const rowsPerPage = useMembersListStore((s) => s.rowsPerPage);
  const allMembers = useMembersListStore((s) => s.allMembers);
  const isLoading = useMembersListStore((s) => s.isLoading);
  const error = useMembersListStore((s) => s.error);
  const loadMembers = useMembersListStore((s) => s.loadMembers);
  const setSearchText = useMembersListStore((s) => s.setSearchText);
  const setShowFallecidos = useMembersListStore((s) => s.setShowFallecidos);
  const setPagaPorFilter = useMembersListStore((s) => s.setPagaPorFilter);
  const setCurrentPage = useMembersListStore((s) => s.setCurrentPage);
  const setRowsPerPage = useMembersListStore((s) => s.setRowsPerPage);

  const [debtMap, setDebtMap] = useState<Record<string, string | null>>({});
  const [considerationYears, setConsiderationYears] = useState(0);
  const [debtLoading, setDebtLoading] = useState(true);
  const [showDebtorsOnly, setShowDebtorsOnly] = useState(false);
  const [hideOldDebt, setHideOldDebt] = useState(false);
  const [debtSortDir, setDebtSortDir] = useState<"asc" | "desc" | null>(null);

  useEffect(() => {
    void loadMembers();
    fetchMembersDebtStatus()
      .then((data) => {
        setDebtMap(data.members);
        setConsiderationYears(data.consideration_years);
      })
      .catch(() => {})
      .finally(() => setDebtLoading(false));
  }, [loadMembers, location.key]);

  const pagaPorOptions = useMemo(() => {
    const values = new Set<string>();
    allMembers.forEach((m) => { if (m.pagaPor) values.add(m.pagaPor); });
    return Array.from(values).sort();
  }, [allMembers]);

  const membersWithDebt = useMemo(() => {
    return allMembers.map((m) => {
      const owed = monthsOwed(debtMap[m.id] ?? null);
      return {
        member: m,
        monthsOwed: owed,
        noData: owed === -1,
      };
    });
  }, [allMembers, debtMap]);

  const filtered = useMemo(() => {
    const s = searchText.toLowerCase().trim();
    const maxMonths = considerationYears * 12;
    return membersWithDebt.filter((item) => {
      const m = item.member;
      const matchSearch =
        !s ||
        m.nombre.toLowerCase().includes(s) ||
        m.documento.includes(s) ||
        m.numeroDeSocio.includes(s);
      const matchFallecido = showFallecidos ? true : !m.fallecido;
      const matchPagaPor = !pagaPorFilter || m.pagaPor === pagaPorFilter;
      const matchDebtor = !showDebtorsOnly || item.monthsOwed > 0 || item.noData;
      const matchOldDebt = !hideOldDebt || maxMonths <= 0 || item.monthsOwed <= maxMonths;
      return matchSearch && matchFallecido && matchPagaPor && matchDebtor && matchOldDebt;
    }).sort((a, b) => {
      if (debtSortDir === "asc") {
        return (a.monthsOwed - b.monthsOwed);
      }
      if (debtSortDir === "desc") {
        return (b.monthsOwed - a.monthsOwed);
      }
      const na = parseInt(a.member.numeroDeSocio.replace(/\D/g, ""), 10) || 0;
      const nb = parseInt(b.member.numeroDeSocio.replace(/\D/g, ""), 10) || 0;
      return na - nb;
    });
  }, [membersWithDebt, searchText, showFallecidos, pagaPorFilter, showDebtorsOnly, hideOldDebt, considerationYears, debtSortDir]);

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

        <div
          className="filter-item"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <input
            id="debtors"
            type="checkbox"
            checked={showDebtorsOnly}
            onChange={(e) => setShowDebtorsOnly(e.target.checked)}
          />
          <label htmlFor="debtors" style={{ userSelect: "none" }}>
            Solo deudores
          </label>
        </div>

        <div
          className="filter-item"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <input
            id="hideOldDebt"
            type="checkbox"
            checked={hideOldDebt}
            onChange={(e) => setHideOldDebt(e.target.checked)}
          />
          <label htmlFor="hideOldDebt" style={{ userSelect: "none" }}>
            Ocultar deuda &gt; {considerationYears} años
          </label>
        </div>

        <select
          value={pagaPorFilter}
          onChange={(e) => setPagaPorFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            fontSize: "0.875rem",
            background: "white",
          }}
        >
          <option value="">Todos (Paga por)</option>
          {pagaPorOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
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
              <col className="column-paga-por" />
              <col className="column-deuda" />
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
                <th>Paga por</th>
                <th
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() =>
                    setDebtSortDir((prev) =>
                      prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
                    )
                  }
                >
                  Deuda {debtSortDir === "asc" ? "▲" : debtSortDir === "desc" ? "▼" : ""}
                </th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading || debtLoading ? (
                <tr>
                  <td
                    colSpan={9}
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
                    colSpan={9}
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
                    colSpan={9}
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
                paginated.map(({ member: m, monthsOwed: owed }) => (
                  <tr
                    key={m.id}
                    onClick={() => navigate(`/socios/editar/${m.id}`, { state: { member: m } })}
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
                    <td style={{ whiteSpace: "nowrap" }}>{m.pagaPor}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {owed === -1 ? (
                        <span style={{ color: "var(--muted)" }}>No disp.</span>
                      ) : owed === 0 ? (
                        <span style={{ color: "green" }}>Al día</span>
                      ) : (
                        <span style={{ color: "#dc3545" }}>{owed} meses</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="header-btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/socios/detalle/${m.id}`);
                        }}
                        title="Ver cuotas"
                      >
                        <Eye size={14} />
                        Cuotas
                      </button>
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
