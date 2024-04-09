import { Divider, List, ListItem, ListItemText, Stack } from '@mui/material';
import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '../../context/AppProvider';
import Kofi from '../../Kofi';

const tools = {
  'cardSearch': {
    icon: '2CardsA0'
  },
  'builds': {
    icon: 'SmithingHammerChisel_x1'
  },
  'itemPlanner': {
    icon: 'EquipmentTransparent2'
  },
  'itemBrowser': {
    icon: 'EquipmentTransparent105'
  },
  'materialTracker': {
    icon: 'Refinery1'
  },
  'activeExpCalculator': {
    icon: 'StatusExp'
  },
  'godPlanner': {
    icon: 'DivGod1'
  },
  'guaranteedDropCalculator': {
    icon: 'TreeInterior1b'
  },
  'skilling': {
    icon: 'EquipmentTools5_x1'
  }
};

export const offlineTools = { cardSearch: true, builds: true, itemBrowser: true, itemPlanner: true };

const ToolsDrawer = () => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const handleClick = (uri) => {
    const url = `/tools/${uri}`;
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'handle_nav', {
        event_category: url,
        event_label: 'engagement',
        value: 1,
      })
    }

    router.push({ pathname: url });
  }

  const isSelected = (label) => {
    return router.pathname.includes(label);
  }

  return (
    <Stack sx={{ height: '100%' }}>
      <Divider/>
      <List>
        {Object.entries(tools).map(([key, value], index) => {
          if (!state?.signedIn && !offlineTools[key]) return null;
          const { icon } = value;
          const keyUri = key.split(/(?=[A-Z])/).map((str) => str.toLowerCase()).join('-');
          const formattedKey = key.split(/(?=[A-Z])/).join(' ').capitalize();
          return (
            <React.Fragment key={key + ' ' + index}>
              <ListItem button selected={isSelected(key)} onClick={() => handleClick(keyUri)}>
                <img className={'list-img'} width={32} src={`/data/${icon}.png`} alt=""/>
                <ListItemText style={{ marginLeft: 10 }} primary={formattedKey}/>
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>
      <List style={{ marginTop: 'auto' }}>
        <ListItem>
          <ListItemText>
            <Kofi display={'inline-block'}/>
          </ListItemText>
        </ListItem>
      </List>
      <Divider/>
    </Stack>
  );
};

export default ToolsDrawer;
