import { Divider, List, ListItem, ListItemIcon, ListItemText, Stack } from '@mui/material';
import React from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import Kofi from '../../Kofi';

import ListItemButton from '@mui/material/ListItemButton';
import { PAGES } from '@components/constants';
import { prefix } from '@utility/helpers';

// Still consumed by hooks/usePageDataLoading.js for an unrelated purpose (deciding whether a
// tool page needs account data before it can render) — keep the export even though this file no
// longer gates on it.
export const offlineTools = { cardSearch: true, builds: true, itemBrowser: true, itemPlanner: true };

const ToolsDrawer = ({ fromList }) => {
  const router = useRouter();

  // Tab params belong to the page being left, not the one being opened. Everything else (demo,
  // profile, ...) has to survive the hop or the target page loses the session it was viewing.
  const { t, nt, dnt, ...updatedQuery } = router.query;

  // Navigation itself is handled by next/link so the target page's chunk gets prefetched while
  // the item is on screen — clicking then costs ~100ms instead of a multi-second chunk download.
  const trackNav = (uri) => {
    const url = `/tools/${uri}`;
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'handle_nav', {
        event_category: url,
        event_label: 'engagement',
        value: 1
      })
    }
  }

  const isSelected = (label) => {
    return router.pathname.includes(label);
  }

  return <Stack sx={{ height: '100%' }}>
    <List sx={{ ...(fromList ? { padding: 0 } : {}) }}>
      {Object.entries(PAGES.TOOLS).map(([key, value], index) => {
        const { icon } = value;
        const keyUri = key.split(/(?=[A-Z])/).map((str) => str.toLowerCase()).join('-');
        const formattedKey = key.split(/(?=[A-Z])/).join(' ').capitalize();
        const selected = isSelected(keyUri);
        return <ListItemButton key={key + ' ' + index} selected={selected}
                               component={NextLink}
                               href={{ pathname: `/tools/${keyUri}`, query: updatedQuery }}
                               onClick={() => trackNav(keyUri)}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <img style={{ objectFit: 'contain' }} width={32} height={32} src={`${prefix}${icon}.png`} alt=""/>
          </ListItemIcon>
          <ListItemText slotProps={{
            primary: {
              color: selected ? '#99ccff' : 'inherit'
            }
          }} style={{ marginLeft: 10 }} primary={formattedKey}/>
        </ListItemButton>;
      })}
    </List>
    {!fromList ? <List style={{ marginTop: 'auto', paddingBottom: 0 }}>
      <ListItem>
        <ListItemText>
          <Kofi display={'inline-block'}/>
        </ListItemText>
      </ListItem>
    </List> : null}
    <Divider/>
  </Stack>;
};

export default ToolsDrawer;
