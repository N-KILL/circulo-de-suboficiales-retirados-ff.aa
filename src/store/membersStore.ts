import { create } from "zustand";
import type { Person, Member, MembersFormState } from "../models/members";
import { saveMember } from "../services/membersApi";

const todayIso = () => new Date().toISOString().split('T')[0];

const emptyForm = (): Member => ({
    id: crypto.randomUUID(),
    numeroDeSocio: '',
    nombre: '',
    sexo: '',
    residencia: '',
    nroFamilia: '',
    nroFamAFall: '',
    tipoDoc: 'DNI',
    documento: '',
    cuil: '',
    tipoSocio: '',
    fechaNac: '',
    edad: '',
    codPostal: '',
    localidad: '',
    domicilio: '',
    email: '',
    telefono: '',
    asistencial: false,
    planSalud: false,
    militar: false,
    fuerza: '',
    grado: '',
    estado: '',
    fechaIngreso: todayIso(),
    fechaBaja: '',
    motivoBaja: '',
    cobraIAF: 'No',
    pagaPor: '',
    depositarEn: '',
    cementerio: '',
    fallecido: false,
    apoderado1: null,
    apoderado2: null,
});

export const useMembersStore = create<MembersFormState>((set, get) => ({
    memberNumber: `SOC-${Date.now().toString().slice(-6)}`,
    form: emptyForm(),
    apoderado1: null,
    apoderado2: null,
    ap1Search: '', ap1Visible: false,
    ap2Search: '', ap2Visible: false,

    setField: (key: keyof Member, value: Member[keyof Member]) =>
        set((state) => ({ form: { ...state.form, [key as string]: value } as Member })),
    setForm: (member: Member) => {
        const cp = (p: Person | null): Person | null => p ? { ...p } : null;
        set({
            form: { ...member, apoderado1: cp(member.apoderado1), apoderado2: cp(member.apoderado2) },
            apoderado1: cp(member.apoderado1),
            apoderado2: cp(member.apoderado2),
            ap1Search: '',
            ap1Visible: false,
            ap2Search: '',
            ap2Visible: false,
        });
    },
    setApoderado1: (p: Person | null) => set(() => ({ apoderado1: p })),
    setApoderado2: (p: Person | null) => set(() => ({ apoderado2: p })),
    setAp1Search: (s: string) => set(() => ({ ap1Search: s })),
    setAp1Visible: (v: boolean) => set(() => ({ ap1Visible: v })),
    setAp2Search: (s: string) => set(() => ({ ap2Search: s })),
    setAp2Visible: (v: boolean) => set(() => ({ ap2Visible: v })),

    save: async () => {
        const s = get();
        const payload = {
            ...s.form,
            apoderado1: s.apoderado1,
            apoderado2: s.apoderado2,
        };
        await saveMember(payload);
    },

    reset: () => set(() => ({
        memberNumber: `SOC-${Date.now().toString().slice(-6)}`,
        form: emptyForm(),
        apoderado1: null, apoderado2: null,
        ap1Search: '', ap1Visible: false,
        ap2Search: '', ap2Visible: false,
    })),
}));

export default useMembersStore;
