import Box from '@mui/material/Box';
import React, { useContext, useEffect, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import IconButton from '@mui/material/IconButton';
import styled from '@emotion/styled';
import { drawerWidth, drawerWidthCollapsed, navBarHeight } from '../../../constants';
import Toolbar from '@mui/material/Toolbar';
import NavItemsList from '../NavItemsList';
import { useRouter } from 'next/router';
import { NextLinkComposed } from '../../NextLinkComposed';
import Link from '@mui/material/Link';
import { Divider, Stack, Tooltip, useMediaQuery } from '@mui/material';
import AccountDrawer from './AccountDrawer';
import CharactersDrawer from './CharactersDrawer';
import ToolsDrawer from './ToolsDrawer';
import { prefix, shouldDisplayDrawer } from '@utility/helpers';
import { AppContext } from '../../context/AppProvider';

const AppDrawer = ({ permanent }) => {
  const { state, dispatch } = useContext(AppContext);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const isCollapsed = state?.drawerCollapsed ?? false;
  const currentDrawerWidth = isCollapsed ? drawerWidthCollapsed : drawerWidth;

  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  const toggleDrawer = (event, open) => {
    setOpen(!open);
  };

  const toggleCollapse = () => {
    dispatch({ type: 'toggleDrawerCollapsed' });
  };

  const getDrawer = () => {
    if (router.pathname.includes('/account')) {
      return <AccountDrawer collapsed={isCollapsed} />
    } else if (router.pathname.includes('/characters')) {
      return <CharactersDrawer collapsed={isCollapsed} />
    } else if (router.pathname.includes('/tools')) {
      return <ToolsDrawer collapsed={isCollapsed} />
    }
    return null;
  };

  const getDrawerLabel = () => {
    if (router.pathname.includes('/account')) return 'Account';
    if (router.pathname.includes('/characters')) return 'Characters';
    if (router.pathname.includes('/tools')) return 'Tools';
    return '';
  };

  return <Box component={'nav'} sx={{ display: 'flex', alignItems: 'center', height: navBarHeight }}>
    <IconButton onClick={(e) => toggleDrawer(e, open)}
                aria-label="open drawer" edge="start"
                sx={{ mr: 2, display: { xs: 'inherit', lg: 'none' } }}>
      <MenuIcon/>
    </IconButton>
    {!permanent ? <Stack>
      <Link to={{ pathname: '/', query: router.query }}
            underline="none" component={NextLinkComposed}
            sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            color="inherit" noWrap variant={'h6'}
      >
        <img src={`${prefix}data/Coins5.png`} alt={''}/>
        <span>{isXs ? 'IT' : 'Idleon Toolbox'}</span>
      </Link>
    </Stack> : null}
    {permanent ? <StyledDrawer 
      variant={'permanent'} 
      open 
      collapsed={isCollapsed}
      sx={{
        display: shouldDisplayDrawer(router.pathname) ? {
          xs: 'none',
          lg: 'inherit'
        } : 'none',
        '& .MuiDrawer-paper': { 
          width: currentDrawerWidth,
          transition: 'width 0.2s ease-in-out',
          overflowX: 'hidden'
        }
      }}>
      <Toolbar sx={{ height: navBarHeight, minHeight: navBarHeight }}/>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'space-between',
        px: isCollapsed ? 0 : 2,
        py: 1,
        minHeight: 48,
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        {!isCollapsed && (
          <Box sx={{ fontSize: 14, fontWeight: 600, color: 'text.secondary' }}>
            {getDrawerLabel()}
          </Box>
        )}
        <Tooltip title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <IconButton 
            onClick={toggleCollapse}
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' }
            }}
          >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      {getDrawer()}
    </StyledDrawer> : <StyledDrawer
      sx={{ display: { xs: 'inherit', lg: 'none' } }}
      anchor={'left'}
      open={open}
      onClose={() => setOpen(false)}
    >
      <Toolbar sx={{ height: navBarHeight, minHeight: navBarHeight }}/>
      <NavItemsList drawer/>
      {router.pathname.includes('/characters') ? <>
        <Divider/>
        <CharactersDrawer/>
      </> : null}
    </StyledDrawer>}
  </Box>
};


const StyledDrawer = styled(Drawer)(({ collapsed }) => ({
  display: { xs: 'block', sm: 'none' },
  '& .MuiDrawer-paper': { 
    boxSizing: 'border-box', 
    width: collapsed ? drawerWidthCollapsed : drawerWidth,
    transition: 'width 0.2s ease-in-out'
  },
  '& .MuiPaper-root': { backgroundImage: 'none' }
}))

export default AppDrawer;
