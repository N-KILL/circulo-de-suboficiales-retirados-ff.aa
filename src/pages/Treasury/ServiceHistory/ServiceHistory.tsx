import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronDown, ChevronUp, RotateCcw, X, ExternalLink, User, Briefcase, Calendar, DollarSign, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TablePagination from "../../../components/TablePagination/TablePagination";
import { fetchServiceRecords, type ServiceRecordItem } from "../../../services/serviceRecordsApi";
import "../TreasuryTables.css";
import "./ServiceHistory.css";

function toCurrency(val: number): string {
    return `$ ${new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(val))}`;
}

const MONTHS = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

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
    const yearDropdownRef = useRef<HTMLDivElement>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const [selectedRecord, setSelectedRecord] = useState<ServiceRecordItem | null>(null);

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        for (const r of records) {
            const d = new Date(r.date + "T12:00:00");
            years.add(d.getFullYear());
        }
        return [...years].sort((a, b) => b - a);
    }, [records]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
                setYearDropdownOpen(false);
            }
        };
        if (yearDropdownOpen) {
            document.addEventListener("mousedown", handler);
        }
        return () => document.removeEventListener("mousedown", handler);
    }, [yearDropdownOpen]);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setError(null);
        fetchServiceRecords()
            .then((data) => {
                if (mounted) {
                    setRecords(data);
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                if (mounted) {
                    setError(err.message || "Error al cargar registros de servicios.");
                    setIsLoading(false);
                }
            });
        return () => { mounted = false; };
    }, []);

    const filteredRecords = useMemo(() => {
        const search = searchText.toLowerCase().trim();
        const hasYear = selectedYears.length > 0;
        const hasMonth = selectedMonths.length > 0;

        return records
            .filter((r) => {
                const d = new Date(r.date + "T12:00:00");
                if (hasYear && !selectedYears.includes(d.getFullYear())) return false;
                if (hasMonth && !selectedMonths.includes(d.getMonth())) return false;

                if (search) {
                    const titular = r.member_nombre ?? r.person_nombre ?? "";
                    const matchSearch =
                        (r.service_name ?? "").toLowerCase().includes(search) ||
                        titular.toLowerCase().includes(search) ||
                        (r.detail ?? "").toLowerCase().includes(search);
                    if (!matchSearch) return false;
                }
                return true;
            })
            .reverse();
    }, [records, searchText, selectedMonths, selectedYears]);

    const totalItems = filteredRecords.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchText, selectedMonths, selectedYears]);
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    }, [rowsPerPage, totalPages, currentPage]);

    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + rowsPerPage);

    const toggleMonth = (m: number) =>
        setSelectedMonths((prev) =>
            prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
        );

    const clearFilters = () => {
        setSearchText("");
        setSelectedMonths([]);
        setSelectedYears([]);
    };

    function formatRecordDate(dateStr: string): string {
        const parts = dateStr.split("-");
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
    }

    function getTitular(r: ServiceRecordItem): string {
        if (r.member_nombre) {
            return `${r.member_nombre}${r.member_numero_de_socio ? ` (Nº ${r.member_numero_de_socio})` : ""}`;
        }
        return r.person_nombre ?? "—";
    }

    if (isLoading) return <div className="dashboard-loading">Cargando historial de servicios...</div>;
    if (error) return <div className="dashboard-loading" style={{ color: "var(--danger)" }}>Error: {error}</div>;

    return (
        <div className="treasury-container">
            <div className="filters-panel filters-panel-stack">
                <div className="filters-top-row">
                    <div className="filter-group" style={{ flex: 1, minWidth: 0 }}>
                        <span className="filter-group-label">Buscar</span>
                        <div className="search-wrapper" style={{ width: "100%", minWidth: 0, marginRight: 0 }}>
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Buscar por servicio, titular o detalle..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="filter-toggle-buttons" style={{ alignSelf: "flex-end", paddingBottom: 2 }}>
                        <button className="toolbar-btn" onClick={clearFilters} title="Limpiar filtros">
                            <RotateCcw size={16} /> Limpiar
                        </button>
                        <button
                            className={`toolbar-btn ${showFilters ? "active" : ""}`}
                            onClick={() => setShowFilters((v) => !v)}
                        >
                            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            Filtros
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="filters-bottom-row">
                        <div className="filters-bottom-left">
                            <div className="filter-group" ref={yearDropdownRef}>
                                <span className="filter-group-label">Año</span>
                                <div className="multi-select-wrapper">
                                    <button
                                        className={`filter-select ${yearDropdownOpen ? "open" : ""}`}
                                        onClick={() => setYearDropdownOpen((v) => !v)}
                                    >
                                        {selectedYears.length === 0
                                            ? "Todos"
                                            : selectedYears.length === 1
                                                ? String(selectedYears[0])
                                                : `${selectedYears.length} seleccionados`}
                                        <ChevronDown size={14} />
                                    </button>
                                    {yearDropdownOpen && (
                                        <div className="multi-select-dropdown">
                                            {availableYears.map((y) => (
                                                <label key={y} className={`multi-select-option ${selectedYears.includes(y) ? "active" : ""}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedYears.includes(y)}
                                                        onChange={() =>
                                                            setSelectedYears((prev) =>
                                                                prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]
                                                            )
                                                        }
                                                    />
                                                    {y}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="filter-group filter-group-months">
                                <span className="filter-group-label">Mes</span>
                                <div className="filter-btns months-grid">
                                    {MONTHS.map((label, m) => (
                                        <button
                                            key={m}
                                            className={`filter-btn ${selectedMonths.includes(m) ? "active" : ""}`}
                                            onClick={() => toggleMonth(m)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="table-card">
                <div className="table-wrapper">
                    <table className="treasury-table service-history-table">
                        <thead>
                            <tr>
                                <th>Fecha pago</th>
                                <th>Fecha servicio</th>
                                <th>Servicio</th>
                                <th>Titular</th>
                                <th>Importe</th>
                                <th>Movimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                                        No se encontraron registros de servicios con los filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((r) => (
                                    <tr key={r.id} className="clickable-row" onClick={() => setSelectedRecord(r)}>
                                        <td>{formatRecordDate(r.date)}</td>
                                        <td>{r.service_date ? formatRecordDate(r.service_date) : "—"}</td>
                                        <td>{r.service_name ?? "—"}</td>
                                        <td>{getTitular(r)}</td>
                                        <td className="amount-ingreso">{toCurrency(r.amount)}</td>
                                        <td>
                                            {r.movement_id && (
                                                <button
                                                    className="link-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/tesoreria/movimientos/detalle/${r.movement_id}`);
                                                    }}
                                                >
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
                <TablePagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    rowsPerPage={rowsPerPage}
                    itemLabel="registros de servicios"
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setCurrentPage(1); }}
                />
            </div>

            {selectedRecord && (
                <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
                    <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalle del Registro de Servicio</h3>
                            <button className="modal-close" onClick={() => setSelectedRecord(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="service-modal-body">
                            <div className="service-modal-highlight">
                                <span className="service-modal-amount">{toCurrency(selectedRecord.amount)}</span>
                                <span className="service-modal-date">
                                    <Calendar size={14} />
                                    {formatRecordDate(selectedRecord.date)}
                                </span>
                            </div>

                            <div className="service-modal-grid">
                                <div className="service-modal-field">
                                    <span className="service-modal-icon"><Briefcase size={14} /></span>
                                    <div>
                                        <span className="service-modal-label">Servicio</span>
                                        <span className="service-modal-value">{selectedRecord.service_name ?? "—"}</span>
                                    </div>
                                </div>
                                <div className="service-modal-field">
                                    <span className="service-modal-icon"><User size={14} /></span>
                                    <div>
                                        <span className="service-modal-label">Titular</span>
                                        <span className="service-modal-value">{getTitular(selectedRecord)}</span>
                                    </div>
                                </div>
                                <div className="service-modal-field">
                                    <span className="service-modal-icon"><Calendar size={14} /></span>
                                    <div>
                                        <span className="service-modal-label">Fecha de pago</span>
                                        <span className="service-modal-value">{formatRecordDate(selectedRecord.date)}</span>
                                    </div>
                                </div>
                                {selectedRecord.service_date && (
                                    <div className="service-modal-field">
                                        <span className="service-modal-icon"><Calendar size={14} /></span>
                                        <div>
                                            <span className="service-modal-label">Fecha del servicio</span>
                                            <span className="service-modal-value">{formatRecordDate(selectedRecord.service_date)}</span>
                                        </div>
                                    </div>
                                )}
                                {selectedRecord.service_amount != null && (
                                    <div className="service-modal-field">
                                        <span className="service-modal-icon"><DollarSign size={14} /></span>
                                        <div>
                                            <span className="service-modal-label">Monto base del servicio</span>
                                            <span className="service-modal-value">{toCurrency(selectedRecord.service_amount)}</span>
                                        </div>
                                    </div>
                                )}
                                {selectedRecord.detail && (
                                    <div className="service-modal-field">
                                        <span className="service-modal-icon"><FileText size={14} /></span>
                                        <div>
                                            <span className="service-modal-label">Detalle</span>
                                            <span className="service-modal-value">{selectedRecord.detail}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedRecord.movement_id && (
                                <div className="service-modal-link">
                                    <button
                                        className="service-modal-link-btn"
                                        onClick={() => {
                                            setSelectedRecord(null);
                                            navigate(`/tesoreria/movimientos/detalle/${selectedRecord.movement_id}`);
                                        }}
                                    >
                                        Ver movimiento vinculado <ExternalLink size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceHistory;
