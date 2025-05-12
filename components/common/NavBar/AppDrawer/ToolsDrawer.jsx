import { Divider, List, ListItem, ListItemIcon, ListItemText, Stack } from '@mui/material';
import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '../../context/AppProvider';
import Kofi from '../../Kofi';

import ListItemButton from '@mui/material/ListItemButton';
import { PAGES } from '@components/constants';
import { prefix } from '@utility/helpers';

export const offlineTools = { cardSearch: true, builds: true, itemBrowser: true, itemPlanner: true };

const ToolsDrawer = ({ fromList }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const handleClick = (uri) => {
    const url = `/tools/${uri}`;
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'handle_nav', {
        event_category: url,
        event_label: 'engagement',
        value: 1
      })
    }

    router.push({ pathname: url });
  }

  const isSelected = (label) => {
    return router.pathname.includes(label);
  }

  return <Stack sx={{ height: '100%' }}>
    <List sx={{ ...(fromList ? { padding: 0 } : {}) }}>
      {Object.entries(PAGES.TOOLS).map(([key, value], index) => {
        if (!state?.signedIn && !offlineTools[key]) return null;
        const { icon } = value;
        const keyUri = key.split(/(?=[A-Z])/).map((str) => str.toLowerCase()).join('-');
        const formattedKey = key.split(/(?=[A-Z])/).join(' ').capitalize();
        const selected = isSelected(keyUri);
        return <ListItemButton key={key + ' ' + index} selected={selected}
                               onClick={() => handleClick(keyUri)}>
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
