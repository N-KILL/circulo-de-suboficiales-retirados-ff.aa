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
        .route("/api/cementerios", get(get_cementerios).patch(update_cementerio))
        .route("/api/dues", get(get_dues).post(insert_due))
        .route("/api/dues-config", get(get_dues_config).post(upsert_dues_config))
        .route("/api/services", get(get_services).post(insert_service).put(update_service).delete(delete_service))
        .route("/api/service-records", get(get_service_records).post(insert_service_record).put(update_service_record).delete(delete_service_record))
        .route("/api/users", get(get_users).post(upsert_user).patch(update_user_role).delete(delete_user))
        .route("/api/cementerio-movimientos", get(get_cementerio_movimientos).post(insert_cementerio_movimiento))
        .route("/api/debts", get(get_debts).post(insert_debt))
        .route("/api/debts/balance", get(get_debts_balance))
        .route("/api/external-services", get(get_external_services).post(insert_external_service).put(update_external_service).delete(delete_external_service))
        .route("/api/external-service-payments", get(get_ext_service_payments).post(upsert_ext_service_payment).delete(delete_ext_service_payment))
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
            "FLOAT4" | "FLOAT8" | "NUMERIC" => {
                row.try_get::<String, _>(idx)
                    .map(|s| {
                        s.parse::<f64>()
                            .map(|f| {
                                serde_json::Number::from_f64(f)
                                    .map(Value::Number)
                                    .unwrap_or(Value::String(s.clone()))
                            })
                            .unwrap_or(Value::String(s))
                    })
                    .unwrap_or(Value::Null)
            }
            "UUID" => row.try_get::<uuid::Uuid, _>(idx).map(|v| Value::String(v.to_string())).unwrap_or(Value::Null),
            "DATE" | "TIMESTAMPTZ" | "TIMESTAMP" => {
                row.try_get::<sqlx::types::JsonValue, _>(idx)
                    .or_else(|_| row.try_get::<String, _>(idx).map(|s| serde_json::Value::String(s)))
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

async fn get_members(State(db): State<AppState>) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query(
        "SELECT m.*, ap1.nombre AS apoderado1_nombre, ap1.tipo_doc AS apoderado1_tipo_doc,
         ap1.documento AS apoderado1_documento, ap1.domicilio AS apoderado1_domicilio, ap1.telefono AS apoderado1_telefono,
         ap2.nombre AS apoderado2_nombre, ap2.tipo_doc AS apoderado2_tipo_doc,
         ap2.documento AS apoderado2_documento, ap2.domicilio AS apoderado2_domicilio, ap2.telefono AS apoderado2_telefono
         FROM members m LEFT JOIN persons ap1 ON m.apoderado1_id = ap1.id
         LEFT JOIN persons ap2 ON m.apoderado2_id = ap2.id
         ORDER BY NULLIF(regexp_replace(m.numero_de_socio, '[^0-9]', '', 'g'), '')::int NULLS LAST, m.numero_de_socio"
    ).fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn get_members_family(
    State(db): State<AppState>,
    Query(q): Query<MemberIdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let member_id = q.member_id.or(q.memberId).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta memberId"))?;
    let rows = sqlx::query(
        "SELECT m.*, ap1.nombre AS apoderado1_nombre, ap1.tipo_doc AS apoderado1_tipo_doc,
         ap1.documento AS apoderado1_documento, ap1.domicilio AS apoderado1_domicilio, ap1.telefono AS apoderado1_telefono,
         ap2.nombre AS apoderado2_nombre, ap2.tipo_doc AS apoderado2_tipo_doc,
         ap2.documento AS apoderado2_documento, ap2.domicilio AS apoderado2_domicilio, ap2.telefono AS apoderado2_telefono
         FROM members m LEFT JOIN persons ap1 ON m.apoderado1_id = ap1.id
         LEFT JOIN persons ap2 ON m.apoderado2_id = ap2.id
         WHERE m.nro_familia LIKE $1 OR m.nro_familia = $2 ORDER BY m.numero_de_socio"
    ).bind(format!("%/{}", member_id))
     .bind(&member_id)
     .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn get_members_debt_status(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query(
        "SELECT m.id, m.numero_de_socio, m.nombre, m.apellido,
         du.type AS debt_type, du.payment_date AS last_payment_date
         FROM members m LEFT JOIN LATERAL (
             SELECT du.type, du.payment_date
             FROM dues du WHERE du.member_id = m.id ORDER BY du.payment_date DESC LIMIT 1
         ) du ON true ORDER BY m.numero_de_socio"
    ).fetch_all(&db.pool).await;
    match rows {
        Ok(rows) => {
            let config = sqlx::query("SELECT consideration_years FROM pricing LIMIT 1")
                .fetch_optional(&db.pool).await.ok().flatten();
            let cy = config.and_then(|r| r.try_get::<i32, _>("consideration_years").ok()).unwrap_or(0);
            Ok(Json(json!({ "members": rows_to_json(&rows), "consideration_years": cy })))
        }
        Err(_) => {
            let rows = sqlx::query(
                "SELECT m.id, m.numero_de_socio, m.nombre
                 FROM members m ORDER BY m.numero_de_socio"
            ).fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
            let config = sqlx::query("SELECT consideration_years FROM pricing LIMIT 1")
                .fetch_optional(&db.pool).await.ok().flatten();
            let cy = config.and_then(|r| r.try_get::<i32, _>("consideration_years").ok()).unwrap_or(0);
            let members: Vec<Value> = rows.iter().map(|r| {
                json!({
                    "id": r.try_get::<uuid::Uuid, _>("id").ok().map(|v| v.to_string()),
                    "numeroDeSocio": r.try_get::<String, _>("numero_de_socio").ok(),
                    "nombre": r.try_get::<String, _>("nombre").ok(),
                    "debt_amount": 0,
                    "last_payment_date": null
                })
            }).collect();
            Ok(Json(json!({ "members": members, "consideration_years": cy })))
        }
    }
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
    let row = sqlx::query("SELECT * FROM petty_cash WHERE id = $1").bind(&id)
        .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let movement = row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado"))?;
    let due = sqlx::query("SELECT * FROM dues WHERE movement_id = $1").bind(&id)
        .fetch_optional(&db.pool).await.ok().flatten().map(|r| row_to_json(&r));
    let sr = sqlx::query("SELECT * FROM service_records WHERE movement_id = $1").bind(&id)
        .fetch_all(&db.pool).await.ok().map(|r| rows_to_json(&r)).unwrap_or(json!([]));
    let cm = sqlx::query("SELECT * FROM cementerio_movimientos WHERE movement_id = $1").bind(&id)
        .fetch_all(&db.pool).await.ok().map(|r| rows_to_json(&r)).unwrap_or(json!([]));
    let mut result = row_to_json(&movement);
    if let Some(obj) = result.as_object_mut() {
        obj.insert("linked_due".into(), due.unwrap_or(Value::Null));
        obj.insert("linked_service_records".into(), sr);
        obj.insert("linked_cementerio_movimientos".into(), cm);
    }
    Ok(Json(result))
}

async fn update_movement(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    if let Some(movement_data) = body.get("movement_data").or(body.as_object().map(|_| &body)) {
        if let Some(obj) = movement_data.as_object() {
            let mut sets = Vec::new();
            let mut idx = 1;
            for (k, _v) in obj {
                if k == "due" || k == "id" { continue; }
                sets.push(format!("\"{}\" = ${}", k, idx));
                idx += 1;
            }
            if !sets.is_empty() {
                let q_str = format!("UPDATE petty_cash SET {} WHERE id = ${}", sets.join(", "), idx);
                sqlx::query(&q_str).execute(&db.pool).await.ok();
            }
        }
    }
    if let Some(due_data) = body.get("due") {
        if let Some(obj) = due_data.as_object() {
            let mut sets = Vec::new();
            let mut idx = 1;
            for (k, _v) in obj {
                sets.push(format!("\"{}\" = ${}", k, idx));
                idx += 1;
            }
            if !sets.is_empty() {
                let q_str = format!("UPDATE dues SET {} WHERE movement_id = ${}", sets.join(", "), idx);
                sqlx::query(&q_str).bind(&id).execute(&db.pool).await.ok();
            }
        }
    }
    Ok(Json(json!({ "success": true })))
}

async fn delete_movement(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    sqlx::query("UPDATE debts SET movement_id = NULL WHERE movement_id = $1").bind(&id).execute(&db.pool).await.ok();
    sqlx::query("DELETE FROM dues WHERE movement_id = $1").bind(&id).execute(&db.pool).await.ok();
    sqlx::query("DELETE FROM service_records WHERE movement_id = $1").bind(&id).execute(&db.pool).await.ok();
    sqlx::query("DELETE FROM cementerio_movimientos WHERE movement_id = $1").bind(&id).execute(&db.pool).await.ok();
    sqlx::query("UPDATE external_service_payments SET movement_id = NULL WHERE movement_id = $1").bind(&id).execute(&db.pool).await.ok();
    sqlx::query("DELETE FROM petty_cash WHERE id = $1").bind(&id).execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_movements(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query("SELECT * FROM petty_cash ORDER BY date DESC")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn get_initial_balances(
    State(db): State<AppState>,
) -> Result<Json<Value>, ErrResponse> {
    let rows = sqlx::query("SELECT * FROM initial_balances")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn upsert_initial_balances(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let caja = body.get("caja_chica").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let banco = body.get("banco").and_then(|v| v.as_f64()).unwrap_or(0.0);
    sqlx::query(
        "INSERT INTO initial_balances (id, caja_chica, banco) VALUES ('caja_chica', $1, 'banco'), ('banco', $2, 'banco')
         ON CONFLICT (id) DO UPDATE SET caja_chica = EXCLUDED.caja_chica, banco = EXCLUDED.banco"
    ).bind(caja).bind(banco).execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_member(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    let row = sqlx::query(
        "SELECT m.*, ap1.nombre AS apoderado1_nombre, ap1.tipo_doc AS apoderado1_tipo_doc,
         ap1.documento AS apoderado1_documento, ap1.domicilio AS apoderado1_domicilio, ap1.telefono AS apoderado1_telefono,
         ap2.nombre AS apoderado2_nombre, ap2.tipo_doc AS apoderado2_tipo_doc,
         ap2.documento AS apoderado2_documento, ap2.domicilio AS apoderado2_domicilio, ap2.telefono AS apoderado2_telefono
         FROM members m LEFT JOIN persons ap1 ON m.apoderado1_id = ap1.id
         LEFT JOIN persons ap2 ON m.apoderado2_id = ap2.id WHERE m.id = $1 LIMIT 1"
    ).bind(&id).fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado")).map(|r| Json(row_to_json(&r)))
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
    .bind(body_str(body.get("sexo"))).bind(body_str(body.get("residencia"))).bind(body_str(body.get("nroFamilia")))
    .bind(body_str(body.get("nroFamAFall"))).bind(body_str(body.get("tipoDoc"))).bind(body_str(body.get("documento")))
    .bind(body_str(body.get("cuil"))).bind(body_str(body.get("tipoSocio"))).bind(body_str(body.get("fechaNac")))
    .bind(body_str(body.get("edad"))).bind(body_str(body.get("codPostal"))).bind(body_str(body.get("localidad")))
    .bind(body_str(body.get("domicilio"))).bind(body_str(body.get("email"))).bind(body_str(body.get("telefono")))
    .bind(body_bool(body.get("asistencial"))).bind(body_bool(body.get("planSalud"))).bind(body_bool(body.get("militar")))
    .bind(body_str(body.get("fuerza"))).bind(body_str(body.get("grado"))).bind(body_str(body.get("estado")))
    .bind(body_str(body.get("fechaIngreso"))).bind(body_str(body.get("fechaBaja"))).bind(body_str(body.get("motivoBaja")))
    .bind(body_str(body.get("cobraIaf"))).bind(body_str(body.get("pagaPor"))).bind(body_str(body.get("depositarEn")))
    .bind(body_str(body.get("cementerio"))).bind(body_bool(body.get("fallecido")))
    .bind(body_str(body.get("apoderado1Id"))).bind(body_str(body.get("apoderado2Id")))
    .execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn delete_member(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    sqlx::query("DELETE FROM members WHERE id = $1").bind(&id).execute(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_person(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    let row = sqlx::query("SELECT * FROM persons WHERE id = $1 LIMIT 1").bind(&id)
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
    sqlx::query("DELETE FROM persons WHERE id = $1").bind(&id).execute(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_person_members(
    State(db): State<AppState>,
    Query(q): Query<PersonIdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let person_id = q.person_id.or(q.personId).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta personId"))?;
    let rows = sqlx::query(
        "SELECT m.* FROM members m WHERE m.apoderado1_id = $1 OR m.apoderado2_id = $1 ORDER BY m.numero_de_socio"
    ).bind(&person_id).fetch_all(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn create_payment(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let date = body.get("date").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta date"))?;
    let amount = body.get("amount").and_then(|v| v.as_f64()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta amount"))?;
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
        let rows = sqlx::query("SELECT DISTINCT socio_id as owner_id FROM cementerios WHERE socio_id IS NOT NULL")
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        let ids: Vec<String> = rows.iter().filter_map(|r| r.try_get::<uuid::Uuid, _>("owner_id").ok().map(|v| v.to_string())).collect();
        return Ok(Json(json!(ids)));
    }
    if let Some(owner_id) = q.owner_id.or(q.ownerId) {
        let is_socio = q.is_socio.as_deref() == Some("true") || q.isSocio.as_deref() == Some("true");
        let rows = if is_socio {
            sqlx::query("SELECT * FROM cementerios WHERE socio_id = $1 ORDER BY nicho").bind(&owner_id)
                .fetch_all(&db.pool).await
        } else {
            sqlx::query("SELECT * FROM cementerios WHERE socio_id = $1 AND es_socio = false ORDER BY nicho").bind(&owner_id)
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
        let mut idx = 1;
        let mut binds: Vec<String> = Vec::new();
        for (k, _v) in obj {
                sets.push(format!("\"{}\" = ${}", k, idx));
                binds.push(_v.as_str().unwrap_or(&_v.to_string()).to_string());
            idx += 1;
        }
        if !sets.is_empty() {
            let q_str = format!("UPDATE cementerios SET {} WHERE id = ${}", sets.join(", "), idx);
            sqlx::query(&q_str).bind(&id).execute(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        }
    }
    Ok(Json(json!({ "success": true })))
}

async fn get_dues(
    State(db): State<AppState>,
    Query(q): Query<DuesQuery>,
) -> Result<Json<Value>, ErrResponse> {
    if let Some(member_id) = q.member_id.or(q.memberId) {
        if q.check.as_deref() == Some("cementerio") {
            let rows = sqlx::query(
                "SELECT d.*, c.nicho FROM dues d
                 LEFT JOIN cementerio_movimientos c ON c.member_id = d.member_id
                 WHERE d.member_id = $1 ORDER BY d.payment_date"
            ).bind(&member_id).fetch_all(&db.pool).await
                .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
            return Ok(Json(rows_to_json(&rows)));
        }
        let rows = sqlx::query("SELECT * FROM dues WHERE member_id = $1 ORDER BY payment_date")
            .bind(&member_id).fetch_all(&db.pool).await
            .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(person_id) = q.person_id.or(q.personId) {
        let rows = sqlx::query("SELECT * FROM dues WHERE person_id = $1 ORDER BY payment_date")
            .bind(&person_id).fetch_all(&db.pool).await
            .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    let rows = sqlx::query("SELECT * FROM dues ORDER BY payment_date")
        .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(rows_to_json(&rows)))
}

async fn insert_due(
    State(db): State<AppState>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ErrResponse> {
    let due_type = body.get("type").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta type"))?;
    let payment_date = body.get("payment_date").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta payment_date"))?;
    let row = sqlx::query(
        "INSERT INTO dues (id, type, payment_date, period, member_id, person_id, movement_id, family_group, paid_members)
         VALUES (gen_random_uuid(), $1, $2::date, $3::jsonb, $4, $5, $6, $7, $8::jsonb) RETURNING id"
    )
    .bind(due_type).bind(payment_date)
    .bind(body.get("period").unwrap_or(&json!([])))
    .bind(body_str(body.get("member_id"))).bind(body_str(body.get("person_id")))
    .bind(body_str(body.get("movement_id"))).bind(body_str(body.get("family_group")))
    .bind(body.get("paid_members").unwrap_or(&Value::Null))
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
    let member_fee = body.get("member_fee").and_then(|v| v.as_f64()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta member_fee"))?;
    sqlx::query(
        "INSERT INTO pricing (id, member_fee, consideration_years, nicho_member_fee, nicho_non_member_fee,
         urna_member_fee, urna_non_member_fee, bolsa_member_fee, bolsa_non_member_fee, asistencial_fee,
         plan_salud_fee, fee_act, fee_act_a, fee_adh, fee_part, fee_vit)
         VALUES ('00000000-0000-0000-0000-000000000002', $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO UPDATE SET member_fee=EXCLUDED.member_fee, consideration_years=EXCLUDED.consideration_years,
         nicho_member_fee=EXCLUDED.nicho_member_fee, nicho_non_member_fee=EXCLUDED.nicho_non_member_fee,
         urna_member_fee=EXCLUDED.urna_member_fee, urna_non_member_fee=EXCLUDED.urna_non_member_fee,
         bolsa_member_fee=EXCLUDED.bolsa_member_fee, bolsa_non_member_fee=EXCLUDED.bolsa_non_member_fee,
         asistencial_fee=EXCLUDED.asistencial_fee, plan_salud_fee=EXCLUDED.plan_salud_fee,
         fee_act=EXCLUDED.fee_act, fee_act_a=EXCLUDED.fee_act_a, fee_adh=EXCLUDED.fee_adh,
         fee_part=EXCLUDED.fee_part, fee_vit=EXCLUDED.fee_vit"
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
    let row = sqlx::query("UPDATE services SET name=$1, amount=$2 WHERE id=$3 RETURNING *")
        .bind(name).bind(body_f64(&body, "amount")).bind(id)
        .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado")).map(|r| Json(row_to_json(&r)))
}

async fn delete_service(
    State(db): State<AppState>,
    Query(q): Query<IdQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let id = q.id.ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta id"))?;
    sqlx::query("DELETE FROM services WHERE id = $1").bind(&id).execute(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

async fn get_service_records(
    State(db): State<AppState>,
    Query(q): Query<ServiceRecordQuery>,
) -> Result<Json<Value>, ErrResponse> {
    if let Some(id) = q.id {
        let row = sqlx::query("SELECT * FROM service_records WHERE id = $1").bind(&id)
            .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return row.ok_or_else(|| err(StatusCode::NOT_FOUND, "No encontrado")).map(|r| Json(row_to_json(&r)));
    }
    if let Some(member_id) = q.member_id.or(q.memberId) {
        let rows = sqlx::query("SELECT * FROM service_records WHERE member_id = $1 ORDER BY date").bind(&member_id)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(person_id) = q.person_id.or(q.personId) {
        let rows = sqlx::query("SELECT * FROM service_records WHERE person_id = $1 ORDER BY date").bind(&person_id)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(movement_id) = q.movement_id.or(q.movementId) {
        let rows = sqlx::query("SELECT * FROM service_records WHERE movement_id = $1 ORDER BY date").bind(&movement_id)
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
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::date, $7, $8) RETURNING *"
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
        "UPDATE service_records SET service_id=$1, member_id=$2, person_id=$3, movement_id=$4,
         amount=$5, date=$6::date, service_date=$7, detail=$8 WHERE id=$9 RETURNING *"
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
    sqlx::query("DELETE FROM service_records WHERE id = $1").bind(&id).execute(&db.pool).await
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
    Query(q): Query<PagosMapQuery>,
    Query(mid): Query<MovementIdQuery>,
    Query(nq): Query<NichoQuery>,
) -> Result<Json<Value>, ErrResponse> {
    let movement_id = mid.movement_id.or(mid.movementId);
    let nicho = nq.nicho;
    let has_nicho = nq.has_nicho.or(nq.hasNicho);
    let pagos_map = q.pagos_map.as_deref() == Some("true") || q.pagosMap.as_deref() == Some("true");

    if pagos_map {
        let rows = sqlx::query("SELECT movement_id, nicho, fecha_pago FROM cementerio_movimientos ORDER BY fecha_pago")
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        let mut map: serde_json::Map<String, Value> = serde_json::Map::new();
        for r in &rows {
            let mid = r.try_get::<uuid::Uuid, _>("movement_id").ok().map(|v| v.to_string()).unwrap_or_default();
            let n = r.try_get::<String, _>("nicho").unwrap_or_default();
            let fp = r.try_get::<String, _>("fecha_pago").unwrap_or_default();
            map.entry(mid.clone()).or_insert_with(|| json!({}));
            if let Some(obj) = map.get_mut(&mid).and_then(|v| v.as_object_mut()) {
                obj.insert(n, Value::String(fp));
            }
        }
        return Ok(Json(Value::Object(map)));
    }
    if let Some(n) = has_nicho {
        let row = sqlx::query("SELECT EXISTS(SELECT 1 FROM cementerio_movimientos WHERE nicho = $1)").bind(&n)
            .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        let exists = row.and_then(|r| r.try_get::<bool, _>(0).ok()).unwrap_or(false);
        return Ok(Json(json!({ "exists": exists })));
    }
    if let Some(mid) = movement_id {
        let rows = sqlx::query("SELECT * FROM cementerio_movimientos WHERE movement_id = $1").bind(&mid)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(n) = nicho {
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
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::date, $7, $8, $9, $10) RETURNING id"
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
        let rows = sqlx::query("SELECT * FROM debts WHERE member_id = $1 ORDER BY date").bind(&member_id)
            .fetch_all(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        return Ok(Json(rows_to_json(&rows)));
    }
    if let Some(person_id) = q.person_id.or(q.personId) {
        let rows = sqlx::query("SELECT * FROM debts WHERE person_id = $1 ORDER BY date").bind(&person_id)
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
    let amount = body.get("amount").and_then(|v| v.as_f64()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta amount"))?;
    let date = body.get("date").and_then(|v| v.as_str()).ok_or_else(|| err(StatusCode::BAD_REQUEST, "Falta date"))?;
    let member_id = body_str(body.get("member_id"));
    let person_id = body_str(body.get("person_id"));
    if member_id.is_none() && person_id.is_none() {
        return Err(err(StatusCode::BAD_REQUEST, "Se requiere member_id o person_id"));
    }
    let row = sqlx::query(
        "INSERT INTO debts (id, member_id, person_id, type, description, amount, movement_id, date)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7::date) RETURNING id"
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
    let q_str = format!(
        "SELECT COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE -amount END), 0) AS balance FROM debts WHERE {} = $1",
        column
    );
    let row = sqlx::query(&q_str).bind(&val)
        .fetch_optional(&db.pool).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
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
         WHERE id=$7 RETURNING *"
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
    sqlx::query("DELETE FROM external_services WHERE id = $1").bind(&id).execute(&db.pool).await
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
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
         ON CONFLICT (service_id, month, year) DO UPDATE SET amount=EXCLUDED.amount, movement_id=EXCLUDED.movement_id RETURNING *"
    )
    .bind(service_id).bind(month).bind(year)
    .bind(body.get("amount").and_then(|v| v.as_f64()))
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
    sqlx::query("DELETE FROM external_service_payments WHERE service_id=$1 AND month=$2 AND year=$3")
        .bind(service_id).bind(month).bind(year).execute(&db.pool).await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

fn body_str(v: Option<&Value>) -> Option<String> {
    v.and_then(|v| v.as_str().map(String::from)).filter(|s| !s.is_empty())
}

fn body_bool(v: Option<&Value>) -> bool {
    v.and_then(|v| v.as_bool()).unwrap_or(false)
}

fn body_f64(body: &Value, key: &str) -> f64 {
    body.get(key).and_then(|v| v.as_f64()).unwrap_or(0.0)
}
