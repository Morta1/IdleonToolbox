// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { slugProps } from '@utility/wiki/static-pages.mjs';
import { entityPath } from '@utility/wiki/kinds.mjs';

const replace = vi.hoisted(() => vi.fn());
vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/wiki/[kind]/[slug]', query: { kind: 'god', slug: 'x', demo: 'true' }, isReady: true, replace })
}));
// next/head only reaches document.head through Next's head manager; rendered in place, React 19 hoists the tags there itself.
vi.mock('next/head', () => ({ default: ({ children }) => <>{children}</> }));

const WikiRedirectPage = (await import('@components/wiki/WikiRedirectPage')).default;

const { props } = slugProps('god', 'goharut');

describe('WikiRedirectPage', () => {
  it('names the new URL as canonical, refreshes to it, links it, and replaces the route keeping the session query', () => {
    const to = entityPath('god', 'goharut');
    const { container } = render(<WikiRedirectPage {...props}/>);
    expect({
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      refresh: document.querySelector('meta[http-equiv="refresh"]')?.getAttribute('content'),
      link: container.querySelector('a')?.getAttribute('href'),
      replaced: replace.mock.calls
    }).toEqual({
      canonical: `https://idleontoolbox.com${to}`,
      refresh: `0; url=${to}`,
      link: to,
      replaced: [[{ pathname: to, query: { demo: 'true' } }]]
    });
    expect(container.textContent).toContain('This page moved to');
  });
});
