import React, { useState, useEffect, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { fetchCementeriosGrid, fetchCementerioPagosMap, type CementerioGridItem } from "../../../services/cementeriosApi";
import { fetchDuesConfig } from "../../../services/duesConfigApi";
import { calcYearsAgo, formatRecordDate } from "../../../utils/format";
import { type SortField, type SortDir } from "./types";
import CementerioFilters from "./CementerioFilters";
import CementerioTable from "./CementerioTable";
import "../TreasuryTables.css";

function esReducible(tipo: string, fechaFallecimiento: string): boolean {
    if (tipo.toUpperCase() !== "F") return false;
    if (!fechaFallecimiento) return false;
    const parts = fechaFallecimiento.split("-");
    if (parts.length !== 3) return false;
    let year: number;
    if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
    } else if (parts[2].length === 4) {
        year = parseInt(parts[2], 10);
    } else {
        return false;
    }
    if (isNaN(year)) return false;
    return new Date().getFullYear() - year >= 25;
}

const Cementerio: React.FC = () => {
    const [data, setData] = useState<CementerioGridItem[]>([]);
    const [pagosMap, setPagosMap] = useState<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const [filtroPagaPor, setFiltroPagaPor] = useState<string>("");
    const [filtroAnios, setFiltroAnios] = useState<number | null>(null);
    const [filtroReducible, setFiltroReducible] = useState<"ocultar" | "todo" | "solo">("ocultar");
    const [debtFilterActive, setDebtFilterActive] = useState(false);
    const [debtFilterYears, setDebtFilterYears] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [sortField, setSortField] = useState<SortField>("nicho");
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [updatingReducibles, setUpdatingReducibles] = useState(false);
    const [lastReducibleUpdate, setLastReducibleUpdate] = useState<string | null>(() => {
        try { return localStorage.getItem("lastReducibleUpdate"); } catch { return null; }
    });

    const filterDeps = `${searchText}|${filtroPagaPor}|${filtroAnios}|${filtroReducible}|${debtFilterActive}|${debtFilterYears}|${sortField}|${sortDir}`;
    const [prevFilterDeps, setPrevFilterDeps] = useState(filterDeps);
    if (filterDeps !== prevFilterDeps) {
        setPrevFilterDeps(filterDeps);
        setCurrentPage(1);
    }

    useEffect(() => {
        let mounted = true;
        Promise.all([fetchCementeriosGrid(), fetchCementerioPagosMap(), fetchDuesConfig()])
            .then(([items, pagos, config]) => {
                if (!mounted) return;
                setData(items);
                setPagosMap(new Map(pagos.map((p) => [`${p.nicho}|${p.memberId ?? ""}|${p.personId ?? ""}`, p.ultimaFechaPago])));
                setDebtFilterYears(config?.consideration_years ?? 0);
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

    const dataWithReducible = useMemo(() => {
        return data.map((d) => {
            const pagoKey = `${d.nicho}|${d.socioId ?? ""}|${d.personaId ?? ""}`;
            return {
                ...d,
                reducible: esReducible(d.tipo, d.fechaFallecimiento),
                hasPagos: pagosMap.has(pagoKey),
                ultimaFechaPago: pagosMap.get(pagoKey) ?? "",
            };
        });
    }, [data, pagosMap]);

    const reducibleCount = useMemo(() => {
        return dataWithReducible.filter((d) => d.reducible).length;
    }, [dataWithReducible]);

    const filtered = useMemo(() => {
        const q = searchText.toLowerCase().trim();

        return dataWithReducible.filter((d) => {
            if (q && !d.nicho.toLowerCase().includes(q) &&
                !d.arrendatario.toLowerCase().includes(q) &&
                !d.telefono.includes(q)) return false;
            if (filtroPagaPor && d.pagaPor.toUpperCase() !== filtroPagaPor) return false;
            if (filtroAnios !== null) {
                const anos = calcYearsAgo(d.ultimaFechaPago ? formatRecordDate(d.ultimaFechaPago) : d.fechaDePago);
                if (anos !== filtroAnios) return false;
            }
            if (filtroReducible === "solo" && !d.reducible) return false;
            if (debtFilterActive && debtFilterYears > 0) {
                const anos = calcYearsAgo(d.ultimaFechaPago ? formatRecordDate(d.ultimaFechaPago) : d.fechaDePago);
                if (anos >= 0 && anos > debtFilterYears) return false;
            }
            return true;
        });
    }, [dataWithReducible, searchText, filtroPagaPor, filtroAnios, filtroReducible, debtFilterActive, debtFilterYears]);

    const sorted = useMemo(() => {
        const list = [...filtered];
        list.sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            switch (sortField) {
                case "nicho": return a.nicho.localeCompare(b.nicho, undefined, { numeric: true }) * dir;
                case "arrendatario": return a.arrendatario.localeCompare(b.arrendatario) * dir;
                case "telefono": return a.telefono.localeCompare(b.telefono) * dir;
                case "pagaPor": return a.pagaPor.localeCompare(b.pagaPor) * dir;
                case "fechaDePago": {
                    const fa = a.ultimaFechaPago || a.fechaDePago;
                    const fb = b.ultimaFechaPago || b.fechaDePago;
                    return fa.localeCompare(fb) * dir;
                }
                case "anios": {
                    const va = calcYearsAgo(a.ultimaFechaPago ? formatRecordDate(a.ultimaFechaPago) : a.fechaDePago);
                    const vb = calcYearsAgo(b.ultimaFechaPago ? formatRecordDate(b.ultimaFechaPago) : b.fechaDePago);
                    if (va < 0 && vb < 0) return 0;
                    if (va < 0) return 1;
                    if (vb < 0) return -1;
                    return (va - vb) * dir;
                }
                case "reducible": {
                    if (a.reducible === b.reducible) return 0;
                    return a.reducible ? -1 * dir : dir;
                }
                default: return 0;
            }
        });
        return list;
    }, [filtered, sortField, sortDir]);

    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    const safePage = Math.min(Math.max(1, currentPage), totalPages || 1);
    const startIndex = (safePage - 1) * rowsPerPage;
    const paginated = sorted.slice(startIndex, startIndex + rowsPerPage);

    const clearFilters = () => {
        setSearchText("");
        setFiltroPagaPor("");
        setFiltroAnios(null);
        setFiltroReducible("ocultar");
        setDebtFilterActive(false);
    };

    const stepperDown = () => {
        setFiltroAnios((prev) => (prev === null ? 0 : Math.max(0, prev - 1)));
    };

    const stepperUp = () => {
        setFiltroAnios((prev) => (prev === null ? 0 : prev + 1));
    };

    const debtStepperDown = () => {
        setDebtFilterYears((prev) => Math.max(0, prev - 1));
    };

    const debtStepperUp = () => {
        setDebtFilterYears((prev) => prev + 1);
    };

    const handleActualizarReducibles = () => {
        setUpdatingReducibles(true);
        const now = new Date().toLocaleString("es-AR");
        localStorage.setItem("lastReducibleUpdate", now);
        setLastReducibleUpdate(now);
        setFiltroReducible("solo");
        setTimeout(() => setUpdatingReducibles(false), 500);
    };

    if (isLoading) return <div className="dashboard-loading">Cargando cementerio...</div>;
    if (error) return <div className="dashboard-loading" style={{ color: "var(--danger)" }}>Error: {error}</div>;

    return (
        <div className="treasury-container">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <button
                    className="header-btn"
                    onClick={handleActualizarReducibles}
                    disabled={updatingReducibles}
                    title="Mostrar nichos en féretro con 25+ años que pueden reducirse"
                >
                    <RefreshCw size={16} className={updatingReducibles ? "spin" : ""} />
                    Actualizar reducibles
                </button>
                {lastReducibleUpdate && (
                    <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                        Última vez: {lastReducibleUpdate}
                    </span>
                )}
                {reducibleCount > 0 && (
                    <span style={{ fontSize: 12, color: "var(--azul-armada)", fontWeight: 600 }}>
                        {reducibleCount} nicho{reducibleCount !== 1 ? "s" : ""} reducible{reducibleCount !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            <CementerioFilters
                searchText={searchText}
                onSearchChange={setSearchText}
                filtroPagaPor={filtroPagaPor}
                onFiltroPagaPorChange={setFiltroPagaPor}
                filtroAnios={filtroAnios}
                onStepperDown={stepperDown}
                onStepperUp={stepperUp}
                filtroReducible={filtroReducible}
                onFiltroReducibleChange={setFiltroReducible}
                debtFilterActive={debtFilterActive}
                onDebtFilterActiveChange={setDebtFilterActive}
                debtFilterYears={debtFilterYears}
                onDebtStepperDown={debtStepperDown}
                onDebtStepperUp={debtStepperUp}
                onClearFilters={clearFilters}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters((v) => !v)}
            />

            <CementerioTable
                paginated={paginated}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                currentPage={currentPage}
                totalItems={totalItems}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setCurrentPage(1); }}
                showReducibleColumn={filtroReducible !== "ocultar"}
            />
        </div>
    );
};

export default Cementerio;
