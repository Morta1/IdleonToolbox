import React, { useContext, useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import MuiAppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { NextLinkComposed } from "./NextLinkComposed";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import PasswordIcon from '@mui/icons-material/Password';
import LogoutIcon from "@mui/icons-material/Logout";
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import { useRouter } from "next/router";
import AccountDrawer from "./AccountDrawer";
import { Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { AppContext } from "./context/AppProvider";
import CharactersDrawer from "./CharactersDrawer";
import ToolsDrawer from "./ToolsDrawer";
import { format } from "date-fns";
import { parseData } from "parsers";
import EmailPasswordDialog from "./EmailPasswordModal";
import { signInWithEmailPassword } from "../../firebase";
import DiscordInvite from "../DiscordInvite";
import { appleAuthorize, getAppleCode } from "../../logins/apple";
import AuthDialog from "./AuthDialog";
import { Adsense } from "@ctrl/react-adsense";
import { isProd } from "../../utility/helpers";


const drawerWidth = 240;
const topLevelItems = ["dashboard", "characters", "account", "tools"];

function NavBar({ children, window }) {
  const { state, dispatch, login, logout, setWaitingForAuth } = useContext(AppContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialog, setDialog] = useState({ open: false });
  const [emailPasswordDialog, setEmailPasswordDialog] = useState(false);
  const [displayDrawer, setDisplayDrawer] = useState(false);
  const [ffText, setFfText] = useState('');
  const [anchorEl, setAnchorEl] = useState();
  const [drawer, setDrawer] = useState();
  const [shouldDisplayMenu, setShouldDisplayMenu] = useState(false);
  const router = useRouter();
  const container = window !== undefined ? () => window().document.body : undefined;
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const isCompact = useMediaQuery('(max-width: 850px)', { noSsr: true })
  const isFirefox = navigator.userAgent.toUpperCase().indexOf("FIREFOX") >= 0;

  useEffect(() => {
    if (router.pathname.includes("/account")) {
      setDrawer("account");
      setDisplayDrawer(true);
    } else if (router.pathname.includes("/characters")) {
      setDrawer("characters");
      setDisplayDrawer(true);
    } else if (router.pathname.includes("/tools")) {
      setDrawer("tools");
      setDisplayDrawer(true);
    } else {
      setDrawer("");
      setDisplayDrawer(isXs);
    }
  }, [router.pathname, isXs]);

  useEffect(() => {
    setShouldDisplayMenu(state?.signedIn || state?.manualImport || state?.pastebin || state?.demo);
  }, [state]);

  useEffect(() => {
    if (state?.signedIn) {
      setDialog({ ...dialog, open: false });
    }
  }, [state?.signedIn]);

  const handleSignOut = async () => {
    logout();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setFfText('');
  };

  const handleAuth = async (logout, { emailPassword, apple } = {}) => {
    if (logout) await handleSignOut();
    else {
      if (emailPassword) {
        let data;
        try {
          data = await signInWithEmailPassword(emailPassword);
        } catch (error) {
          dispatch({ type: 'loginError', data: error?.stack })
        }
        console.log('Managed to get user token', data);
        if (data) {
          setEmailPasswordDialog(false);
        }
        dispatch({ type: 'emailPasswordLogin', data })
      } else if (apple) {
        await handleAppleLogin();
      } else {
        await handleGoogleLogin();
      }
    }
  };

  const handleAppleLogin = async () => {
    try {
      const code = await getAppleCode();
      await appleAuthorize(code);
      dispatch({ type: 'appleLogin', data: code })
      setDialog({
        title: 'Apple Login',
        type: 'apple',
        open: true,
        loading: true
      });
    } catch (error){
      console.error('Error: ', error?.stack)
      dispatch({ type: 'loginError', data: error?.stack });
    }
  }

  const handleGoogleLogin = async () => {
    const userCode = await login();
    setDialog({
      title: 'Google Login',
      type: 'google',
      open: true,
      loading: true,
      userCode
    });
  };

  const handleManualImport = async (ff) => {
    try {
      let content;
      if (ff) {
        content = JSON.parse(ffText);
      } else {
        content = JSON.parse(await navigator.clipboard.readText());
      }
      let parsedData;
      if (!Object.keys(content).includes('serverVars')) {
        parsedData = parseData(content);
      } else {
        const { data, charNames, guildData, serverVars } = content;
        parsedData = parseData(data, charNames, guildData, serverVars);
      }
      localStorage.setItem('charactersData', JSON.stringify(parsedData));
      localStorage.setItem('lastUpdated', JSON.stringify(new Date().getTime()));
      dispatch({ type: "data", data: { manualImport: true } });
      handleClose();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDialogClose = () => {
    setWaitingForAuth(false);
    setDialog({ ...dialog, open: false });
    dispatch({ type: 'resetLoginError' })
  };

  return (
    <Box sx={{ marginBottom: '75px' }}>
      <AppBar position="fixed" sx={{ ml: { sm: `${drawerWidth}px` } }}>
        <Toolbar sx={{ height: 70, minHeight: 70 }}>
          {shouldDisplayMenu ? (
            <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle}
                        sx={{ display: { sm: "none" } }}>
              <MenuIcon/>
            </IconButton>
          ) : null}
          <Link to={{
            pathname: '/',
            query: router.query,
          }} underline="none" component={NextLinkComposed} color="inherit" noWrap variant="h6">
            Idleon Toolbox
          </Link>
          <TopNavigation queryParams={router.query} signedIn={shouldDisplayMenu}/>
          {shouldDisplayMenu && state?.lastUpdated ? (
            <Box sx={{ marginLeft: "auto", mx: 2 }}>
              {!isCompact ? <Typography component={"div"} variant={"caption"}>
                {isXs ? '' : 'Last Updated'} {`${state?.manualImport ? "(offline)" : state?.pastebin ? '(pastebin)' : ""}`}
              </Typography> : null}
              <Typography component={"div"} variant={"caption"}>
                {format(state?.lastUpdated, "dd/MM/yyyy HH:mm:ss")}
              </Typography>
            </Box>
          ) : null}
          {(!state.signedIn && !state?.pastebin && !state?.manualImport) && state?.demo ? <Stack sx={{ mr: 1 }}>
            <Typography color={'primary'} variant={"caption"}>This is a demo site, please login</Typography>
          </Stack> : null}
          <Stack direction={'row'} alignItems={'center'} sx={{ marginLeft: 'auto' }}>
            <DiscordInvite shield={false} style={{ margin: '0 7.5px' }}/>
            {!state?.pastebin ? <Tooltip title="Paste JSON">
              <IconButton onClick={handleMenu} color="inherit">
                <FileCopyIcon/>
              </IconButton>
            </Tooltip> : null}
            <Menu id="menu-appbar" anchorEl={anchorEl} anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  keepMounted
                  transformOrigin={{ vertical: "top", horizontal: "right" }} open={Boolean(anchorEl)}
                  onClose={handleClose}>
              <MenuItem onClick={() => handleManualImport()}>
                <Typography variant={"span"}>From extractor</Typography>
              </MenuItem>
              <MenuItem onClick={() => handleManualImport()}>
                <Typography variant={"span"}>From website</Typography>
              </MenuItem>
              {isFirefox ? <MenuItem sx={{
                '&': { width: 200 },
                '& .MuiTouchRipple-root': { display: 'none' },
                '&:hover': { background: 'inherit' },
                '& .MuiOutlinedInput-root': {
                  '&:hover': {
                    borderColor: ''
                  },
                  '& fieldset': {
                    borderColor: ffText ? 'green' : '',
                  },
                  '&:hover fieldset': {
                    borderColor: ffText ? 'green' : '',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: ffText ? 'green' : '',
                  },
                },
              }}>
                <TextField onChange={(e) =>
                  setFfText(e.target.value)}
                           value={ffText} size={'small'} label={'Firefox'}/>
                <Button onClick={() => handleManualImport(true)}>upload</Button>
              </MenuItem> : null}
            </Menu>
            {!state?.pastebin && !state?.signedIn ? <Tooltip title={state?.signedIn ? "Logout" : "Apple Login"}>
              <IconButton onClick={() => handleAuth(state?.signedIn, { apple: true })} color="inherit">
                {state?.signedIn ? <LogoutIcon/> : <AppleIcon/>}
              </IconButton>
            </Tooltip> : null}
            {!state?.pastebin ? <Tooltip title={state?.signedIn ? "Logout" : "Google Login"}>
              <IconButton onClick={() => handleAuth(state?.signedIn)} color="inherit">
                {state?.signedIn ? <LogoutIcon/> : <GoogleIcon/>}
              </IconButton>
            </Tooltip> : null}
            {!state?.pastebin && !state?.signedIn ?
              <Tooltip title={state?.signedIn ? "Logout" : "Email-Password Login"}>
                <IconButton onClick={() => setEmailPasswordDialog(true)} color="inherit">
                  {state?.signedIn ? <LogoutIcon/> : <PasswordIcon/>}
                </IconButton>
              </Tooltip> : null}
          </Stack>
        </Toolbar>
      </AppBar>
      {displayDrawer ? (
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
          <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true // Better open performance on mobile.
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
              "& .MuiPaper-root": { backgroundImage: "none" }
            }}
          >
            <Toolbar sx={{ height: 70, minHeight: 70 }}/>
            <TopNavigation queryParams={router.query} signedIn={shouldDisplayMenu} onLabelClick={handleDrawerToggle}
                           drawer/>
            {drawer === "account" ? <AccountDrawer onLabelClick={handleDrawerToggle}/> : null}
            {drawer === "characters" ? <CharactersDrawer onLabelClick={handleDrawerToggle}/> : null}
            {drawer === "tools" ? <ToolsDrawer signedIn={shouldDisplayMenu} onLabelClick={handleDrawerToggle}/> : null}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
            }}
            open
          >
            <Toolbar sx={{ height: 70, minHeight: 70 }}/>
            {drawer === "account" ? <AccountDrawer/> : null}
            {drawer === "characters" ? <CharactersDrawer/> : null}
            {drawer === "tools" ? <ToolsDrawer signedIn={shouldDisplayMenu}/> : null}
          </Drawer>
        </Box>
      ) : null}
      <Box component="main"
           sx={{
             flexGrow: 1,
             pt: '24px',
             pl: !isXs && drawer ? '264px' : '24px',
             pr: '24px',
             width: '100%'
           }}>
        <Toolbar sx={{ height: 70, minHeight: 70 }}/>
        {children}
      </Box>
      <div style={{
        // height: 50,
        backgroundColor: isProd ? '' : '#d73333',
        position: 'fixed',
        bottom: 0,
        align: 'center',
        left: drawer ? '240px' : 0,
        width: '100%'
      }}>
        <Adsense
          style={{ maxHeight: 50, maxWidth: 1200, margin: '0 auto' }}
          client="ca-pub-1842647313167572"
          slot="8040203474"
        />
      </div>
      <EmailPasswordDialog loginError={state?.loginError} open={emailPasswordDialog}
                           handleClose={() => setEmailPasswordDialog(false)}
                           handleClick={(emailPassword) => handleAuth(state?.signedIn, { emailPassword })}/>
      <AuthDialog dialog={dialog} onClose={handleDialogClose} loginError={state?.loginError}/>
    </Box>
  );
}

const TopNavigation = ({ onLabelClick, signedIn, drawer, queryParams }) => {
  return (
    <Box sx={{ gap: 2, flexGrow: 1, marginLeft: 3, display: { xs: drawer ? "" : "none", sm: "flex" } }}>
      {topLevelItems.map((page, index) => {
        if (!signedIn && page !== "tools") return null;
        const pageName = page === "account" ? "account/general" : page === "tools" ? "tools/card-search" : page;
        return (
          <Button component={NextLinkComposed} to={{
            pathname: `/${pageName}`,
            query: queryParams,
          }} size="medium" key={`${page}-${index}`}
                  onClick={() => drawer && onLabelClick()}
                  sx={{ my: drawer ? 1 : 2, color: "white", display: "block" }}>
            {page}
          </Button>
        );
      })}
    </Box>
  );
};

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open"
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  })
}));

export default NavBar;
