// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import PreHydrationLoader from '@components/common/PreHydrationLoader';
import { PAGE_H1_SX } from '@components/common/PageTitle';

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

// Field data: the LCP element on nearly every page is the h1, painted only after hydration.
// Shipping it in the HTML is the whole point of this block.
describe('page heading in the export', () => {
  it('ships the heading as the page h1, with its description', () => {
    const html = renderToString(<PreHydrationLoader heading="Stamps" description="Track your stamps"/>);
    expect(html).toMatch(/<h1[^>]*>Stamps<\/h1>/);
    expect(html).toContain('Track your stamps');
  });

  // Chrome moves LCP to a later paint only when a LARGER element arrives. The hydrated h1 replaces
  // this one, so if PageTitle's styling ever diverged, the early paint would stop counting.
  it('draws the h1 with exactly the styling PageTitle uses after hydration', () => {
    expect(PAGE_H1_SX).toMatchObject({ fontSize: 24, fontWeight: 600 });
  });

  // The cookie-consent bar's text block is ~14,000px^2 and paints at hydration; a body-size
  // description (~13,000px^2) lost to it on every first visit. Subtitle size clears it.
  it('draws the description at subtitle size, so the cookie bar cannot outsize it', () => {
    const html = renderToString(<PreHydrationLoader heading="Stamps" description="Track your stamps"/>);
    expect(html).toMatch(/<p class="[^"]*MuiTypography-h6[^"]*">Track your stamps<\/p>/);
  });

  it('ships nothing but the loader when the page has no heading', () => {
    const html = renderToString(<PreHydrationLoader/>);
    expect(html).not.toContain('<h1');
    expect(html).not.toContain('<header');
  });
});

// The hero is larger than any text on the landing page, so without it here LCP would re-anchor to
// its post-hydration paint and the heading would have bought nothing.
describe('landing page hero in the export', () => {
  const hero = { src: '/etc/bg_0.png', alt: 'screenshot' };

  it('ships the hero image, marked high priority', () => {
    const html = renderToString(<PreHydrationLoader heading="Idleon Toolbox" hero={hero}/>);
    expect(html).toMatch(/<img[^>]+src="\/etc\/bg_0\.png"/);
    expect(html).toMatch(/<img[^>]+fetchpriority="high"/i);
  });

  // Intrinsic size on the tag so the box is reserved before the bytes arrive - a late-sizing hero
  // is a layout shift on the one page most visitors land on.
  it('declares the image dimensions', () => {
    const html = renderToString(<PreHydrationLoader heading="Idleon Toolbox" hero={hero}/>);
    expect(html).toMatch(/<img[^>]+width="1200"[^>]+height="674"/);
  });

  // Measured: the rotation's second image is one pixel taller than the first, and with the height
  // left to the image that made it a larger, later LCP candidate - LCP went from 164ms to 5.3s the
  // moment the first rotation landed. A fixed box with cover makes every image the same size.
  it('paints the hero into a fixed box, so no later image can be larger', () => {
    const html = renderToString(<PreHydrationLoader heading="Idleon Toolbox" hero={hero}/>);
    const img = html.match(/<img[^>]+>/)[0];
    expect(img).toMatch(/height:100%/);
    expect(img).toMatch(/object-fit:cover/);
  });
});

describe('after hydration', () => {
  // The effect runs during render() here, which is exactly the post-hydration state. If this ever
  // returned markup, every page would carry a permanent loader (and a second h1) above its real UI.
  it('unmounts itself, heading and hero included', () => {
    const { container } = render(
      <PreHydrationLoader heading="Stamps" description="d" hero={{ src: '/etc/bg_0.png', alt: '' }}/>
    );
    expect(container.innerHTML).toBe('');
  });
});
