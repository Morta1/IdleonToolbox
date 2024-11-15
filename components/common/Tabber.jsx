import React, { useState } from 'react';
import { Tab, Tabs, useMediaQuery } from '@mui/material';
import { prefix } from '@utility/helpers';
import Box from '@mui/material/Box';

const Tabber = ({ tabs, icons, children, onTabChange, forceScroll, orientation = 'horizontal', iconsOnly }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });

  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
    onTabChange && onTabChange(selected);
  }

  const array = Array.isArray(children) ? children : [children];
  return <Box sx={orientation === 'vertical' ? { flexGrow: 1, display: 'flex' } : {}}>
    <Tabs
      centered={!isMd || (isMd && tabs.length < 4)}
      scrollButtons
      allowScrollButtonsMobile
      sx={{ marginBottom: 3 }}
        variant={(isMd && tabs.length > 4) || forceScroll ? 'scrollable' : 'standard'}
      value={selectedTab} onChange={handleOnClick}>
      {tabs?.map((tab, index) => {
        return <Tab iconPosition="start" icon={icons?.[index] ? <img src={`${prefix}${icons?.[index]}.png`}/> : null}
                    wrapped label={iconsOnly ? '' : tab} sx={{minWidth: 62}} key={`${tab}-${index}`}/>;
      })}
    </Tabs>
    {onTabChange ? children : array?.map((child, index) => {
      return index === selectedTab ? child : null;
    })}
  </Box>
};

export default Tabber;
