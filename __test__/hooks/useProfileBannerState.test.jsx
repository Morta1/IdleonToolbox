// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const router = vi.hoisted(() => ({ pathname: '/', query: {} }));
vi.mock('next/router', () => ({ useRouter: () => router }));

const { AppContext } = await import('@components/common/context/AppProvider');
const { default: useProfileBannerState } = await import('@hooks/useProfileBannerState');
const { BAND_SLOT_ATTR, bandSlotScript } = await import('@utility/band-slot');

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

describe('useProfileBannerState ad-block ask', () => {
  it.each([
    ['takes the free band on a wiki page', '/wiki/[kind]/[slug]', { isAdBlockAsk: true, isVisible: true }],
    ['gives way to the guest banner on the dashboard', '/dashboard', { isAdBlockAsk: false, isVisible: true }]
  ])('%s', (_, pathname, expected) => {
    expect(run(pathname, { ...anonymous, adBlockAsk: true })).toMatchObject(expected);
  });
});

// The script is a string, so nothing else reads it. Each row is a visitor: where they land, the hint they carry, and the
// state the app lands them in. The script's guess and the hook's answer have to agree, or the page jumps.
describe('bandSlotScript guesses the hook', () => {
  const held = (pathname, search, hint) => {
    document.documentElement.removeAttribute(BAND_SLOT_ATTR);
    window.history.replaceState(null, '', `/${search}`);
    if (hint) localStorage.setItem('authHint', hint);
    else localStorage.removeItem('authHint');
    const script = bandSlotScript(pathname);
    if (script) new Function(script)();
    return document.documentElement.hasAttribute(BAND_SLOT_ATTR);
  };

  it.each([
    ['/dashboard', '', null, anonymous],
    ['/dashboard', '', 'no', anonymous],
    ['/dashboard', '', 'yes', { signedIn: true }],
    ['/dashboard', '?demo=true', 'yes', { demo: true }],
    ['/settings', '', null, anonymous],
    ['/settings', '?demo=true', null, { demo: true }],
    ['/wiki/[kind]', '', null, anonymous],
    ['/wiki/[kind]', '?demo=true', null, { demo: true }],
    ['/wiki/[kind]', '?profile=someone', 'no', { profile: true }],
    ['/', '', null, anonymous],
    ['/', '?demo=true', null, { demo: true }],
    ['/', '?profile=someone', null, { profile: true }]
  ])('%s%s, hint %s', (pathname, search, hint, state) => {
    const query = Object.fromEntries(new URLSearchParams(search));
    expect(held(pathname, search, hint)).toBe(run(pathname, state, query).isVisible);
  });

  it('reads storage that throws as a first visit', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('site data blocked');
    });
    expect(held('/dashboard', '', null)).toBe(true);
    getItem.mockRestore();
  });
});
