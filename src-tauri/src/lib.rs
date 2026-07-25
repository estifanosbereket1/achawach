mod db;
mod library;
mod player;
mod playlists;
mod stats;

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

            let app_data_dir = app.path().app_data_dir()?;
            let pool = tauri::async_runtime::block_on(db::init_pool(&app_data_dir))
                .expect("failed to initialize database");
            app.manage(pool);

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
            library::get_library,
            player::set_queue,
            player::play,
            player::pause,
            player::next_track,
            player::prev_track,
            player::seek,
            player::set_volume,
            player::get_position,
            player::set_shuffle,
            player::set_repeat,
            player::jump_to_index,
            player::reorder_queue,
            stats::record_play,
            stats::get_monthly_play_counts,
            playlists::get_playlists,
            playlists::create_playlist,
            playlists::rename_playlist,
            playlists::delete_playlist,
            playlists::get_playlist_tracks,
            playlists::set_playlist_tracks,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
