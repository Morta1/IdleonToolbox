import React, { useState } from 'react';
import { Tab, Tabs, useMediaQuery } from '@mui/material';

const Tabber = ({ tabs, children, onTabChange }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });

  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
    onTabChange && onTabChange(selected);
  }

  const array = Array.isArray(children) ? children : [children];
  return <>
    <Tabs
      centered={!isMd || (isMd && tabs.length < 4)}
      scrollButtons={true}
      allowScrollButtonsMobile
      sx={{ marginBottom: 3 }}
      variant={isMd && tabs.length > 4 ? 'scrollable' : 'standard'}
      value={selectedTab} onChange={handleOnClick}>
      {tabs?.map((tab, index) => {
        return <Tab label={tab} key={`${tab}-${index}`}/>;
      })}
    </Tabs>
    {onTabChange ? children : array?.map((child, index) => {
      return index === selectedTab ? child : null;
    })}
  </>
};

export default Tabber;
