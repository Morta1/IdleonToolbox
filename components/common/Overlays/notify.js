// One snackbar for the whole app (Overlays board): a new message replaces the old one, and it
// leaves after 4 s, or 6 s when it carries an action. Pages call notify(); none renders a Snackbar.
const EMPTY = { notice: null, open: false, slot: null };
let snapshot = EMPTY;
let lastId = 0;
let slots = [];
const listeners = new Set();

const emit = (changes) => {
  snapshot = { ...snapshot, ...changes };
  listeners.forEach((listener) => listener());
};

// undo: a function, shown as an Undo button. action: { label, onClick } or { label, href }.
// Returns the notice's id, for closeNotice.
export const notify = (message, { undo, action } = {}) => {
  lastId += 1;
  emit({ notice: { id: lastId, message, action: undo ? { label: 'Undo', onClick: undo } : action ?? null }, open: true });
  return lastId;
};

export const closeNotice = (id) => {
  if (snapshot.open && snapshot.notice?.id === id) emit({ open: false });
};

export const closeAllNotices = () => {
  if (snapshot.open) emit({ open: false });
};

// While a dialog, drawer or popover is open the snackbar renders in its slot (see NoticeSlot).
export const registerNoticeSlot = (element) => {
  slots = [...slots, element];
  emit({ slot: element });
  return () => {
    slots = slots.filter((slot) => slot !== element);
    emit({ slot: slots.at(-1) ?? null });
  };
};

export const subscribeNotices = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const noticeSnapshot = () => snapshot;
export const serverNoticeSnapshot = () => EMPTY;
