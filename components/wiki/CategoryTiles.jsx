import React from 'react';
import { Box, Card, Link, List, ListSubheader, Stack, Typography } from '@mui/material';
import { KIND_GROUPS, systemHref, systemsWithRows } from '@utility/wiki/kinds.mjs';
import { KindLink, KindTile, TILE_GRID, kindLabel } from './KindLink';
import { goOnPlainClick, navigateOnPlainClick } from './links';

// The registry test reads the art map from here.
export { KIND_ART } from './kind-art';

// h2: the page's h1 is the NavBar's title, and nothing else on the home is a heading.
const GroupTitle = ({ children }) => <Typography
  component={'h2'}
  variant={'subtitle2'}
  color={'text.secondary'}
  textTransform={'uppercase'}
  letterSpacing={0.5}
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
const CategoryTiles = ({ counts, onGo }) => {
  const goTo = goOnPlainClick(onGo);

  const kindRow = (kind, short) => <KindLink
    key={kind}
    kind={kind}
    label={kindLabel(kind, { short })}
    count={counts[kind]}
    artSize={20}
    compact
    go={goTo}
  />;

  const groups = KIND_GROUPS.filter((group) => group.kinds.some((kind) => counts[kind]));

  return <Stack gap={2.5}>
    {groups.filter((group) => !group.collapsible).map((group) => <Stack key={group.label} gap={1}>
      <GroupTitle>{group.label}</GroupTitle>
      <Box sx={TILE_GRID}>
        {group.kinds.filter((kind) => counts[kind]).map((kind) => <KindTile key={kind} kind={kind} count={counts[kind]} go={goTo}/>)}
      </Box>
    </Stack>)}
    <Box sx={{ columnCount: { xs: 1, sm: 2, lg: 3 }, columnGap: 2 }}>
      {groups.filter((group) => group.collapsible).map((group) => {
        const loose = group.entries.filter((entry) => typeof entry === 'string' && counts[entry]);
        const systems = systemsWithRows(counts).filter((system) => system.group === group.label);
        return <Card key={group.label} variant={'outlined'} sx={{ breakInside: 'avoid', mb: 2, display: 'inline-block', width: '100%' }}>
          <Box sx={{ px: 2, pt: 1.25, pb: 0.5 }}>
            <GroupTitle>{group.label}</GroupTitle>
          </Box>
          <List dense disablePadding sx={{ pb: 0.5 }}>
            {loose.map((kind) => kindRow(kind, group.shortLabels))}
            {systems.map((system) => <React.Fragment key={system.label}>
              {/* An li like the rows beside it: a <p> is not a valid child of the list. The heading is the system's page. */}
              <ListSubheader disableSticky sx={{ typography: 'body2', color: 'text.secondary', fontWeight: 500, px: 2, pt: 0.75, bgcolor: 'transparent' }}>
                <Link href={systemHref(system)} underline={'hover'} color={'inherit'}
                      onClick={navigateOnPlainClick(onGo, systemHref(system), true)}>
                  {system.label}
                </Link>
              </ListSubheader>
              {system.kinds.map((kind) => kindRow(kind, true))}
            </React.Fragment>)}
          </List>
        </Card>;
      })}
    </Box>
  </Stack>;
};

export default CategoryTiles;
