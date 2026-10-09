// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const trackEvent = vi.fn();
vi.mock('@utility/analytics', async (importActual) => ({ ...(await importActual()), trackEvent }));
const { isProductionHost, leaderboardEventParams, trackLeaderboardEvent } = await import('@components/leaderboards/analytics');

afterEach(() => { vi.clearAllMocks(); });

describe('production-only leaderboard analytics', () => {
  it('knows the production host', () => {
    expect(isProductionHost('idleontoolbox.com')).toBe(true);
    expect(isProductionHost('idleon-toolbox-beta-git-feat-leaderboards-redesign-morta1s-projects.vercel.app')).toBe(false);
    expect(isProductionHost('localhost')).toBe(false);
  });

  it('stays silent on localhost (jsdom default)', () => {
    trackLeaderboardEvent('lb_mode', { mode: 'boards', self: false });
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('puts a stripped page_location on the params, keeping the rest', () => {
    expect(leaderboardEventParams({ mode: 'boards', self: false }, 'https://idleontoolbox.com/leaderboards?t=Skills&player=X&m=mining')).toEqual({
      mode: 'boards',
      self: false,
      page_location: 'https://idleontoolbox.com/leaderboards?t=Skills'
    });
    expect(leaderboardEventParams(undefined, 'https://idleontoolbox.com/leaderboards?player=X').page_location).toBe('https://idleontoolbox.com/leaderboards');
  });

  it('leaves the location of any other page alone', () => {
    expect(leaderboardEventParams({}, 'https://idleontoolbox.com/construction?player=X').page_location).toBe('https://idleontoolbox.com/construction?player=X');
  });
});
