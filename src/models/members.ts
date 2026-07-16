export type Person = {
    id: string;
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
    apoderado1: Person | null;
    apoderado2: Person | null;
};

export type ServiceRecord = {
    id: string;
    serviceId: string | null;
    serviceName: string | null;
    serviceAmount: number | null;
    memberId: string | null;
    memberNombre: string | null;
    memberNumeroDeSocio: string | null;
    personId: string | null;
    personNombre: string | null;
    movementId: string | null;
    movementAmount: number | null;
    amount: number;
    date: string;
    serviceDate: string | null;
    detail: string;
};

export type Cementerio = {
    id: string;
    nicho: string;
    folio: string;
    tipo: string;
    ocupante: string;
    numeroOrden: string;
    tieneLapida: boolean;
    esSocio: boolean;
    socioId: string | null;
    personaId: string | null;
    pagaPor: string;
    anioDeGracia: string;
    contratoNro: string;
    contratoPorAnios: string;
    anioVencContrato: string;
    ultimoPago: string;
    planDePago: string;
    fechaDePago: string;
    telefono: string;
    nombreAlternativo: string;
    fechaFallecimiento: string;
    reducir: string;
    debeAnios: string;
};

// Estado del formulario de creación/edición de socio
export type MembersFormState = {
    memberNumber: string;
    form: Member;
    apoderado1: Person | null;
    apoderado2: Person | null;
    ap1Search: string;
    ap1Visible: boolean;
    ap2Search: string;
    ap2Visible: boolean;
    setField: (key: keyof Member, value: any) => void;
    setForm: (member: Member) => void;
    setApoderado1: (p: Person | null) => void;
    setApoderado2: (p: Person | null) => void;
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
    pagaPorFilter: string;
    currentPage: number;
    rowsPerPage: number;
    loadMembers: () => Promise<void>;
    setSearchText: (s: string) => void;
    setShowFallecidos: (v: boolean) => void;
    setPagaPorFilter: (v: string) => void;
    setCurrentPage: (p: number) => void;
    setRowsPerPage: (r: number) => void;
    getFiltered: () => Member[];
    getPaginated: () => Member[];
    getTotalPages: () => number;
};

// Alias de compatibilidad — el store de formulario se sigue llamando MembersState
export type MembersState = MembersFormState;
