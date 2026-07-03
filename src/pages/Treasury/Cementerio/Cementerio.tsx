import React, { useState, useEffect, useMemo } from "react";
import { Search, RotateCcw, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TablePagination from "../../../components/TablePagination/TablePagination";
import { fetchCementeriosGrid, type CementerioGridItem } from "../../../services/cementeriosApi";
import "../TreasuryTables.css";


const PAGA_POR_OPTS = ["", "TES", "HAB"] as const;

const PAGA_POR_LABEL: Record<string, string> = {
    TES: "TESORERIA",
    HAB: "HABERES",
};

function calcYearsAgo(dateStr: string): number {
    if (!dateStr) return -1;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return -1;
    let day: number, month: number, year: number;
    if (parts[2].length === 4) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
    } else if (parts[2].length === 2) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = 2000 + parseInt(parts[2], 10);
    } else {
        return -1;
    }
    if (isNaN(day) || isNaN(month) || isNaN(year)) return -1;
    const d = new Date(year, month, day);
    const now = new Date();
    let anos = now.getFullYear() - d.getFullYear();
    const monthDiff = now.getMonth() - d.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
        anos--;
    }
    return Math.max(0, anos);
}

type SortField = "nicho" | "cantOcupantes" | "arrendatario" | "telefono" | "pagaPor" | "fechaDePago" | "anios";
type SortDir = "asc" | "desc";

