import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TablePagination from "../../../components/TablePagination/TablePagination";
import FiltersPanel from "../../../components/filters/FiltersPanel";
import MonthFilter from "../../../components/filters/MonthFilter";
import YearFilter from "../../../components/filters/YearFilter";
import { fetchMovements, type Movement } from "../../../services/movementsApi";
import { fetchInitialBalances } from "../../../services/initialBalancesApi";
import { fetchCementerioMovimientosByNicho } from "../../../services/cementeriosApi";
import { formatCurrency, formatRecordDate } from "../../../utils/format";
import "../TreasuryTables.css";

const Movements: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const nichoFilter = searchParams.get("nicho") || "";
  const memberIdFilter = searchParams.get("memberId") || "";
  const personIdFilter = searchParams.get("personId") || "";

  const [rawMovements, setRawMovements] = useState<Movement[]>([]);
  const [initialBanco, setInitialBanco] = useState(0);
  const [initialCajaChica, setInitialCajaChica] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [showSaldoColumns, setShowSaldoColumns] = useState(true);
  const [cajaBanco, setCajaBanco] = useState(true);
  const [cajaChica, setCajaChica] = useState(true);
  const [filtroIngreso, setFiltroIngreso] = useState(true);
  const [filtroEgreso, setFiltroEgreso] = useState(true);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [nichoMovementIds, setNichoMovementIds] = useState<Set<string> | null>(null);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const m of rawMovements) {
      const d = new Date(m.date + "T12:00:00");
      years.add(d.getFullYear());
    }
    return [...years].sort((a, b) => b - a);
  }, [rawMovements]);

  const [prevNichoFilter, setPrevNichoFilter] = useState(nichoFilter);
  if (prevNichoFilter !== nichoFilter) {
    setPrevNichoFilter(nichoFilter);
    setNichoMovementIds(null);
  }

  useEffect(() => {
    if (!nichoFilter) return;
    let mounted = true;
    fetchCementerioMovimientosByNicho(
      nichoFilter,
      memberIdFilter || null,
      personIdFilter || null,
    )
      .then((records) => {
        if (!mounted) return;
        const ids = new Set(records.map((r) => r.movement_id).filter(Boolean) as string[]);
        setNichoMovementIds(ids);
      })
      .catch(() => { if (mounted) setNichoMovementIds(new Set()); });
    return () => { mounted = false; };
  }, [nichoFilter, memberIdFilter, personIdFilter]);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchMovements(), fetchInitialBalances()])
      .then(([data, balances]) => {
        if (!mounted) return;
        setRawMovements(data);
        setInitialBanco(balances?.banco ?? 0);
        setInitialCajaChica(balances?.caja_chica ?? 0);
        if (data.length > 0) {
          const now = new Date();
          setSelectedMonths([now.getMonth()]);
          setSelectedYears([now.getFullYear()]);
        } else {
          const now = new Date();
          setSelectedMonths([now.getMonth()]);
          setSelectedYears([now.getFullYear()]);
        }
        setIsLoading(false);
      })
      .catch((err) => { if (mounted) { setError(err.message || "Error al cargar movimientos."); setIsLoading(false); } });
    return () => { mounted = false; };
  }, []);

  const { movementsWithSaldo, finalBanco, finalCajaChica } = useMemo(() => {
    let rb = initialBanco;
    let rc = initialCajaChica;
    const items: Array<{
      id: string; date: string; fecha: string;
      tipo: string; modalidad: string; concepto: string;
      comprobante: string;
      ingreso: string; egreso: string;
      saldoBanco: string | null; saldoCajaChica: string | null;
      dateObj: Date;
    }> = [];
    for (const m of rawMovements) {
      if (m.type === "ingreso") { if (m.mode === "transferencia") rb += m.amount; if (m.mode === "efectivo") rc += m.amount; }
      else if (m.type === "egreso") { if (m.mode === "transferencia") rb -= m.amount; if (m.mode === "efectivo") rc -= m.amount; }
      const fecha = formatRecordDate(m.date);
      items.push({
        id: m.id, date: m.date, fecha,
        tipo: m.type === "ingreso" ? "Ingreso" : m.type === "egreso" ? "Egreso" : "Transferencia",
        modalidad: m.mode === "efectivo" ? "Efectivo" : "Transferencia",
        concepto: m.detail ?? "",
        comprobante: m.comprobante?.receipt_number != null ? String(m.comprobante.receipt_number).padStart(6, "0") : "\u2014",
        ingreso: m.type === "ingreso" ? formatCurrency(m.amount) : "-",
        egreso: m.type === "egreso" ? formatCurrency(m.amount) : "-",
        saldoBanco: m.mode === "transferencia" ? formatCurrency(rb) : null,
        saldoCajaChica: m.mode === "efectivo" ? formatCurrency(rc) : null,
        dateObj: new Date(m.date + "T12:00:00"),
      });
    }
    return { movementsWithSaldo: items, finalBanco: rb, finalCajaChica: rc };
  }, [rawMovements, initialBanco, initialCajaChica]);

  const filteredMovements = useMemo(() => {
    const search = searchText.toLowerCase().trim();
    const hasYear = selectedYears.length > 0;
    const hasMonth = selectedMonths.length > 0;
    return movementsWithSaldo
      .filter((m) => {
        if (nichoMovementIds && !nichoMovementIds.has(m.id)) return false;
        if (hasYear || hasMonth) {
          const d = m.dateObj;
          if (hasYear && !selectedYears.includes(d.getFullYear())) return false;
          if (hasMonth && !selectedMonths.includes(d.getMonth())) return false;
        }
        const modeMatch = (cajaBanco && m.modalidad === "Transferencia") || (cajaChica && m.modalidad === "Efectivo");
        if (!cajaBanco && !cajaChica) return false;
        if (!modeMatch) return false;
        if (search && !m.concepto.toLowerCase().includes(search) && !m.comprobante.toLowerCase().includes(search)) return false;
        if (m.tipo === "Transferencia") return false;
        if (m.tipo === "Ingreso" && !filtroIngreso) return false;
        if (m.tipo === "Egreso" && !filtroEgreso) return false;
        return true;
      })
      .reverse();
  }, [movementsWithSaldo, searchText, selectedMonths, selectedYears, cajaBanco, cajaChica, filtroIngreso, filtroEgreso, nichoMovementIds]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const totalItems = filteredMovements.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const filterDeps = `${searchText}|${selectedMonths.join(',')}|${selectedYears.join(',')}|${cajaBanco}|${cajaChica}|${filtroIngreso}|${filtroEgreso}`;
  const [prevFilterDeps, setPrevFilterDeps] = useState(filterDeps);
  if (filterDeps !== prevFilterDeps) {
    setPrevFilterDeps(filterDeps);
    setCurrentPage(1);
  }

  const safePage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + rowsPerPage);

  const toggleMonth = (m: number) => setSelectedMonths((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  const toggleYear = (y: number) => setSelectedYears((prev) => prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]);

  const clearFilters = () => {
    const now = new Date();
    setSearchText("");
    setSelectedMonths([now.getMonth()]);
    setSelectedYears([now.getFullYear()]);
    setCajaBanco(true);
    setCajaChica(true);
    setFiltroIngreso(true);
    setFiltroEgreso(true);
    setSearchParams({});
  };

  if (isLoading) return <div className="dashboard-loading">Cargando movimientos...</div>;
  if (error) return <div className="dashboard-loading" style={{ color: "var(--danger)" }}>Error: {error}</div>;

  const ultimoSaldoBanco = formatCurrency(finalBanco);
  const ultimoSaldoCajaChica = formatCurrency(finalCajaChica);

  return (
    <div className="treasury-container">
      <FiltersPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
        onClearFilters={clearFilters}
        showSaldos={showSaldoColumns}
        onToggleSaldos={() => setShowSaldoColumns((v) => !v)}
        showSaldosLabel="Saldos"
        nichoFilter={nichoFilter}
        onClearNichoFilter={() => setSearchParams({})}
        topContent={
          <div className="filter-group" style={{ flex: 1, minWidth: 0 }}>
            <span className="filter-group-label">Buscar</span>
            <div className="search-wrapper" style={{ width: "100%", minWidth: 0, marginRight: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" className="search-input" placeholder="Buscar..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
          </div>
        }
      >
        <div className="filters-bottom-left">
          <div className="filter-group">
            <span className="filter-group-label">Tipo</span>
            <div className="filter-btns">
              <button className={`filter-btn ${filtroIngreso ? "active" : ""}`} onClick={() => setFiltroIngreso((v) => !v)}>Ingreso</button>
              <button className={`filter-btn ${filtroEgreso ? "active" : ""}`} onClick={() => setFiltroEgreso((v) => !v)}>Egreso</button>
            </div>
          </div>
          <YearFilter availableYears={availableYears} selectedYears={selectedYears} onToggleYear={toggleYear} isOpen={yearDropdownOpen} onToggleOpen={() => setYearDropdownOpen((v) => !v)} />
          <MonthFilter selectedMonths={selectedMonths} onToggleMonth={toggleMonth} isOpen={monthDropdownOpen} onToggleOpen={() => setMonthDropdownOpen((v) => !v)} />
        </div>
        <div className="filters-bottom-right">
          <button className={`caja-card-toggle-sm ${cajaBanco ? "active" : "inactive"}`} onClick={() => setCajaBanco((v) => !v)}>
            <span className="caja-card-label">Banco</span>
            <span className="caja-card-value">{ultimoSaldoBanco}</span>
          </button>
          <button className={`caja-card-toggle-sm ${cajaChica ? "active" : "inactive"}`} onClick={() => setCajaChica((v) => !v)}>
            <span className="caja-card-label">Caja Chica</span>
            <span className="caja-card-value">{ultimoSaldoCajaChica}</span>
          </button>
        </div>
      </FiltersPanel>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="treasury-table">
            <thead>
              <tr>
                <th>Fecha</th><th>Comprobante</th><th>Tipo</th><th>Modalidad</th><th>Concepto</th><th>Ingreso</th><th>Egreso</th>
                {showSaldoColumns && <><th>Saldo Banco</th><th>Saldo Caja Chica</th></>}
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.length === 0 ? (
                <tr><td colSpan={showSaldoColumns ? 9 : 7} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>No se encontraron movimientos con los filtros aplicados.</td></tr>
              ) : (
                paginatedMovements.map((m, idx) => (
                  <tr key={idx} className="clickable-row" onClick={() => navigate(`/tesoreria/movimientos/detalle/${m.id}`)}>
                    <td className="col-fecha">{m.fecha}</td>
                    <td className="col-comprobante">{m.comprobante}</td>
                    <td><span className={`badge ${m.tipo === "Ingreso" ? "badge-ingreso" : "badge-egreso"}`}>{m.tipo}</span></td>
                    <td>{m.modalidad}</td><td>{m.concepto}</td>
                    <td className="amount-ingreso">{m.ingreso}</td><td className="amount-egreso">{m.egreso}</td>
                    {showSaldoColumns && <><td className="amount-saldo">{m.saldoBanco ?? "\u2014"}</td><td className="amount-saldo">{m.saldoCajaChica ?? "\u2014"}</td></>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalItems={totalItems} rowsPerPage={rowsPerPage} itemLabel="movimientos" onPageChange={setCurrentPage} onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setCurrentPage(1); }} />
      </div>
    </div>
  );
};

export default Movements;
