#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app_lib::{
    app_state::AppState,
    commands::{chat_commands, email_commands, user_commands, window_commands, screen_commands, config_commands, log_commands, prompt_preset_commands, audio_commands, whisper_commands, ollama_commands, changelog_commands, calendar_commands, notion_commands},
    config::Config,
    clickthrough,
    visibility,
    stealth,
};
use tauri::{Manager, Emitter, PhysicalSize, Listener};
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

fn get_data_dir() -> std::path::PathBuf {
    let identifier = "com.primer.dev";
    
    #[cfg(target_os = "windows")]
    {
        let app_data = std::env::var("APPDATA").expect("APPDATA not set");
        std::path::PathBuf::from(app_data).join(identifier)
    }
    #[cfg(target_os = "macos")]
    {
        let home = std::env::var("HOME").expect("HOME not set");
        std::path::PathBuf::from(home).join("Library/Application Support").join(identifier)
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let home = std::env::var("HOME").expect("HOME not set");
        std::path::PathBuf::from(home).join(".local/share").join(identifier)
    }
}

#[tokio::main]
async fn main() {
    let config = Config::from_env();

    // Initialize Database Path
    let app_local_data_dir = get_data_dir();
    std::fs::create_dir_all(&app_local_data_dir)
        .expect("failed to create app data directory");
    
    let db_path = app_local_data_dir.join("primer.sqlite");
    let db_url = format!("sqlite:{}", db_path.to_string_lossy());
    
    log::info!("Initializing AppState with database at: {}", db_url);

    // Initialize AppState (Async)
    let app_state = AppState::initialize(&config, Some(db_url))
        .await
        .expect("failed to initialize application state");

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            let _ = app.emit("tauri://deep-link", argv);
        }))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts([
                    "CommandOrControl+Shift+S",
                    "CommandOrControl+Backslash",
                    "CommandOrControl+Shift+D",
                    "CommandOrControl+Shift+F",
                ])
                .expect("Failed to register global shortcuts")
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        // Toggle Stealth Mode: Ctrl+Shift+S
                        if shortcut.matches(Modifiers::SUPER | Modifiers::SHIFT, Code::KeyS) ||
                           shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyS) {
                               let app_handle = app.clone();
                               tauri::async_runtime::spawn(async move {
                                   toggle_global_stealth(app_handle).await;
                               });
                        }
                        // Minimize/Restore Window: Ctrl+\
                        if shortcut.matches(Modifiers::SUPER, Code::Backslash) ||
                           shortcut.matches(Modifiers::CONTROL, Code::Backslash) {
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_minimized().unwrap_or(false) {
                                    let _ = window.unminimize();
                                    let _ = window.set_focus();
                                } else {
                                    let _ = window.minimize();
                                }
                            }
                        }
                        // Toggle Dock Visibility: Ctrl+Shift+D
                        if shortcut.matches(Modifiers::SUPER | Modifiers::SHIFT, Code::KeyD) ||
                           shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyD) {
                            let _ = app.emit("toggle_dock_visibility", ());
                        }
                        // Toggle Focus Mode: Ctrl+Shift+F
                        if shortcut.matches(Modifiers::SUPER | Modifiers::SHIFT, Code::KeyF) ||
                           shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyF) {
                            let _ = app.emit("toggle_focus_mode", ());
                        }
                    }
                })
                .build()
        )
        .invoke_handler(tauri::generate_handler![
            // user commands
            user_commands::add_api_key,
            user_commands::get_api_keys,
            user_commands::delete_api_key,
            user_commands::delete_account,
            user_commands::get_current_user,
            user_commands::clear_session,
            user_commands::sync_session,
            user_commands::clear_all_data,
            user_commands::get_user_stats,
            // chat commands
            chat_commands::create_chat,
            chat_commands::send_message,
            chat_commands::get_chats,
            chat_commands::get_messages,
            chat_commands::delete_chat,
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
            // config commands
            config_commands::get_app_config,
            config_commands::set_language,
            config_commands::set_enable_smart_rag,
            config_commands::open_system_settings,
            // prompt preset commands
            prompt_preset_commands::get_prompt_presets,
            prompt_preset_commands::get_summary_presets,
            prompt_preset_commands::create_prompt_preset,
            prompt_preset_commands::update_prompt_preset,
            prompt_preset_commands::delete_prompt_preset,
            // Log commands
            log_commands::open_log_folder,
            log_commands::read_log_content,
            log_commands::get_log_path_cmd,
            log_commands::log_frontend_message,
            // New commands
            window_commands::set_always_on_top,
            window_commands::set_window_opacity,
            window_commands::get_window_opacity,
            window_commands::enable_full_stealth,
                            window_commands::disable_full_stealth,
                            window_commands::toggle_minimize_window,
                            // Screen commands
            screen_commands::capture_screen,
            // Audio commands
            audio_commands::start_recording,
            audio_commands::stop_recording,
            audio_commands::get_recording_status,
            audio_commands::read_audio_file,
            // Whisper commands
            whisper_commands::transcribe_with_whisper,
            whisper_commands::check_whisper_models,
            whisper_commands::download_whisper_model,
            // Ollama commands
            ollama_commands::get_ollama_models,
            // Changelog commands
            changelog_commands::get_changelogs,
            // Calendar commands
            calendar_commands::create_calendar_event,
            calendar_commands::get_calendar_events,
            calendar_commands::delete_calendar_event,
            calendar_commands::update_calendar_event,
            // Notion commands
            notion_commands::get_notion_status,
            notion_commands::get_notion_auth_url,
            notion_commands::exchange_notion_code,
            notion_commands::create_notion_page,
            notion_commands::get_notion_pages,
            notion_commands::delete_notion_page,
            notion_commands::update_notion_page,
            notion_commands::get_notion_page_content,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();
            app.listen("tauri://deep-link", move |event| {
                let _ = handle.emit("auth-callback", event.payload());
            });

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




