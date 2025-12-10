#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app_lib::{
    app_state::AppState,
    commands::{chat_commands, email_commands, user_commands, window_commands},
    config::Config,
    clickthrough,
    visibility,
    stealth,
};
use tauri::{Manager, Emitter, PhysicalSize};
use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};

#[tauri::command]
async fn close_app(app_handle: tauri::AppHandle) -> Result<(), String> {
    app_handle.exit(0);
    Ok(())
}

#[tauri::command]
async fn close_splashscreen(window: tauri::WebviewWindow) {
    // Close splashscreen
    if let Some(splash) = window.get_webview_window("splashscreen") {
        splash.close().unwrap();
    }
    // Show main window
    if let Some(main) = window.get_webview_window("main") {
        main.show().unwrap();
        // Ensure the window is visible in the taskbar/dock on startup
        let _ = visibility::show_in_taskbar(&main);
    }
}

#[tauri::command]
async fn enable_click_through_cmd(window: tauri::WebviewWindow) -> Result<(), String> {
    clickthrough::enable_click_through(&window)?;
    stealth::update_click_through_state(true);
    Ok(())
}

#[tauri::command]
async fn disable_click_through_cmd(window: tauri::WebviewWindow) -> Result<(), String> {
    clickthrough::disable_click_through(&window)?;
    stealth::update_click_through_state(false);
    Ok(())
}

#[tauri::command]
async fn hide_from_taskbar_cmd(window: tauri::WebviewWindow) -> Result<(), String> {
    visibility::hide_from_taskbar(&window)?;
    stealth::update_hidden_from_dock_state(true);
    Ok(())
}

#[tauri::command]
async fn show_in_taskbar_cmd(window: tauri::WebviewWindow) -> Result<(), String> {
    visibility::show_in_taskbar(&window)?;
    stealth::update_hidden_from_dock_state(false);
    Ok(())
}

#[tauri::command]
async fn enable_stealth_mode_cmd(window: tauri::WebviewWindow) -> Result<stealth::StealthStatus, String> {
    stealth::enable_stealth_mode(&window)
}

#[tauri::command]
async fn disable_stealth_mode_cmd(window: tauri::WebviewWindow) -> Result<(), String> {
    stealth::disable_stealth_mode(&window)
}

#[tauri::command]
async fn get_stealth_status_cmd() -> Result<stealth::StealthStatus, String> {
    stealth::get_stealth_status()
}

async fn toggle_global_stealth(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let status = stealth::get_stealth_status().unwrap_or(stealth::StealthStatus {
            active: false,
            method: stealth::StealthMethod::NativeAPI,
            click_through: false,
            hidden_from_dock: false,
            os: "unknown".to_string(),
        });

        if status.active {
            // Disable all (Full Stealth)
            #[cfg(target_os = "macos")]
            let _ = window_commands::disable_full_stealth(window.clone()).await;
            
            #[cfg(not(target_os = "macos"))]
            {
                let _ = stealth::disable_stealth_mode(&window);
                let _ = clickthrough::disable_click_through(&window);
                let _ = visibility::show_in_taskbar(&window);
            }
            
            stealth::update_click_through_state(false);
            stealth::update_hidden_from_dock_state(false);
            
            // Emit event to frontend
            let _ = app.emit("stealth_change", false);
        } else {
            // Enable all (Full Stealth)
            #[cfg(target_os = "macos")]
            let _ = window_commands::enable_full_stealth(window.clone()).await;

            #[cfg(not(target_os = "macos"))]
            {
                let _ = stealth::enable_stealth_mode(&window);
                let _ = clickthrough::enable_click_through(&window);
                let _ = visibility::hide_from_taskbar(&window);
            }

            stealth::update_click_through_state(true);
            stealth::update_hidden_from_dock_state(true);
            
            // Emit event to frontend
            let _ = app.emit("stealth_change", true);
        }
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
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut("CommandOrControl+Shift+S")
                .expect("Failed to register global shortcut")
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if shortcut.matches(Modifiers::SUPER | Modifiers::SHIFT, Code::KeyS) ||
                           shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyS) {
                               let app_handle = app.clone();
                               tauri::async_runtime::spawn(async move {
                                   toggle_global_stealth(app_handle).await;
                               });
                        }
                    }
                })
                .build()
        )
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
            user_commands::save_shortcut,
            user_commands::get_shortcuts,
            user_commands::backup_shortcuts,
            // chat commands
            chat_commands::create_chat,
            chat_commands::send_message,
            chat_commands::sync_messages,
            chat_commands::backup_chat,
            chat_commands::get_chats,
            chat_commands::get_messages,
            chat_commands::delete_chat,
            chat_commands::delete_all_chats,
            // email commands
            email_commands::send_email,
            email_commands::send_chat_summary,
            close_app,
            close_splashscreen,
            window_commands::set_stealth_mode,
            // clickthrough commands
            enable_click_through_cmd,
            disable_click_through_cmd,
            // visibility commands
            hide_from_taskbar_cmd,
            show_in_taskbar_cmd,
            // stealth commands
            enable_stealth_mode_cmd,
            disable_stealth_mode_cmd,
            get_stealth_status_cmd,
            // New commands
            window_commands::set_always_on_top,
            window_commands::set_window_opacity,
            window_commands::get_window_opacity,
            window_commands::enable_full_stealth,
            window_commands::disable_full_stealth,
        ])
        .setup(|app| {
            let win = app.get_webview_window("main").unwrap();

            // 🧱 Limita a largura do conteúdo (não da janela fullscreen)
            win.set_max_size(Some(PhysicalSize {
                width: 99999, // janela pode ser tela cheia
                height: 99999,
            }))?;

            // Espera o compositor mapear a janela antes de maximizar
            let win_clone = win.clone();
            tauri::async_runtime::spawn(async move {
                std::thread::sleep(std::time::Duration::from_millis(150));

                win_clone.show().unwrap();
                win_clone.maximize().unwrap();  // OU fullscreen()
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}




