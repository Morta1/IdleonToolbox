import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

// A menu row that turns something on or off: a check while it is on, the label always, and the
// checked state for screen readers. A plain function, not a component: MenuList hands focus props
// to its direct MenuItem children.
export const menuCheck = (checked, label, onClick) => (
  <MenuItem key={label} role="menuitemcheckbox" aria-checked={checked} onClick={onClick}>
    <ListItemIcon>{checked ? <CheckIcon fontSize="small"/> : null}</ListItemIcon>
    <ListItemText>{label}</ListItemText>
  </MenuItem>
);
