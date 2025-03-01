import React, { useContext } from 'react';
import { NextLinkComposed } from '../NextLinkComposed';
import { drawerWidth, navItems, offlinePages } from '../../constants';
import { useRouter } from 'next/router';
import { List, ListItemButton, ListItemText, Stack } from '@mui/material';
import { AppContext } from '../context/AppProvider';
import PinnedPages from '@components/common/favorites/PinnedPages';

const NavItemsList = ({ drawer }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const { t, nt, ...updateQuery } = router?.query || {};

  return <Stack
    direction={drawer ? 'column' : 'row'}
    justifyContent={drawer ? 'flex-start' : 'center'}
    sx={{ width: '100%', maxWidth: drawer ? drawerWidth : 'inherit' }}>
    <ItemsWrapper drawer={drawer}>
      {navItems.map((navItem, index) => {
        if ((!state?.signedIn && !state?.profile && !state?.demo && !state?.manualImport) && !offlinePages.includes(navItem)) return null;
        if (state?.profile && navItem === 'guilds') return null;
        const pageName = navItem === 'account' ? 'account/misc/general' : navItem === 'tools'
          ? 'tools/card-search'
          : navItem;
        return <ListItemButton component={NextLinkComposed}
                               selected={router?.pathname.includes(navItem)}
                               key={`${navItem}-${index}`}
                               to={{ pathname: `/${pageName}`, query: updateQuery }}
                               sx={{
                                 borderRadius: drawer ? 'inherit' : 2,
                                 p: drawer ? '8px 16px' : '0 8px'
                               }}
                               data-cy={`nav-item-${pageName}`}
                               dense={!drawer}
                               size="medium">
          <ListItemText component={'span'} disableTypography
                        sx={{ fontWeight: 'bold', fontSize: 16 }}>{navItem.capitalize()}</ListItemText>
        </ListItemButton>
      })}
      <PinnedPages text={'Pinned pages'}/>
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
