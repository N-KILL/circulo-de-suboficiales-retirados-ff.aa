import { create } from "zustand";
import type { Person } from "../models/members";
import { fetchAllPersons } from "../services/personsApi";

type PersonsListState = {
    allPersons: Person[];
    isLoading: boolean;
    error: string | null;
    searchText: string;
    currentPage: number;
    rowsPerPage: number;
    loadPersons: () => Promise<void>;
    setSearchText: (s: string) => void;
    setCurrentPage: (p: number) => void;
    setRowsPerPage: (r: number) => void;
    getFiltered: () => Person[];
    getPaginated: () => Person[];
    getTotalPages: () => number;
};

export const usePersonsListStore = create<PersonsListState>((set, get) => ({
    allPersons: [],
    isLoading: false,
    error: null,
    searchText: "",
    currentPage: 1,
    rowsPerPage: 15,

    loadPersons: async () => {
        set({ isLoading: true, error: null });
        try {
            const persons = await fetchAllPersons();
            set({ allPersons: persons, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Error al cargar personas",
            });
        }
    },

    setSearchText: (s: string) => set(() => ({ searchText: s, currentPage: 1 })),
    setCurrentPage: (p: number) => set(() => ({ currentPage: p })),
    setRowsPerPage: (r: number) =>
        set(() => ({ rowsPerPage: r, currentPage: 1 })),

    getFiltered: () => {
        const { allPersons, searchText } = get();
        const s = searchText.toLowerCase().trim();
        if (!s) return allPersons;
        return allPersons.filter(
            (p) =>
                p.nombre.toLowerCase().includes(s) ||
                p.documento.includes(s) ||
                p.telefono.includes(s),
        );
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
