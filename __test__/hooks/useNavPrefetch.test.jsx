// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const router = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/router', () => ({ useRouter: () => router }));

const { default: useNavPrefetch } = await import('@hooks/useNavPrefetch');

describe('useNavPrefetch', () => {
  // undefined keeps next/link's default (prefetch in viewport); false leaves hover/touch only.
  it.each(['/', '/wiki/[kind]/[slug]', '/tools/builds/[slug]', '/guilds'])('%s prefetches on hover only', (pathname) => {
    router.pathname = pathname;
    expect(renderHook(useNavPrefetch).result.current).toBe(false);
  });

  it.each(['/dashboard', '/account/world-3/printer', '/tools/card-search', '/characters'])('%s keeps viewport prefetch', (pathname) => {
    router.pathname = pathname;
    expect(renderHook(useNavPrefetch).result.current).toBeUndefined();
  });
});
