mod windows;
mod log;

#[tauri::command]
async fn get_pid() -> u32 {
    std::process::id()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenvy::from_filename(".env").ok();
    
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_pid])
        .setup(|app| {
            windows::create_main_window(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
