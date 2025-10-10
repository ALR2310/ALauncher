use std::{env, os::windows::process::CommandExt, path::Path, process::Command};
use tauri::{App, WebviewUrl, WebviewWindowBuilder};

use crate::log::logger;

fn spawn_runtime_process<P: AsRef<Path>>(runtime_path: P, data_path: P) {
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let _child = Command::new(runtime_path.as_ref())
        .arg(data_path.as_ref())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .unwrap_or_else(|e| {
            let error_msg = format!(
                "failed to start runtime: {:?}, runtime_path exists={}, data_path exists={}",
                e,
                runtime_path.as_ref().exists(),
                data_path.as_ref().exists()
            );
            logger(&error_msg);
            panic!("{}", error_msg);
        });

    logger("runtime.bin started successfully");
}

pub fn create_main_window(app: &App) {
    let node_env = env::var("NODE_ENV").unwrap_or_else(|_| "production".into());

    let exe_dir = env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .expect("failed to get exe directory");

    let runtime_path = exe_dir.join("runtime.bin");
    let data_path = exe_dir.join("data.bin");

    logger(&format!("NODE_ENV = {}", node_env));
    logger(&format!("exe_dir = {:?}", exe_dir));
    logger(&format!("runtime_path = {:?}", runtime_path));
    logger(&format!("data_path = {:?}", data_path));

    if node_env == "production" {
        spawn_runtime_process(&runtime_path, &data_path);
    }

    let monitor = app.primary_monitor().unwrap().unwrap();
    let scale_factor = monitor.scale_factor();
    let screen_size = monitor.size();

    // default size
    let mut desired_width_physical = 1150.0;
    let mut desired_height_physical = 650.0;

    if node_env == "development" {
        desired_width_physical = 500.0;
        desired_height_physical = 250.0;
    }

    let logical_width = desired_width_physical / scale_factor;
    let logical_height = desired_height_physical / scale_factor;

    let x = (screen_size.width as f64 / scale_factor - logical_width) / 2.0;
    let y = (screen_size.height as f64 / scale_factor - logical_height) / 2.0;

    let min_width = logical_width * 0.75;
    let min_height = logical_height * 0.75;

    let mut url = WebviewUrl::External("http://localhost:2310".parse().unwrap());

    if node_env == "development" {
        url = WebviewUrl::External("http://localhost:2311".parse().unwrap());
    }

    WebviewWindowBuilder::new(app, "main", url)
        .title("ALauncher")
        .decorations(false)
        .inner_size(logical_width, logical_height)
        .min_inner_size(min_width, min_height)
        .position(x, y)
        .background_color(tauri::utils::config::Color(18, 18, 18, 255))
        .build()
        .unwrap();
}
