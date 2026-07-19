import React, { useState, useEffect, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TablePagination from "../../../components/TablePagination/TablePagination";
import FiltersPanel from "../../../components/filters/FiltersPanel";
import MonthFilter from "../../../components/filters/MonthFilter";
import YearFilter from "../../../components/filters/YearFilter";
import ServiceRecordModal from "../../../components/service/ServiceRecordModal";
import { fetchServiceRecords, type ServiceRecordItem } from "../../../services/serviceRecordsApi";
import { toCurrency, formatRecordDate } from "../../../utils/format";
import "../TreasuryTables.css";
import "./ServiceHistory.css";

const ServiceHistory: React.FC = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState<ServiceRecordItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
    const [selectedYears, setSelectedYears] = useState<number[]>([]);
    const [showFilters, setShowFilters] = useState(true);
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
    const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [selectedRecord, setSelectedRecord] = useState<ServiceRecordItem | null>(null);

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        for (const r of records) { const d = new Date(r.date + "T12:00:00"); years.add(d.getFullYear()); }
        return [...years].sort((a, b) => b - a);
    }, [records]);

    useEffect(() => {
        let mounted = true;
        fetchServiceRecords()
            .then((data) => { if (mounted) { setRecords(data); setIsLoading(false); } })
            .catch((err) => { if (mounted) { setError(err.message || "Error al cargar registros de servicios."); setIsLoading(false); } });
        return () => { mounted = false; };
    }, []);

    const filteredRecords = useMemo(() => {
        const search = searchText.toLowerCase().trim();
        const hasYear = selectedYears.length > 0;
        const hasMonth = selectedMonths.length > 0;
        return records.filter((r) => {
            const d = new Date(r.date + "T12:00:00");
            if (hasYear && !selectedYears.includes(d.getFullYear())) return false;
            if (hasMonth && !selectedMonths.includes(d.getMonth())) return false;
            if (search) {
                const titular = r.member_nombre ?? r.person_nombre ?? "";
                const matchSearch = (r.service_name ?? "").toLowerCase().includes(search) || titular.toLowerCase().includes(search) || (r.detail ?? "").toLowerCase().includes(search);
                if (!matchSearch) return false;
            }
            return true;
        }).reverse();
    }, [records, searchText, selectedMonths, selectedYears]);

    const totalItems = filteredRecords.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    const filterDeps = `${searchText}|${selectedMonths.join(',')}|${selectedYears.join(',')}`;
    const [prevFilterDeps, setPrevFilterDeps] = useState(filterDeps);
    if (filterDeps !== prevFilterDeps) {
        setPrevFilterDeps(filterDeps);
        setCurrentPage(1);
    }

    const safePage = Math.min(Math.max(1, currentPage), totalPages || 1);
    const startIndex = (safePage - 1) * rowsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + rowsPerPage);
    const toggleMonth = (m: number) => setSelectedMonths((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
    const toggleYear = (y: number) => setSelectedYears((prev) => prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]);
    const clearFilters = () => { setSearchText(""); setSelectedMonths([]); setSelectedYears([]); };

    function getTitular(r: ServiceRecordItem): string {
        if (r.member_nombre) return `${r.member_nombre}${r.member_numero_de_socio ? ` (N\u00BA ${r.member_numero_de_socio})` : ""}`;
        return r.person_nombre ?? "\u2014";
    }

    if (isLoading) return <div className="dashboard-loading">Cargando historial de servicios...</div>;
    if (error) return <div className="dashboard-loading" style={{ color: "var(--danger)" }}>Error: {error}</div>;

    return (
        <div className="treasury-container">
            <FiltersPanel
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters((v) => !v)}
                onClearFilters={clearFilters}
                topContent={
                    <div className="filter-group" style={{ flex: 1, minWidth: 0 }}>
                        <span className="filter-group-label">Buscar</span>
                        <div className="search-wrapper" style={{ width: "100%", minWidth: 0, marginRight: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input type="text" className="search-input" placeholder="Buscar por servicio, titular o detalle..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                        </div>
                    </div>
                }
            >
                <div className="filters-bottom-left">
                    <YearFilter availableYears={availableYears} selectedYears={selectedYears} onToggleYear={toggleYear} isOpen={yearDropdownOpen} onToggleOpen={() => setYearDropdownOpen((v) => !v)} />
                    <MonthFilter selectedMonths={selectedMonths} onToggleMonth={toggleMonth} isOpen={monthDropdownOpen} onToggleOpen={() => setMonthDropdownOpen((v) => !v)} />
                </div>
            </FiltersPanel>

            <div className="table-card">
                <div className="table-wrapper">
                    <table className="treasury-table service-history-table">
                        <thead>
                            <tr><th>Fecha pago</th><th>Fecha servicio</th><th>Servicio</th><th>Titular</th><th>Importe</th><th>Movimiento</th></tr>
                        </thead>
                        <tbody>
                            {paginatedRecords.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>No se encontraron registros de servicios con los filtros aplicados.</td></tr>
                            ) : (
                                paginatedRecords.map((r) => (
                                    <tr key={r.id} className="clickable-row" onClick={() => setSelectedRecord(r)}>
                                        <td>{formatRecordDate(r.date)}</td>
                                        <td>{r.service_date ? formatRecordDate(r.service_date) : "\u2014"}</td>
                                        <td>{r.service_name ?? "\u2014"}</td>
                                        <td>{getTitular(r)}</td>
                                        <td className="amount-ingreso">{toCurrency(r.amount)}</td>
                                        <td>
                                            {r.movement_id && (
                                                <button className="link-btn" onClick={(e) => { e.stopPropagation(); navigate(`/tesoreria/movimientos/detalle/${r.movement_id}`); }}>
                                                    Ver <ExternalLink size={12} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <TablePagination currentPage={currentPage} totalItems={totalItems} rowsPerPage={rowsPerPage} itemLabel="registros de servicios" onPageChange={setCurrentPage} onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setCurrentPage(1); }} />
            </div>

            <ServiceRecordModal
                record={selectedRecord}
                onClose={() => setSelectedRecord(null)}
                onNavigateToMovement={(movementId) => navigate(`/tesoreria/movimientos/detalle/${movementId}`)}
            />
        </div>
    );
};

export default ServiceHistory;
