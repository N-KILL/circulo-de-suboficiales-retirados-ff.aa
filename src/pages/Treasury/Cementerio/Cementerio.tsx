import React, { useState, useEffect, useMemo } from "react";
import { fetchCementeriosGrid, type CementerioGridItem } from "../../../services/cementeriosApi";
import { calcYearsAgo } from "../../../utils/format";
import { type SortField, type SortDir } from "./types";
import CementerioFilters from "./CementerioFilters";
import CementerioTable from "./CementerioTable";
import "../TreasuryTables.css";


const Cementerio: React.FC = () => {
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

    const filterDeps = `${searchText}|${filtroPagaPor}|${filtroAnios}|${sortField}|${sortDir}`;
    const [prevFilterDeps, setPrevFilterDeps] = useState(filterDeps);
    if (filterDeps !== prevFilterDeps) {
        setPrevFilterDeps(filterDeps);
        setCurrentPage(1);
    }

    useEffect(() => {
        let mounted = true;
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

    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    const safePage = Math.min(Math.max(1, currentPage), totalPages || 1);
    const startIndex = (safePage - 1) * rowsPerPage;
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

    if (isLoading) return <div className="dashboard-loading">Cargando cementerio...</div>;
    if (error) return <div className="dashboard-loading" style={{ color: "var(--danger)" }}>Error: {error}</div>;

    return (
        <div className="treasury-container">
            <CementerioFilters
                searchText={searchText}
                onSearchChange={setSearchText}
                filtroPagaPor={filtroPagaPor}
                onFiltroPagaPorChange={setFiltroPagaPor}
                filtroAnios={filtroAnios}
                onStepperDown={stepperDown}
                onStepperUp={stepperUp}
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
            />
        </div>
    );
};

export default Cementerio;
