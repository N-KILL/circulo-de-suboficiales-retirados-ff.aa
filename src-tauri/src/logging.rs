use std::fs;
use std::path::PathBuf;
use tracing_subscriber::fmt::time::ChronoLocal;
use tracing_subscriber::EnvFilter;

/// Returns the path to the logs directory (next to the executable).
pub fn logs_dir() -> PathBuf {
    let base = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."));
    base.join("logs")
}

/// Initialize tracing: console in debug, file in release, file always.
pub fn init_logging() {
    let log_dir = logs_dir();
    fs::create_dir_all(&log_dir).ok();

    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        if cfg!(debug_assertions) {
            EnvFilter::new("info,circulo_de_suboficiales_lib=debug,tower_http=debug,sqlx=warn")
        } else {
            EnvFilter::new("info,circulo_de_suboficiales_lib=info,tower_http=info,sqlx=warn")
        }
    });

    let time_fmt = ChronoLocal::new("%Y-%m-%d %H:%M:%S".to_string());

    if cfg!(debug_assertions) {
        // Debug: console (colored)
        tracing_subscriber::fmt()
            .with_env_filter(env_filter)
            .with_target(true)
            .with_file(true)
            .with_line_number(true)
            .with_ansi(true)
            .with_writer(std::io::stdout)
            .with_timer(time_fmt)
            .init();

        tracing::info!(
            version = env!("CARGO_PKG_VERSION"),
            log_dir = %log_dir.display(),
            "Logging initialized (debug mode)"
        );
    } else {
        // Release: file only
        let file_appender = tracing_appender::rolling::daily(&log_dir, "app.log");
        let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
        Box::leak(Box::new(_guard));

        tracing_subscriber::fmt()
            .with_env_filter(env_filter)
            .with_target(true)
            .with_file(true)
            .with_line_number(true)
            .with_ansi(false)
            .with_writer(non_blocking)
            .with_timer(time_fmt)
            .init();

        tracing::info!(
            version = env!("CARGO_PKG_VERSION"),
            log_dir = %log_dir.display(),
            "Logging initialized (release mode)"
        );
    }
}

/// Install a global panic hook that logs panics with backtrace.
pub fn install_panic_hook() {
    let default_hook = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |panic_info| {
        let payload = panic_info.payload();
        let message = if let Some(s) = payload.downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = payload.downcast_ref::<String>() {
            s.clone()
        } else {
            "Box<dyn Any>".to_string()
        };

        let location = panic_info
            .location()
            .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
            .unwrap_or_else(|| "unknown".to_string());

        let thread = std::thread::current();
        let thread_name = thread.name().unwrap_or("unnamed");

        tracing::error!(
            message = %message,
            location = %location,
            thread = %thread_name,
            "PANIC"
        );

        let backtrace = std::backtrace::Backtrace::force_capture();
        tracing::error!(backtrace = %backtrace, "Panic backtrace");

        default_hook(panic_info);
    }));
}
