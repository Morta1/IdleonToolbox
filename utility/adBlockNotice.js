// The ad-block ask (Overlays board, option B): a line in the band from a player's second session,
// shown only on a page change, hidden for 7 days by its x. These functions only compute the stored
// record; hooks/useAdBlockNotice.js reads and writes it.
export const AD_BLOCK_NOTICE_KEY = 'adBlockNotice';
const SESSION_GAP = 30 * 60 * 1000;
const HIDDEN_FOR = 7 * 24 * 60 * 60 * 1000;

// sessions: visits so far. lastSeen: the last page load or page change. dismissedAt: the x.
// blocked: the last answer, for adblock_disabled. ask: the session the ask may show in (0: none).
// decided: the session whose ask was decided. The board names the first four; ask is stored because it
// is decided once a session, and a reload inside the session must keep that decision. Deciding waits for
// the blocker's answer, which a first page that reloads at once (the wiki's moved URLs) never gets, so
// the session's next page decides it.
export const EMPTY_NOTICE = { sessions: 0, lastSeen: 0, dismissedAt: 0, blocked: false, ask: 0, decided: 0 };

// Storage can hold anything (an older shape, a hand edit): fill the gaps, never throw.
export const readNotice = (value) => (value && typeof value === 'object' ? { ...EMPTY_NOTICE, ...value } : EMPTY_NOTICE);

// A visit 30 minutes after the last one is a new session.
export const isNewSession = (record, now) => now - record.lastSeen > SESSION_GAP;

export const visit = (record, now) => ({
  ...record,
  sessions: isNewSession(record, now) ? record.sessions + 1 : record.sessions,
  lastSeen: now
});

// Whether this session's ask is still to be decided (an older record reads decided: 0 and decides once).
export const needsDecision = (record) => record.decided !== record.sessions;

// Once a session, on its first page the blocker answers on: the ask is on from the second session, with a
// blocker, a free band and no dismissal in the last 7 days. Nobody is asked on a first visit: Nitro's
// recovery covers those.
export const decideSession = (record, { slotTaken, now }) => ({
  ...record,
  decided: record.sessions,
  ask: record.blocked && !slotTaken && record.sessions >= 2 && now - record.dismissedAt >= HIDDEN_FOR ? record.sessions : 0
});

export const askOpen = (record) => record.ask > 0 && record.ask === record.sessions;
export const cancelAsk = (record) => ({ ...record, ask: 0 });
export const dismissAsk = (record, now) => ({ ...record, ask: 0, dismissedAt: now });
