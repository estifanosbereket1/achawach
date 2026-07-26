use std::process::Command;
use tauri::AppHandle;

const PACKAGE_NAME: &str = "achawatch";

/// True only when this process is actually the apt/dpkg-installed package —
/// hidden during `npm run tauri dev` and on non-.deb installs (RPM/AppImage),
/// since the removal command below only applies to a dpkg-managed install.
#[tauri::command]
pub fn is_installed_package() -> bool {
    Command::new("dpkg")
        .args(["-s", PACKAGE_NAME])
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Removes the installed package via a `pkexec`-elevated `apt-get remove`,
/// prompting the user's own native authentication dialog (there is no way to
/// remove system-installed files without it). Quits the app on success;
/// on failure (e.g. the user cancels the prompt) returns an error instead so
/// the UI can show it, and the app keeps running.
#[tauri::command]
pub async fn uninstall_app(app: AppHandle) -> Result<(), String> {
    let status = tauri::async_runtime::spawn_blocking(|| {
        Command::new("pkexec")
            .args(["apt-get", "remove", "-y", PACKAGE_NAME])
            .status()
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    if status.success() {
        app.exit(0);
        Ok(())
    } else {
        Err("Uninstall was cancelled or failed.".to_string())
    }
}
