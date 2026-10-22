import {
  BABA_RESPAWN_MS,
  DAY_MS,
  getBabaRespawnAt,
  getDefecausStatus,
  getResetWindowStart,
  isBabaUp,
  syncBaba,
  syncDefecaus,
  undoDefecaus
} from '@utility/dashboard/bossRespawns';

describe('getResetWindowStart', () => {
  const nextReset = 10 * DAY_MS;

  it('returns the last reset while the next one is still ahead', () => {
    expect(getResetWindowStart(nextReset, nextReset - 1000)).toBe(nextReset - DAY_MS);
  });

  it('rolls forward when the save is older than the reset', () => {
    expect(getResetWindowStart(nextReset, nextReset + 5000)).toBe(nextReset);
    expect(getResetWindowStart(nextReset, nextReset + DAY_MS + 5000)).toBe(nextReset + DAY_MS);
  });

  it('returns null without ShopRestock', () => {
    expect(getResetWindowStart(NaN, 0)).toBeNull();
  });
});

describe('Dr Defecaus', () => {
  const HOUR_MS = 36e5;

  it('starts a fresh record on a new reset, with the current kills as baseline', () => {
    expect(syncDefecaus(undefined, { nextReset: DAY_MS, kills: 7 })).toEqual({ nextReset: DAY_MS, baseline: 7, dismissed: false });
    const old = { nextReset: DAY_MS, baseline: 7, dismissed: true };
    expect(syncDefecaus(old, { nextReset: 2 * DAY_MS, kills: 9 })).toEqual({ nextReset: 2 * DAY_MS, baseline: 9, dismissed: false });
  });

  it('keeps the record when ShopRestock drifts within the same reset', () => {
    const stored = { nextReset: DAY_MS, baseline: 7, dismissed: true };
    expect(syncDefecaus(stored, { nextReset: DAY_MS + 30000, kills: 8 })).toBe(stored);
  });

  it('keeps the kill state when a watch pulls the next reset earlier, then re-arms at that reset', () => {
    const stored = { nextReset: DAY_MS, baseline: 7, dismissed: true };
    const watched = syncDefecaus(stored, { nextReset: DAY_MS - 5 * HOUR_MS, kills: 8 });
    expect(watched).toEqual({ nextReset: DAY_MS - 5 * HOUR_MS, baseline: 7, dismissed: true });
    expect(syncDefecaus(watched, { nextReset: 2 * DAY_MS - 5 * HOUR_MS, kills: 8 })).toEqual({ nextReset: 2 * DAY_MS - 5 * HOUR_MS, baseline: 8, dismissed: false });
  });

  it('converts a record stored with only the window start', () => {
    const legacy = { resetStart: 100, baseline: 7, dismissed: true };
    expect(syncDefecaus(legacy, { nextReset: 100 + DAY_MS - 5 * HOUR_MS, kills: 8 })).toEqual({ nextReset: 100 + DAY_MS - 5 * HOUR_MS, baseline: 7, dismissed: true });
  });

  it('is killed only when tracked and the count went up', () => {
    const stored = { nextReset: DAY_MS, baseline: 7, dismissed: false };
    expect(getDefecausStatus(stored, { kills: 7, tracked: true })).toBe('up');
    expect(getDefecausStatus(stored, { kills: 8, tracked: true })).toBe('killed');
    expect(getDefecausStatus(stored, { kills: 8, tracked: false })).toBe('up');
    expect(getDefecausStatus({ ...stored, dismissed: true }, { kills: 7, tracked: false })).toBe('dismissed');
  });

  it('undo forgets both a dismiss and an auto-detected kill', () => {
    const stored = { nextReset: DAY_MS, baseline: 7, dismissed: true };
    const undone = undoDefecaus(stored, 8);
    expect(getDefecausStatus(undone, { kills: 8, tracked: true })).toBe('up');
  });
});

describe('Baba Yaga', () => {
  it('only seeds a baseline on first sight, without starting a timer', () => {
    expect(syncBaba(undefined, { kills: 3, tracked: true, clock: 50 })).toEqual({ baseline: 3 });
  });

  it('starts the timer when the count goes up', () => {
    expect(syncBaba({ baseline: 3 }, { kills: 4, tracked: true, clock: 50 })).toEqual({ baseline: 4, killedAt: 50 });
  });

  it('leaves manual state alone when kills are not tracked', () => {
    const stored = { killedAt: 10 };
    expect(syncBaba(stored, { kills: 0, tracked: false, clock: 50 })).toBe(stored);
  });

  it('is up when no kill is stored or the respawn has passed', () => {
    expect(isBabaUp(undefined, 0)).toBe(true);
    expect(getBabaRespawnAt({ killedAt: 1000 })).toBe(1000 + BABA_RESPAWN_MS);
    expect(isBabaUp({ killedAt: 1000 }, 1000 + BABA_RESPAWN_MS - 1)).toBe(false);
    expect(isBabaUp({ killedAt: 1000 }, 1000 + BABA_RESPAWN_MS)).toBe(true);
  });
});
