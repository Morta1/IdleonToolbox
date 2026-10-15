// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import CategoryTiles from '@components/wiki/CategoryTiles';
import { kindLabel } from '@components/wiki/WikiRail';
import { KIND_PLURALS, KIND_SHORT_PLURALS } from '@utility/wiki/kind-labels.mjs';
import { inListing, KIND_GROUPS, LISTED_KINDS } from '@utility/wiki/kinds.mjs';
import searchIndex from '../../data/wiki-search-index.json';

// The count on a row is the number of rows its category listing shows, so it comes from the same
// predicate the listing page filters with.
const counts = {};
for (const row of searchIndex.filter(inListing)) counts[row.kind] = (counts[row.kind] || 0) + 1;

const renderTiles = (onSelect = vi.fn()) => ({
  onSelect,
  ...render(<CategoryTiles searchList={searchIndex} onSelect={onSelect}/>)
});

describe('CategoryTiles', () => {
  it('links every listed kind that has rows, in listing order, each ending in its row count', () => {
    const { container } = renderTiles();
    const links = [...container.querySelectorAll('a')];
    const listed = LISTED_KINDS.filter((kind) => counts[kind]);
    const countText = listed.map((kind) => counts[kind].toLocaleString('en-US'));

    expect(links.map((link) => link.getAttribute('href'))).toEqual(listed.map((kind) => `/wiki/${kind}`));
    expect(links.map((link, i) => link.textContent.slice(-countText[i].length))).toEqual(countText);
  });

  it('titles each group that has rows, in the rail order', () => {
    const { container } = renderTiles();
    expect([...container.querySelectorAll('h3')].map((heading) => heading.textContent)).toEqual(
      KIND_GROUPS.filter((group) => group.kinds.some((kind) => counts[kind])).map((group) => group.label)
    );
  });

  // A system's kinds and a shortLabels group's loose kinds drop the words their heading already says.
  it.each([
    ['sushiupgrade', KIND_SHORT_PLURALS.sushiupgrade, 'Sushi Station'],
    ['owl', KIND_SHORT_PLURALS.owl, 'Clickers'],
    ['pet', KIND_PLURALS.pet, 'Account']
  ])('labels %s with the rail rule', (kind, label, heading) => {
    const { container } = renderTiles();
    const link = container.querySelector(`a[href="/wiki/${kind}"]`);
    expect(link.textContent).toBe(`${label}${counts[kind].toLocaleString('en-US')}`);
    expect(kindLabel(kind, { short: true })).toBe(label);
    expect(link.closest('.MuiCard-root').textContent).toContain(heading);
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
    const { container, onSelect } = renderTiles();
    const link = container.querySelector('a[href="/wiki/pet"]');

    fireEvent.click(link);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('pet');

    fireEvent.click(link, { ctrlKey: true });
    document.body.removeEventListener('click', record);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([true, false]);
  });
});
