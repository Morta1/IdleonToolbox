// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const router = vi.hoisted(() => ({ pathname: '/account/worlds/alchemy', query: {} }));
vi.mock('next/router', () => ({ useRouter: () => router }));

const { AppContext } = await import('@components/common/context/AppProvider');
const { default: usePin } = await import('@components/common/favorites/usePin');

const pins = [
  { name: 'alchemy', tab: 'Bubbles', url: '/account/worlds/alchemy' },
  { name: 'alchemy', tab: 'Bubbles', nestedTab: 'Power', deeplyNestedTab: 'Cauldron', url: '/account/worlds/alchemy' },
  { name: 'alchemy', tab: 'Vials', url: '/account/worlds/alchemy' },
  { name: 'stats', url: '/account/misc/stats' }
];

const togglePinOn = (query) => {
  router.query = query;
  const dispatch = vi.fn();
  const wrapper = ({ children }) => (
    <AppContext.Provider value={{ state: { pinnedPages: pins }, dispatch }}>{children}</AppContext.Provider>
  );
  const { result } = renderHook(usePin, { wrapper });
  act(() => result.current.togglePin());
  return dispatch.mock.calls[0][0].data;
};

describe('usePin togglePin', () => {
  beforeEach(() => localStorage.clear());

  it.each([
    ['a pin without a deep tab', { t: 'Bubbles' }, 0],
    ['a pin with a deep tab', { t: 'Bubbles', nt: 'Power', dnt: 'Cauldron' }, 1]
  ])('unpinning %s removes only that pin', (_, query, removed) => {
    expect(togglePinOn(query)).toEqual(pins.filter((_, index) => index !== removed));
  });

  it('pins a page that is not pinned yet', () => {
    expect(togglePinOn({ t: 'Liquid' })).toEqual([
      ...pins,
      { name: 'alchemy', tab: 'Liquid', nestedTab: undefined, deeplyNestedTab: undefined, url: '/account/worlds/alchemy' }
    ]);
  });
});
