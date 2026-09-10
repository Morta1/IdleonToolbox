// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from '@mui/material';
import RelationTable from '@components/wiki/RelationTable';
import darkTheme from '../../styles/theme/darkTheme';

// The table caps itself at 50 rows behind a "Show more" link, so everything past the cap has to
// ship as a hidden anchor or a crawler never reaches it.

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
    const props = makeProps(60);
    const html = renderToString(<ThemeProvider theme={darkTheme}><RelationTable {...props}/></ThemeProvider>);
    const hrefs = [...html.matchAll(/href="(\/wiki\/item\/item-\d+)"/g)].map((match) => match[1]);
    expect(new Set(hrefs).size).toBe(60);
  });
});
