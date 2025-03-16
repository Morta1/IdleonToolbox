import * as React from 'react';
import { useState } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useRouter } from 'next/router';
import usePin from '@components/common/favorites/usePin';
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  listItemButtonClasses,
  ListItemText,
  Popover,
  Typography,
  useMediaQuery
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { IconX } from '@tabler/icons-react';

const PinnedPages = ({}) => {
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('lg'), { noSsr: true });
  const [isOpen, setIsOpen] = useState(false);
  const { pinnedPages, removePin } = usePin();
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

  const handleNavigation = (url, tab, nestedTab, deeplyNestedTab) => {
    setAnchorEl(null);
    let query = {}
    if (router.query.profile) {
      query.profile = router.query.profile;
    }
    if (tab) {
      query.t = tab;
      if (nestedTab) {
        query.nt = nestedTab;
      }
      if (deeplyNestedTab) {
        query.dnt = deeplyNestedTab;
      }
    }
    router.push({ pathname: url, query });
  }

  const truncateMiddle = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    const half = Math.floor(maxLength / 2);
    return text.slice(0, half) + '...' + text.slice(-half);
  }

  return (
    <div>
      <ListItemButton
        disableGutters={!isXs}
        disableRipple
        sx={{
          color: 'white',
          borderRadius: '8px',
          ...(!isXs ? { p: '0 8px' } : {})
        }}
        selected={open}
        variant={'text'}
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <ListItemText component={'span'} disableTypography
                      sx={{ fontWeight: 'bold', fontSize: 16 }}>
          Pinned Pages
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
          {pinnedPages?.map(({ name, url, tab, nestedTab, deeplyNestedTab }, index) => {
            return <ListItem key={`${name}-${index}`}
                             secondaryAction={<IconButton size="small" onClick={(e) => {
                               e.stopPropagation();
                               removePin(index)
                             }}>
                               <IconX size={20}/>
                             </IconButton>}>
              <ListItemButton sx={{ [`&.${listItemButtonClasses.root}`]: { px: 0, pl: 2 } }}
                              onClick={() => handleNavigation(url, tab, nestedTab, deeplyNestedTab)}>{name.replace('-', ' ').capitalizeAllWords()}{tab
                ? ` - ${tab}`
                : ''}{nestedTab ? ` - ${nestedTab}` : ''}{deeplyNestedTab ? ` - ${deeplyNestedTab}` : ''}
              </ListItemButton>
            </ListItem>
          })}
          {!pinnedPages?.length && <ListItemButton dense disabled>You don't have any pinned pages</ListItemButton>}
        </List>
      </Collapse> : <Popover
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        sx={{ mt: 0.5 }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <List sx={{ minWidth: 300 }}>
          {pinnedPages?.length > 0 ? (
            pinnedPages.map(({ name, url, tab, nestedTab, deeplyNestedTab }, index) => {
              const text = name.replace('-', ' ').capitalizeAllWords() + (tab ? ` - ${tab}` : '') + (nestedTab
                ? ` - ${nestedTab}`
                : '') + (deeplyNestedTab ? ` - ${deeplyNestedTab}` : '');
              return (
                <ListItem
                  sx={{ px: 1 }}
                  key={`${name}-${index}`}
                  dense
                  secondaryAction={<IconButton size="small" onClick={(e) => {
                    e.stopPropagation();
                    removePin(index)
                  }}>
                    <IconX size={20}/>
                  </IconButton>}
                  onClick={() => handleNavigation(url, tab, nestedTab, deeplyNestedTab)}
                >
                  <ListItemButton sx={{ [`&.${listItemButtonClasses.root}`]: { px: 0, pl: 2 } }}>
                    {truncateMiddle(text, 30)}
                  </ListItemButton>
                </ListItem>
              )
            })
          ) : (
            <ListItem dense disabled>
              <ListItemText>
                <Typography variant="body2">You don't have any pinned pages</Typography>
              </ListItemText>
            </ListItem>
          )}
        </List>
      </Popover>}
    </div>
  );
}

export default PinnedPages;