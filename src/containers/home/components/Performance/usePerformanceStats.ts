import { useEffect, useState } from 'react';
import type { PerformanceStats } from '@/types/performance';

const STATS_URL = '/api/render-pulse-stats';

export type StatsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: PerformanceStats };

// Fetches the live stats once `enabled` turns true (the section scrolled into view)
export const usePerformanceStats = (enabled: boolean): StatsState => {
  const [state, setState] = useState<StatsState>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    fetch(STATS_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<PerformanceStats>;
      })
      .then((data) => setState({ status: 'ready', data }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });

    return () => controller.abort();
  }, [enabled]);

  return state;
};
