import React, { useContext, useState } from 'react';
import { NextLinkComposed } from '../NextLinkComposed';
import { drawerWidth } from '../../constants';
import { TOP_NAV } from '@utility/navMenu';
import { useRouter } from 'next/router';
import { Collapse, List, ListItem, ListItemButton, ListItemText, Stack } from '@mui/material';
import { AppContext } from '../context/AppProvider';
import PinnedPages from '@components/common/favorites/PinnedPages';
import AccountDrawer from '@components/common/NavBar/AppDrawer/AccountDrawer';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Kofi from '@components/common/Kofi';
import ToolsDrawer from '@components/common/NavBar/AppDrawer/ToolsDrawer';
import { sessionQuery } from '@utility/nav-query';
import useNavPrefetch from '@hooks/useNavPrefetch';
import { NavMenuButton } from './NavMenu';


const NavItemsList = ({ drawer, openMenu, onMenu }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const updateQuery = sessionQuery(router?.query);
  const prefetch = useNavPrefetch();
  const [openItems, setOpenItems] = useState({});
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
        {TOP_NAV.map((navItem, index) => {
          if (state?.profile && navItem === 'guilds') return null;

          // `drawer` stands in for the lg breakpoint rather than a useMediaQuery, which is false
          // at build and on the first client render: this list is display:none below lg and the
          // drawer that passes `drawer` is display:none from lg up, so CSS already draws the line.
          if (drawer && (navItem === 'account' || navItem === 'tools')) {
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

          // From lg (the row): Account and Tools open their menu (Decision 11).
          if (navItem === 'account' || navItem === 'tools') {
            return <NavMenuButton key={navItem} menu={navItem} open={openMenu === navItem}
                                  selected={router?.pathname.includes(navItem)} onToggle={onMenu}/>;
          }

          const selected = router?.pathname.includes(navItem);
          return (
            <ListItemButton
              component={NextLinkComposed}
              selected={selected}
              aria-current={selected ? 'page' : undefined}
              key={`${navItem}-${index}`}
              to={{ pathname: `/${navItem}`, query: updateQuery }}
              prefetch={prefetch}
              sx={{
                borderRadius: drawer ? 'inherit' : 2,
                p: drawer ? '8px 16px' : '0 8px'
              }}
              data-cy={`nav-item-${navItem}`}
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
        {drawer && <List style={{ marginTop: 'auto', paddingBottom: 0 }}>
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
    <Stack component={'nav'} aria-label="Main" direction={'row'} gap={1} sx={{ display: { xs: 'none', lg: 'flex' } }}>
      {children}
    </Stack>
  );
};

export default NavItemsList;
