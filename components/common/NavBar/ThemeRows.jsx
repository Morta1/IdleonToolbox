import { useState, useSyncExternalStore } from 'react';
import { Box, Link, Menu, MenuItem, MenuList, Popper, Typography } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import useHydrated from '@hooks/useHydrated';
import { getTourMenu, subscribeTourMenu } from '@utility/whatsNew';
import { SELECT_ROW } from '../../../styles/theme/theme';

// A line of text in a menu, not an item: the arrow keys skip it (MenuList reads muiSkipListHighlight).
export const MenuCaption = ({ children }) => <Typography variant="caption" color="text.secondary" component="li" role="none"
                                                         sx={{ display: 'block', px: 2, pt: 0.5, pb: 1 }}>{children}</Typography>;
MenuCaption.muiSkipListHighlight = true;

const THEME_MODES = [
  { mode: 'dark', label: 'Dark (default)' },
  { mode: 'light', label: 'Light' },
  { mode: 'system', label: 'System' }
];

// The stored choice, undefined until hydrated: the export can't know it, so the first render shows none.
export const useThemeMode = () => {
  const hydrated = useHydrated();
  const { mode, setMode } = useColorScheme();
  return { mode: hydrated ? mode : undefined, setMode };
};

// An array, so each row is its Menu's own child and the arrow keys walk them.
export const useThemeRows = (onPick) => {
  const { mode, setMode } = useThemeMode();
  return [
    <MenuCaption key="theme-caption">Theme</MenuCaption>,
    ...THEME_MODES.map((row) => <MenuItem key={row.mode} className={SELECT_ROW} role="menuitemradio" aria-checked={mode === row.mode}
                                          selected={mode === row.mode}
                                          onClick={() => {
                                            setMode(row.mode);
                                            onPick();
                                          }}>{row.label}</MenuItem>)
  ];
};

const noServerMenu = () => null;
// Whether the What's new tour's theme stop holds this menu open.
export const useTourMenu = (menu) => useSyncExternalStore(subscribeTourMenu, getTourMenu, noServerMenu) === menu;

// The menu's rows for that stop. A plain list, not a Menu: a Menu is a modal, whose focus trap and aria-hidden on the rest of
// the page would fight the tour's card, which holds the focus. It stands above the tour's dim, so its theme rows work, and
// under the card. Only those: the tour isn't the time to leave the page or log out.
export const TourMenu = ({ anchorEl, placement, children }) => <Popper open anchorEl={anchorEl} placement={placement}
                                                                       sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
  <Box data-tour="theme-menu" sx={{
    my: '4px', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '8px',
    boxShadow: (theme) => (theme.vars || theme).palette.shadow.floating
  }}>
    <MenuList sx={{ '& > .MuiMenuItem-root:not([role="menuitemradio"])': { pointerEvents: 'none' } }}>{children}</MenuList>
  </Box>
</Popper>;

// The footer's way in, for a guest, who has no user menu. It sits at the page's end, so its menu opens upward.
export const ThemeLink = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [link, setLink] = useState(null);
  const tourOpen = useTourMenu('footer');
  const close = () => setAnchorEl(null);
  const rows = useThemeRows(close);
  return <>
    <Link ref={setLink} data-tour="theme-link" component="button" variant="caption" color="text.secondary" sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          aria-haspopup="true" aria-expanded={anchorEl ? 'true' : undefined}
          onClick={(event) => setAnchorEl(event.currentTarget)}>
      Theme
    </Link>
    {tourOpen ? <TourMenu anchorEl={link} placement="top">{rows}</TourMenu> : null}
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          slotProps={{ paper: { sx: { mt: -0.5 } } }}>
      {rows}
    </Menu>
  </>;
};
