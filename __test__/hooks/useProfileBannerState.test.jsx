// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const router = vi.hoisted(() => ({ pathname: '/', query: {} }));
vi.mock('next/router', () => ({ useRouter: () => router }));

const { AppContext } = await import('@components/common/context/AppProvider');
const { default: useProfileBannerState } = await import('@hooks/useProfileBannerState');

const run = (pathname, state, query = {}) => {
  router.pathname = pathname;
  router.query = query;
  const wrapper = ({ children }) => <AppContext.Provider value={{ state, dispatch: () => {} }}>{children}</AppContext.Provider>;
  return renderHook(useProfileBannerState, { wrapper }).result.current;
};

const anonymous = { signedIn: false, emptyAccount: true, isLoading: false };

describe('useProfileBannerState guest banner', () => {
  // "numbers fill in once you sign in" is only true where the page shows account numbers. On
  // static pages it also arrived after hydration as the largest text, which made it the LCP.
  it.each(['/', '/wiki/[kind]/[slug]', '/tools/builds/[slug]', '/guilds', '/patch-notes'])('hidden on %s', (pathname) => {
    expect(run(pathname, anonymous)).toMatchObject({ isEmptyAccount: false, isVisible: false });
  });

  it.each(['/dashboard', '/characters', '/account/world-3/printer', '/tools/card-search'])('shown on %s', (pathname) => {
    expect(run(pathname, anonymous)).toMatchObject({ isEmptyAccount: true, isVisible: true });
  });

  it('keeps the profile banner on a static page', () => {
    expect(run('/wiki/[kind]/[slug]', { profile: true }, { profile: 'someone' })).toMatchObject({ isProfileView: true, isVisible: true });
  });

  it('keeps the simulated-pets warning on a static page', () => {
    const simulating = { account: { companions: { list: [{ simulated: true }] } } };
    expect(run('/wiki/[kind]/[slug]', simulating)).toMatchObject({ isSimulating: true, isVisible: true });
  });
});
