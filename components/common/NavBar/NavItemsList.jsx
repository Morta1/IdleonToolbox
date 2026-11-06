import React, { useContext } from 'react';
import { NextLinkComposed } from '../NextLinkComposed';
import { TOP_NAV } from '@utility/navMenu';
import { useRouter } from 'next/router';
import { ListItemButton, listItemButtonClasses, ListItemText, Stack } from '@mui/material';
import { AppContext } from '../context/AppProvider';
import PinnedPages from '@components/common/favorites/PinnedPages';
import { sessionQuery } from '@utility/nav-query';
import useNavPrefetch from '@hooks/useNavPrefetch';
import { NavMenuButton } from './NavMenu';
import { BAR_SNUG, BAR_TIGHT } from './frame';

// The bar's sections from lg (below it PhoneMenu holds them): Account and Tools open their menu (Decision 11), the
// rest are links.
const NavItemsList = ({ openMenu, onMenu }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const updateQuery = sessionQuery(router?.query);
  const prefetch = useNavPrefetch();
  return (
    // Beside the logo, at one x from 1280 up. Grows from its content's width, which holds the search and the user block at
    // the right edge, so the bar shrinks something only when it truly runs out of room.
    <Stack direction={'row'} sx={{ flex: '1 1 auto', ml: { lg: 3 }, [BAR_TIGHT]: { ml: 1 } }}>
      {/* No label wraps: the bar is one row, and below 1440 its gaps tighten instead (frame.js) */}
      <Stack component={'nav'} aria-label="Main" direction={'row'} sx={{
        display: { xs: 'none', lg: 'flex' }, gap: 1,
        [`& .${listItemButtonClasses.root}`]: { whiteSpace: 'nowrap' },
        [BAR_SNUG]: { gap: 0 },
        [BAR_TIGHT]: { [`& .${listItemButtonClasses.root}`]: { px: '6px' } }
      }}>
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
                sx={{ fontWeight: 600, fontSize: 16 }}
              >
                {navItem.capitalize()}
              </ListItemText>
            </ListItemButton>
          );
        })}
        <PinnedPages/>
      </Stack>
    </Stack>
  );
};

export default NavItemsList;
