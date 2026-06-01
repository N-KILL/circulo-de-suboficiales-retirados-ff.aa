import { create } from "zustand";
import type { Person, MemberForm, MembersState } from "../models/members";

const todayIso = () => new Date().toISOString().split('T')[0];

export const useMembersStore = create<MembersState>((set, get) => ({
    memberNumber: `SOC-${Date.now().toString().slice(-6)}`,
    form: {
        nro: '', nombre: '', sexo: '', residencia: '', nroFamilia: '', nroFamAFall: '', tipoDoc: 'DNI', documento: '', cuil: '', tipoSocio: '', fechaNac: '', codPostal: '', localidad: '', domicilio: '', telefono: '', asistencial: false, planSalud: '', militar: false, fuerza: '', grado: '', estado: '', fechaIngreso: todayIso(), cobraIAF: 'No', pagaPor: '', depositarEn: '', cementerio: ''
    },
    albacea: null,
    apoderado1: null,
    apoderado2: null,
    albSearch: '', albVisible: false,
    ap1Search: '', ap1Visible: false,
    ap2Search: '', ap2Visible: false,

    setField: (key: keyof MemberForm, value: any) => set((state: MembersState) => ({ form: { ...state.form, [key as string]: value } as MemberForm })),
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
        const payload = { memberNumber: s.memberNumber, ...s.form, albacea: s.albacea, apoderado1: s.apoderado1, apoderado2: s.apoderado2 };
        console.log('Guardar socio (store):', payload);
        // TODO: llamar API
    },

    reset: () => set(() => ({
        memberNumber: `SOC-${Date.now().toString().slice(-6)}`,
        form: { nro: '', nombre: '', sexo: '', residencia: '', nroFamilia: '', nroFamAFall: '', tipoDoc: 'DNI', documento: '', cuil: '', tipoSocio: '', fechaNac: '', codPostal: '', localidad: '', domicilio: '', telefono: '', asistencial: false, planSalud: '', militar: false, fuerza: '', grado: '', estado: '', fechaIngreso: todayIso(), cobraIAF: 'No', pagaPor: '', depositarEn: '', cementerio: '' },
        albacea: null, apoderado1: null, apoderado2: null,
        albSearch: '', albVisible: false, ap1Search: '', ap1Visible: false, ap2Search: '', ap2Visible: false
    }))
}));

export default useMembersStore;
