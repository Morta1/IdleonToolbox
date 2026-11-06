import { useState } from 'react';
import { Link, Menu, MenuItem, Typography } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import useHydrated from '@hooks/useHydrated';
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

// The footer's way in, for a guest, who has no user menu. It sits at the page's end, so its menu opens upward.
export const ThemeLink = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const close = () => setAnchorEl(null);
  const rows = useThemeRows(close);
  return <>
    <Link component="button" variant="caption" color="text.secondary" sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          aria-haspopup="true" aria-expanded={anchorEl ? 'true' : undefined}
          onClick={(event) => setAnchorEl(event.currentTarget)}>
      Theme
    </Link>
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          slotProps={{ paper: { sx: { mt: -0.5 } } }}>
      {rows}
    </Menu>
  </>;
};
