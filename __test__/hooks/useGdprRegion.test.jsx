// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useGdprRegion from '@hooks/useGdprRegion';

const fire = (name, detail) => act(() => document.dispatchEvent(new CustomEvent(name, { detail })));

describe('useGdprRegion', () => {
  afterEach(() => {
    delete window.__tcfapi;
    delete window.nitroAds;
  });

  it('is undecided until Nitro reports', () => {
    expect(renderHook(useGdprRegion).result.current).toBeNull();
  });

  it('is false once Nitro loads without a TCF CMP', () => {
    const { result } = renderHook(useGdprRegion);
    fire('nitroAds.loaded');
    expect(result.current).toBe(false);
  });

  it('is true once Nitro loads with a TCF CMP', () => {
    window.__tcfapi = () => {};
    const { result } = renderHook(useGdprRegion);
    fire('nitroAds.loaded');
    expect(result.current).toBe(true);
  });

  // An ad blocker stops Nitro before it can tell where the visitor is. Treating that as
  // "not GDPR" showed the site's own Accept/Decline banner to blocked EU visitors, outside TCF.
  it('stays undecided when an ad blocker stops Nitro', () => {
    const { result } = renderHook(useGdprRegion);
    fire('np.blocking', { blocking: true });
    expect(result.current).toBeNull();
  });
});
