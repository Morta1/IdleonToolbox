// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const trackEvent = vi.fn();
vi.mock('@utility/analytics', () => ({ trackEvent }));
const { isProductionHost, trackLeaderboardEvent } = await import('@components/leaderboards/analytics');

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
});
