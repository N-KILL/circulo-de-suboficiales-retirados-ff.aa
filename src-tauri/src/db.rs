use sqlx::postgres::{PgPool, PgPoolOptions};
use std::path::PathBuf;
use std::time::Instant;
use tracing::{info, warn};

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
}

fn find_env_path() -> Option<PathBuf> {
    let candidates = [
        std::env::current_dir().ok().map(|p| p.join(".env")),
        std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .map(|p| p.join(".env")),
    ];
    for candidate in candidates.into_iter().flatten() {
        if candidate.exists() {
            return Some(candidate);
        }
    }
    None
}

const EMBEDDED_DATABASE_URL: &str = "postgresql://neondb_owner:npg_INaJKgd8R3Oj@ep-delicate-cell-ac71eoeo-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

pub async fn create_pool() -> Result<PgPool, String> {
    if let Some(env_path) = find_env_path() {
        info!(path = %env_path.display(), "Loading .env file");
        dotenvy::from_path(&env_path).ok();
    } else {
        dotenvy::dotenv().ok();
    }

    let mut database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| EMBEDDED_DATABASE_URL.to_string());

    if database_url.contains("channel_binding=require") {
        database_url = database_url.replace("channel_binding=require", "");
        database_url = database_url.trim_end_matches('&').to_string();
    }

    let start = Instant::now();
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Database connection failed");
            e.to_string()
        })?;

    let elapsed = start.elapsed();
    info!(
        elapsed_ms = elapsed.as_millis() as u64,
        max_connections = 5,
        "Database connected"
    );

    if elapsed.as_millis() > 500 {
        warn!(
            elapsed_ms = elapsed.as_millis() as u64,
            "Slow database connection detected (>500ms)"
        );
    }

    Ok(pool)
}
