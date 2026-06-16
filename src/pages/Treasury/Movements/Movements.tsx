import React, { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import TablePagination from "../../../components/TablePagination/TablePagination";
import { fetchMovements, type Movement } from "../../../services/movementsApi";
import "../TreasuryTables.css";

/* ── helpers ───────────────────────────────────────────────── */
const toInputDate = (d: Date) => d.toISOString().split("T")[0]; // "YYYY-MM-DD"

function formatCurrency(val: number): string {
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absVal);
  return `${val < 0 ? "- " : ""}$ ${formatted}`;
}

/* ── component ─────────────────────────────────────────────── */
const Movements: React.FC = () => {
  // ── Database states ────────────────────────────────────────
  const [rawMovements, setRawMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter states ──────────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tipoFilter, setTipoFilter] = useState("Todos los tipos");
  const [categoriaFilter, setCategoriaFilter] = useState("Todas las categorías");

  // ── Fetch data on mount ────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    fetchMovements()
      .then((data) => {
        if (isMounted) {
          setRawMovements(data);
          if (data.length > 0) {
            const latest = data[data.length - 1];
            const latestDate = new Date(latest.date + "T12:00:00");
            const firstDay = toInputDate(new Date(latestDate.getFullYear(), latestDate.getMonth(), 1));
            const lastDay = toInputDate(new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0));
            setDateFrom(firstDay);
            setDateTo(lastDay);
          } else {
            const now = new Date();
            setDateFrom(toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
            setDateTo(toInputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "No se pudieron cargar los movimientos de caja.");
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const INITIAL_BALANCE = 0;

  // ── Calculate chronological running balance ─────────────────
  const movementsWithSaldo = useMemo(() => {
    let runningBalance = INITIAL_BALANCE;
    return rawMovements.map((m) => {
      if (m.type === "ingreso") {
        runningBalance += m.amount;
      } else if (m.type === "egreso") {
        runningBalance -= m.amount;
      }

      const parts = m.date.split("-");
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : m.date;

      return {
        id: m.id,
        fecha: formattedDate,
        tipo: m.type === "ingreso" ? "Ingreso" : m.type === "egreso" ? "Egreso" : "Transferencia",
        concepto: m.detail,
        ingreso: (m.type === "ingreso" || m.type === "transferencia") ? formatCurrency(m.amount) : "-",
        egreso: (m.type === "egreso" || m.type === "transferencia") ? formatCurrency(m.amount) : "-",
        saldo: formatCurrency(runningBalance),
        dateObject: new Date(m.date + "T12:00:00"),
      };
    });
  }, [rawMovements]);

  // ── Filtered data (sorted descending: newest first) ──────────
  const filteredMovements = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    
    const from = new Date(dateFrom + "T00:00:00");
    const to = new Date(dateTo + "T23:59:59");
    const search = searchText.toLowerCase().trim();

    const list = movementsWithSaldo.filter((m) => {
      const mDate = m.dateObject;

      const matchDate = mDate >= from && mDate <= to;
      const matchSearch =
        !search ||
        m.concepto.toLowerCase().includes(search);
      const matchTipo = tipoFilter === "Todos los tipos" || m.tipo === tipoFilter;

      return matchDate && matchSearch && matchTipo;
    });

    return [...list].reverse();
  }, [movementsWithSaldo, searchText, dateFrom, dateTo, tipoFilter, categoriaFilter]);

  // ── Pagination ─────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const totalItems = filteredMovements.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, dateFrom, dateTo, tipoFilter, categoriaFilter]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [rowsPerPage, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + rowsPerPage);

  // ── Render states ──────────────────────────────────────────
  if (isLoading) {
    return <div className="dashboard-loading">Cargando movimientos de caja...</div>;
  }

  if (error) {
    return <div className="dashboard-loading" style={{ color: "var(--danger)" }}>Error: {error}</div>;
  }

  return (
    <div className="treasury-container">
      {/* Filters Bar */}
      <div className="filters-bar">
        {/* Search */}
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por concepto, socio, comprobante..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Date range */}
        <div className="filter-item filter-item-date">
          <div className="date-range-inputs">
            <input
              type="date"
              className="filter-select date-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="date-separator">—</span>
            <input
              type="date"
              className="filter-select date-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Tipo */}
        <div className="filter-item">
          <select
            className="filter-select"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
          >
            <option>Todos los tipos</option>
            <option>Ingreso</option>
            <option>Egreso</option>
            <option>Transferencia</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-card">
        <div className="table-wrapper">
          <table className="treasury-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Ingreso</th>
                <th>Egreso</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                    No se encontraron movimientos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((m, idx) => (
                  <tr key={idx}>
                    <td>{m.fecha}</td>
                    <td>
                      <span className={`badge ${m.tipo === "Ingreso" ? "badge-ingreso" : m.tipo === "Egreso" ? "badge-egreso" : "badge-transferencia"}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td>{m.concepto}</td>
                    <td className={m.tipo === "Transferencia" ? "amount-transferencia" : "amount-ingreso"}>{m.ingreso}</td>
                    <td className={m.tipo === "Transferencia" ? "amount-transferencia" : "amount-egreso"}>{m.egreso}</td>
                    <td className="amount-saldo">{m.saldo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          itemLabel="movimientos"
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

export default Movements;
