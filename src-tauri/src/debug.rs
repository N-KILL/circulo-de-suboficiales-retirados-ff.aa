use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use sysinfo::{Disks, System};

use crate::logging::logs_dir;

/// System info for debug reports.
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub exe_path: String,
    pub data_path: String,
    pub logs_path: String,
    pub db_path: String,
    pub db_size: String,
    pub total_memory: String,
    pub available_memory: String,
    pub disk_free: String,
    pub rust_version: String,
    pub compile_time: String,
}

impl SystemInfo {
    pub fn collect() -> Self {
        let mut sys = System::new();
        sys.refresh_memory();

        let disks = Disks::new_with_refreshed_list();

        let exe = std::env::current_exe().ok();
        let exe_path = exe.as_ref().map(|p| p.display().to_string()).unwrap_or_default();

        let data_path = exe
            .as_ref()
            .and_then(|p| p.parent())
            .map(|p| p.display().to_string())
            .unwrap_or_default();

        let logs_path = logs_dir().display().to_string();

        // DB path: look for .env or the SQLite/Postgres info
        let db_path = find_database_path();

        let db_size = fs::metadata(&db_path)
            .map(|m| format_bytes(m.len()))
            .unwrap_or_else(|_| "N/A".to_string());

        let total_mem = sys.total_memory();
        let avail_mem = sys.available_memory();

        let disk_free = disks
            .iter()
            .find(|d| {
                exe.as_ref()
                    .map(|e| e.to_string_lossy().starts_with(&d.mount_point().to_string_lossy().to_string()))
                    .unwrap_or(false)
            })
            .map(|d| format_bytes(d.available_space()))
            .or_else(|| disks.iter().next().map(|d| format_bytes(d.available_space())))
            .unwrap_or_else(|| "N/A".to_string());

        SystemInfo {
            os: format!("{} {}", System::name().unwrap_or_default(), System::os_version().unwrap_or_default()),
            arch: std::env::consts::ARCH.to_string(),
            exe_path,
            data_path,
            logs_path,
            db_path,
            db_size,
            total_memory: format_bytes(total_mem),
            available_memory: format_bytes(avail_mem),
            disk_free,
            rust_version: "1.x (compiled)".to_string(),
            compile_time: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        }
    }
}

/// Generate a full debug report text.
pub fn generate_debug_report() -> String {
    let info = SystemInfo::collect();
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");

    let log_tail = read_log_tail(200);

    let mut report = String::new();
    report.push_str("═══════════════════════════════════════════════════════════\n");
    report.push_str("  DEBUG REPORT - Circulo de Suboficiales Retirados\n");
    report.push_str(&format!("  Generated: {}\n", now));
    report.push_str("═══════════════════════════════════════════════════════════\n\n");

    report.push_str("## System\n");
    report.push_str(&format!("  OS:           {}\n", info.os));
    report.push_str(&format!("  Architecture: {}\n", info.arch));
    report.push_str(&format!("  Rust version: {}\n", info.rust_version));
    report.push_str(&format!("  Compiled at:  {}\n\n", info.compile_time));

    report.push_str("## Paths\n");
    report.push_str(&format!("  Executable: {}\n", info.exe_path));
    report.push_str(&format!("  Data dir:   {}\n", info.data_path));
    report.push_str(&format!("  Logs dir:   {}\n", info.logs_path));
    report.push_str(&format!("  Database:   {}\n", info.db_path));
    report.push_str(&format!("  DB size:    {}\n\n", info.db_size));

    report.push_str("## Resources\n");
    report.push_str(&format!("  Total memory:     {}\n", info.total_memory));
    report.push_str(&format!("  Available memory: {}\n", info.available_memory));
    report.push_str(&format!("  Free disk:        {}\n\n", info.disk_free));

    report.push_str("═══════════════════════════════════════════════════════════\n");
    report.push_str("  LAST 200 LOG ENTRIES\n");
    report.push_str("═══════════════════════════════════════════════════════════\n\n");
    report.push_str(&log_tail);

    report.push_str("\n═══════════════════════════════════════════════════════════\n");
    report.push_str("  END OF REPORT\n");
    report.push_str("═══════════════════════════════════════════════════════════\n");

    report
}

/// Export diagnostics as a zip file.
pub fn export_diagnostics() -> Result<PathBuf, String> {
    let out_dir = logs_dir();
    fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let zip_path = out_dir.join(format!("diagnostico_{}.zip", timestamp));

    let file = fs::File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    // 1. debug-report.txt
    let report = generate_debug_report();
    zip.start_file("debug-report.txt", options).map_err(|e| e.to_string())?;
    zip.write_all(report.as_bytes()).map_err(|e| e.to_string())?;

    // 2. app.log
    let log_path = out_dir.join("app.log");
    if log_path.exists() {
        if let Ok(data) = fs::read(&log_path) {
            zip.start_file("app.log", options).map_err(|e| e.to_string())?;
            zip.write_all(&data).map_err(|e| e.to_string())?;
        }
    }

    // 3. version.txt
    zip.start_file("version.txt", options).map_err(|e| e.to_string())?;
    zip.write_all(
        format!(
            "App: {}\nRust: {}\nDate: {}\n",
            env!("CARGO_PKG_VERSION"),
            "compiled",
            chrono::Local::now().format("%Y-%m-%d %H:%M:%S")
        ).as_bytes()
    ).map_err(|e| e.to_string())?;

    // 4. Database backup attempt (if SQLite file exists)
    let db_path = find_database_path();
    if Path::new(&db_path).exists() && db_path.ends_with(".db") {
        if let Ok(data) = fs::read(&db_path) {
            zip.start_file("backup.db", options).map_err(|e| e.to_string())?;
            zip.write_all(&data).map_err(|e| e.to_string())?;
        }
    }

    zip.finish().map_err(|e| e.to_string())?;
    Ok(zip_path)
}

fn read_log_tail(lines: usize) -> String {
    let log_path = logs_dir().join("app.log");
    if !log_path.exists() {
        return "  (no log file found)\n".to_string();
    }

    let content = fs::read_to_string(&log_path).unwrap_or_default();
    let all_lines: Vec<&str> = content.lines().collect();
    let start = all_lines.len().saturating_sub(lines);
    all_lines[start..]
        .iter()
        .map(|l| format!("  {}\n", l))
        .collect()
}

fn find_database_path() -> String {
    // Check for .env next to executable
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()));

    if let Some(dir) = &exe_dir {
        let env_path = dir.join(".env");
        if let Ok(content) = fs::read_to_string(&env_path) {
            for line in content.lines() {
                if let Some(url) = line.strip_prefix("DATABASE_URL=") {
                    return url.trim().to_string();
                }
            }
        }
    }

    // Check current dir
    if let Ok(content) = fs::read_to_string(".env") {
        for line in content.lines() {
            if let Some(url) = line.strip_prefix("DATABASE_URL=") {
                return url.trim().to_string();
            }
        }
    }

    "PostgreSQL (Neon)".to_string()
}

fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = 1024 * KB;
    const GB: u64 = 1024 * MB;

    if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}
