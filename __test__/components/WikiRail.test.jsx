// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { KIND_GROUPS, LISTED_KINDS, SYSTEMS, listingHref, systemHref } from '@utility/wiki/kinds.mjs';

const push = vi.fn();
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/wiki/[kind]', query: {}, push }) }));

const WikiRail = (await import('@components/wiki/WikiRail')).default;

const SYSTEM_HREFS = SYSTEMS.map(systemHref);
const OWN_HREFS = ['/wiki', '/wiki/changelog'];

const renderRail = (props) => {
  const { container } = render(<WikiRail current={null} {...props}/>);
  const nav = container.querySelector('nav[aria-label="Wiki categories"]');
  const hrefs = [...nav.querySelectorAll('a[href]')].map((link) => link.getAttribute('href'));
  return { nav, hrefs };
};

describe('WikiRail', () => {
  // A closed fold leaves its links out of the page: the rail sits on every wiki page, and every fold's links on each of
  // 8,000 pages was half the export. The wiki home, system pages and breadcrumbs still link every listing for a crawler.
  it("ships only the open groups' links, every fold heading included", () => {
    const { nav, hrefs } = renderRail();
    const open = KIND_GROUPS.filter((group) => !group.collapsible).flatMap((group) => group.kinds);
    expect({
      listings: hrefs.filter((href) => !OWN_HREFS.includes(href)),
      folds: [...nav.querySelectorAll('[aria-expanded]')].map((node) => [node.textContent, node.getAttribute('aria-expanded')])
    }).toEqual({
      listings: LISTED_KINDS.filter((kind) => open.includes(kind)).map(listingHref),
      folds: KIND_GROUPS.filter((group) => group.collapsible).map((group) => [group.label, 'false'])
    });
  });

  it("renders a fold's links when it opens: its systems, and a system's listings when that opens", () => {
    const { nav } = renderRail();
    const linked = () => [...nav.querySelectorAll('a[href]')].map((link) => link.getAttribute('href'));
    fireEvent.click(screen.getByRole('button', { name: 'World 6' }));
    const world6 = SYSTEMS.filter((system) => system.group === 'World 6').map(systemHref);
    expect(world6.every((href) => linked().includes(href))).toBe(true);
    expect(linked()).not.toContain(listingHref('sneakfloor'));
    fireEvent.click(screen.getByRole('button', { name: 'Show Sneaking categories' }));
    expect(linked()).toContain(listingHref('sneakfloor'));
  });

  it('folds a system from its chevron without leaving the page', () => {
    renderRail();
    fireEvent.click(screen.getByRole('button', { name: 'World 6' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show Sneaking categories' }));
    expect(screen.getByRole('button', { name: 'Hide Sneaking categories' }).getAttribute('aria-expanded')).toBe('true');
    expect(push).not.toHaveBeenCalled();
  });

  // The system page is not a kind, so only its own label is selected, and its group and fold start open.
  it('selects the system being read, and nothing else', () => {
    const { nav } = renderRail({ currentSystem: 'equinox' });
    const selected = (href) => nav.querySelector(`a[href="${href}"]`).classList.contains('Mui-selected');
    expect([
      selected('/wiki/equinox'),
      selected('/wiki/equinox/upgrades'),
      selected('/wiki'),
      screen.getByRole('button', { name: 'Hide Equinox categories' }).getAttribute('aria-expanded'),
      screen.getByRole('button', { name: 'World 3' }).getAttribute('aria-expanded')
    ]).toEqual([true, false, false, 'true', 'true']);
  });
});
