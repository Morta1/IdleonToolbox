// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const router = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/router', () => ({ useRouter: () => router }));

const { default: useNavPrefetch } = await import('@hooks/useNavPrefetch');

describe('useNavPrefetch', () => {
  // undefined keeps next/link's default (prefetch in viewport); false leaves hover/touch only.
  // One route per side: which route is which is routeNeedsAccount's table, in AppProviderLazyEmptyAccount.
  it.each([
    ['/wiki/[kind]/[slug]', 'prefetches on hover only', false],
    ['/dashboard', 'keeps viewport prefetch', undefined]
  ])('%s %s', (pathname, _, prefetch) => {
    router.pathname = pathname;
    expect(renderHook(useNavPrefetch).result.current).toBe(prefetch);
  });
});
