// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const router = vi.hoisted(() => ({ pathname: '/account/worlds/alchemy', query: {} }));
vi.mock('next/router', () => ({ useRouter: () => router }));

const { default: usePin } = await import('@components/common/favorites/usePin');

const pins = [
  { name: 'alchemy', tab: 'Bubbles', url: '/account/worlds/alchemy' },
  { name: 'alchemy', tab: 'Bubbles', nestedTab: 'Power', deeplyNestedTab: 'Cauldron', url: '/account/worlds/alchemy' },
  { name: 'alchemy', tab: 'Vials', url: '/account/worlds/alchemy' },
  { name: 'stats', url: '/account/misc/stats' },
  { name: 'killroy', url: '/account/world-2/killroy' }
];

const togglePinOn = (query, pathname = '/account/worlds/alchemy') => {
  router.pathname = pathname;
  router.query = query;
  localStorage.setItem('pinnedPages', JSON.stringify(pins));
  const { result } = renderHook(usePin);
  act(() => result.current.togglePin());
  return result.current.pinnedPages;
};

describe('usePin togglePin', () => {
  beforeEach(() => localStorage.clear());

  it.each([
    ['a pin without a deep tab', { t: 'Bubbles' }, 0],
    ['a pin with a deep tab', { t: 'Bubbles', nt: 'Power', dnt: 'Cauldron' }, 1],
    ['a pin with no tab, from its first tab', { t: 'Schedule' }, 4, '/account/world-2/killroy']
  ])('unpinning %s removes only that pin', (_, query, removed, pathname) => {
    expect(togglePinOn(query, pathname)).toEqual(pins.filter((_, index) => index !== removed));
  });

  it('pins a page that is not pinned yet', () => {
    expect(togglePinOn({ t: 'Liquid' })).toEqual([
      ...pins,
      { name: 'alchemy', tab: 'Liquid', nestedTab: undefined, deeplyNestedTab: undefined, url: '/account/worlds/alchemy' }
    ]);
  });

  it('reads saved pins as they are, and treats junk in the key as no pins', () => {
    localStorage.setItem('pinnedPages', JSON.stringify(pins));
    expect(renderHook(usePin).result.current.pinnedPages).toEqual(pins);
    localStorage.setItem('pinnedPages', 'not json');
    expect(renderHook(usePin).result.current.pinnedPages).toEqual([]);
  });
});
