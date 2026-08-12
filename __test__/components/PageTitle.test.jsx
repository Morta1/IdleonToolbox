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

  it('renders nothing on the homepage, which has its own h1', () => {
    pathname = '/';
    const { container } = render(<PageTitle/>);
    expect(container.querySelector('h1')).toBeNull();
  });

  it('renders the page name as an h1, without the site suffix', () => {
    pathname = '/account/world-1/anvil';
    const { container } = render(<PageTitle/>);
    const heading = container.querySelector('h1');
    expect(heading).not.toBeNull();
    expect(heading.textContent).toBe('Anvil');
    expect(PAGE_SEO['/account/world-1/anvil'].title).toContain('| Idleon Toolbox');
    expect(heading.textContent).not.toContain('Idleon Toolbox');
  });

  it('renders nothing on /settings, which draws its own title', () => {
    pathname = '/settings';
    const { container } = render(<PageTitle/>);
    expect(container.querySelector('h1')).toBeNull();
  });

  it('strips the site suffix whatever separator a title uses', () => {
    const everyTitle = Object.values(PAGE_SEO).map(({ title }) => title);
    expect(everyTitle.some((title) => /\|\s*Idleon Toolbox\s*$/.test(title))).toBe(true);

    const strip = (title) => title.replace(/\s*[|\-–—]\s*Idleon Toolbox\s*$/i, '').trim();
    expect(strip('Settings - Idleon Toolbox')).toBe('Settings');
    expect(strip('Settings | Idleon Toolbox')).toBe('Settings');
    expect(strip('Co-op Guide | Idleon Toolbox')).toBe('Co-op Guide');
  });

  it('renders nothing for a route with no SEO entry', () => {
    pathname = '/not/a/real/route';
    const { container } = render(<PageTitle/>);
    expect(container.querySelector('h1')).toBeNull();
  });

  it('renders nothing for a noindex page', () => {
    const noindexRoute = Object.entries(PAGE_SEO).find(([, seo]) => seo.noindex)?.[0];
    expect(noindexRoute, 'expected at least one noindex route in PAGE_SEO').toBeTruthy();
    pathname = noindexRoute;
    const { container } = render(<PageTitle/>);
    expect(container.querySelector('h1')).toBeNull();
  });

  it('produces exactly one heading, never a list', () => {
    pathname = '/account/world-5/slab';
    const { container } = render(<PageTitle/>);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  it('has a title for every indexable page it will be rendered on', () => {
    const missing = Object.entries(PAGE_SEO)
      .filter(([route, seo]) => route !== '/' && !seo.noindex)
      .filter(([, seo]) => !seo.title?.replace(/\s*\|.*$/, '').trim())
      .map(([route]) => route);
    expect(missing).toEqual([]);
  });
});