const Cementerio: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<CementerioGridItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const [filtroPagaPor, setFiltroPagaPor] = useState<string>("");
    const [filtroAnios, setFiltroAnios] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(true);
    const [sortField, setSortField] = useState<SortField>("nicho");
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setError(null);
        fetchCementeriosGrid()
            .then((items) => {
                if (!mounted) return;
                setData(items);
                setIsLoading(false);
            })
            .catch((err) => {
                if (mounted) {
                    setError(err.message || "Error al cargar datos del cementerio.");
                    setIsLoading(false);
                }
            });
        return () => { mounted = false; };
    }, []);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDir("asc");
        }
    };

    const filtered = useMemo(() => {
        const q = searchText.toLowerCase().trim();

        return data.filter((d) => {
            if (q && !d.nicho.toLowerCase().includes(q) &&
                !d.arrendatario.toLowerCase().includes(q) &&
                !d.telefono.includes(q)) return false;
            if (filtroPagaPor && d.pagaPor.toUpperCase() !== filtroPagaPor) return false;
            if (filtroAnios !== null) {
                const anos = calcYearsAgo(d.fechaDePago);
                if (anos !== filtroAnios) return false;
            }
            return true;
        });
    }, [data, searchText, filtroPagaPor, filtroAnios]);

    const sorted = useMemo(() => {
        const list = [...filtered];
        list.sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            switch (sortField) {
                case "nicho": return a.nicho.localeCompare(b.nicho, undefined, { numeric: true }) * dir;
                case "cantOcupantes": return (a.cantOcupantes - b.cantOcupantes) * dir;
                case "arrendatario": return a.arrendatario.localeCompare(b.arrendatario) * dir;
                case "telefono": return a.telefono.localeCompare(b.telefono) * dir;
                case "pagaPor": return a.pagaPor.localeCompare(b.pagaPor) * dir;
                case "fechaDePago": return a.fechaDePago.localeCompare(b.fechaDePago) * dir;
                case "anios": {
                    const va = calcYearsAgo(a.fechaDePago);
                    const vb = calcYearsAgo(b.fechaDePago);
                    if (va < 0 && vb < 0) return 0;
                    if (va < 0) return 1;
                    if (vb < 0) return -1;
                    return (va - vb) * dir;
                }
                default: return 0;
            }
        });
        return list;
    }, [filtered, sortField, sortDir]);

    useEffect(() => { setCurrentPage(1); }, [searchText, filtroPagaPor, filtroAnios, sortField, sortDir]);

    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    }, [rowsPerPage, totalPages, currentPage]);

    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginated = sorted.slice(startIndex, startIndex + rowsPerPage);

    const clearFilters = () => {
        setSearchText("");
        setFiltroPagaPor("");
        setFiltroAnios(null);
    };

    const stepperDown = () => {
        setFiltroAnios((prev) => (prev === null ? 0 : Math.max(0, prev - 1)));
    };

    const stepperUp = () => {
        setFiltroAnios((prev) => (prev === null ? 0 : prev + 1));
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={14} style={{ marginLeft: 4, opacity: 0.3 }} />;
        return sortDir === "asc"
            ? <ArrowUp size={14} style={{ marginLeft: 4 }} />
            : <ArrowDown size={14} style={{ marginLeft: 4 }} />;
    };

    if (isLoading) return <div className="dashboard-loading">Cargando cementerio...</div>;
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
                                placeholder="Buscar por nicho, arrendatario o teléfono..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="filter-toggle-buttons" style={{ alignSelf: "flex-end", paddingBottom: 2 }}>
                        <button
                            className="toolbar-btn"
                            onClick={clearFilters}
                            title="Limpiar filtros"
                        >
                            <RotateCcw size={16} />
                            Limpiar
                        </button>
                        <button
                            className={`toolbar-btn ${showFilters ? "active" : ""}`}
                            onClick={() => setShowFilters((v) => !v)}
                        >
                            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="filters-bottom-row" style={{ marginTop: 8 }}>
                        <div className="filter-group">
                            <span className="filter-group-label">Paga por</span>
                            <div className="filter-btns">
                                {PAGA_POR_OPTS.map((opt) => (
                                    <button
                                        key={opt}
                                        className={`filter-btn ${filtroPagaPor === opt ? "active" : ""}`}
                                        onClick={() => setFiltroPagaPor(opt)}
                                    >
                                        {opt === "" ? "Todos" : PAGA_POR_LABEL[opt]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="filter-group">
                            <span className="filter-group-label">Años desde último pago</span>
                            <div className="stepper-wrapper">
                                <button className="stepper-btn" onClick={stepperDown}>-</button>
                                <span className="stepper-value">{filtroAnios !== null ? filtroAnios : "Cualq."}</span>
                                <button className="stepper-btn" onClick={stepperUp}>+</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="table-card">
                <div className="table-wrapper">
                    <table className="treasury-table">
                        <thead>
                            <tr>
                                <th className="sortable-th col-nicho" onClick={() => handleSort("nicho")}>
                                    Nro de Nicho <SortIcon field="nicho" />
                                </th>
                                <th className="sortable-th col-cant" onClick={() => handleSort("cantOcupantes")}>
                                    Cant. Ocupantes <SortIcon field="cantOcupantes" />
                                </th>
                                <th className="sortable-th col-arrendatario" onClick={() => handleSort("arrendatario")}>
                                    Arrendatario <SortIcon field="arrendatario" />
                                </th>
                                <th className="sortable-th col-telefono" onClick={() => handleSort("telefono")}>
                                    Teléfono <SortIcon field="telefono" />
                                </th>
                                <th className="sortable-th col-paga-por" onClick={() => handleSort("pagaPor")}>
                                    Paga por <SortIcon field="pagaPor" />
                                </th>
                                <th className="sortable-th col-fecha" onClick={() => handleSort("fechaDePago")}>
                                    Fecha Último Pago <SortIcon field="fechaDePago" />
                                </th>
                                <th className="sortable-th col-anios" onClick={() => handleSort("anios")}>
                                    Años desde Último Pago <SortIcon field="anios" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                                        No se encontraron resultados.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((item, idx) => (
                                    <tr
                                        key={idx}
                                        className="clickable-row"
                                        onClick={() => navigate(`/tesoreria/cementerio/${item.nicho}`)}
                                        title="Ver detalle del nicho"
                                    >
                                        <td className="col-nicho">{item.nicho}</td>
                                        <td className="col-cant">{item.cantOcupantes}</td>
                                        <td className="col-arrendatario">{item.arrendatario}</td>
                                        <td className="col-telefono">{item.telefono}</td>
                                        <td className="col-paga-por">{PAGA_POR_LABEL[item.pagaPor.toUpperCase()] || item.pagaPor}</td>
                                        <td className="col-fecha">{item.fechaDePago}</td>
                                        <td className="col-anios">{(() => { const v = calcYearsAgo(item.fechaDePago); return v < 0 ? "—" : v; })()}</td>
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
                    itemLabel="nichos"
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setCurrentPage(1); }}
                />
            </div>
        </div>
    );
};

export default Cementerio;
