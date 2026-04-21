// localStorage-backed draft persistence for the builds create/edit form.
// Stores one draft at a time per user-session (most recent wins).

const KEY = 'builds-draft';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const canUseStorage = () =>
  typeof window !== 'undefined' && window.localStorage != null;

export const saveDraft = (draft) => {
  if (!canUseStorage()) return;
  try {
    const payload = {
      savedAt: Date.now(),
      draft
    };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch (err) {
    // Quota exceeded / private mode — swallow
    console.warn('[builds] draft save failed:', err);
  }
};

export const loadDraft = () => {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !parsed?.draft) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('[builds] draft load failed:', err);
    return null;
  }
};

export const clearDraft = () => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
};

// Simple debouncer so callers don't have to import lodash just for this.
export const makeDebouncedSaver = (delayMs = 1000) => {
  let timer = null;
  return (draft) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => saveDraft(draft), delayMs);
  };
};
