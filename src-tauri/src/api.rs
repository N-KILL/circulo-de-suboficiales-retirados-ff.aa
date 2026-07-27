#![allow(non_snake_case, dead_code)]

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, patch, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::{Column, Row, TypeInfo};
use tracing::{error, info, warn};

use crate::db::AppState;

pub fn api_router() -> Router<AppState> {
    Router::new()
        .route("/api/members", get(get_members))
        .route("/api/members/family", get(get_members_family))
        .route("/api/members/debt-status", get(get_members_debt_status))
        .route("/api/members/vitalicios", patch(update_vitalicios))
        .route("/api/persons", get(get_persons))
        .route("/api/persons/search", get(search_persons))
        .route("/api/movements", get(get_movements))
        .route("/api/movement", get(get_movement).put(update_movement).delete(delete_movement))
        .route("/api/initial-balances", get(get_initial_balances).post(upsert_initial_balances))
        .route("/api/member", get(get_member).post(upsert_member).delete(delete_member))
        .route("/api/person", get(get_person).post(upsert_person).delete(delete_person))
        .route("/api/person-members", get(get_person_members))
        .route("/api/payment", post(create_payment))
        .route("/api/receipt/next", post(next_receipt_number))
        .route("/api/comprobante", get(get_comprobante).post(insert_comprobante))
        .route("/api/receipt-copies-config", get(get_receipt_copies_config).post(save_receipt_copies_config))
        .route("/api/cementerios", get(get_cementerios).patch(update_cementerio))
        .route("/api/dues", get(get_dues).post(insert_due))
        .route("/api/dues-config", get(get_dues_config).post(upsert_dues_config))
        .route("/api/dues-config/history", get(get_pricing_history))
        .route("/api/services", get(get_services).post(insert_service).put(update_service).delete(delete_service))
        .route("/api/service-records", get(get_service_records).post(insert_service_record).put(update_service_record).delete(delete_service_record))
        .route("/api/users", get(get_users).post(upsert_user).patch(update_user_role).delete(delete_user))
        .route("/api/cementerio-movimientos", get(get_cementerio_movimientos).post(insert_cementerio_movimiento))
        .route("/api/debts", get(get_debts).post(insert_debt))
        .route("/api/debts/balance", get(get_debts_balance))
        .route("/api/external-services", get(get_external_services).post(insert_external_service).put(update_external_service).delete(delete_external_service))
        .route("/api/external-service-payments", get(get_ext_service_payments).post(upsert_ext_service_payment).delete(delete_ext_service_payment))
        .route("/api/frontend-errors", post(receive_frontend_error))
}

type ErrResponse = (StatusCode, Json<Value>);

fn err(status: StatusCode, msg: &str) -> ErrResponse {
    (status, Json(json!({ "error": msg })))
}

fn ok(json: Value) -> impl IntoResponse {
    Json(json)
}

fn row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    let mut map = serde_json::Map::new();
    for (idx, column) in row.columns().iter().enumerate() {
        let name = column.name().to_string();
        let value: Value = match column.type_info().name() {
            "BOOL" => row.try_get::<bool, _>(idx).map(Value::Bool).unwrap_or(Value::Null),
            "INT4" | "INT8" | "SERIAL" => row.try_get::<i32, _>(idx).map(|v| Value::Number(v.into())).unwrap_or(Value::Null),
            "FLOAT4" | "FLOAT8" => {
                row.try_get::<f64, _>(idx)
                    .map(|f| {
                        serde_json::Number::from_f64(f)
                            .map(Value::Number)
                            .unwrap_or(Value::Null)
                    })
                    .unwrap_or(Value::Null)
            }
            "NUMERIC" => {
                row.try_get::<rust_decimal::Decimal, _>(idx)
                    .map(|d| {
                        let f: f64 = d.to_string().parse().unwrap_or(0.0);
                        serde_json::Number::from_f64(f)
                            .map(Value::Number)
                            .unwrap_or(Value::String(d.to_string()))
                    })
                    .unwrap_or(Value::Null)
            }
            "UUID" => row.try_get::<uuid::Uuid, _>(idx).map(|v| Value::String(v.to_string())).unwrap_or(Value::Null),
            "DATE" => {
                row.try_get::<chrono::NaiveDate, _>(idx)
                    .map(|d| Value::String(d.to_string()))
                    .unwrap_or(Value::Null)
            }
            "TIMESTAMPTZ" | "TIMESTAMP" => {
                row.try_get::<chrono::NaiveDateTime, _>(idx)
                    .map(|dt| Value::String(dt.format("%Y-%m-%dT%H:%M:%S%.fZ").to_string()))
                    .or_else(|_| row.try_get::<String, _>(idx).map(Value::String))
                    .unwrap_or(Value::Null)
            }
            "JSONB" | "JSON" => row.try_get::<Value, _>(idx).unwrap_or(Value::Null),
            "TEXT[]" | "_TEXT" => {
                row.try_get::<Vec<String>, _>(idx)
                    .map(|v| Value::Array(v.into_iter().map(Value::String).collect()))
                    .unwrap_or(Value::Null)
            }
            _ => {
                row.try_get::<String, _>(idx)
                    .map(Value::String)
                    .or_else(|_| row.try_get::<Value, _>(idx))
                    .unwrap_or(Value::Null)
            }
        };
        map.insert(name, value);
    }
    Value::Object(map)
}

fn rows_to_json(rows: &[sqlx::postgres::PgRow]) -> Value {
    Value::Array(rows.iter().map(row_to_json).collect())
}

#[derive(Deserialize)]
struct IdQuery { id: Option<String> }
#[derive(Deserialize)]
struct MemberIdQuery { member_id: Option<String>, memberId: Option<String> }
#[derive(Deserialize)]
struct PersonIdQuery { person_id: Option<String>, personId: Option<String> }
#[derive(Deserialize)]
struct MovementIdQuery { movement_id: Option<String>, movementId: Option<String> }
#[derive(Deserialize)]
struct NichoQuery { nicho: Option<String>, has_nicho: Option<String>, hasNicho: Option<String> }
#[derive(Deserialize)]
struct CementeriosQuery {
    owner_id: Option<String>, ownerId: Option<String>,
    is_socio: Option<String>, isSocio: Option<String>,
    nicho: Option<String>,
    owners: Option<String>,
}
#[derive(Deserialize)]
struct DuesQuery {
    member_id: Option<String>, memberId: Option<String>,
    person_id: Option<String>, personId: Option<String>,
    check: Option<String>,
}
#[derive(Deserialize)]
struct CementerioMovimientosQuery {
    movement_id: Option<String>, movementId: Option<String>,
    nicho: Option<String>,
    has_nicho: Option<String>, hasNicho: Option<String>,
    pagos_map: Option<String>, pagosMap: Option<String>,
    member_id: Option<String>, memberId: Option<String>,
    person_id: Option<String>, personId: Option<String>,
}

#[derive(Deserialize)]
struct DebtBalanceQuery {
    member_id: Option<String>, memberId: Option<String>,
    person_id: Option<String>, personId: Option<String>,
}
#[derive(Deserialize)]
struct PagosMapQuery { pagos_map: Option<String>, pagosMap: Option<String> }
#[derive(Deserialize)]
struct YearQuery { year: Option<i32> }
#[derive(Deserialize)]
struct AuthUserQuery { auth_user_id: Option<String>, authUserId: Option<String> }
#[derive(Deserialize)]
struct SearchQuery { q: Option<String> }
#[derive(Deserialize)]
struct ServiceRecordQuery {
    id: Option<String>,
    member_id: Option<String>, memberId: Option<String>,
    person_id: Option<String>, personId: Option<String>,
    movement_id: Option<String>, movementId: Option<String>,
}

fn str_col(row: &sqlx::postgres::PgRow, col: &str) -> String {
    row.try_get::<Option<String>, _>(col).ok().flatten().unwrap_or_default()
}

fn bool_col(row: &sqlx::postgres::PgRow, col: &str) -> bool {
    row.try_get::<Option<bool>, _>(col).ok().flatten().unwrap_or(false)
}

fn opt_str_col(row: &sqlx::postgres::PgRow, col: &str) -> Option<String> {
    row.try_get::<Option<String>, _>(col).ok().flatten()
}

fn uuid_col(row: &sqlx::postgres::PgRow, col: &str) -> String {
    row.try_get::<uuid::Uuid, _>(col).map(|v| v.to_string()).unwrap_or_default()
}

fn opt_uuid_col(row: &sqlx::postgres::PgRow, col: &str) -> Option<String> {
    row.try_get::<Option<uuid::Uuid>, _>(col).ok().flatten().map(|v| v.to_string())
}

fn map_sexo(raw: &str) -> String {
    match raw { "M" | "m" => "Masculino", "F" | "f" => "Femenino", _ => raw }.to_string()
}

fn unmap_sexo(raw: &str) -> String {
    match raw { "Masculino" => "M", "Femenino" => "F", _ => raw }.to_string()
}

fn map_tipo_socio(raw: &str) -> String {
    match raw {
        "ACT" => "Activo",
        "ACT A" | "ACT \"A\"" => "Activo Tipo A",
        "ADH" => "Adherente",
        "HON" => "Honorario",
        "PART" => "Participante",
        "VIT" => "Vitalicio",
        _ => raw,
    }.to_string()
}

