import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Collapse, Divider, IconButton, List, ListItem, ListItemButton, ListItemText, ListSubheader, Stack } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { KIND_GROUPS, SYSTEMS, systemHref } from '@utility/wiki/kinds.mjs';
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
// the first render identical on the build machine and the client.
const Fold = ({ label, startOpen, children }) => {
  const [open, setOpen] = useState(startOpen);
  return <>
    <ListItemButton onClick={() => setOpen(!open)} aria-expanded={open} sx={{ py: 0.25 }}>
      <ListItemText primary={label} slotProps={{
        primary: { variant: 'body2', color: 'text.secondary', fontWeight: 500 }
      }}/>
      {open ? <ExpandLess fontSize={'small'}/> : <ExpandMore fontSize={'small'}/>}
    </ListItemButton>
    <Collapse in={open}>
      <List dense disablePadding>
        {children}
      </List>
    </Collapse>
  </>;
};

// A system's row is two controls: the label is the system's page and the chevron is the fold. It sits
// among its world's kinds, so it takes a kind row's shape with the chevron where the art goes, which
// keeps it from reading as another world. Its kinds stay mounted while folded, for the crawler.
const SystemFold = ({ system, startOpen, selected, go, children }) => {
  const [open, setOpen] = useState(startOpen);
  const href = systemHref(system);
  return <>
    <ListItem disablePadding>
      {/* 13px + the button's 5px padding puts the chevron where a kind row's art starts. */}
      <IconButton size={'small'} onClick={() => setOpen(!open)} aria-expanded={open}
                  aria-label={`${open ? 'Hide' : 'Show'} ${system.label} categories`} sx={{ ml: '13px' }}>
        {open ? <ExpandLess fontSize={'small'}/> : <ExpandMore fontSize={'small'}/>}
      </IconButton>
      <ListItemButton component={'a'} href={href} selected={selected} onClick={(event) => go(event, href)}
                      sx={{ pl: '7px' }}>
        <ListItemText primary={system.label} slotProps={{ primary: { fontWeight: 500 } }}/>
      </ListItemButton>
    </ListItem>
    <Collapse in={open}>
      <List dense disablePadding>
        {children}
      </List>
    </Collapse>
  </>;
};

const systemNamed = (label) => SYSTEMS.find((system) => system.label === label);

// A game system's kinds sit one step in under its heading, and drop the system's name from their
// own, which the heading already says.
const RailEntries = ({ entries, shortLabels, current, currentSystem, go }) => entries.map((entry) => {
  if (typeof entry === 'string') {
    return <KindLink key={entry} kind={entry} label={kindLabel(entry, { short: shortLabels })} current={current} go={go}/>;
  }
  const system = systemNamed(entry.label);
  return <SystemFold key={entry.label} system={system} go={go} selected={currentSystem === system.slug}
                     startOpen={entry.kinds.includes(current) || currentSystem === system.slug}>
    {entry.kinds.map((kind) => <KindLink key={kind} kind={kind} label={kindLabel(kind, { short: true })} current={current}
                                         go={go} inset/>)}
  </SystemFold>;
});

// A world's systems fold under its heading so the rail stays short, and the group and system holding
// the page being read start open.
const RailGroup = ({ group, current, currentSystem, go }) => {
  const entries = <RailEntries entries={group.entries} shortLabels={group.shortLabels} current={current}
                               currentSystem={currentSystem} go={go}/>;
  if (!group.collapsible) {
    return <>
      <ListSubheader disableSticky sx={{ lineHeight: '32px', bgcolor: 'transparent' }}>
        {group.label}
      </ListSubheader>
      {entries}
    </>;
  }
  const holdsSystem = SYSTEMS.some((system) => system.group === group.label && system.slug === currentSystem);
  return <Fold label={group.label} startOpen={group.kinds.includes(current) || holdsSystem}>
    {entries}
  </Fold>;
};

// The wiki section's frame: search on top of every page, and a left rail of category links the
// way idleon.wiki keeps its categories in reach. Rail is desktop only; below md the tiles and
// back links already cover navigation. Real anchors, so middle-click, copy-link and modified
// clicks all behave, and hidden by CSS rather than by a condition so the hrefs stay in every
// wiki page's exported HTML, which is how a crawler reaches the categories.
// `currentSystem` is the slug of the system page being read, which is not a kind and so selects no row.
const WikiRail = ({ current, currentSystem = null, children }) => {
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
        <ListItemButton component={'a'} href={'/wiki'} selected={!current && !currentSystem}
                        onClick={(event) => go(event, '/wiki')}>
          <ListItemText primary={'Wiki Home'} slotProps={{ primary: { fontWeight: 600 } }}/>
        </ListItemButton>
        {KIND_GROUPS.map((group) => <RailGroup key={group.label} group={group} current={current} currentSystem={currentSystem}
                                                go={go}/>)}
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
