mod api;
mod db;
mod debug;
mod logging;

use axum::body::Body;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use rust_embed::Embed;
use std::time::Duration;
use tauri::Manager;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::{error, info, warn};
use sysinfo::System;

#[derive(Embed)]
#[folder = "../dist"]
struct DistAssets;

#[allow(dead_code)]
fn wait_for_port(port: u16, timeout: Duration) -> bool {
    let start = std::time::Instant::now();
    loop {
        if std::net::TcpStream::connect(format!("127.0.0.1:{port}")).is_ok() {
            return true;
        }
        if start.elapsed() > timeout {
            return false;
        }
        std::thread::sleep(Duration::from_millis(100));
    }
}

async fn serve_index() -> impl IntoResponse {
    match DistAssets::get("index.html") {
        Some(content) => Response::builder()
            .header(header::CONTENT_TYPE, "text/html")
            .body(Body::from(content.data.to_vec()))
            .unwrap(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn serve_asset(uri: axum::http::Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');
    if path.is_empty() {
        return serve_index().await.into_response();
    }
    match DistAssets::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path)
                .first_or_octet_stream()
                .to_string();
            Response::builder()
                .header(header::CONTENT_TYPE, mime)
                .body(Body::from(content.data.to_vec()))
                .unwrap()
                .into_response()
        }
        None => {
            // SPA fallback: serve index.html for client-side routing
            if let Some(content) = DistAssets::get("index.html") {
                Response::builder()
                    .header(header::CONTENT_TYPE, "text/html")
                    .body(Body::from(content.data.to_vec()))
                    .unwrap()
                    .into_response()
            } else {
                StatusCode::NOT_FOUND.into_response()
            }
        }
    }
}

async fn start_api_server(pool: sqlx::PgPool, serve_frontend: bool) {
    let state = db::AppState { pool };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let mut app = api::api_router()
        .with_state(state)
        .layer(cors)
        .layer(
            TraceLayer::new_for_http()
                .on_request(|_req: &axum::http::Request<Body>, _span: &tracing::Span| {
                    info!(
                        method = %_req.method(),
                        uri = %_req.uri(),
                        "→ Request"
                    );
                })
                .on_response(|res: &axum::http::Response<Body>, latency: Duration, _span: &tracing::Span| {
                    let status = res.status().as_u16();
                    let latency_ms = latency.as_millis() as u64;
                    if status >= 500 {
                        error!(
                            status = status,
                            latency_ms = latency_ms,
                            "← Response (error)"
                        );
                    } else if latency_ms > 1000 {
                        warn!(
                            status = status,
                            latency_ms = latency_ms,
                            "← Response (slow)"
                        );
                    } else {
                        info!(
                            status = status,
                            latency_ms = latency_ms,
                            "← Response"
                        );
                    }
                }),
        );

    if serve_frontend {
        info!("Serving embedded frontend assets");
        app = app.fallback(serve_asset);
    }

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001")
        .await
        .expect("Failed to bind API server on port 3001");

    info!("API server running on http://localhost:3001");
    axum::serve(listener, app).await.expect("API server error");
}

fn log_startup_info() {
    let mut sys = System::new();
    sys.refresh_memory();

    let exe_path = std::env::current_exe()
        .ok()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let logs_path = logging::logs_dir()
        .display()
        .to_string();

    info!(
        version = env!("CARGO_PKG_VERSION"),
        arch = std::env::consts::ARCH,
        os = %format!("{} {}", System::name().unwrap_or_default(), System::os_version().unwrap_or_default()),
        exe_path = %exe_path,
        logs_path = %logs_path,
        total_memory_mb = (sys.total_memory() / (1024 * 1024)) as u64,
        build_mode = if cfg!(debug_assertions) { "debug" } else { "release" },
        "Application starting"
    );
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging first (before anything else)
    logging::init_logging();
    logging::install_panic_hook();

    log_startup_info();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            api::generate_debug_report,
            api::export_diagnostics,
        ])
        .setup(|app| {
            tauri::async_runtime::spawn(async move {
                match db::create_pool().await {
                    Ok(pool) => {
                        #[cfg(debug_assertions)]
                        start_api_server(pool, false).await;
                        #[cfg(not(debug_assertions))]
                        start_api_server(pool, true).await;
                    }
                    Err(e) => {
                        error!(error = %e, "Failed to create DB pool — server not started");
                    }
                }
            });

            #[cfg(not(debug_assertions))]
            {
                if wait_for_port(3001, Duration::from_secs(10)) {
                    info!("API server ready on port 3001");
                    if let Some(window) = app.get_webview_window("main") {
                        window
                            .eval("window.location.href = 'http://localhost:3001'")
                            .ok();
                    }
                } else {
                    error!("API server did not start within 10 seconds. The app will not work.");
                }
            }

            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
