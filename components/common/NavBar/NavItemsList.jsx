import React, { useContext } from 'react';
import { NextLinkComposed } from '../NextLinkComposed';
import { TOP_NAV } from '@utility/navMenu';
import { useRouter } from 'next/router';
import { ListItemButton, ListItemText, Stack } from '@mui/material';
import { AppContext } from '../context/AppProvider';
import PinnedPages from '@components/common/favorites/PinnedPages';
import { sessionQuery } from '@utility/nav-query';
import useNavPrefetch from '@hooks/useNavPrefetch';
import { NavMenuButton } from './NavMenu';

// The bar's sections from lg (below it PhoneMenu holds them): Account and Tools open their menu (Decision 11), the
// rest are links.
const NavItemsList = ({ openMenu, onMenu }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const updateQuery = sessionQuery(router?.query);
  const prefetch = useNavPrefetch();
  return (
    <Stack direction={'row'} justifyContent={'center'} sx={{ width: '100%', maxWidth: 'inherit' }}>
      <Stack component={'nav'} aria-label="Main" direction={'row'} gap={1} sx={{ display: { xs: 'none', lg: 'flex' } }}>
        {TOP_NAV.map((navItem, index) => {
          if (state?.profile && navItem === 'guilds') return null;

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
              sx={{ borderRadius: 2, p: '0 8px' }}
              data-cy={`nav-item-${navItem}`}
              dense
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
      </Stack>
    </Stack>
  );
};

export default NavItemsList;
