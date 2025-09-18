use tauri::{App, WebviewUrl, WebviewWindowBuilder};

pub fn create_main_window(app: &App) {
    let monitor = app.primary_monitor().unwrap().unwrap();
    let scale_factor = monitor.scale_factor();

    let screen_size = monitor.size();

    let desired_width_physical = 1150.0;
    let desired_height_physical = 650.0;

    let logical_width = desired_width_physical / scale_factor;
    let logical_height = desired_height_physical / scale_factor;

    let x = (screen_size.width as f64 / scale_factor - logical_width) / 2.0;
    let y = (screen_size.height as f64 / scale_factor - logical_height) / 2.0;

    // let min_width = logical_width * 0.75;
    // let min_height = logical_height * 0.75;

    WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
        .title("ALauncher")
        .inner_size(logical_width, logical_height)
        // .min_inner_size(min_width, min_height)
        .position(x, y)
        .build()
        .unwrap();
}
