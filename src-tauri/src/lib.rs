mod library;
mod player;

use tauri::menu::MenuBuilder;
use tauri::tray::TrayIconBuilder;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let player_handle =
                player::PlayerHandle::new().expect("failed to initialize audio output device");
            app.manage(player_handle);

            let menu = MenuBuilder::new(app)
                .text("show", "Show")
                .text("quit", "Quit")
                .build()?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            library::scan_folders,
            player::set_queue,
            player::play,
            player::pause,
            player::next_track,
            player::prev_track,
            player::seek,
            player::set_volume,
            player::get_position,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
