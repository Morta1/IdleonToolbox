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
import LoginIcon from "@mui/icons-material/Login";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import PasswordIcon from '@mui/icons-material/Password';
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/router";
import AccountDrawer from "./AccountDrawer";
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import { AppContext } from "./context/AppProvider";
import CharactersDrawer from "./CharactersDrawer";
import ToolsDrawer from "./ToolsDrawer";
import { format } from "date-fns";
import { parseData } from "parsers";
import EmailPasswordDialog from "./EmailPasswordModal";
import { signInWithEmailPassword } from "../../firebase";


const drawerWidth = 240;
const topLevelItems = ["characters", "account", "tools"];

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
    setShouldDisplayMenu(state?.signedIn || state?.manualImport || state?.pastebin);
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

  const handleAuth = async (logout, emailPassword) => {
    if (logout) await handleSignOut();
    else {
      if (emailPassword) {
        const data = await signInWithEmailPassword(emailPassword);
        console.log('Managed to get user token', data);
        if (data) {
          setEmailPasswordDialog(false);
        }
        dispatch({ type: 'emailPasswordLogin', data })
      } else {
        await handleGoogleLogin();
      }
    }
  };

  const handleGoogleLogin = async () => {
    const userCode = await login();
    setDialog({
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
  };

  // const shouldDisplayMenu = state?.signedIn || state?.manualImport;

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ ml: { sm: `${drawerWidth}px` } }}>
        <Toolbar>
          {shouldDisplayMenu ? (
            <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: "none" } }}>
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
            <Box sx={{ marginLeft: "auto", mr: 1 }}>
              <Typography component={"div"} variant={"caption"}>
                Last Updated {`${state?.manualImport ? "(offline)" : state?.pastebin ? '(pastebin)' : ""}`}
              </Typography>
              <Typography component={"div"} variant={"caption"}>
                {format(state?.lastUpdated, "dd/MM/yyyy HH:mm:ss")}
              </Typography>
            </Box>
          ) : null}
          {!state?.pastebin ? <Tooltip title="Paste JSON">
            <IconButton onClick={handleMenu} sx={{ marginLeft: "auto" }} color="inherit">
              <FileCopyIcon/>
            </IconButton>
          </Tooltip> : null}
          <Menu id="menu-appbar" anchorEl={anchorEl} anchorOrigin={{ vertical: "top", horizontal: "right" }} keepMounted
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
          {!state?.pastebin ? <Tooltip title={state?.signedIn ? "Logout" : "Login"}>
            <IconButton onClick={() => handleAuth(state?.signedIn)} color="inherit">
              {shouldDisplayMenu ? <LogoutIcon/> : <LoginIcon/>}
            </IconButton>
          </Tooltip> : null}
          {!state?.pastebin && !state?.signedIn ? <Tooltip title={state?.signedIn ? "Logout" : "Email-Password Login"}>
            <IconButton onClick={() => setEmailPasswordDialog(true)} color="inherit">
              {shouldDisplayMenu ? <LogoutIcon/> : <PasswordIcon/>}
            </IconButton>
          </Tooltip> : null}
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
            <Toolbar/>
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
            <Toolbar/>
            {drawer === "account" ? <AccountDrawer/> : null}
            {drawer === "characters" ? <CharactersDrawer/> : null}
            {drawer === "tools" ? <ToolsDrawer signedIn={shouldDisplayMenu}/> : null}
          </Drawer>
        </Box>
      ) : null}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar/>
        <Box sx={{ height: "100%", minHeight: "unset" }}>{children}</Box>
      </Box>
      <EmailPasswordDialog open={emailPasswordDialog} handleClose={() => setEmailPasswordDialog(false)}
                           handleClick={(emailPassword) => handleAuth(state?.signedIn, emailPassword)}/>
      <Dialog open={dialog.open} onClose={handleDialogClose}>
        <DialogTitle>Google Login</DialogTitle>
        <DialogContent>
          <Stack gap={3} alignItems={"center"}>
            <div style={{ wordBreak: "break-all" }}>
              Please go to{" "}
              <Link mr={1} target="_blank" href="https://www.google.com/device" rel="noreferrer">
                https://www.google.com/device
              </Link>
              and enter the following code:
            </div>
            <Typography p={1} border={"1px solid white"} justifySelf={"center"} margin={"0 auto"} width={"fit-content"}>
              {dialog?.userCode}
            </Typography>
            {dialog?.error ? (
              <Typography variant={"body1"}>Failed to auth, please refresh and try again.</Typography>
            ) : (
              <Stack flexWrap={"wrap"} gap={3} direction={"row"} alignItems={"center"}>
                <Typography variant={"body1"}>Waiting for your authentication:</Typography> <CircularProgress/>
              </Stack>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
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
