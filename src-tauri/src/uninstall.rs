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
/// on failure (e.g. the user cancels the prompt, or apt fails for its own
/// reasons such as a held dpkg lock) returns the actual apt error text so the
/// UI can show it, and the app keeps running.
///
/// `DPkg::Lock::Timeout=30` is set defensively: Ubuntu desktops routinely
/// have packagekit/unattended-upgrades briefly holding the dpkg lock in the
/// background, which otherwise makes a plain `apt-get remove` fail instantly
/// with a lock error instead of just waiting a moment.
#[tauri::command]
pub async fn uninstall_app(app: AppHandle) -> Result<(), String> {
    let output = tauri::async_runtime::spawn_blocking(|| {
        Command::new("pkexec")
            .args([
                "apt-get",
                "remove",
                "-y",
                "-o",
                "DPkg::Lock::Timeout=30",
                PACKAGE_NAME,
            ])
            .output()
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    // apt-get's own exit code can be poisoned by an unrelated package's trigger
    // processing failing in the same transaction (e.g. a broken DKMS kernel
    // module rebuild) even when achawatch itself was removed successfully —
    // so check directly whether the package is actually gone rather than
    // trusting the aggregate exit status alone.
    if !is_installed_package() {
        app.exit(0);
        return Ok(());
    }

    if output.status.success() {
        app.exit(0);
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let detail = if !stderr.trim().is_empty() {
            stderr.trim().to_string()
        } else if !stdout.trim().is_empty() {
            stdout.trim().to_string()
        } else {
            format!("apt-get exited with {:?}", output.status.code())
        };
        Err(format!("Uninstall failed: {detail}"))
    }
}
