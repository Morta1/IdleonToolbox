import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Collapse, Divider, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Stack } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { KIND_GROUPS } from '@utility/wiki/kinds.mjs';
import { KIND_PLURALS } from './EntityPanel';
import { KIND_ART } from './CategoryTiles';
import WikiSearchBar from './WikiSearchBar';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { navBarHeight } from '@components/constants';

// Clears the fixed nav bar, the same way ConstructionMain's sticky board does. Pinning at the
// viewport top instead would bury the first rows behind the header.
const RAIL_TOP = navBarHeight + 8;

const KindLink = ({ kind, current, go }) => <ListItemButton
  component={'a'}
  href={`/wiki/${kind}`}
  selected={kind === current}
  onClick={(event) => go(event, `/wiki/${kind}`)}>
  <ListItemIcon sx={{ minWidth: 34 }}>
    <img src={`${prefix}${KIND_ART[kind]}`} alt="" width={24} height={24}
         style={{ objectFit: 'contain' }}/>
  </ListItemIcon>
  <ListItemText primary={KIND_PLURALS[kind] || kind}/>
</ListItemButton>;

// A world's systems fold under its heading so the rail stays short, and the group holding the page
// being read starts open. Collapse keeps its children mounted, so every link is still in the
// exported HTML for a crawler even while folded. The open state seeds from props only, which keeps
// the first render identical on the build machine and the client.
const RailGroup = ({ group, current, go }) => {
  const [open, setOpen] = useState(group.kinds.includes(current));
  if (!group.collapsible) {
    return <>
      <ListSubheader disableSticky sx={{ lineHeight: '32px', bgcolor: 'transparent' }}>
        {group.label}
      </ListSubheader>
      {group.kinds.map((kind) => <KindLink key={kind} kind={kind} current={current} go={go}/>)}
    </>;
  }
  return <>
    <ListItemButton onClick={() => setOpen(!open)} aria-expanded={open} sx={{ py: 0.25 }}>
      <ListItemText primary={group.label}
                    slotProps={{ primary: { variant: 'body2', color: 'text.secondary', fontWeight: 500 } }}/>
      {open ? <ExpandLess fontSize={'small'}/> : <ExpandMore fontSize={'small'}/>}
    </ListItemButton>
    <Collapse in={open}>
      <List dense disablePadding>
        {group.kinds.map((kind) => <KindLink key={kind} kind={kind} current={current} go={go}/>)}
      </List>
    </Collapse>
  </>;
};

// The wiki section's frame: search on top of every page, and a left rail of category links the
// way idleon.wiki keeps its categories in reach. Rail is desktop only; below md the tiles and
// back links already cover navigation. Real anchors, so middle-click, copy-link and modified
// clicks all behave, and hidden by CSS rather than by a condition so the hrefs stay in every
// wiki page's exported HTML, which is how a crawler reaches the categories.
const WikiRail = ({ current, children }) => {
  const router = useRouter();
  const go = (event, href) => {
    // Let the browser handle modified clicks (ctrl/cmd/shift/middle) so they open a new tab or window.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    router.push({ pathname: href, query: sessionQuery(router.query) });
  };

  return <Stack direction={'row'} gap={3} alignItems={'flex-start'}>
    <Box component={'nav'} aria-label={'Wiki categories'} sx={{
      display: { xs: 'none', md: 'block' },
      width: 190,
      flexShrink: 0,
      position: 'sticky',
      top: `${RAIL_TOP}px`,
      // An unfolded group can still outrun a short viewport once the rail pins, so it scrolls rather than
      // stranding the last categories. X stays hidden, which is what the rounded border needs.
      maxHeight: `calc(100vh - ${RAIL_TOP + 16}px)`,
      overflowX: 'hidden',
      overflowY: 'auto',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1
    }}>
      <List dense disablePadding>
        <ListItemButton component={'a'} href={'/wiki'} selected={!current}
                        onClick={(event) => go(event, '/wiki')}>
          <ListItemText primary={'Wiki Home'} slotProps={{ primary: { fontWeight: 600 } }}/>
        </ListItemButton>
        {KIND_GROUPS.map((group) => <RailGroup key={group.label} group={group} current={current} go={go}/>)}
        {/* Below the divider because it is not a category: it cuts across all of them. */}
        <Divider sx={{ my: 0.5 }}/>
        <ListItemButton component={'a'} href={'/wiki/changelog'} selected={current === 'changelog'}
                        onClick={(event) => go(event, '/wiki/changelog')}>
          <ListItemText primary={'Changelog'}/>
        </ListItemButton>
      </List>
    </Box>
    <Stack sx={{ flexGrow: 1, minWidth: 0 }} gap={3}>
      <WikiSearchBar/>
      <Box>
        {children}
      </Box>
    </Stack>
  </Stack>;
};

export default WikiRail;
