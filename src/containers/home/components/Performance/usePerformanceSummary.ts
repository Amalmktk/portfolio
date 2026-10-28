import { useEffect, useState } from 'react';
import type { PerformanceSummary } from '@/types/performance';

const SUMMARY_URL = '/api/performance';

export type SummaryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: PerformanceSummary };

// Fetches the live summary once `enabled` turns true (the section scrolled into view)
export const usePerformanceSummary = (enabled: boolean): SummaryState => {
  const [state, setState] = useState<SummaryState>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    fetch(SUMMARY_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<PerformanceSummary>;
      })
      .then((data) => setState({ status: 'ready', data }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });

    return () => controller.abort();
  }, [enabled]);

  return state;
};
