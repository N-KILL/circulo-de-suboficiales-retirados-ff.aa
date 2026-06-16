import { create } from "zustand";
import type { Person, Member, MembersFormState } from "../models/members";

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
    albacea: null,
    apoderado1: null,
    apoderado2: null,
});

export const useMembersStore = create<MembersFormState>((set, get) => ({
    memberNumber: `SOC-${Date.now().toString().slice(-6)}`,
    form: emptyForm(),
    albacea: null,
    apoderado1: null,
    apoderado2: null,
    albSearch: '', albVisible: false,
    ap1Search: '', ap1Visible: false,
    ap2Search: '', ap2Visible: false,

    setField: (key: keyof Member, value: any) =>
        set((state) => ({ form: { ...state.form, [key as string]: value } as Member })),
    setAlbacea: (p: Person | null) => set(() => ({ albacea: p })),
    setApoderado1: (p: Person | null) => set(() => ({ apoderado1: p })),
    setApoderado2: (p: Person | null) => set(() => ({ apoderado2: p })),
    setAlbSearch: (s: string) => set(() => ({ albSearch: s })),
    setAlbVisible: (v: boolean) => set(() => ({ albVisible: v })),
    setAp1Search: (s: string) => set(() => ({ ap1Search: s })),
    setAp1Visible: (v: boolean) => set(() => ({ ap1Visible: v })),
    setAp2Search: (s: string) => set(() => ({ ap2Search: s })),
    setAp2Visible: (v: boolean) => set(() => ({ ap2Visible: v })),

    save: () => {
        const s = get();
        const payload = {
            memberNumber: s.memberNumber,
            ...s.form,
            albacea: s.albacea,
            apoderado1: s.apoderado1,
            apoderado2: s.apoderado2,
        };
        console.log('Guardar socio (store):', payload);
        // TODO: llamar API
    },

    reset: () => set(() => ({
        memberNumber: `SOC-${Date.now().toString().slice(-6)}`,
        form: emptyForm(),
        albacea: null, apoderado1: null, apoderado2: null,
        albSearch: '', albVisible: false,
        ap1Search: '', ap1Visible: false,
        ap2Search: '', ap2Visible: false,
    })),
}));

export default useMembersStore;
