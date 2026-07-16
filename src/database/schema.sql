CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS persons (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          VARCHAR(255)    NOT NULL,
    tipo_doc        VARCHAR(20),
    documento       VARCHAR(20),
    domicilio       VARCHAR(255),
    telefono        VARCHAR(100),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_persons_documento ON persons (documento) WHERE documento IS NOT NULL AND documento != '';

CREATE TABLE IF NOT EXISTS members (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_de_socio     VARCHAR(20)     NOT NULL UNIQUE,

    nombre              VARCHAR(255)    NOT NULL,
    sexo                VARCHAR(10),
    residencia          VARCHAR(100),
    nro_familia         VARCHAR(50),
    nro_fam_a_fall      VARCHAR(50),
    tipo_doc            VARCHAR(20),
    documento           VARCHAR(20),
    cuil                VARCHAR(20),
    tipo_socio          VARCHAR(50),
    fecha_nac           VARCHAR(20),
    edad                VARCHAR(10),
    cod_postal          VARCHAR(20),
    localidad           VARCHAR(100),
    domicilio           VARCHAR(255),
    email               VARCHAR(255),
    telefono            VARCHAR(100),

    asistencial         BOOLEAN         NOT NULL DEFAULT FALSE,
    plan_salud          BOOLEAN         NOT NULL DEFAULT FALSE,
    militar             BOOLEAN         NOT NULL DEFAULT FALSE,
    fuerza              VARCHAR(50),
    grado               VARCHAR(100),
    estado              VARCHAR(50),

    fecha_ingreso       VARCHAR(20),
    fecha_baja          VARCHAR(20),
    motivo_baja         VARCHAR(255),

    cobra_iaf           VARCHAR(50),
    paga_por            VARCHAR(100),
    depositar_en        VARCHAR(255),

    cementerio          VARCHAR(255),
    fallecido           BOOLEAN         NOT NULL DEFAULT FALSE,

    apoderado1_id       UUID            REFERENCES persons(id) ON DELETE SET NULL,
    apoderado2_id       UUID            REFERENCES persons(id) ON DELETE SET NULL,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_nombre        ON members (nombre);
CREATE INDEX IF NOT EXISTS idx_members_documento     ON members (documento);
CREATE INDEX IF NOT EXISTS idx_members_fallecido     ON members (fallecido);
CREATE INDEX IF NOT EXISTS idx_members_numero_socio  ON members (numero_de_socio);

CREATE TABLE IF NOT EXISTS petty_cash (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    date                DATE            NOT NULL,
    detail              TEXT,
    receipt             VARCHAR(100),
    amount              NUMERIC(12,2)   NOT NULL DEFAULT 0,
    type                VARCHAR(20)     NOT NULL,
    mode                VARCHAR(20)     NOT NULL DEFAULT 'efectivo',
    total_balance       NUMERIC(12,2),
    caja_chica_balance  NUMERIC(12,2),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cementerios (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    nicho               VARCHAR(50),
    folio               VARCHAR(50),
    tipo                VARCHAR(20),
    ocupante            VARCHAR(255),
    numero_orden        VARCHAR(50),
    tiene_lapida        BOOLEAN         NOT NULL DEFAULT FALSE,
    es_socio            BOOLEAN         NOT NULL DEFAULT FALSE,
    socio_id            UUID            REFERENCES members(id) ON DELETE SET NULL,
    persona_id          UUID            REFERENCES persons(id) ON DELETE SET NULL,
    paga_por            VARCHAR(20),
    anio_de_gracia      VARCHAR(50),
    contrato_nro        VARCHAR(50),
    contrato_por_anios  VARCHAR(50),
    anio_venc_contrato  VARCHAR(50),
    ultimo_pago         VARCHAR(50),
    plan_de_pago        VARCHAR(100),
    fecha_de_pago       VARCHAR(50),
    telefono            VARCHAR(100),
    nombre_alternativo  VARCHAR(255),
    fecha_fallecimiento VARCHAR(50),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cementerios_socio_id    ON cementerios (socio_id);
CREATE INDEX IF NOT EXISTS idx_cementerios_persona_id  ON cementerios (persona_id);

CREATE TABLE IF NOT EXISTS initial_balances (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_chica  NUMERIC(12,2)   NOT NULL DEFAULT 0,
    banco       NUMERIC(12,2)   NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dues (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(20)     NOT NULL,
    payment_date    DATE            NOT NULL,
    period          JSONB DEFAULT '[]'::jsonb,
    member_id       UUID            REFERENCES members(id) ON DELETE SET NULL,
    person_id       UUID            REFERENCES persons(id) ON DELETE SET NULL,
    movement_id     UUID            REFERENCES petty_cash(id) ON DELETE SET NULL,
    family_group    VARCHAR(50),
    paid_members    JSONB,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dues_member_id   ON dues (member_id);
CREATE INDEX IF NOT EXISTS idx_dues_person_id   ON dues (person_id);
CREATE INDEX IF NOT EXISTS idx_dues_type        ON dues (type);

CREATE TABLE IF NOT EXISTS pricing (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    member_fee              NUMERIC(12,2)   NOT NULL DEFAULT 0,
    consideration_years     INT             NOT NULL DEFAULT 0,
    nicho_member_fee        NUMERIC(12,2)   NOT NULL DEFAULT 0,
    nicho_non_member_fee    NUMERIC(12,2)   NOT NULL DEFAULT 0,
    urna_member_fee         NUMERIC(12,2)   NOT NULL DEFAULT 0,
    urna_non_member_fee     NUMERIC(12,2)   NOT NULL DEFAULT 0,
    bolsa_member_fee        NUMERIC(12,2)   NOT NULL DEFAULT 0,
    bolsa_non_member_fee    NUMERIC(12,2)   NOT NULL DEFAULT 0,
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

INSERT INTO pricing (id, member_fee, consideration_years)
VALUES ('00000000-0000-0000-0000-000000000002', 0, 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS services (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255)    NOT NULL,
    amount      NUMERIC(12,2)   NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_records (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id      UUID            REFERENCES services(id) ON DELETE SET NULL,
    member_id       UUID            REFERENCES members(id) ON DELETE SET NULL,
    person_id       UUID            REFERENCES persons(id) ON DELETE SET NULL,
    movement_id     UUID            REFERENCES petty_cash(id) ON DELETE SET NULL,
    amount          NUMERIC(12,2)   NOT NULL DEFAULT 0,
    date            DATE            NOT NULL,
    service_date    DATE,
    detail          TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_records_service_id   ON service_records (service_id);
CREATE INDEX IF NOT EXISTS idx_service_records_member_id    ON service_records (member_id);
CREATE INDEX IF NOT EXISTS idx_service_records_person_id    ON service_records (person_id);
CREATE INDEX IF NOT EXISTS idx_service_records_movement_id  ON service_records (movement_id);
