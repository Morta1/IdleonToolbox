// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import MonsterInfo from '@components/wiki/MonsterInfo';
import { navigateOnPlainClick } from '@components/wiki/links';

const valueOf = (label) => screen.getByText(label).nextElementSibling.textContent;

const renderInfo = (stats) => render(
  <MonsterInfo node={{ kind: 'monster', name: 'Test', stats, location: null }} index={{ byId: {} }}
               onNavigate={() => {}}/>
);

describe('MonsterInfo accuracy rows', () => {
  it.each([
    ['the monster curve for monsters', { defence: 230, hitCurve: 'monster' }, '116', '346'],
    ['the resource curve for ores, trees, fish and bugs', { defence: 25, hitCurve: 'resource' }, '7', '50'],
    ['the monster curve when the graph has no curve', { defence: 230 }, '116', '346']
  ])('uses %s', (_, stats, low, high) => {
    renderInfo(stats);
    expect([valueOf('5% Accuracy'), valueOf('100% Accuracy')]).toEqual([low, high]);
  });
});

describe('MonsterInfo card ladder', () => {
  // One cell per card tier, Base to the cap (CardLv).
  it('reads the card bonus at every tier', () => {
    render(<MonsterInfo node={{ kind: 'monster', name: 'Test', stats: null, location: null }} index={{ byId: {} }}
                        card={{ effect: '{%_Base_Damage', bonus: 4 }} cardId={'item:CardsA0'} onNavigate={() => {}}/>);
    const box = within(screen.getByText('Card info').closest('section'));
    expect([box.getAllByText(/^\d+$/).map((node) => node.textContent), box.getAllByRole('img').map((node) => node.getAttribute('alt'))]).toEqual([
      ['4', '8', '12', '16', '20', '24', '28'],
      ['1 star', '2 star', '3 star', '4 star', '5 star', '6 star']
    ]);
  });
});

describe('MonsterInfo location rows', () => {
  const node = {
    kind: 'monster', name: 'Test', stats: null,
    location: { world: 7, area: 'Refraction_Bend', mapIndex: 301 }
  };
  const byId = {
    'world:7': { kind: 'world', rawName: '7', name: 'Shimmerfin_Deep', slug: 'shimmerfin-deep' },
    'map:301': { kind: 'map', rawName: '301', name: 'Refraction_Bend', slug: 'refraction-bend' }
  };
  const hrefFor = (id) => {
    const target = byId[id];
    return target?.slug ? `/wiki/${target.kind}/${target.slug}` : null;
  };

  it('names the world from its node, links to the page and routes a plain click in-app', () => {
    const onNavigate = vi.fn();
    render(<MonsterInfo node={node} index={{ byId }} hrefFor={hrefFor} onNavigate={onNavigate}/>);
    const world = screen.getByRole('link', { name: 'Shimmerfin Deep' });
    expect(world.getAttribute('href')).toBe('/wiki/world/shimmerfin-deep');
    expect(screen.getByRole('link', { name: 'Refraction Bend' }).getAttribute('href')).toBe('/wiki/map/refraction-bend');
    fireEvent.click(world);
    expect(onNavigate.mock.calls).toEqual([['world:7']]);
  });

  it.each([
    ['has no such world', {}],
    ['has the world but not as a page', { 'world:7': { ...byId['world:7'], navigable: false } }]
  ])('falls back to the world number when the graph %s', (unused, worlds) => {
    render(<MonsterInfo node={node} index={{ byId: worlds }} hrefFor={hrefFor} onNavigate={() => {}}/>);
    expect(valueOf('World')).toBe('World 7');
  });
});

// The click rule every wiki link shares; the component tests only check that a link is wired to it.
describe('navigateOnPlainClick', () => {
  // [routed in-app, default prevented] for one click.
  const click = (hasHref, event) => {
    const onNavigate = vi.fn();
    const preventDefault = vi.fn();
    navigateOnPlainClick(onNavigate, 'world:7', hasHref)({ button: 0, preventDefault, ...event });
    return [onNavigate.mock.calls.length, preventDefault.mock.calls.length];
  };

  it('routes a plain click in-app, and leaves a modified click to the browser only where there is an anchor to open', () => {
    expect({
      plain: click(true, {}),
      ctrl: click(true, { ctrlKey: true }),
      middle: click(true, { button: 1 }),
      ctrlOnButton: click(false, { ctrlKey: true })
    }).toEqual({ plain: [1, 1], ctrl: [0, 0], middle: [0, 0], ctrlOnButton: [1, 1] });
  });
});
