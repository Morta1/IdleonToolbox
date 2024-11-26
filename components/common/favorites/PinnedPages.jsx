import * as React from 'react';
import { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useRouter } from 'next/router';
import usePin from '@components/common/favorites/usePin';
import { Collapse, List, ListItemButton, ListItemText, useMediaQuery } from '@mui/material';

const PinnedPages = ({}) => {
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('lg'), { noSsr: true });
  const [isOpen, setIsOpen] = useState(false);
  const { pinnedPages } = usePin();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    if (isXs) {
      setIsOpen(!isOpen);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };
  const handleClose = () => {
    if (isXs) {
      setIsOpen(false);
    } else {
      setAnchorEl(null);
    }
  };

  const handleNavigation = (url, tab, nestedTab) => {
    setAnchorEl(null);
    let query = { profile: router.query.profile }
    if (router.query.profile) {
      query.profile = router.query.profile;
    }
    if (tab) {
      query.t = tab;
      if (nestedTab) {
        query.nt = nestedTab;
      }
    }
    router.push({ pathname: url, query });
  }

  return (
    <div>
      <ListItemButton
        disableGutters={!isXs}
        disableRipple
        sx={{
          color: 'white', borderRadius: '4px',
          ...(!isXs ? { p: '0 8px' } : {})
        }}
        variant={'text'}
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <ListItemText component={'span'} disableTypography sx={{ fontWeight: 'bold', fontSize: 14 }}>
          PINNED PAGES
        </ListItemText>
        <KeyboardArrowDownIcon sx={{
          ml: 1,
          transform: isOpen || anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
          transitionProperty: 'transform',
          transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          transitionDuration: '.15s'
        }}/>
      </ListItemButton>
      {isXs ? <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <List>
          {pinnedPages?.map(({ name, url, tab, nestedTab }, index) => {
            return <ListItemButton sx={{ pl: '35px' }} key={`${name}-${index}`}
                                   onClick={() => handleNavigation(url, tab, nestedTab)}>{name.replace('-', ' ').capitalizeAllWords()}{tab
              ? ` - ${tab}`
              : ''}{nestedTab ? ` - ${nestedTab}` : ''}</ListItemButton>
          })}
          {!pinnedPages?.length && <ListItemButton dense disabled>You don't have any pinned pages</ListItemButton>}
        </List>
      </Collapse> : <Menu
        id="basic-menu"
        sx={{ mt: .5 }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'basic-button' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {pinnedPages?.map(({ name, url, tab, nestedTab }, index) => {
          return <MenuItem dense key={`${name}-${index}`}
                           onClick={() => handleNavigation(url, tab, nestedTab)}>{name.replace('-', ' ').capitalizeAllWords()}{tab
            ? ` - ${tab}`
            : ''}{nestedTab ? ` - ${nestedTab}` : ''}</MenuItem>
        })}
        {!pinnedPages?.length && <MenuItem dense disabled={true}>You don't have any pinned pages</MenuItem>}
      </Menu>}
    </div>
  );
}

export default PinnedPages;