import React, { useContext, useState } from 'react';
import { NextLinkComposed } from '../NextLinkComposed';
import { drawerWidth, navItems, offlinePages } from '../../constants';
import { useRouter } from 'next/router';
import { Collapse, List, ListItem, ListItemButton, ListItemText, Stack, useMediaQuery } from '@mui/material';
import { AppContext } from '../context/AppProvider';
import PinnedPages from '@components/common/favorites/PinnedPages';
import AccountDrawer from '@components/common/NavBar/AppDrawer/AccountDrawer';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Kofi from '@components/common/Kofi';
import ToolsDrawer from '@components/common/NavBar/AppDrawer/ToolsDrawer';


const NavItemsList = ({ drawer }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const { t, nt, dnt, ...updateQuery } = router?.query || {};
  const [openItems, setOpenItems] = useState({});
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('lg'), { noSsr: true });
  const toggleOpen = (key) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  return (
    <Stack
      direction={drawer ? 'column' : 'row'}
      justifyContent={drawer ? 'flex-start' : 'center'}
      sx={{ width: '100%', maxWidth: drawer ? drawerWidth : 'inherit' }}
    >
      <ItemsWrapper drawer={drawer}>
        {navItems.map((navItem, index) => {
          if (
            (!state?.signedIn && !state?.profile && !state?.demo && !state?.manualImport) &&
            !offlinePages.includes(navItem)
          )
            return null;

          if (state?.profile && navItem === 'guilds') return null;

          if (isXs && (navItem === 'account' || navItem === 'tools')) {
            const isAccount = navItem === 'account';
            const isTools = navItem === 'tools';

            return (
              <CollapsibleNavItem
                key={`account-${index}`}
                navKey={navItem}
                label={navItem.capitalize()}
                isOpen={openItems[navItem]}
                setIsOpen={() => toggleOpen(navItem)}
                selected={router?.pathname.includes(navItem)}
                drawer={drawer}
                dataCy={`nav-item-${navItem}`}
              >
                {isAccount && <AccountDrawer fromList/>}
                {isTools && <ToolsDrawer fromList/>}
              </CollapsibleNavItem>
            );
          }

          const pageName = navItem === 'account' ? 'account/misc/general' : navItem === 'tools'
            ? 'tools/card-search'
            : navItem;

          return (
            <ListItemButton
              component={NextLinkComposed}
              selected={router?.pathname.includes(navItem)}
              key={`${navItem}-${index}`}
              to={{ pathname: `/${pageName}`, query: updateQuery }}
              sx={{
                borderRadius: drawer ? 'inherit' : 2,
                p: drawer ? '8px 16px' : '0 8px'
              }}
              data-cy={`nav-item-${pageName}`}
              dense={!drawer}
              size="medium"
            >
              <ListItemText
                component={'span'}
                disableTypography
                sx={{ fontWeight: 'bold', fontSize: 16 }}
              >
                {navItem.capitalize()}
              </ListItemText>
            </ListItemButton>
          );
        })}
        <PinnedPages text={'Pinned pages'}/>
        {isXs && <List style={{ marginTop: 'auto', paddingBottom: 0 }}>
          <ListItem>
            <ListItemText>
              <Kofi display={'inline-block'}/>
            </ListItemText>
          </ListItem>
        </List>}
      </ItemsWrapper>
    </Stack>
  );
};

const CollapsibleNavItem = ({
                              navKey,
                              label,
                              isOpen,
                              setIsOpen,
                              selected,
                              drawer,
                              dataCy,
                              children
                            }) => (
  <React.Fragment key={`collapsible-${navKey}`}>
    <ListItemButton
      onClick={() => setIsOpen(!isOpen)}
      selected={selected}
      sx={{
        borderRadius: drawer ? 'inherit' : 2,
        p: drawer ? '8px 16px' : '0 8px'
      }}
      data-cy={dataCy}
      dense={!drawer}
      size="medium"
    >
      <ListItemText
        component={'span'}
        disableTypography
        sx={{ fontWeight: 'bold', fontSize: 16 }}
      >
        {label}
      </ListItemText>
      {isOpen ? <ExpandLess/> : <ExpandMore/>}
    </ListItemButton>
    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      {children}
    </Collapse>
  </React.Fragment>
);

const ItemsWrapper = ({ drawer, children }) => {
  return drawer ? (
    <List component={'nav'}>
      {children}
    </List>
  ) : (
    <Stack component={'nav'} direction={'row'} gap={1} sx={{ display: { xs: 'none', lg: 'flex' }, heigh: '100%' }}>
      {children}
    </Stack>
  );
};

export default NavItemsList;
