CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

    albacea_nombre      VARCHAR(255),
    albacea_tipo_doc    VARCHAR(20),
    albacea_documento   VARCHAR(20),
    albacea_domicilio   VARCHAR(255),
    albacea_telefono    VARCHAR(100),

    apoderado1_nombre     VARCHAR(255),
    apoderado1_tipo_doc   VARCHAR(20),
    apoderado1_documento  VARCHAR(20),
    apoderado1_domicilio  VARCHAR(255),
    apoderado1_telefono   VARCHAR(100),

    apoderado2_nombre     VARCHAR(255),
    apoderado2_tipo_doc   VARCHAR(20),
    apoderado2_documento  VARCHAR(20),
    apoderado2_domicilio  VARCHAR(255),
    apoderado2_telefono   VARCHAR(100),

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

CREATE TABLE IF NOT EXISTS initial_balances (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_chica  NUMERIC(12,2)   NOT NULL DEFAULT 0,
    banco       NUMERIC(12,2)   NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