fn unmap_tipo_socio(raw: &str) -> String {
    match raw {
        "Activo" => "ACT",
        "Activo Tipo A" => "ACT A",
        "Adherente" => "ADH",
        "Honorario" => "HON",
        "Participante" => "PART",
        "Vitalicio" => "VIT",
        _ => raw,
    }.to_string()
}

fn map_estado(raw: &str) -> String {
    match raw {
        "" => "En servicio",
        "(R)" | "RET" => "Retirado",
        "Baja" => "Baja",
        "PENS" => "Pensionado",
        _ => raw,
    }.to_string()
}

fn unmap_estado(raw: &str) -> String {
    match raw {
        "En servicio" => "",
        "Retirado" => "RET",
        "Baja" => "Baja",
        "Pensionado" => "PENS",
        _ => raw,
    }.to_string()
}

fn fecha_to_display(raw: &str) -> String {
    if raw.is_empty() { return String::new(); }
    if raw.len() == 10 && raw.as_bytes()[4] == b'-' { return raw.to_string(); }
    if raw.len() >= 10 && raw.as_bytes()[2] == b'/' && raw.as_bytes()[5] == b'/' {
        let d = &raw[0..2];
        let m = &raw[3..5];
        let y = &raw[6..10];
        return format!("{}-{}-{}", y, m, d);
    }
    raw.to_string()
}

fn fecha_to_db(raw: &str) -> String {
    if raw.is_empty() { return String::new(); }
    if raw.len() >= 10 && raw.as_bytes()[2] == b'/' && raw.as_bytes()[5] == b'/' { return raw.to_string(); }
    if raw.len() == 10 && raw.as_bytes()[4] == b'-' {
        let y = &raw[0..4];
        let m = &raw[5..7];
        let d = &raw[8..10];
        return format!("{}/{}/{}", d, m, y);
    }
    raw.to_string()
}

fn person_json(row: &sqlx::postgres::PgRow, prefix: &str) -> Value {
    let nombre = str_col(row, &format!("{}_nombre", prefix));
    if nombre.trim().is_empty() { return Value::Null; }
    json!({
        "id": opt_uuid_col(row, &format!("{}_id", prefix)).unwrap_or_default(),
        "nombre": nombre,
        "tipoDoc": str_col(row, &format!("{}_tipo_doc", prefix)),
        "documento": str_col(row, &format!("{}_documento", prefix)),
        "domicilio": str_col(row, &format!("{}_domicilio", prefix)),
        "telefono": str_col(row, &format!("{}_telefono", prefix)),
    })
}

fn row_to_member_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "id": uuid_col(row, "id"),
        "numeroDeSocio": str_col(row, "numero_de_socio"),
        "nombre": str_col(row, "nombre"),
        "sexo": map_sexo(&str_col(row, "sexo")),
        "residencia": str_col(row, "residencia"),
        "nroFamilia": str_col(row, "nro_familia"),
        "nroFamAFall": str_col(row, "nro_fam_a_fall"),
        "tipoDoc": str_col(row, "tipo_doc"),
        "documento": str_col(row, "documento"),
        "cuil": str_col(row, "cuil"),
        "tipoSocio": map_tipo_socio(&str_col(row, "tipo_socio")),
        "fechaNac": fecha_to_display(&str_col(row, "fecha_nac")),
        "edad": str_col(row, "edad"),
        "codPostal": str_col(row, "cod_postal"),
        "localidad": str_col(row, "localidad"),
        "domicilio": str_col(row, "domicilio"),
        "email": str_col(row, "email"),
        "telefono": str_col(row, "telefono"),
        "asistencial": bool_col(row, "asistencial"),
        "planSalud": bool_col(row, "plan_salud"),
        "militar": bool_col(row, "militar"),
        "fuerza": str_col(row, "fuerza"),
        "grado": str_col(row, "grado"),
        "estado": map_estado(&str_col(row, "estado")),
        "fechaIngreso": fecha_to_display(&str_col(row, "fecha_ingreso")),
        "fechaBaja": fecha_to_display(&str_col(row, "fecha_baja")),
        "motivoBaja": str_col(row, "motivo_baja"),
        "cobraIAF": str_col(row, "cobra_iaf"),
        "pagaPor": str_col(row, "paga_por"),
        "depositarEn": opt_str_col(row, "depositar_en"),
        "cementerio": str_col(row, "cementerio"),
        "fallecido": bool_col(row, "fallecido"),
        "apoderado1": person_json(row, "apoderado1"),
        "apoderado2": person_json(row, "apoderado2"),
    })
}

async fn get_members(State(db): State<AppState>) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query(
        "SELECT m.*, ap1.id AS apoderado1_id, ap1.nombre AS apoderado1_nombre, ap1.tipo_doc AS apoderado1_tipo_doc,
         ap1.documento AS apoderado1_documento, ap1.domicilio AS apoderado1_domicilio, ap1.telefono AS apoderado1_telefono,
         ap2.id AS apoderado2_id, ap2.nombre AS apoderado2_nombre, ap2.tipo_doc AS apoderado2_tipo_doc,
         ap2.documento AS apoderado2_documento, ap2.domicilio AS apoderado2_domicilio, ap2.telefono AS apoderado2_telefono
         FROM members m LEFT JOIN persons ap1 ON m.apoderado1_id = ap1.id
         LEFT JOIN persons ap2 ON m.apoderado2_id = ap2.id
         ORDER BY NULLIF(regexp_replace(m.numero_de_socio, '[^0-9]', '', 'g'), '')::int NULLS LAST, m.numero_de_socio"
    ).fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let members: Vec<Value> = rows.iter().map(|r| row_to_member_json(r)).collect();
    Ok(Json(Value::Array(members)))
}

async fn get_members_family(
    State(db): State<AppState>,
    Query(q): Query<MemberIdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let member_id = q.member_id.or(q.memberId).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta memberId"))?;
    if member_id.is_empty() { return Ok(Json(json!([]))); }
    let current = sqlx::query("SELECT nro_familia, numero_de_socio FROM members WHERE id = $1::uuid LIMIT 1")
        .bind(&member_id).fetch_optional(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let current = current.ok_or_else(|| err(StatusCode::NOT_FOUND, "Socio no encontrado"))?;
    let raw = opt_str_col(&current, "nro_familia").unwrap_or_default();
    let numero = str_col(&current, "numero_de_socio");
    let nro = raw.trim();
    let family_group = if !nro.is_empty() {
        nro.split('/').next().unwrap_or(nro).to_string()
    } else {
        numero.split('/').next().unwrap_or("").to_string()
    };
    if family_group.is_empty() {
        return Ok(Json(Value::Array(vec![])));
    }
    let like_pattern = format!("{}/%", family_group);
    let rows = sqlx::query(
        "SELECT m.*, ap1.id AS apoderado1_id, ap1.nombre AS apoderado1_nombre, ap1.tipo_doc AS apoderado1_tipo_doc,
         ap1.documento AS apoderado1_documento, ap1.domicilio AS apoderado1_domicilio, ap1.telefono AS apoderado1_telefono,
         ap2.id AS apoderado2_id, ap2.nombre AS apoderado2_nombre, ap2.tipo_doc AS apoderado2_tipo_doc,
         ap2.documento AS apoderado2_documento, ap2.domicilio AS apoderado2_domicilio, ap2.telefono AS apoderado2_telefono
         FROM members m LEFT JOIN persons ap1 ON m.apoderado1_id = ap1.id
         LEFT JOIN persons ap2 ON m.apoderado2_id = ap2.id
         WHERE m.nro_familia LIKE $1 OR m.nro_familia = $2 ORDER BY m.numero_de_socio"
    ).bind(&like_pattern).bind(&family_group)
     .fetch_all(&db.pool).await
     .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let members: Vec<Value> = rows.iter().map(|r| row_to_member_json(r)).collect();
    Ok(Json(Value::Array(members)))
}

async fn get_members_debt_status(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let dues_rows = sqlx::query(
        "SELECT member_id, paid_members, period FROM dues WHERE type = 'socio'"
    ).fetch_all(&db.pool).await.unwrap_or_default();

    let mut latest_map: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    for row in &dues_rows {
        let member_id: Option<uuid::Uuid> = row.try_get("member_id").ok().flatten();
        let period: Option<Value> = row.try_get("period").ok().flatten();
        let paid_members: Option<Value> = row.try_get("paid_members").ok().flatten();

        let periods: Vec<String> = match &period {
            Some(Value::Array(arr)) => arr.iter().filter_map(|v| v.as_str().map(String::from)).collect(),
            _ => continue,
        };
        if periods.is_empty() { continue; }
        let latest = periods.iter().max().cloned().unwrap_or_default();

        let mut members: Vec<String> = Vec::new();
        if let Some(mid) = member_id {
            members.push(mid.to_string());
        }
        if let Some(Value::Array(pm)) = &paid_members {
            for v in pm {
                if let Some(s) = v.as_str() {
                    members.push(s.to_string());
                }
            }
        }
        for mid in &members {
            if let Some(existing) = latest_map.get(mid) {
                if latest > *existing {
                    latest_map.insert(mid.clone(), latest.clone());
                }
            } else {
                latest_map.insert(mid.clone(), latest.clone());
            }
        }
    }

    let config = sqlx::query("SELECT consideration_years FROM pricing LIMIT 1")
        .fetch_optional(&db.pool).await.ok().flatten();
    let cy = config.and_then(|r| r.try_get::<i32, _>("consideration_years").ok()).unwrap_or(0);

    let member_rows = sqlx::query(
        "SELECT m.id, m.numero_de_socio, m.nombre FROM members m ORDER BY m.numero_de_socio"
    ).fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let members: Vec<Value> = member_rows.iter().map(|r| {
        let id = r.try_get::<uuid::Uuid, _>("id").ok().map(|v| v.to_string()).unwrap_or_default();
        let last_payment = latest_map.get(&id).cloned();
        json!({
            "id": id,
            "numeroDeSocio": str_col(r, "numero_de_socio"),
            "nombre": str_col(r, "nombre"),
            "last_payment_date": last_payment,
        })
    }).collect();

    Ok(Json(json!({ "members": members, "consideration_years": cy })))
}

async fn update_vitalicios(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let result = sqlx::query(
        "UPDATE members SET tipo_socio = 'VIT', updated_at = NOW()
         WHERE fallecido = FALSE AND (fecha_baja IS NULL OR fecha_baja = '')
         AND tipo_socio IS DISTINCT FROM 'VIT'
         AND edad ~ '^[0-9]+$' AND CAST(edad AS INTEGER) > 35"
    ).execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "updated": result.rows_affected() })))
}

