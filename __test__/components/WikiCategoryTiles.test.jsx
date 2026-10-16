// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import CategoryTiles from '@components/wiki/CategoryTiles';
import { KIND_PLURALS, KIND_SHORT_PLURALS } from '@utility/wiki/kind-labels.mjs';
import { KIND_GROUPS, LISTED_KINDS, SYSTEMS, listingCounts, listingHref, systemHref } from '@utility/wiki/kinds.mjs';
import searchIndex from '../../data/wiki-search-index.json';

// The count on a row is the number of rows its category listing shows, so it comes from the same
// predicate the listing page filters with.
const counts = listingCounts(searchIndex);

const renderTiles = (onGo = vi.fn()) => ({
  onGo,
  ...render(<CategoryTiles counts={counts} onGo={onGo}/>)
});

describe('CategoryTiles', () => {
  // Render order: the always-open groups' tiles, then each folding group's loose kinds, then each of its
  // systems' heading followed by that system's kinds. Kinds and systems with no rows are left out.
  it('links every listed kind and system that has rows, in render order, each kind ending in its row count', () => {
    const { container } = renderTiles();
    const groups = [...KIND_GROUPS.filter((group) => !group.collapsible), ...KIND_GROUPS.filter((group) => group.collapsible)];
    const rowsOf = (kinds) => kinds.filter((kind) => counts[kind]);
    const expected = groups.flatMap((group) => (group.collapsible
      ? [
        ...rowsOf(group.entries.filter((entry) => typeof entry === 'string')).map(listingHref),
        ...SYSTEMS.filter((system) => system.group === group.label && rowsOf(system.kinds).length)
          .flatMap((system) => [systemHref(system), ...rowsOf(system.kinds).map(listingHref)])
      ]
      : rowsOf(group.kinds).map(listingHref)));
    const links = [...container.querySelectorAll('a')];
    const systemHrefs = SYSTEMS.map(systemHref);
    const kindLinks = links.filter((link) => !systemHrefs.includes(link.getAttribute('href')));
    const countText = LISTED_KINDS.filter((kind) => counts[kind]).map((kind) => counts[kind].toLocaleString('en-US'));

    expect(links.map((link) => link.getAttribute('href'))).toEqual(expected);
    expect(kindLinks.map((link, i) => link.textContent.slice(-countText[i].length))).toEqual(countText);
  });

  it('titles each group that has rows, in the rail order', () => {
    const { container } = renderTiles();
    expect([...container.querySelectorAll('h2')].map((heading) => heading.textContent)).toEqual(
      KIND_GROUPS.filter((group) => group.kinds.some((kind) => counts[kind])).map((group) => group.label)
    );
  });

  // A system's kinds and a shortLabels group's loose kinds drop the words their heading already says, so each
  // sits right under that heading: the system's sub-heading, or the group title.
  it.each([
    ['sushiupgrade', KIND_SHORT_PLURALS.sushiupgrade, 'Sushi Station'],
    ['owl', KIND_SHORT_PLURALS.owl, 'Clickers'],
    ['pet', KIND_PLURALS.pet, 'Account']
  ])('labels %s with the rail rule, under its heading', (kind, label, heading) => {
    const { container } = renderTiles();
    const link = container.querySelector(`a[href="${listingHref(kind)}"]`);
    const headings = [...container.querySelectorAll('h2, li.MuiListSubheader-root')]
      .filter((node) => node.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect([link.textContent, headings.at(-1).textContent])
      .toEqual([`${label}${counts[kind].toLocaleString('en-US')}`, heading]);
  });

  it('routes a plain click in-app and leaves a modified click to the browser', () => {
    const seen = [];
    // After React's own handler has run, so it records whether the default was already prevented,
    // and stops jsdom trying to navigate.
    const record = (event) => {
      seen.push(event.defaultPrevented);
      event.preventDefault();
    };
    document.body.addEventListener('click', record);
    const { container, onGo } = renderTiles();
    const link = container.querySelector('a[href="/wiki/pet"]');

    fireEvent.click(link);
    expect(onGo).toHaveBeenCalledTimes(1);
    expect(onGo).toHaveBeenCalledWith('/wiki/pet');

    fireEvent.click(link, { ctrlKey: true });
    document.body.removeEventListener('click', record);
    expect(onGo).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([true, false]);
  });

  it('routes a plain click on a system heading in-app and leaves a modified click to the browser', () => {
    const seen = [];
    const record = (event) => {
      seen.push(event.defaultPrevented);
      event.preventDefault();
    };
    document.body.addEventListener('click', record);
    const { container, onGo } = renderTiles();
    const heading = container.querySelector('li.MuiListSubheader-root a[href="/wiki/sneaking"]');

    fireEvent.click(heading);
    fireEvent.click(heading, { ctrlKey: true });
    document.body.removeEventListener('click', record);
    expect([onGo.mock.calls, seen, heading.textContent]).toEqual([[['/wiki/sneaking']], [true, false], 'Sneaking']);
  });
});
