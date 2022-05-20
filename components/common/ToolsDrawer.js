import { Divider, List, ListItem, ListItemText, Stack } from "@mui/material";
import React from "react";
import { useRouter } from "next/router";

const tools = {
  'cardSearch': {
    icon: '2CardsA0'
  },
  // 'builds': {
  //   icon: 'SmithingHammerChisel_x1'
  // },
  'itemPlanner': {
    icon: 'EquipmentTransparent2'
  },
  'itemBrowser': {
    icon: 'EquipmentTransparent105'
  },
  'activeExpCalculator': {
    icon: 'StatusExp'
  },
};

export const offlineTools = { cardSearch: true, builds: true };

const ToolsDrawer = ({ onLabelClick, signedIn }) => {
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
    router.push(url);
    typeof onLabelClick === 'function' && onLabelClick();
  }

  const isSelected = (label) => {
    return router.pathname.includes(label);
  }

  return (
    <Stack sx={{ height: '100%' }}>
      <Divider/>
      <List>
        {Object.entries(tools).map(([key, value], index) => {
          if (!signedIn && !offlineTools[key]) return null;
          const { icon } = value;
          const keyUri = key.split(/(?=[A-Z])/).map((str) => str.toLowerCase()).join('-');
          const formattedKey = key.split(/(?=[A-Z])/).join(" ").capitalize();
          return (
            <React.Fragment key={key + " " + index}>
              <ListItem button selected={isSelected(key)} onClick={() => handleClick(keyUri)}>
                <img className={"list-img"} width={32} src={`/data/${icon}.png`} alt=""/>
                <ListItemText style={{ marginLeft: 10 }} primary={formattedKey}/>
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>
      <List style={{ marginTop: 'auto' }}>
        <ListItem>
          <ListItemText>
            <a style={{ height: 0, display: 'inline-block' }} href='https://ko-fi.com/S6S7BHLQ4' target='_blank'
               rel="noreferrer">
              <img height='36'
                   style={{ border: 0, height: 36 }}
                   src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3'
                   alt='Buy Me a Coffee at ko-fi.com'/>
            </a>
          </ListItemText>
        </ListItem>
      </List>
      <Divider/>
    </Stack>
  );
};

export default ToolsDrawer;
