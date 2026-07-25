import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface MonthlyPlayCount {
  path: string;
  count: number;
}

export function useMonthlyPlayCounts() {
  const [counts, setCounts] = useState<MonthlyPlayCount[]>([]);

  useEffect(() => {
    invoke<MonthlyPlayCount[]>("get_monthly_play_counts")
      .then(setCounts)
      .catch(() => setCounts([]));
  }, []);

  return counts;
}
