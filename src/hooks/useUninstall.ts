import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useUninstall() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<boolean>("is_installed_package")
      .then(setIsAvailable)
      .catch(() => setIsAvailable(false));
  }, []);

  async function uninstall() {
    setIsUninstalling(true);
    setError(null);
    try {
      // On success the app process exits itself (see the Rust side); there's
      // nothing more to update here since the window is about to close.
      await invoke("uninstall_app");
    } catch (e) {
      setError(String(e));
      setIsUninstalling(false);
    }
  }

  return { isAvailable, isUninstalling, error, uninstall };
}
