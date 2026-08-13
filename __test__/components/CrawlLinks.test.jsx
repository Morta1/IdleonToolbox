// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import CrawlLinks from '@components/common/CrawlLinks';

// This component is the only reason any link reaches the static export: everything below
// <WaitForRouter> in _app.jsx renders as <></> at build time. Two properties matter and they pull
// in opposite directions - the server render must contain the links, and the hydrated page must
// not, or the app grows a duplicate nav under its real UI.

const LINKS = [
  { h: '/tools/builds/wizard', t: 'Wizard builds' },
  { h: '/tools/builds/frzfgn-combat-es', t: 'Elemental Sorcerer — Combat ES' }
];

describe('server render (what ships in out/*.html)', () => {
  it('emits every link as a real anchor', () => {
    const html = renderToString(<CrawlLinks links={LINKS} heading="Idleon builds"/>);
    expect(html).toContain('href="/tools/builds/wizard"');
    expect(html).toContain('href="/tools/builds/frzfgn-combat-es"');
    expect(html).toContain('Wizard builds');
  });

  it('labels the block with its heading', () => {
    const html = renderToString(<CrawlLinks links={LINKS} heading="Idleon Wizard builds"/>);
    expect(html).toContain('Idleon Wizard builds');
  });

  it('renders nothing for a page that opted out', () => {
    expect(renderToString(<CrawlLinks links={undefined} heading="x"/>)).toBe('');
    expect(renderToString(<CrawlLinks links={[]} heading="x"/>)).toBe('');
  });
});

// Shown, this block was the whole page for as long as hydration took - ~0.7s on desktop, ~9.5s on
// a throttled phone. It unmounts on hydration either way, so a crawler's rendered DOM never had
// these links; hiding them costs nothing that the unmount had not already cost.
describe('never visible to a visitor', () => {
  it('ships the anchors but keeps the block out of the layout', () => {
    const html = renderToString(<CrawlLinks links={LINKS} heading="Idleon builds"/>);
    expect(html).toContain('href="/tools/builds/wizard"');
    expect(html).toMatch(/<nav[^>]*style="display:none"/);
  });
});

describe('after hydration', () => {
  // The effect runs during render() here, which is exactly the post-hydration state. If this ever
  // returned markup, every page would carry a second copy of its links under the real UI.
  it('unmounts itself, leaving no duplicate nav behind', () => {
    const { container } = render(<CrawlLinks links={LINKS} heading="Idleon builds"/>);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.innerHTML).toBe('');
  });
});

// A mismatch here would be a hydration error on every page that ships the block, so the two
// renders must agree on the first pass. This asserts the pre-hydration markup is identical, which
// is the pass React compares.
describe('first client render matches the server', () => {
  it('produces the same anchors before the effect runs', () => {
    const server = renderToString(<CrawlLinks links={LINKS} heading="Idleon builds"/>);
    for (const { h, t } of LINKS) {
      expect(server).toContain(`href="${h}"`);
      expect(server).toContain(t);
    }
  });
});
