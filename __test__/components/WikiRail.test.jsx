// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LISTED_KINDS, SYSTEMS, listingHref, systemHref } from '@utility/wiki/kinds.mjs';

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
  // Folding hides, never unmounts: every system page is linked from every wiki page's export.
  it('links every system page, in rail order, with every fold closed', () => {
    const { nav, hrefs } = renderRail();
    expect([
      hrefs.filter((href) => SYSTEM_HREFS.includes(href)),
      [...new Set([...nav.querySelectorAll('[aria-expanded]')].map((node) => node.getAttribute('aria-expanded')))]
    ]).toEqual([SYSTEM_HREFS, ['false']]);
  });

  it('links every listing through listingHref', () => {
    const { hrefs } = renderRail();
    expect(hrefs.filter((href) => !SYSTEM_HREFS.includes(href) && !OWN_HREFS.includes(href)))
      .toEqual(LISTED_KINDS.map(listingHref));
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
