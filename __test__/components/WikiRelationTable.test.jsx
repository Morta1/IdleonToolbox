// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import RelationTable from '@components/wiki/RelationTable';
import darkTheme from '../../styles/theme/darkTheme';

// The table caps a long group behind a "Show more" link, so everything past the cap has to ship as a
// hidden anchor or a crawler never reaches it.

const makeProps = (count) => {
  const byId = {};
  const rows = [];
  for (let i = 0; i < count; i++) {
    const id = `item:i${i}`;
    byId[id] = { kind: 'item', rawName: `i${i}`, name: `Item_${String(i).padStart(3, '0')}`, icon: null };
    rows.push({ key: id, otherId: id, paths: 1, combinedChance: 1 / (i + 1), edge: { meta: {} } });
  }
  return {
    groups: [{ key: 'drops', rows }],
    index: { byId },
    hrefFor: (id) => `/wiki/item/item-${id.replace('item:i', '')}`,
    onNavigate: () => {},
    showChance: true
  };
};

describe('RelationTable anchors', () => {
  it('ships one real link per row in the export, the rows past the cap included', () => {
    const props = makeProps(90);
    const html = renderToString(<ThemeProvider theme={darkTheme}><RelationTable {...props}/></ThemeProvider>);
    const hrefs = [...html.matchAll(/href="(\/wiki\/item\/item-\d+)"/g)].map((match) => match[1]);
    expect(new Set(hrefs).size).toBe(90);
  });
});

describe('RelationTable on a phone', () => {
  it('hides the Chance column below sm, since the rate beside it says the same thing', () => {
    render(<ThemeProvider theme={darkTheme}><RelationTable {...makeProps(3)}/></ThemeProvider>);
    // jsdom resolves no media queries, so read the rules emotion emitted on the table for the heading's column.
    const column = [...screen.getByText('Chance').closest('th').classList].find((name) => name.startsWith('col-'));
    const css = [...document.querySelectorAll('style')].map((style) => style.textContent);
    const displayRules = css.filter((rule) => rule.includes(`th.${column}{`) && rule.includes('display:'));

    expect(displayRules).toEqual([
      expect.stringMatching(new RegExp(`^@media \\(min-width:0px\\)\\{\\.css-\\w+ th\\.${column}\\{[^}]*display:none;\\}\\}$`)),
      expect.stringMatching(new RegExp(`^@media \\(min-width:600px\\)\\{\\.css-\\w+ th\\.${column}\\{[^}]*display:table-cell;\\}\\}$`))
    ]);
  });
});
