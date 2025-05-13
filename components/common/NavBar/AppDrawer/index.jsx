import Box from '@mui/material/Box';
import React, { useContext, useEffect, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import styled from '@emotion/styled';
import { drawerWidth, navBarHeight } from '../../../constants';
import Toolbar from '@mui/material/Toolbar';
import NavItemsList from '../NavItemsList';
import { useRouter } from 'next/router';
import { NextLinkComposed } from '../../NextLinkComposed';
import Link from '@mui/material/Link';
import { Divider, Stack, useMediaQuery } from '@mui/material';
import AccountDrawer from './AccountDrawer';
import CharactersDrawer from './CharactersDrawer';
import ToolsDrawer from './ToolsDrawer';
import { prefix, shouldDisplayDrawer } from '../../../../utility/helpers';
import { AppContext } from '../../context/AppProvider';

const AppDrawer = ({ permanent }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });

  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  const toggleDrawer = (event, open) => {
    setOpen(!open);
  };

  const getDrawer = () => {
    if (router.pathname.includes('/account')) {
      return <AccountDrawer/>
    } else if (router.pathname.includes('/characters')) {
      return <CharactersDrawer/>
    } else if (router.pathname.includes('/tools')) {
      return <ToolsDrawer/>
    }
    return null;
  }

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
    {permanent ? <StyledDrawer variant={'permanent'} open sx={{ // desktop
      display: shouldDisplayDrawer(router.pathname) ? {
        xs: 'none',
        lg: 'inherit'
      } : 'none'
    }}>
      <Toolbar sx={{ height: navBarHeight, minHeight: navBarHeight }}/>
      {getDrawer()}
    </StyledDrawer> : <StyledDrawer // mobile
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


const StyledDrawer = styled(Drawer)(() => ({
  display: { xs: 'block', sm: 'none' },
  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
  '& .MuiPaper-root': { backgroundImage: 'none' }
}))

export default AppDrawer;
