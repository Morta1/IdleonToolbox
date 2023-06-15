import React, { useContext } from 'react';
import { NextLinkComposed } from '../NextLinkComposed';
import { drawerWidth, navItems, offlinePages } from '../../constants';
import { useRouter } from 'next/router';
import { List, ListItemButton, ListItemText, Stack } from '@mui/material';
import { AppContext } from '../context/AppProvider';

const NavItemsList = ({ drawer }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  return <Stack
    direction={drawer ? 'column' : 'row'}
    justifyContent={drawer ? 'flex-start' : 'center'}
    sx={{ width: '100%', maxWidth: drawer ? drawerWidth : 'inherit' }}>
    <ItemsWrapper drawer={drawer}>
      {navItems.map((navItem, index) => {
        if ((!state?.signedIn && !state?.pastebin && !state?.demo) && !offlinePages.includes(navItem)) return null;
        const pageName = navItem === 'account' ? 'account/general' : navItem === 'tools' ? 'tools/card-search' : navItem;
        return <ListItemButton component={NextLinkComposed}
                               selected={router?.pathname.includes(navItem)}
                               key={`${navItem}-${index}`}
                               to={{ pathname: `/${pageName}`, query: router?.query }}
                               sx={{
                                 borderRadius: drawer ? 'inherit' : 2,
                                 p: drawer ? '8px 16px' : '0 8px'
                               }}
                               dense={!drawer}
                               size="medium">
          <ListItemText component={'span'} disableTypography
                        sx={{ fontWeight: 'bold', fontSize: 14 }}>{navItem.toUpperCase()}</ListItemText>
        </ListItemButton>
      })}
    </ItemsWrapper>
  </Stack>
};

const ItemsWrapper = ({ drawer, children }) => {
  return drawer ? <List component={'nav'}>
    {children}
  </List> : <Stack component={'nav'} direction={'row'} gap={1} sx={{ display: { xs: 'none', lg: 'flex' } }}>
    {children}
  </Stack>
}

export default NavItemsList;
