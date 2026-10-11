// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PAGE_SEO } from '../../data/page-seo';

let pathname = '/';
vi.mock('next/router', () => ({ useRouter: () => ({ pathname }) }));

const PageTitle = (await import('@components/common/PageTitle')).default;

describe('PageTitle', () => {
  beforeEach(() => { pathname = '/'; });

  // /tools/builds/[slug]: PAGE_SEO is keyed by route pattern, so its entry ("Idleon Builds by Class")
  // is a fallback shared by 22 class pages and every build page, wrong copy on all of them. Those
  // pages draw their own h1, so PageTitle must stay out.
  // /tools/builds: the hub shares BuildsBrowser's header with the class pages, so it draws the same
  // h1 they do. A NavBar title on top of that gave the hub two h1s and moved the whole page every
  // time a visitor switched between "All" and a class.
  it.each([
    ['the homepage, which has its own h1', '/'],
    ['/settings, which draws its own title', '/settings'],
    ['/tools/builds/[slug], which draws its own title per page', '/tools/builds/[slug]'],
    ['/tools/builds, which shares the class pages\' header', '/tools/builds'],
    ['a route with no SEO entry', '/not/a/real/route'],
    ['a noindex page', Object.entries(PAGE_SEO).find(([, seo]) => seo.noindex)?.[0]]
  ])('renders nothing on %s', (_label, route) => {
    expect(route, 'expected at least one noindex route in PAGE_SEO').toBeTruthy();
    pathname = route;
    const { container } = render(<PageTitle/>);
    expect(container.querySelector('h1')).toBeNull();
  });

  it('renders the page name as exactly one h1, without the site suffix', () => {
    pathname = '/account/world-1/anvil';
    const { container } = render(<PageTitle/>);
    const headings = container.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe('Anvil');
    expect(PAGE_SEO['/account/world-1/anvil'].title).toContain('| Idleon Toolbox');
    expect(headings[0].textContent).not.toContain('Idleon Toolbox');
  });

  it('has a title for every indexable page it will be rendered on', () => {
    const missing = Object.entries(PAGE_SEO)
      .filter(([route, seo]) => route !== '/' && !seo.noindex)
      .filter(([, seo]) => !seo.title?.replace(/\s*\|.*$/, '').trim())
      .map(([route]) => route);
    expect(missing).toEqual([]);
  });
});
