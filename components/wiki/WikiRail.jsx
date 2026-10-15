import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Collapse, Divider, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Stack } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { KIND_GROUPS } from '@utility/wiki/kinds.mjs';
import { KindLink, kindLabel } from './KindLink';
import { isModifiedClick } from './links';
import WikiSearchBar from './WikiSearchBar';
import { sessionQuery } from '@utility/nav-query';
import { navBarHeight } from '@components/constants';

// Clears the fixed nav bar, the same way ConstructionMain's sticky board does. Pinning at the
// viewport top instead would bury the first rows behind the header.
const RAIL_TOP = navBarHeight + 8;

// A fold that keeps its children mounted: Collapse only hides them, so every link is still in the
// exported HTML for a crawler even while folded. The open state seeds from props only, which keeps
// the first render identical on the build machine and the client. A system's fold sits among its
// world's kinds, so it takes a kind row's shape with the chevron where the art goes, which keeps it
// from reading as another world.
const Fold = ({ label, startOpen, system, children }) => {
  const [open, setOpen] = useState(startOpen);
  const chevron = open ? <ExpandLess fontSize={'small'}/> : <ExpandMore fontSize={'small'}/>;
  return <>
    <ListItemButton onClick={() => setOpen(!open)} aria-expanded={open} sx={{ py: system ? null : 0.25 }}>
      {system ? <ListItemIcon sx={{ minWidth: 34, pl: 0.25 }}>{chevron}</ListItemIcon> : null}
      <ListItemText primary={label} slotProps={{
        primary: system ? { fontWeight: 500 } : { variant: 'body2', color: 'text.secondary', fontWeight: 500 }
      }}/>
      {system ? null : chevron}
    </ListItemButton>
    <Collapse in={open}>
      <List dense disablePadding>
        {children}
      </List>
    </Collapse>
  </>;
};

// A game system's kinds sit one step in under its heading, and drop the system's name from their
// own, which the heading already says.
const RailEntries = ({ entries, shortLabels, current, go }) => entries.map((entry) => typeof entry === 'string'
  ? <KindLink key={entry} kind={entry} label={kindLabel(entry, { short: shortLabels })} current={current} go={go}/>
  : <Fold key={entry.label} label={entry.label} startOpen={entry.kinds.includes(current)} system>
    {entry.kinds.map((kind) => <KindLink key={kind} kind={kind} label={kindLabel(kind, { short: true })} current={current}
                                         go={go} inset/>)}
  </Fold>);

// A world's systems fold under its heading so the rail stays short, and the group and system holding
// the page being read start open.
const RailGroup = ({ group, current, go }) => {
  if (!group.collapsible) {
    return <>
      <ListSubheader disableSticky sx={{ lineHeight: '32px', bgcolor: 'transparent' }}>
        {group.label}
      </ListSubheader>
      <RailEntries entries={group.entries} shortLabels={group.shortLabels} current={current} go={go}/>
    </>;
  }
  return <Fold label={group.label} startOpen={group.kinds.includes(current)}>
    <RailEntries entries={group.entries} shortLabels={group.shortLabels} current={current} go={go}/>
  </Fold>;
};

// The wiki section's frame: search on top of every page, and a left rail of category links the
// way idleon.wiki keeps its categories in reach. Rail is desktop only; below md the tiles and
// back links already cover navigation. Real anchors, so middle-click, copy-link and modified
// clicks all behave, and hidden by CSS rather than by a condition so the hrefs stay in every
// wiki page's exported HTML, which is how a crawler reaches the categories.
const WikiRail = ({ current, children }) => {
  const router = useRouter();
  const go = (event, href) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    router.push({ pathname: href, query: sessionQuery(router.query) });
  };

  return <Stack direction={'row'} gap={3} alignItems={'flex-start'}>
    <Box component={'nav'} aria-label={'Wiki categories'} sx={{
      display: { xs: 'none', md: 'block' },
      width: 250,
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
