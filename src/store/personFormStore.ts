import { create } from "zustand";
import type { Person } from "../models/members";
import { savePerson } from "../services/personsApi";

type PersonFormState = {
    form: Person;
    setField: (key: keyof Person, value: Person[keyof Person]) => void;
    setForm: (person: Person) => void;
    save: () => Promise<void>;
    reset: () => void;
};

const emptyForm = (): Person => ({
    id: crypto.randomUUID(),
    nombre: "",
    tipoDoc: "DNI",
    documento: "",
    domicilio: "",
    telefono: "",
    brindaServicios: false,
});

export const usePersonFormStore = create<PersonFormState>((set, get) => ({
    form: emptyForm(),

    setField: (key: keyof Person, value: Person[keyof Person]) =>
        set((state) => ({ form: { ...state.form, [key]: value } as Person })),

    setForm: (person: Person) => set(() => ({ form: { ...person } })),

    save: async () => {
        const s = get();
        await savePerson(s.form);
    },

    reset: () => set(() => ({ form: emptyForm() })),
}));
