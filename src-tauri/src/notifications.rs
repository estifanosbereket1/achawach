use notify_rust::Notification;

/// Note: confirmed via manual testing that `notify-rust` correctly shows a
/// system notification when run as a standalone binary on this machine
/// (both the `zbus` and classic `dbus` backends), and raw `notify-send`
/// works too — but the identical call made from inside the running Tauri/
/// WebKitGTK process reports success without ever rendering a visible
/// notification, on this GNOME session. Left in place since it may work
/// fine in a packaged build or a different desktop environment; if it
/// silently fails, that's this known gap, not a new bug.
#[tauri::command]
pub fn send_notification(title: String, body: String, icon_path: Option<String>) -> Result<(), String> {
    let mut notification = Notification::new();
    notification.summary(&title).body(&body);
    if let Some(path) = &icon_path {
        notification.image_path(path);
    }
    if let Err(e) = notification.show() {
        eprintln!("[notifications] show() failed: {e}");
        return Err(e.to_string());
    }
    Ok(())
}
