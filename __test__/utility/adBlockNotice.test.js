import { describe, expect, it } from 'vitest';
import { EMPTY_NOTICE, decideSession, visit } from '@utility/adBlockNotice';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const NOW = 1_800_000_000_000;

describe('ad-block notice record', () => {
  it.each([
    ['31 minutes away starts a new session', 31, 3],
    ['29 minutes away is the same session', 29, 2]
  ])('%s', (_, minutesAway, sessions) => {
    const record = { ...EMPTY_NOTICE, sessions: 2, lastSeen: NOW - minutesAway * MINUTE };
    expect(visit(record, NOW)).toEqual({ ...record, sessions, lastSeen: NOW });
  });

  it.each([
    ['the first session with a blocker', { sessions: 1, blocked: true }, false, 0],
    ['the second session with a blocker', { sessions: 2, blocked: true }, false, 2],
    ['no blocker', { sessions: 2, blocked: false }, false, 0],
    ['an identity banner holds the band', { sessions: 2, blocked: true }, true, 0],
    ['dismissed 6 days ago', { sessions: 2, blocked: true, dismissedAt: NOW - 6 * DAY }, false, 0],
    ['dismissed 8 days ago, session 5', { sessions: 5, blocked: true, dismissedAt: NOW - 8 * DAY }, false, 5]
  ])('%s', (_, fields, slotTaken, ask) => {
    const result = decideSession({ ...EMPTY_NOTICE, ...fields }, { slotTaken, now: NOW });
    expect([result.ask, result.decided]).toEqual([ask, fields.sessions]);
  });
});
