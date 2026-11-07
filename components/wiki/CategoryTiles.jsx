import React from 'react';
import { Box, Link, List, ListSubheader, Stack, Typography } from '@mui/material';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import { KIND_GROUPS, systemHref, systemsWithRows } from '@utility/wiki/kinds.mjs';
import { KindLink, KindTile, kindLabel } from './KindLink';
import { goOnPlainClick, navigateOnPlainClick } from './links';

// The registry test reads the art map from here.
export { KIND_ART } from './kind-art';

// h2: the page's h1 is the NavBar's title, and nothing else on the home is a heading.
const GroupTitle = ({ children }) => <Typography
  component={'h2'}
  variant={'groupLabel'}
  color={'text.secondary'}
>
  {children}
</Typography>;

// The way in for someone who does not yet know what to search for. Counts are shown because they
// set the expectation before the click: Shops is nine rows, Items is a few thousand. A count is the
// number of rows the kind's listing shows (inListing), not the number of pages the kind has.
//
// The home is the phone's whole index (the rail is hidden below md), so every row is a real anchor
// and the layout is CSS-only: the Encyclopedia keeps its big tiles, and every other group is one
// card in a masonry of columns, which reads as a dense list on a phone and as three columns on a desktop.
// `counts` is rows per kind, worked out at build time (wikiHomeProps), so the export carries every link.
// The columns follow the width beside the rail, not the window's. A column holds a row's art, its longest word
// ("Constellations") and its count from 205 px, so a name wraps between words and never reaches its count.
const COLUMNS_SX = {
  columnCount: 1,
  columnGap: 2,
  '@container (min-width:426px)': { columnCount: 2 },
  '@container (min-width:647px)': { columnCount: 3 }
};

const CategoryTiles = ({ counts, onGo }) => {
  const goTo = goOnPlainClick(onGo);

  const kindRow = (kind, short) => <KindLink
    key={kind}
    kind={kind}
    label={kindLabel(kind, { short })}
    count={counts[kind]}
    compact
    go={goTo}
  />;

  const groups = KIND_GROUPS.filter((group) => group.kinds.some((kind) => counts[kind]));

  return <Stack gap={2.5}>
    {groups.filter((group) => !group.collapsible).map((group) => <Stack key={group.label} gap={1}>
      <GroupTitle>{group.label}</GroupTitle>
      <CardGrid size={'s'}>
        {group.kinds.filter((kind) => counts[kind]).map((kind) => <KindTile key={kind} kind={kind} count={counts[kind]} go={goTo}/>)}
      </CardGrid>
    </Stack>)}
    <Box sx={{ containerType: 'inline-size' }}><Box sx={COLUMNS_SX}>
      {groups.filter((group) => group.collapsible).map((group) => {
        const loose = group.entries.filter((entry) => typeof entry === 'string' && counts[entry]);
        const systems = systemsWithRows(counts).filter((system) => system.group === group.label);
        return <Panel key={group.label} title={group.label} sx={{ breakInside: 'avoid', mb: 2, display: 'inline-block', width: '100%', boxSizing: 'border-box' }}>
          <List dense disablePadding sx={{ pb: 0.5 }}>
            {loose.map((kind) => kindRow(kind, group.shortLabels))}
            {systems.map((system) => <React.Fragment key={system.label}>
              {/* An li like the rows beside it: a <p> is not a valid child of the list. The heading is the system's page. */}
              <ListSubheader disableSticky sx={{ typography: 'body2', color: 'text.secondary', fontWeight: 'fontWeightMedium', px: 2, pt: 0.75, bgcolor: 'transparent' }}>
                <Link href={systemHref(system)} color={'inherit'}
                      onClick={navigateOnPlainClick(onGo, systemHref(system), true)}>
                  {system.label}
                </Link>
              </ListSubheader>
              {system.kinds.map((kind) => kindRow(kind, true))}
            </React.Fragment>)}
          </List>
        </Panel>;
      })}
    </Box></Box>
  </Stack>;
};

export default CategoryTiles;
