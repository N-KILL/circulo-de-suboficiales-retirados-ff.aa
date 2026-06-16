export type Person = {
    nombre: string;
    tipoDoc: string;
    documento: string;
    domicilio: string;
    telefono: string;
};

export type Member = {
    id: string; // UUID
    numeroDeSocio: string;
    nombre: string;
    sexo: string;
    residencia: string;
    nroFamilia: string;
    nroFamAFall: string;
    tipoDoc: string;
    documento: string;
    cuil: string;
    tipoSocio: string;
    fechaNac: string;
    edad: string;
    codPostal: string;
    localidad: string;
    domicilio: string;
    email: string;
    telefono: string;
    asistencial: boolean;
    planSalud: boolean;
    militar: boolean;
    fuerza: string;
    grado: string;
    estado: string;
    fechaIngreso: string;
    fechaBaja: string;
    motivoBaja: string;
    cobraIAF: string;
    pagaPor: string;
    depositarEn?: string;
    cementerio: string;
    fallecido: boolean;
    albacea: Person | null;
    apoderado1: Person | null;
    apoderado2: Person | null;
};

// Estado del formulario de creación/edición de socio
export type MembersFormState = {
    memberNumber: string;
    form: Member;
    albacea: Person | null;
    apoderado1: Person | null;
    apoderado2: Person | null;
    albSearch: string;
    albVisible: boolean;
    ap1Search: string;
    ap1Visible: boolean;
    ap2Search: string;
    ap2Visible: boolean;
    setField: (key: keyof Member, value: any) => void;
    setForm: (member: Member) => void;
    setAlbacea: (p: Person | null) => void;
    setApoderado1: (p: Person | null) => void;
    setApoderado2: (p: Person | null) => void;
    setAlbSearch: (s: string) => void;
    setAlbVisible: (v: boolean) => void;
    setAp1Search: (s: string) => void;
    setAp1Visible: (v: boolean) => void;
    setAp2Search: (s: string) => void;
    setAp2Visible: (v: boolean) => void;
    save: () => Promise<void>;
    reset: () => void;
};

// Estado de la lista/paginación de socios
export type MembersListState = {
    allMembers: Member[];
    isLoading: boolean;
    error: string | null;
    searchText: string;
    showFallecidos: boolean;
    currentPage: number;
    rowsPerPage: number;
    loadMembers: () => Promise<void>;
    setSearchText: (s: string) => void;
    setShowFallecidos: (v: boolean) => void;
    setCurrentPage: (p: number) => void;
    setRowsPerPage: (r: number) => void;
    getFiltered: () => Member[];
    getPaginated: () => Member[];
    getTotalPages: () => number;
};

// Alias de compatibilidad — el store de formulario se sigue llamando MembersState
export type MembersState = MembersFormState;
