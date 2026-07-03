import { create } from "zustand";
import type { Member, MembersListState } from "../models/members";
import { fetchMembers } from "../services/membersApi";

function filterAndSort(
    all: Member[],
    searchText: string,
    showFallecidos: boolean,
    pagaPorFilter: string
): Member[] {
    const s = searchText.toLowerCase().trim();
    const list = all.filter((m) => {
        const matchSearch =
            !s ||
            m.nombre.toLowerCase().includes(s) ||
            m.documento.includes(s) ||
            m.numeroDeSocio.includes(s);
        const matchFallecido = showFallecidos ? true : !m.fallecido;
        const matchPagaPor = !pagaPorFilter || m.pagaPor === pagaPorFilter;
        return matchSearch && matchFallecido && matchPagaPor;
    });
    return list.sort((a, b) => {
        const na = parseInt(a.numeroDeSocio.replace(/\D/g, ""), 10) || 0;
        const nb = parseInt(b.numeroDeSocio.replace(/\D/g, ""), 10) || 0;
        return na - nb;
    });
}

export const useMembersListStore = create<MembersListState>((set, get) => ({
    allMembers: [],
    isLoading: false,
    error: null,
    searchText: "",
    showFallecidos: false,
    pagaPorFilter: "",
    currentPage: 1,
    rowsPerPage: 15,

    loadMembers: async () => {
        set({ isLoading: true, error: null });
        try {
            const members = await fetchMembers();
            set({ allMembers: members, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Error al cargar socios",
            });
        }
    },

    setSearchText: (s: string) => set(() => ({ searchText: s, currentPage: 1 })),
    setShowFallecidos: (v: boolean) =>
        set(() => ({ showFallecidos: v, currentPage: 1 })),
    setPagaPorFilter: (v: string) =>
        set(() => ({ pagaPorFilter: v, currentPage: 1 })),
    setCurrentPage: (p: number) => set(() => ({ currentPage: p })),
    setRowsPerPage: (r: number) =>
        set(() => ({ rowsPerPage: r, currentPage: 1 })),

    getFiltered: () => {
        const { allMembers, searchText, showFallecidos, pagaPorFilter } = get();
        return filterAndSort(allMembers, searchText, showFallecidos, pagaPorFilter);
    },

    getPaginated: () => {
        const { currentPage, rowsPerPage } = get();
        const filtered = get().getFiltered();
        const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
        const safePage = Math.min(currentPage, totalPages);
        const startIndex = (safePage - 1) * rowsPerPage;
        return filtered.slice(startIndex, startIndex + rowsPerPage);
    },

    getTotalPages: () => {
        const { rowsPerPage } = get();
        const filtered = get().getFiltered();
        return Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    },
}));

export default useMembersListStore;
