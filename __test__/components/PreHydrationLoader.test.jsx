// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import PreHydrationLoader from '@components/common/PreHydrationLoader';

// Nothing below <WaitForRouter> in _app.jsx renders at build time, so this is what stands between
// a visitor and a blank screen for the whole hydration window. Two properties, pulling opposite
// ways: it must be in the exported HTML, and it must be gone once the real UI can render.

describe('server render (what ships in out/*.html)', () => {
  it('ships the loader', () => {
    const html = renderToString(<PreHydrationLoader/>);
    expect(html).toContain('data-testid="page-loader"');
  });

  // The handoff is only invisible if both sides are the same component. If this stops being
  // SimpleLoader, the screen changes at hydration for no reason a visitor can understand.
  it('is the same loader DataLoadingWrapper shows after the gate opens', () => {
    expect(renderToString(<PreHydrationLoader/>)).toContain('Coins.gif');
  });
});

describe('after hydration', () => {
  // The effect runs during render() here, which is exactly the post-hydration state. If this ever
  // returned markup, every page would carry a permanent loader above its real UI.
  it('unmounts itself', () => {
    const { container } = render(<PreHydrationLoader/>);
    expect(container.innerHTML).toBe('');
  });
});
