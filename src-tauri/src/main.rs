#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app_lib::{
    app_state::AppState,
    commands::{chat_commands, email_commands, user_commands},
    config::Config,
};
use tauri::Manager;


#[tauri::command]
async fn close_app(app_handle: tauri::AppHandle) -> Result<(), String> {
    app_handle.exit(0);
    Ok(())
}

#[tauri::command]
async fn close_splashscreen(window: tauri::Window) {
    // Close splashscreen
    if let Some(splash) = window.get_webview_window("splashscreen") {
        splash.close().unwrap();
    }
    // Show main window
    if let Some(main) = window.get_webview_window("main") {
        main.show().unwrap();
    }
}

#[tokio::main]
async fn main() {
    let config = Config::from_env();

    let app_state = AppState::initialize(&config)
        .await
        .expect("failed to initialize application state");

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            // user commands
            user_commands::login,
            user_commands::register,
            user_commands::reset_password,
            user_commands::add_api_key,
            user_commands::get_api_keys,
            user_commands::delete_api_key,
            user_commands::delete_account,
            user_commands::get_session,
            user_commands::clear_session,
            // chat commands
            chat_commands::create_chat,
            chat_commands::send_message,
            chat_commands::sync_messages,
            chat_commands::backup_chat,
            // email commands
            email_commands::send_email,
            email_commands::send_chat_summary,
            close_app,
            close_splashscreen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

