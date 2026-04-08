export interface ReconciliationEntry {
  id: number;
  user: string;
  time: string;
  tagname: string[];
  tagreconciled: string[];
  tagcorrection: string[];
  tagmatrix: number[][];
  status: string;
}

const STORAGE_KEY = 'reconciliationData';

export function getReconciliationHistory(): ReconciliationEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getLatestReconciliation(): ReconciliationEntry | null {
  return getReconciliationHistory()[0] ?? null;
}

export function saveReconciliationEntry(entry: ReconciliationEntry) {
  const next = [entry, ...getReconciliationHistory()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('localStorageUpdated'));
}

export function clearReconciliationHistory() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('localStorageUpdated'));
}
