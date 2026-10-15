// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MonsterInfo from '@components/wiki/MonsterInfo';

const valueOf = (label) => screen.getByText(label).nextElementSibling.textContent;

const renderInfo = (stats) => render(
  <MonsterInfo node={{ kind: 'monster', name: 'Test', stats, location: null }} index={{ byId: {} }}
               onNavigate={() => {}}/>
);

describe('MonsterInfo accuracy rows', () => {
  it('uses the monster curve for monsters', () => {
    renderInfo({ defence: 230, hitCurve: 'monster' });
    expect(valueOf('5% Accuracy')).toBe('116');
    expect(valueOf('100% Accuracy')).toBe('346');
  });

  it('uses the resource curve for ores, trees, fish and bugs', () => {
    renderInfo({ defence: 25, hitCurve: 'resource' });
    expect(valueOf('5% Accuracy')).toBe('7');
    expect(valueOf('100% Accuracy')).toBe('50');
  });

  it('falls back to the monster curve when the graph has no curve', () => {
    renderInfo({ defence: 230 });
    expect(valueOf('5% Accuracy')).toBe('116');
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

  it('names the world from its node and links to the page', () => {
    render(<MonsterInfo node={node} index={{ byId }} hrefFor={hrefFor} onNavigate={() => {}}/>);
    expect(screen.getByRole('link', { name: 'Shimmerfin Deep' }).getAttribute('href')).toBe('/wiki/world/shimmerfin-deep');
    expect(screen.getByRole('link', { name: 'Refraction Bend' }).getAttribute('href')).toBe('/wiki/map/refraction-bend');
  });

  it.each([
    ['has no such world', {}],
    ['has the world but not as a page', { 'world:7': { ...byId['world:7'], navigable: false } }]
  ])('falls back to the world number when the graph %s', (unused, worlds) => {
    render(<MonsterInfo node={node} index={{ byId: worlds }} hrefFor={hrefFor} onNavigate={() => {}}/>);
    expect(valueOf('World')).toBe('World 7');
  });

  // A plain click routes in-app; a modified one is the browser's (a new tab), so it never reaches the router.
  it('routes a plain click on the world in-app and leaves a ctrl-click to the browser', () => {
    const onNavigate = vi.fn();
    render(<MonsterInfo node={node} index={{ byId }} hrefFor={hrefFor} onNavigate={onNavigate}/>);
    const world = screen.getByRole('link', { name: 'Shimmerfin Deep' });
    // Stops jsdom trying to follow the ctrl-click.
    const block = (event) => event.preventDefault();
    document.body.addEventListener('click', block);
    fireEvent.click(world);
    fireEvent.click(world, { ctrlKey: true });
    document.body.removeEventListener('click', block);
    expect(onNavigate.mock.calls).toEqual([['world:7']]);
  });
});
