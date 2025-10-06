use chrono::Local;
use std::fs::OpenOptions;
use std::io::Write;

pub fn logger(message: &str) {
    let exe_path = std::env::current_exe().expect("failed to get current exe path");
    let exe_dir = exe_path.parent().expect("failed to get exe directory");
    let log_path = exe_dir.join("ALauncher.log");

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .unwrap_or_else(|_| panic!("failed to open log file at {:?}", log_path));

    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let line = format!("[{}]: {}\n", timestamp, message);

    file.write_all(line.as_bytes())
        .expect("failed to write log");
}
