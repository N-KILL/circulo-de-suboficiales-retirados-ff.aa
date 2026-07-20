import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import React from "react";

export type SortField = "nicho" | "arrendatario" | "telefono" | "pagaPor" | "fechaDePago" | "anios" | "reducible";
export type SortDir = "asc" | "desc";

export const SortIcon: React.FC<{ field: SortField; currentSort: SortField; currentDir: SortDir }> = ({ field, currentSort, currentDir }) => {
    if (currentSort !== field) return <ArrowUpDown size={14} style={{ marginLeft: 4, opacity: 0.3 }} />;
    return currentDir === "asc"
        ? <ArrowUp size={14} style={{ marginLeft: 4 }} />
        : <ArrowDown size={14} style={{ marginLeft: 4 }} />;
};
