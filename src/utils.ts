import { confirm } from "@tauri-apps/plugin-dialog";

export async function confirmUnless(
  skip: boolean,
  message: string,
  options: { title: string; kind: "warning" },
): Promise<boolean> {
  if (skip) return true;
  return confirm(message, options);
}

export function formatTime(secs: number): string {
  const total = Math.max(0, Math.floor(secs));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