async fn get_persons(
    State(db): State<AppState>,
    Query(q): Query<SearchQuery>,
) -> Result<Json<Value>, ErrResponse> {
    if let Some(query) = q.q.filter(|s| !s.is_empty()) {
        let pattern = format!("%{query}%");
        let rows = sqlx::query("SELECT * FROM persons WHERE (documento ILIKE $1 OR nombre ILIKE $1) ORDER BY nombre LIMIT 20")
            .bind(&pattern)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    let rows = sqlx::query("SELECT * FROM persons ORDER BY nombre")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn search_persons(
    State(db): State<AppState>,
    Query(q): Query<SearchQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let query = q.q.unwrap_or_default();
    if query.is_empty() {
        return Ok(Json(json!([])));
    }
    let pattern = format!("%{query}%");
    let rows = sqlx::query("SELECT * FROM persons WHERE (documento ILIKE $1 OR nombre ILIKE $1) ORDER BY nombre LIMIT 20")
        .bind(&pattern)
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn get_movement(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    let row = sqlx::query(
        "SELECT id, date::text, detail, amount::float8 as amount, type, mode, concept, created_at::text FROM petty_cash WHERE id = $1::uuid"
    ).bind(&id)
        .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let movement = row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado"))?;
    let due = sqlx::query("SELECT * FROM dues WHERE movement_id = $1::uuid").bind(&id)
        .fetch_optional(&db.pool).await.ok().flatten().map(|r| row_to_json(&r));
    let sr = sqlx::query("SELECT * FROM service_records WHERE movement_id = $1::uuid").bind(&id)
        .fetch_all(&db.pool).await.ok().map(|r| rows_to_json(&r)).unwrap_or(json!([]));
    let cm = sqlx::query("SELECT * FROM cementerio_movimientos WHERE movement_id = $1::uuid").bind(&id)
        .fetch_all(&db.pool).await.ok().map(|r| rows_to_json(&r)).unwrap_or(json!([]));
    let comprobante_row = sqlx::query(
        "SELECT id, movement_id::text, receipt_number, copies_to_print, detail, concept, payer_name, created_at::text FROM comprobantes WHERE movement_id = $1::uuid ORDER BY created_at DESC LIMIT 1"
    ).bind(&id)
        .fetch_optional(&db.pool).await.ok().flatten().map(|r| row_to_json(&r));
    let mut result = row_to_json(&movement);
    if let Some(obj) = result.as_object_mut() {
        obj.insert("linked_due".into(), due.unwrap_or(Value::Null));
        obj.insert("linked_service_records".into(), sr);
        obj.insert("linked_cementerio_movimientos".into(), cm);
        obj.insert("comprobante".into(), comprobante_row.unwrap_or(Value::Null));
    }
    Ok(Json(result))
}

async fn update_movement(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    if let Some(obj) = body.as_object() {
        let mut sets = Vec::new();
        let mut non_null_values: Vec<(&String, &Value)> = Vec::new();
        for (k, v) in obj {
            if k == "due" || k == "id" { continue; }
            let cast = match k.as_str() {
                "date" => "::date",
                _ => "",
            };
            match v {
                Value::Null => {
                    sets.push(format!("\"{}\" = NULL", k));
                }
                _ => {
                    sets.push(format!("\"{}\" = ${}{}", k, sets.len() + 1, cast));
                    non_null_values.push((k, v));
                }
            }
        }
        if !sets.is_empty() {
            let q_str = format!("UPDATE petty_cash SET {} WHERE id = ${}::uuid", sets.join(", "), sets.len() + 1);
            let mut query = sqlx::query(&q_str);
            for (_k, v) in &non_null_values {
                query = bind_json(query, v);
            }
            query = query.bind(&id);
            query.execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        }
    }
    if let Some(due_data) = body.get("due") {
        if let Some(obj) = due_data.as_object() {
            let period_json = obj.get("period")
                .and_then(|v| v.as_array())
                .filter(|a| !a.is_empty())
                .map(|a| serde_json::to_string(a).unwrap_or_default());
            let paid_members_json = obj.get("paid_members")
                .and_then(|v| v.as_array())
                .filter(|a| !a.is_empty())
                .map(|a| serde_json::to_string(a).unwrap_or_default());
            let q_str = "UPDATE dues SET period = COALESCE($1::jsonb, period), paid_members = COALESCE($2::jsonb, paid_members) WHERE movement_id = $3::uuid";
            sqlx::query(q_str)
                .bind(period_json)
                .bind(paid_members_json)
                .bind(&id)
                .execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        }
    }
    Ok(Json(json!({ "success": true })))
}

async fn delete_movement(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    let debts = sqlx::query("SELECT id, description, amount FROM debts WHERE movement_id = $1::uuid")
        .bind(&id).fetch_all(&db.pool).await.unwrap_or_default();
    for debt in &debts {
        let debt_id: Option<uuid::Uuid> = debt.try_get("id").ok();
        let desc: String = debt.try_get("description").ok().flatten().unwrap_or_default();
        let amount: f64 = debt.try_get("amount").ok().flatten().unwrap_or(0.0);
        if let Some(did) = debt_id {
            let cancel_desc = format!("Cancelados {}{:.2} - {}", if amount >= 0.0 { "+" } else { "" }, amount, desc);
            sqlx::query("UPDATE debts SET amount = 0, description = $1 WHERE id = $2::uuid")
                .bind(cancel_desc).bind(did).execute(&db.pool).await.ok();
        }
    }
    sqlx::query("DELETE FROM dues WHERE movement_id = $1::uuid").bind(&id).execute(&db.pool).await.ok();
    sqlx::query("DELETE FROM service_records WHERE movement_id = $1::uuid").bind(&id).execute(&db.pool).await.ok();
    sqlx::query("DELETE FROM cementerio_movimientos WHERE movement_id = $1::uuid").bind(&id).execute(&db.pool).await.ok();
    sqlx::query("UPDATE external_service_payments SET movement_id = NULL WHERE movement_id = $1::uuid").bind(&id).execute(&db.pool).await.ok();
    sqlx::query("DELETE FROM petty_cash WHERE id = $1::uuid").bind(&id).execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_movements(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query(
        "SELECT id, date::text, detail, amount::float8 as amount, type, mode, concept, created_at::text FROM petty_cash ORDER BY date DESC, created_at DESC"
    )
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let movement_ids: Vec<String> = rows.iter()
        .filter_map(|r| r.try_get::<uuid::Uuid, _>("id").ok().map(|v| v.to_string()))
        .collect();

    let comprobantes_value: Value = if !movement_ids.is_empty() {
        sqlx::query(
            "SELECT id, movement_id::text, receipt_number, copies_to_print, detail, concept, payer_name, created_at::text FROM comprobantes WHERE movement_id = ANY($1::uuid[])"
        )
            .bind(&movement_ids)
            .fetch_all(&db.pool).await
            .map(|r| rows_to_json(&r))
            .unwrap_or(json!([]))
    } else {
        json!([])
    };

    let mut comprobante_map: std::collections::HashMap<String, Value> = std::collections::HashMap::new();
    if let Some(arr) = comprobantes_value.as_array() {
        for c in arr {
            if let Some(mid) = c.get("movement_id").and_then(|v| v.as_str()) {
                comprobante_map.insert(mid.to_string(), c.clone());
            }
        }
    }

    let movements: Vec<Value> = rows.iter().map(|r| {
        let mut movement = row_to_json(r);
        if let Some(obj) = movement.as_object_mut() {
            let mid = obj.get("id").and_then(|v| v.as_str()).unwrap_or("");
            let comprobante = comprobante_map.get(mid).cloned().unwrap_or(Value::Null);
            obj.insert("comprobante".into(), comprobante);
        }
        movement
    }).collect();

    Ok(Json(Value::Array(movements)))
}

async fn get_initial_balances(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let row = sqlx::query(
        "SELECT id, caja_chica::float as caja_chica, banco::float as banco,
         comprobante_ingreso, comprobante_egreso
         FROM initial_balances LIMIT 1"
    )
    .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(row.map(|r| row_to_json(&r)).unwrap_or(Value::Null)))
}

async fn upsert_initial_balances(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let caja = body.get("caja_chica").and_then(|v| v.as_f64()).map(|f| rust_decimal::Decimal::try_from(f).unwrap_or_default()).unwrap_or_default();
    let banco = body.get("banco").and_then(|v| v.as_f64()).map(|f| rust_decimal::Decimal::try_from(f).unwrap_or_default()).unwrap_or_default();
    let ci = body.get("comprobante_ingreso").and_then(|v| v.as_i64()).map(|v| v as i32);
    let ce = body.get("comprobante_egreso").and_then(|v| v.as_i64()).map(|v| v as i32);
    let row = sqlx::query(
        "INSERT INTO initial_balances (id, caja_chica, banco, comprobante_ingreso, comprobante_egreso)
         VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, COALESCE($3, 1), COALESCE($4, 1))
         ON CONFLICT (id) DO UPDATE SET
         caja_chica = EXCLUDED.caja_chica,
         banco = EXCLUDED.banco,
         comprobante_ingreso = COALESCE($3, initial_balances.comprobante_ingreso),
         comprobante_egreso = COALESCE($4, initial_balances.comprobante_egreso),
         updated_at = NOW()
         RETURNING id, caja_chica::float as caja_chica, banco::float as banco,
         comprobante_ingreso, comprobante_egreso"
    ).bind(caja).bind(banco).bind(ci).bind(ce)
     .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(row.map(|r| row_to_json(&r)).unwrap_or(json!({ "success": true }))))
}

async fn get_member(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    let row = sqlx::query(
        "SELECT m.*, ap1.id AS apoderado1_id, ap1.nombre AS apoderado1_nombre, ap1.tipo_doc AS apoderado1_tipo_doc,
         ap1.documento AS apoderado1_documento, ap1.domicilio AS apoderado1_domicilio, ap1.telefono AS apoderado1_telefono,
         ap2.id AS apoderado2_id, ap2.nombre AS apoderado2_nombre, ap2.tipo_doc AS apoderado2_tipo_doc,
         ap2.documento AS apoderado2_documento, ap2.domicilio AS apoderado2_domicilio, ap2.telefono AS apoderado2_telefono
         FROM members m LEFT JOIN persons ap1 ON m.apoderado1_id = ap1.id
         LEFT JOIN persons ap2 ON m.apoderado2_id = ap2.id WHERE m.id = $1::uuid LIMIT 1"
    ).bind(&id).fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado")).map(|r| Json(row_to_member_json(&r)))
}

async fn upsert_member(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let ns = body.get("numeroDeSocio").or(body.get("numero_de_socio")).and_then(|v| v.as_str());
    if ns.is_none() || ns.unwrap().trim().is_empty() {
        return Err(err(StatusCode::BAD_REQUEST, "Falta número de socio"));
    }
    let id = body.get("id").and_then(|v| v.as_str()).unwrap_or("");
    let numero = ns.unwrap();
    let nombre = body.get("nombre").and_then(|v| v.as_str()).unwrap_or("");
    let sexo = unmap_sexo(&body_str(body.get("sexo")).unwrap_or_default());
    let tipo_socio = unmap_tipo_socio(&body_str(body.get("tipoSocio")).unwrap_or_default());
    let estado = unmap_estado(&body_str(body.get("estado")).unwrap_or_default());
    let fecha_nac = fecha_to_db(&body_str(body.get("fechaNac")).unwrap_or_default());
    let fecha_ingreso = fecha_to_db(&body_str(body.get("fechaIngreso")).unwrap_or_default());
    let fecha_baja = fecha_to_db(&body_str(body.get("fechaBaja")).unwrap_or_default());
    sqlx::query(
        "INSERT INTO members (id, numero_de_socio, nombre, sexo, residencia, nro_familia, nro_fam_a_fall,
         tipo_doc, documento, cuil, tipo_socio, fecha_nac, edad, cod_postal, localidad, domicilio, email, telefono,
         asistencial, plan_salud, militar, fuerza, grado, estado, fecha_ingreso, fecha_baja, motivo_baja,
         cobra_iaf, paga_por, depositar_en, cementerio, fallecido, apoderado1_id, apoderado2_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34)
         ON CONFLICT (id) DO UPDATE SET
         numero_de_socio=EXCLUDED.numero_de_socio, nombre=EXCLUDED.nombre, sexo=EXCLUDED.sexo,
         residencia=EXCLUDED.residencia, nro_familia=EXCLUDED.nro_familia, nro_fam_a_fall=EXCLUDED.nro_fam_a_fall,
         tipo_doc=EXCLUDED.tipo_doc, documento=EXCLUDED.documento, cuil=EXCLUDED.cuil, tipo_socio=EXCLUDED.tipo_socio,
         fecha_nac=EXCLUDED.fecha_nac, edad=EXCLUDED.edad, cod_postal=EXCLUDED.cod_postal, localidad=EXCLUDED.localidad,
         domicilio=EXCLUDED.domicilio, email=EXCLUDED.email, telefono=EXCLUDED.telefono,
         asistencial=EXCLUDED.asistencial, plan_salud=EXCLUDED.plan_salud, militar=EXCLUDED.militar,
         fuerza=EXCLUDED.fuerza, grado=EXCLUDED.grado, estado=EXCLUDED.estado,
         fecha_ingreso=EXCLUDED.fecha_ingreso, fecha_baja=EXCLUDED.fecha_baja, motivo_baja=EXCLUDED.motivo_baja,
         cobra_iaf=EXCLUDED.cobra_iaf, paga_por=EXCLUDED.paga_por, depositar_en=EXCLUDED.depositar_en,
         cementerio=EXCLUDED.cementerio, fallecido=EXCLUDED.fallecido,
         apoderado1_id=EXCLUDED.apoderado1_id, apoderado2_id=EXCLUDED.apoderado2_id, updated_at=NOW()"
    )
    .bind(id).bind(numero).bind(nombre)
    .bind(&sexo).bind(body_str(body.get("residencia"))).bind(body_str(body.get("nroFamilia")))
    .bind(body_str(body.get("nroFamAFall"))).bind(body_str(body.get("tipoDoc"))).bind(body_str(body.get("documento")))
    .bind(body_str(body.get("cuil"))).bind(&tipo_socio).bind(&fecha_nac)
    .bind(body_str(body.get("edad"))).bind(body_str(body.get("codPostal"))).bind(body_str(body.get("localidad")))
    .bind(body_str(body.get("domicilio"))).bind(body_str(body.get("email"))).bind(body_str(body.get("telefono")))
    .bind(body_bool(body.get("asistencial"))).bind(body_bool(body.get("planSalud"))).bind(body_bool(body.get("militar")))
    .bind(body_str(body.get("fuerza"))).bind(body_str(body.get("grado"))).bind(&estado)
    .bind(&fecha_ingreso).bind(&fecha_baja).bind(body_str(body.get("motivoBaja")))
    .bind(body_str(body.get("cobraIAF"))).bind(body_str(body.get("pagaPor"))).bind(body_str(body.get("depositarEn")))
    .bind(body_str(body.get("cementerio"))).bind(body_bool(body.get("fallecido")))
    .bind(body_str(body.get("apoderado1").and_then(|a| a.get("id"))).or_else(|| body_str(body.get("apoderado1Id"))))
    .bind(body_str(body.get("apoderado2").and_then(|a| a.get("id"))).or_else(|| body_str(body.get("apoderado2Id"))))
    .execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn delete_member(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    sqlx::query("DELETE FROM members WHERE id = $1::uuid").bind(&id).execute(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_person(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    let row = sqlx::query("SELECT * FROM persons WHERE id = $1::uuid LIMIT 1").bind(&id)
        .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado")).map(|r| Json(row_to_json(&r)))
}

async fn upsert_person(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let nombre = body.get("nombre").and_then(|v| v.as_str()).and_then(|s| if s.trim().is_empty() { None } else { Some(s.trim()) })
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta nombre"))?;
    let id = body.get("id").and_then(|v| v.as_str()).unwrap_or("");
    sqlx::query(
        "INSERT INTO persons (id, nombre, tipo_doc, documento, domicilio, telefono)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET nombre=EXCLUDED.nombre, tipo_doc=EXCLUDED.tipo_doc,
         documento=EXCLUDED.documento, domicilio=EXCLUDED.domicilio, telefono=EXCLUDED.telefono"
    )
    .bind(id).bind(nombre)
    .bind(body_str(body.get("tipoDoc"))).bind(body_str(body.get("documento")))
    .bind(body_str(body.get("domicilio"))).bind(body_str(body.get("telefono")))
    .execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn delete_person(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    sqlx::query("DELETE FROM persons WHERE id = $1::uuid").bind(&id).execute(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_person_members(
    State(db): State<AppState>,
    Query(q): Query<PersonIdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let person_id = q.person_id.or(q.personId).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta personId"))?;
    let rows = sqlx::query(
        "SELECT m.* FROM members m WHERE m.apoderado1_id = $1::uuid OR m.apoderado2_id = $1::uuid ORDER BY m.numero_de_socio"
    ).bind(&person_id).fetch_all(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let members: Vec<Value> = rows.iter().map(|r| {
        let full = row_to_member_json(r);
        json!({
            "id": full.get("id"),
            "numeroDeSocio": full.get("numeroDeSocio"),
            "nombre": full.get("nombre"),
        })
    }).collect();
    Ok(Json(Value::Array(members)))
}

async fn create_payment(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let date = body.get("date").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta date"))?;
    let amount = body.get("amount").and_then(|v| v.as_f64())
        .map(|f| rust_decimal::Decimal::try_from(f).unwrap_or_default())
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta amount"))?;
    let row = sqlx::query(
        "INSERT INTO petty_cash (id, date, detail, amount, type, mode, concept)
         VALUES (gen_random_uuid(), $1::date, $2, $3, $4, $5, $6) RETURNING id"
    )
    .bind(date).bind(body_str(body.get("detail"))).bind(amount)
    .bind(body_str(body.get("type")).unwrap_or_else(|| "ingreso".to_string()))
    .bind(body_str(body.get("mode"))).bind(body_str(body.get("concept")))
    .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let id = row.try_get::<uuid::Uuid, _>("id").ok().map(|v| v.to_string());
    Ok(Json(json!({ "success": true, "id": id })))
}

async fn get_cementerios(
    State(db): State<AppState>,
    Query(q): Query<CementeriosQuery>,
) -> Result<Json<Value>, ErrResponse> {
    if q.owners.as_deref() == Some("true") {
        let rows = sqlx::query("SELECT DISTINCT socio_id, persona_id FROM cementerios WHERE socio_id IS NOT NULL OR persona_id IS NOT NULL")
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        let mut member_ids: Vec<String> = Vec::new();
        let mut person_ids: Vec<String> = Vec::new();
        for r in &rows {
            if let Ok(Some(mid)) = r.try_get::<Option<uuid::Uuid>, _>("socio_id") {
                let s = mid.to_string();
                if !member_ids.contains(&s) { member_ids.push(s); }
            }
            if let Ok(Some(pid)) = r.try_get::<Option<uuid::Uuid>, _>("persona_id") {
                let s = pid.to_string();
                if !person_ids.contains(&s) { person_ids.push(s); }
            }
        }
        return Ok(Json(json!({ "memberIds": member_ids, "personIds": person_ids })));
    }
    if let Some(owner_id) = q.owner_id.or(q.ownerId) {
        let is_socio = q.is_socio.as_deref() == Some("true") || q.isSocio.as_deref() == Some("true");
        let rows = if is_socio {
            sqlx::query("SELECT * FROM cementerios WHERE socio_id = $1::uuid ORDER BY nicho").bind(&owner_id)
                .fetch_all(&db.pool).await
        } else {
            sqlx::query("SELECT * FROM cementerios WHERE persona_id = $1::uuid ORDER BY nicho").bind(&owner_id)
                .fetch_all(&db.pool).await
        };
        let rows = rows.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(nicho) = q.nicho {
        let rows = sqlx::query("SELECT * FROM cementerios WHERE nicho = $1 ORDER BY nicho").bind(&nicho)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    let rows = sqlx::query("SELECT * FROM cementerios ORDER BY nicho")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn update_cementerio(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    if let Some(obj) = body.as_object() {
        let mut sets = Vec::new();
        let mut non_null_values: Vec<(&String, &Value)> = Vec::new();
        for (k, v) in obj {
            match v {
                Value::Null => {
                    sets.push(format!("\"{}\" = NULL", k));
                }
                _ => {
                    sets.push(format!("\"{}\" = ${}", k, non_null_values.len() + 1));
                    non_null_values.push((k, v));
                }
            }
        }
        if !sets.is_empty() {
            let q_str = format!("UPDATE cementerios SET {}, updated_at = NOW() WHERE id = ${}::uuid", sets.join(", "), non_null_values.len() + 1);
            let mut query = sqlx::query(&q_str);
            for (_k, v) in &non_null_values {
                query = bind_json(query, v);
            }
            query = query.bind(&id);
            query.execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        }
    }
    Ok(Json(json!({ "success": true })))
}

async fn get_dues(
    State(db): State<AppState>,
    Query(q): Query<DuesQuery>,
) -> Result<Json<Value>, ErrResponse> {
    if let Some(member_id) = q.member_id.or(q.memberId) {
        if member_id.is_empty() { return Ok(Json(json!([]))); }
        if q.check.as_deref() == Some("cementerio") {
            let count_row = sqlx::query("SELECT COUNT(*)::int AS count FROM cementerios WHERE socio_id = $1::uuid")
                .bind(&member_id).fetch_optional(&db.pool).await.ok().flatten();
            let has_cementerio = count_row.and_then(|r| r.try_get::<i32, _>("count").ok()).unwrap_or(0) > 0;

            let rows = sqlx::query(
                "SELECT d.id, d.type, d.payment_date::text, d.period, d.member_id,
                 m.nombre AS member_nombre, m.numero_de_socio AS member_numero_de_socio,
                 d.person_id, p.nombre AS person_nombre, d.movement_id,
                 pc.amount AS amount, d.family_group, d.paid_members, d.created_at::text
                 FROM dues d
                 LEFT JOIN members m ON d.member_id = m.id
                 LEFT JOIN persons p ON d.person_id = p.id
                 LEFT JOIN petty_cash pc ON d.movement_id = pc.id
                 WHERE d.member_id = $1::uuid OR d.paid_members::jsonb ? $1
                 ORDER BY d.payment_date DESC, d.created_at DESC"
            ).bind(&member_id).fetch_all(&db.pool).await
             .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
            let dues: Vec<Value> = rows.iter().map(|r| row_to_json(r)).collect();
            return Ok(Json(json!({ "hasCementerio": has_cementerio, "dues": dues })));
        }
        let rows = sqlx::query(
            "SELECT d.id, d.type, d.payment_date::text, d.period, d.member_id,
             m.nombre AS member_nombre, m.numero_de_socio AS member_numero_de_socio,
             d.person_id, p.nombre AS person_nombre, d.movement_id,
             pc.amount AS amount, d.family_group, d.paid_members, d.created_at::text
             FROM dues d
             LEFT JOIN members m ON d.member_id = m.id
             LEFT JOIN persons p ON d.person_id = p.id
             LEFT JOIN petty_cash pc ON d.movement_id = pc.id
             WHERE d.member_id = $1::uuid OR d.paid_members::jsonb ? $1
             ORDER BY d.payment_date DESC, d.created_at DESC"
        ).bind(&member_id).fetch_all(&db.pool).await
         .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(person_id) = q.person_id.or(q.personId) {
        let rows = sqlx::query(
            "SELECT d.id, d.type, d.payment_date::text, d.period, d.member_id,
             m.nombre AS member_nombre, m.numero_de_socio AS member_numero_de_socio,
             d.person_id, p.nombre AS person_nombre, d.movement_id,
             pc.amount AS amount, d.family_group, d.paid_members, d.created_at::text
             FROM dues d
             LEFT JOIN members m ON d.member_id = m.id
             LEFT JOIN persons p ON d.person_id = p.id
             LEFT JOIN petty_cash pc ON d.movement_id = pc.id
             WHERE d.person_id = $1::uuid
             ORDER BY d.payment_date DESC, d.created_at DESC"
        ).bind(&person_id).fetch_all(&db.pool).await
         .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    let rows = sqlx::query(
        "SELECT d.id, d.type, d.payment_date::text, d.period, d.member_id,
         m.nombre AS member_nombre, m.numero_de_socio AS member_numero_de_socio,
         d.person_id, p.nombre AS person_nombre, d.movement_id,
         pc.amount AS amount, d.family_group, d.paid_members, d.created_at::text
         FROM dues d
         LEFT JOIN members m ON d.member_id = m.id
         LEFT JOIN persons p ON d.person_id = p.id
         LEFT JOIN petty_cash pc ON d.movement_id = pc.id
         ORDER BY d.payment_date DESC, d.created_at DESC"
    ).fetch_all(&db.pool).await
     .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn insert_due(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let due_type = body.get("type").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta type"))?;
    let payment_date = body.get("payment_date").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta payment_date"))?;
    let period_str: Option<String> = body.get("period")
        .and_then(|v| v.as_array())
        .filter(|a| !a.is_empty())
        .map(|a| serde_json::to_string(a).unwrap_or_else(|_| "[]".to_string()));
    let paid_members_str: Option<String> = body.get("paid_members")
        .and_then(|v| v.as_array())
        .filter(|a| !a.is_empty())
        .map(|a| serde_json::to_string(a).unwrap_or_else(|_| "[]".to_string()));
    let row = sqlx::query(
        "INSERT INTO dues (id, type, payment_date, period, member_id, person_id, movement_id, family_group, paid_members)
         VALUES (gen_random_uuid(), $1, $2::date, $3::jsonb, $4::uuid, $5::uuid, $6::uuid, $7, $8::jsonb) RETURNING id"
    )
    .bind(due_type).bind(payment_date)
    .bind(period_str).bind(body_str(body.get("member_id"))).bind(body_str(body.get("person_id")))
    .bind(body_str(body.get("movement_id"))).bind(body_str(body.get("family_group")))
    .bind(paid_members_str)
    .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let id = row.try_get::<uuid::Uuid, _>("id").ok().map(|v| v.to_string());
    Ok(Json(json!({ "success": true, "id": id })))
}

async fn get_dues_config(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let row = sqlx::query("SELECT * FROM pricing LIMIT 1")
        .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(row.map(|r| row_to_json(&r)).unwrap_or(Value::Null)))
}
async fn upsert_dues_config(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let member_fee = body.get("member_fee").and_then(|v| v.as_f64())
        .map(|f| rust_decimal::Decimal::try_from(f).unwrap_or_default())
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta member_fee"))?;
    sqlx::query(
        "INSERT INTO pricing (member_fee, consideration_years, nicho_member_fee, nicho_non_member_fee,
         urna_member_fee, urna_non_member_fee, bolsa_member_fee, bolsa_non_member_fee, asistencial_fee,
         plan_salud_fee, fee_act, fee_act_a, fee_adh, fee_part, fee_vit)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)"
    )
    .bind(member_fee)
    .bind(body_f64(&body, "consideration_years"))
    .bind(body_f64(&body, "nicho_member_fee")).bind(body_f64(&body, "nicho_non_member_fee"))
    .bind(body_f64(&body, "urna_member_fee")).bind(body_f64(&body, "urna_non_member_fee"))
    .bind(body_f64(&body, "bolsa_member_fee")).bind(body_f64(&body, "bolsa_non_member_fee"))
    .bind(body_f64(&body, "asistencial_fee")).bind(body_f64(&body, "plan_salud_fee"))
    .bind(body_f64(&body, "fee_act")).bind(body_f64(&body, "fee_act_a"))
    .bind(body_f64(&body, "fee_adh")).bind(body_f64(&body, "fee_part")).bind(body_f64(&body, "fee_vit"))
    .execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_pricing_history(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query("SELECT * FROM pricing ORDER BY updated_at DESC")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn get_services(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query("SELECT * FROM services ORDER BY name")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn insert_service(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let name = body.get("name").and_then(|v| v.as_str()).and_then(|s| if s.trim().is_empty() { None } else { Some(s.trim()) })
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta name"))?;
    let row = sqlx::query("INSERT INTO services (id, name, amount) VALUES (gen_random_uuid(), $1, $2) RETURNING *")
        .bind(name).bind(body_f64(&body, "amount"))
        .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(row_to_json(&row)))
}

async fn update_service(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let id = body.get("id").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    let name = body.get("name").and_then(|v| v.as_str()).and_then(|s| if s.trim().is_empty() { None } else { Some(s.trim()) })
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta name"))?;
    let row = sqlx::query("UPDATE services SET name=$1, amount=$2 WHERE id=$3::uuid RETURNING *")
        .bind(name).bind(body_f64(&body, "amount")).bind(id)
        .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado")).map(|r| Json(row_to_json(&r)))
}

async fn delete_service(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    sqlx::query("DELETE FROM services WHERE id = $1::uuid").bind(&id).execute(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_service_records(
    State(db): State<AppState>,
    Query(q): Query<ServiceRecordQuery>,
) -> Result<Json<Value>, ErrResponse> {
    if let Some(id) = q.id {
        let row = sqlx::query("SELECT * FROM service_records WHERE id = $1::uuid").bind(&id)
            .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado")).map(|r| Json(row_to_json(&r)));
    }
    if let Some(member_id) = q.member_id.or(q.memberId) {
        let rows = sqlx::query("SELECT * FROM service_records WHERE member_id = $1::uuid ORDER BY date").bind(&member_id)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(person_id) = q.person_id.or(q.personId) {
        let rows = sqlx::query("SELECT * FROM service_records WHERE person_id = $1::uuid ORDER BY date").bind(&person_id)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(movement_id) = q.movement_id.or(q.movementId) {
        let rows = sqlx::query("SELECT * FROM service_records WHERE movement_id = $1::uuid ORDER BY date").bind(&movement_id)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    let rows = sqlx::query("SELECT * FROM service_records ORDER BY date")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn insert_service_record(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let service_id = body.get("service_id").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta service_id"))?;
    let date = body.get("date").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta date"))?;
    let member_id = body_str(body.get("member_id"));
    let person_id = body_str(body.get("person_id"));
    if member_id.is_none() && person_id.is_none() {
        return Err(err(StatusCode::BAD_REQUEST, "Se requiere member_id o person_id"));
    }
    let row = sqlx::query(
        "INSERT INTO service_records (id, service_id, member_id, person_id, movement_id, amount, date, service_date, detail)
         VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6::date, $7, $8) RETURNING *"
    )
    .bind(service_id).bind(member_id).bind(person_id)
    .bind(body_str(body.get("movement_id"))).bind(body_f64(&body, "amount"))
    .bind(date).bind(body_str(body.get("service_date"))).bind(body_str(body.get("detail")))
    .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(row_to_json(&row)))
}

async fn update_service_record(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let id = body.get("id").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    let row = sqlx::query(
        "UPDATE service_records SET service_id=$1::uuid, member_id=$2::uuid, person_id=$3::uuid, movement_id=$4::uuid,
         amount=$5, date=$6::date, service_date=$7, detail=$8 WHERE id=$9::uuid RETURNING *"
    )
    .bind(body_str(body.get("service_id"))).bind(body_str(body.get("member_id")))
    .bind(body_str(body.get("person_id"))).bind(body_str(body.get("movement_id")))
    .bind(body_f64(&body, "amount")).bind(body_str(body.get("date")))
    .bind(body_str(body.get("service_date"))).bind(body_str(body.get("detail")))
    .bind(id)
    .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado")).map(|r| Json(row_to_json(&r)))
}

async fn delete_service_record(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    sqlx::query("DELETE FROM service_records WHERE id = $1::uuid").bind(&id).execute(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_users(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query("SELECT * FROM app_users ORDER BY created_at")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn upsert_user(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let auth_user_id = body.get("auth_user_id").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta auth_user_id"))?;
    let email = body.get("email").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta email"))?;
    let row = sqlx::query(
        "INSERT INTO app_users (auth_user_id, email, name, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT (auth_user_id) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name RETURNING *"
    )
    .bind(auth_user_id).bind(email)
    .bind(body_str(body.get("name"))).bind(body_str(body.get("role")).unwrap_or_else(|| "secretario".to_string()))
    .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(row_to_json(&row)))
}

async fn update_user_role(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let auth_user_id = body.get("auth_user_id").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta auth_user_id"))?;
    let role = body.get("role").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta role"))?;
    let row = sqlx::query("UPDATE app_users SET role = $1 WHERE auth_user_id = $2 RETURNING *")
        .bind(role).bind(auth_user_id)
        .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado")).map(|r| Json(row_to_json(&r)))
}

async fn delete_user(
    State(db): State<AppState>,
    Query(q): Query<AuthUserQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let auth_user_id = q.auth_user_id.or(q.authUserId).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta auth_user_id"))?;
    sqlx::query("DELETE FROM app_users WHERE auth_user_id = $1").bind(&auth_user_id)
        .execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_cementerio_movimientos(
    State(db): State<AppState>,
    Query(q): Query<CementerioMovimientosQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let movement_id = q.movement_id.or(q.movementId);
    let nicho = q.nicho;
    let has_nicho = q.has_nicho.or(q.hasNicho);
    let pagos_map = q.pagos_map.as_deref() == Some("true") || q.pagosMap.as_deref() == Some("true");
    let member_id = q.member_id.or(q.memberId);
    let person_id = q.person_id.or(q.personId);

    if pagos_map {
        let rows = sqlx::query(
            "SELECT nicho, member_id, person_id, MAX(fecha_pago) AS ultima_fecha_pago
             FROM cementerio_movimientos
             GROUP BY nicho, member_id, person_id"
        ).fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        let result: Vec<Value> = rows.iter().map(|r| {
            json!({
                "nicho": str_col(r, "nicho"),
                "memberId": opt_uuid_col(r, "member_id"),
                "personId": opt_uuid_col(r, "person_id"),
                "ultimaFechaPago": str_col(r, "ultima_fecha_pago"),
            })
        }).collect();
        return Ok(Json(Value::Array(result)));
    }
    if let Some(n) = has_nicho {
        let row = sqlx::query("SELECT EXISTS(SELECT 1 FROM cementerio_movimientos WHERE nicho = $1)").bind(&n)
            .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        let exists = row.and_then(|r| r.try_get::<bool, _>(0).ok()).unwrap_or(false);
        return Ok(Json(json!({ "exists": exists })));
    }
    if let Some(mid) = movement_id {
        let rows = sqlx::query("SELECT * FROM cementerio_movimientos WHERE movement_id = $1::uuid").bind(&mid)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(n) = nicho {
        if member_id.is_some() || person_id.is_some() {
            let rows = sqlx::query(
                "SELECT * FROM cementerio_movimientos WHERE nicho = $1
                 AND member_id IS DISTINCT FROM $2::uuid
                 AND person_id IS DISTINCT FROM $3::uuid"
            ).bind(&n)
             .bind(member_id.as_deref())
             .bind(person_id.as_deref())
             .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
            return Ok(Json(rows_to_json(&rows)));
        }
        let rows = sqlx::query("SELECT * FROM cementerio_movimientos WHERE nicho = $1").bind(&n)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    Err(err(StatusCode::BAD_REQUEST, "Falta parámetro"))
}

async fn insert_cementerio_movimiento(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let movement_id = body.get("movement_id").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta movement_id"))?;
    let nicho = body.get("nicho").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta nicho"))?;
    let fecha_pago = body.get("fecha_pago").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta fecha_pago"))?;
    let row = sqlx::query(
        "INSERT INTO cementerio_movimientos (id, movement_id, cementerio_id, nicho, tipo, ocupante, fecha_pago, anios_pagados, importe, member_id, person_id)
         VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, $5, $6::date, $7, $8, $9::uuid, $10::uuid) RETURNING id"
    )
    .bind(movement_id).bind(body_str(body.get("cementerio_id"))).bind(nicho)
    .bind(body_str(body.get("tipo"))).bind(body_str(body.get("ocupante")))
    .bind(fecha_pago)
    .bind(body.get("anios_pagados").and_then(|v| v.as_array()).map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect::<Vec<_>>()).unwrap_or_default())
    .bind(body_f64(&body, "importe"))
    .bind(body_str(body.get("member_id"))).bind(body_str(body.get("person_id")))
    .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let id = row.try_get::<uuid::Uuid, _>("id").ok().map(|v| v.to_string());
    Ok(Json(json!({ "success": true, "id": id })))
}

async fn get_debts(
    State(db): State<AppState>,
    Query(q): Query<DebtBalanceQuery>,
) -> Result<Json<Value>, ErrResponse> {
    if let Some(member_id) = q.member_id.or(q.memberId) {
        if member_id.is_empty() { return Ok(Json(json!([]))); }
        let rows = sqlx::query(
            "SELECT d.id, d.member_id, d.person_id, d.type, d.description,
             d.amount, d.movement_id, d.date::text, d.created_at::text,
             m.nombre AS member_nombre, m.numero_de_socio AS member_numero_de_socio,
             p.nombre AS person_nombre
             FROM debts d
             LEFT JOIN members m ON d.member_id = m.id
             LEFT JOIN persons p ON d.person_id = p.id
             WHERE d.member_id = $1::uuid ORDER BY d.date DESC, d.created_at DESC"
        ).bind(&member_id)
         .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(person_id) = q.person_id.or(q.personId) {
        if person_id.is_empty() { return Ok(Json(json!([]))); }
        let rows = sqlx::query(
            "SELECT d.id, d.member_id, d.person_id, d.type, d.description,
             d.amount, d.movement_id, d.date::text, d.created_at::text,
             m.nombre AS member_nombre, m.numero_de_socio AS member_numero_de_socio,
             p.nombre AS person_nombre
             FROM debts d
             LEFT JOIN members m ON d.member_id = m.id
             LEFT JOIN persons p ON d.person_id = p.id
             WHERE d.person_id = $1::uuid ORDER BY d.date DESC, d.created_at DESC"
        ).bind(&person_id)
         .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    Err(err(StatusCode::BAD_REQUEST, "Falta memberId o personId"))
}

async fn insert_debt(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let debt_type = body.get("type").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta type"))?;
    let amount = body.get("amount").and_then(|v| v.as_f64())
        .map(|f| rust_decimal::Decimal::try_from(f).unwrap_or_default())
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta amount"))?;
    let date = body.get("date").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta date"))?;
    let member_id = body_str(body.get("member_id"));
    let person_id = body_str(body.get("person_id"));
    if member_id.is_none() && person_id.is_none() {
        return Err(err(StatusCode::BAD_REQUEST, "Se requiere member_id o person_id"));
    }
    let row = sqlx::query(
        "INSERT INTO debts (id, member_id, person_id, type, description, amount, movement_id, date)
         VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, $5, $6::uuid, $7::date) RETURNING id"
    )
    .bind(member_id).bind(person_id).bind(debt_type)
    .bind(body_str(body.get("description"))).bind(amount)
    .bind(body_str(body.get("movement_id"))).bind(date)
    .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let id = row.try_get::<uuid::Uuid, _>("id").ok().map(|v| v.to_string());
    Ok(Json(json!({ "success": true, "id": id })))
}

async fn get_debts_balance(
    State(db): State<AppState>,
    Query(q): Query<DebtBalanceQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let (column, val) = if let Some(mid) = q.member_id.or(q.memberId) {
        ("member_id", mid)
    } else if let Some(pid) = q.person_id.or(q.personId) {
        ("person_id", pid)
    } else {
        return Err(err(StatusCode::BAD_REQUEST, "Falta memberId o personId"));
    };
    if val.is_empty() { return Ok(Json(json!({ "balance": 0.0 }))); }
    let q_str = format!(
        "SELECT COALESCE(SUM(amount), 0)::float8 AS balance FROM debts WHERE {} = $1::uuid",
        column
    );
    let row = sqlx::query(&q_str).bind(&val)
        .fetch_optional(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let balance = row.and_then(|r| r.try_get::<f64, _>("balance").ok()).unwrap_or(0.0);
    Ok(Json(json!({ "balance": balance })))
}

async fn get_external_services(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query("SELECT * FROM external_services ORDER BY name")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn insert_external_service(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let name = body.get("name").and_then(|v| v.as_str()).and_then(|s| if s.trim().is_empty() { None } else { Some(s.trim()) })
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta nombre"))?;
    let row = sqlx::query(
        "INSERT INTO external_services (id, name, phone, description, frequency, start_month, active)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true) RETURNING *"
    )
    .bind(name).bind(body_str(body.get("phone"))).bind(body_str(body.get("description")))
    .bind(body_str(body.get("frequency")).unwrap_or_else(|| "mensual".to_string()))
    .bind(body.get("start_month").and_then(|v| v.as_i64()).map(|v| v as i32))
    .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(row_to_json(&row)))
}

async fn update_external_service(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let id = body.get("id").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    let name = body.get("name").and_then(|v| v.as_str()).and_then(|s| if s.trim().is_empty() { None } else { Some(s.trim()) })
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta name"))?;
    let active = body.get("active").and_then(|v| v.as_bool()).unwrap_or(true);
    let row = sqlx::query(
        "UPDATE external_services SET name=$1, phone=$2, description=$3, frequency=$4, start_month=$5, active=$6, updated_at=NOW()
         WHERE id=$7::uuid RETURNING *"
    )
    .bind(name).bind(body_str(body.get("phone"))).bind(body_str(body.get("description")))
    .bind(body_str(body.get("frequency")).unwrap_or_else(|| "mensual".to_string()))
    .bind(body.get("start_month").and_then(|v| v.as_i64()).map(|v| v as i32))
    .bind(active).bind(id)
    .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado")).map(|r| Json(row_to_json(&r)))
}

async fn delete_external_service(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    sqlx::query("DELETE FROM external_services WHERE id = $1::uuid").bind(&id).execute(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_ext_service_payments(
    State(db): State<AppState>,
    Query(q): Query<YearQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let year = q.year.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta año"))?;
    let rows = sqlx::query("SELECT * FROM external_service_payments WHERE year = $1").bind(year)
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn upsert_ext_service_payment(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let service_id = body.get("service_id").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta service_id"))?;
    let month = body.get("month").and_then(|v| v.as_i64()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta month"))? as i32;
    let year = body.get("year").and_then(|v| v.as_i64()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta year"))? as i32;
    let row = sqlx::query(
        "INSERT INTO external_service_payments (id, service_id, month, year, amount, movement_id)
         VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5::uuid)
         ON CONFLICT (service_id, month, year) DO UPDATE SET amount=EXCLUDED.amount, movement_id=EXCLUDED.movement_id RETURNING *"
    )
    .bind(service_id).bind(month).bind(year)
    .bind(body.get("amount").and_then(|v| v.as_f64()).map(|f| rust_decimal::Decimal::try_from(f).unwrap_or_default()))
    .bind(body_str(body.get("movement_id")))
    .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(row_to_json(&row)))
}

async fn delete_ext_service_payment(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let service_id = body.get("service_id").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta service_id"))?;
    let month = body.get("month").and_then(|v| v.as_i64()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta month"))? as i32;
    let year = body.get("year").and_then(|v| v.as_i64()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta year"))? as i32;
    sqlx::query("DELETE FROM external_service_payments WHERE service_id=$1::uuid AND month=$2 AND year=$3")
        .bind(service_id).bind(month).bind(year).execute(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn next_receipt_number(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let receipt_type = body.get("type").and_then(|v| v.as_str())
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta type"))?;
    let column = match receipt_type {
        "ingreso" => "comprobante_ingreso",
        "egreso" => "comprobante_egreso",
        _ => return Err(err(StatusCode::BAD_REQUEST, "Tipo inválido (ingreso o egreso)")),
    };
    let q_str = format!(
        "UPDATE initial_balances SET {column} = {column} + 1, updated_at = NOW()
         WHERE id = '00000000-0000-0000-0000-000000000001'
         RETURNING {column} - 1 AS receipt_number"
    );
    let row = sqlx::query(&q_str)
        .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let number = row.and_then(|r| r.try_get::<i32, _>("receipt_number").ok()).unwrap_or(1);
    Ok(Json(json!({ "receipt_number": number })))
}

async fn get_comprobante(
    State(db): State<AppState>,
    Query(q): Query<MovementIdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let movement_id = q.movement_id.or(q.movementId)
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta movementId"))?;
    let row = sqlx::query(
        "SELECT * FROM comprobantes WHERE movement_id = $1::uuid ORDER BY created_at DESC LIMIT 1"
    ).bind(&movement_id).fetch_optional(&db.pool).await
     .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(row.map(|r| row_to_json(&r)).unwrap_or(Value::Null)))
}

async fn insert_comprobante(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let movement_id = body.get("movement_id").and_then(|v| v.as_str())
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta movement_id"))?;
    let receipt_number = body.get("receipt_number").and_then(|v| v.as_i64())
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta receipt_number"))? as i32;
    let detail = body.get("detail").and_then(|v| v.as_str())
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta detail"))?;
    let copies = body.get("copies_to_print").and_then(|v| v.as_i64()).unwrap_or(1) as i32;
    let concept = body.get("concept").and_then(|v| v.as_str());
    let payer_name = body.get("payer_name").and_then(|v| v.as_str());
    let row = sqlx::query(
        "INSERT INTO comprobantes (movement_id, receipt_number, copies_to_print, detail, concept, payer_name)
         VALUES ($1::uuid, $2, $3, $4, $5, $6) RETURNING id"
    ).bind(movement_id).bind(receipt_number).bind(copies).bind(detail)
     .bind(concept).bind(payer_name)
     .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let id = row.try_get::<uuid::Uuid, _>("id").ok().map(|v| v.to_string());
    Ok(Json(json!({ "success": true, "id": id })))
}

async fn get_receipt_copies_config(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query(
        "SELECT rc.id, rc.type, rc.name, rc.target, rc.sort_order, rc.active,
         COALESCE(rcc.copies_to_print, 1) as copies_to_print
         FROM receipt_concepts rc
         LEFT JOIN receipt_copies_config rcc ON rcc.concept_id = rc.id
         ORDER BY rc.type, rc.sort_order"
    ).fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "concepts": rows_to_json(&rows) })))
}

async fn save_receipt_copies_config(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let concepts = body.get("concepts").and_then(|v| v.as_array())
        .ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta concepts"))?;

    let existing_rows = sqlx::query("SELECT id FROM receipt_concepts")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let existing_set: std::collections::HashSet<String> = existing_rows.iter()
        .filter_map(|r| r.try_get::<uuid::Uuid, _>("id").ok().map(|v| v.to_string()))
        .collect();
    let incoming_ids: std::collections::HashSet<String> = concepts.iter()
        .filter_map(|c| c.get("id").and_then(|v| v.as_str()).map(String::from))
        .collect();

    for id in &existing_set {
        if !incoming_ids.contains(id.as_str()) {
            sqlx::query("DELETE FROM receipt_copies_config WHERE concept_id = $1::uuid").bind(id)
                .execute(&db.pool).await.ok();
            sqlx::query("DELETE FROM receipt_concepts WHERE id = $1::uuid").bind(id)
                .execute(&db.pool).await.ok();
        }
    }

    for c in concepts {
        let id = c.get("id").and_then(|v| v.as_str());
        let name = c.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let ctype = c.get("type").and_then(|v| v.as_str()).unwrap_or("egreso");
        let target = c.get("target").and_then(|v| v.as_str()).unwrap_or("ambos");
        let sort_order = c.get("sort_order").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
        let active = c.get("active").and_then(|v| v.as_bool()).unwrap_or(true);
        let copies = c.get("copies_to_print").and_then(|v| v.as_i64()).unwrap_or(1) as i32;

        if let Some(exist_id) = id {
            if existing_set.contains(exist_id) {
                sqlx::query(
                    "UPDATE receipt_concepts SET name=$1, type=$2, target=$3, sort_order=$4, active=$5 WHERE id=$6::uuid"
                ).bind(name).bind(ctype).bind(target).bind(sort_order).bind(active).bind(exist_id)
                 .execute(&db.pool).await.ok();
                sqlx::query(
                    "INSERT INTO receipt_copies_config (concept_id, copies_to_print)
                     VALUES ($1, $2) ON CONFLICT (concept_id) DO UPDATE SET copies_to_print = EXCLUDED.copies_to_print"
                ).bind(exist_id).bind(copies).execute(&db.pool).await.ok();
                continue;
            }
        }
        let row = sqlx::query(
            "INSERT INTO receipt_concepts (type, name, target, sort_order, active)
             VALUES ($1, $2, $3, $4, $5) RETURNING id"
        ).bind(ctype).bind(name).bind(target).bind(sort_order).bind(active)
         .fetch_one(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        let new_id = row.try_get::<uuid::Uuid, _>("id").ok().map(|v| v.to_string());
        if let Some(nid) = new_id {
            sqlx::query(
                "INSERT INTO receipt_copies_config (concept_id, copies_to_print) VALUES ($1, $2)"
            ).bind(&nid).bind(copies).execute(&db.pool).await.ok();
        }
    }

    let rows = sqlx::query(
        "SELECT rc.id, rc.type, rc.name, rc.target, rc.sort_order, rc.active,
         COALESCE(rcc.copies_to_print, 1) as copies_to_print
         FROM receipt_concepts rc
         LEFT JOIN receipt_copies_config rcc ON rcc.concept_id = rc.id
         ORDER BY rc.type, rc.sort_order"
    ).fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "concepts": rows_to_json(&rows) })))
}

fn body_str(v: Option<&Value>) -> Option<String> {
    v.and_then(|v| v.as_str().map(String::from)).filter(|s| !s.is_empty())
}

fn body_bool(v: Option<&Value>) -> bool {
    v.and_then(|v| v.as_bool()).unwrap_or(false)
}

fn body_f64(body: &Value, key: &str) -> rust_decimal::Decimal {
    body.get(key).and_then(|v| v.as_f64())
        .map(|f| rust_decimal::Decimal::try_from(f).unwrap_or_default())
        .unwrap_or_default()
}

fn bind_json<'q>(
    q: sqlx::query::Query<'q, sqlx::Postgres, sqlx::postgres::PgArguments>,
    value: &Value,
) -> sqlx::query::Query<'q, sqlx::Postgres, sqlx::postgres::PgArguments> {
    match value {
        Value::Null => q.bind(Option::<String>::None),
        Value::Bool(b) => q.bind(*b),
        Value::Number(n) => {
            let s = n.to_string();
            let d: rust_decimal::Decimal = s.parse().unwrap_or_default();
            q.bind(d)
        }
        Value::String(s) => q.bind(s.clone()),
        _ => q.bind(value.to_string()),
    }
}

/// Log a SQL error with endpoint context and return an ErrResponse.
fn sql_err(endpoint: &str, operation: &str, e: sqlx::Error) -> ErrResponse {
    error!(
        endpoint = endpoint,
        operation = operation,
        error = %e,
        "SQL error"
    );
    // Never expose SQL errors to the frontend
    err(StatusCode::INTERNAL_SERVER_ERROR, "Error interno del servidor")
}

/// Log a validation/client error and return an ErrResponse.
fn client_err(status: StatusCode, msg: &str) -> ErrResponse {
    warn!(message = msg, status = status.as_u16(), "Client error");
    err(status, msg)
}

/// Tauri command: generate debug report and return the text content.
#[tauri::command]
pub fn generate_debug_report() -> Result<String, String> {
    info!("Generating debug report");
    Ok(crate::debug::generate_debug_report())
}

/// Tauri command: export diagnostics as a zip file, returns the path.
#[tauri::command]
pub fn export_diagnostics() -> Result<String, String> {
    info!("Exporting diagnostics");
    let path = crate::debug::export_diagnostics()?;
    Ok(path.display().to_string())
}

/// Receive frontend errors and log them via tracing.
async fn receive_frontend_error(
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let error_type = body.get("type").and_then(|v| v.as_str()).unwrap_or("unknown");
    let message = body.get("message").and_then(|v| v.as_str()).unwrap_or("");
    let url = body.get("url").and_then(|v| v.as_str()).unwrap_or("");
    let stack = body.get("stack").and_then(|v| v.as_str()).unwrap_or("");
    let component = body.get("component").and_then(|v| v.as_str()).unwrap_or("");
    let source = body.get("source").and_then(|v| v.as_str()).unwrap_or("");
    let line = body.get("line").and_then(|v| v.as_i64()).unwrap_or(0);
    let column = body.get("column").and_then(|v| v.as_i64()).unwrap_or(0);

    if !component.is_empty() {
        error!(
            frontend_type = error_type,
            message = message,
            url = url,
            source = source,
            line = line,
            column = column,
            stack = stack,
            component = component,
            "Frontend error (React)"
        );
    } else if !source.is_empty() {
        error!(
            frontend_type = error_type,
            message = message,
            url = url,
            source = source,
            line = line,
            column = column,
            stack = stack,
            "Frontend error"
        );
    } else {
        error!(
            frontend_type = error_type,
            message = message,
            url = url,
            stack = stack,
            "Frontend error"
        );
    }

    Ok(Json(json!({ "success": true })))
}

