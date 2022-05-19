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
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/router";
import AccountDrawer from "./AccountDrawer";
import { CircularProgress, Dialog, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { AppContext } from "./context/AppProvider";
import CharactersDrawer from "./CharactersDrawer";
import ToolsDrawer from "./ToolsDrawer";
import { format } from "date-fns";
import { parseData } from "parsers";

const drawerWidth = 240;
const topLevelItems = ["characters", "account", "tools"];

function NavBar({ children, window }) {
  const { state, dispatch, login, logout, setWaitingForAuth } = useContext(AppContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialog, setDialog] = useState({ open: false });
  const [displayDrawer, setDisplayDrawer] = useState(false);
  const [anchorEl, setAnchorEl] = useState();
  const [drawer, setDrawer] = useState();
  const [shouldDisplayMenu, setShouldDisplayMenu] = useState(false);
  const router = useRouter();
  const container = window !== undefined ? () => window().document.body : undefined;

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
      setDisplayDrawer(false);
    }
  }, [router.pathname]);

  useEffect(() => {
    setShouldDisplayMenu(state?.signedIn || state?.manualImport);
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
  };

  const handleAuth = async (logout) => {
    if (logout) await handleSignOut();
    else {
      await handleGoogleLogin();
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

  const handleManualImport = async (source) => {
    const content = await navigator.clipboard.readText();
    let parsedData;
    if (source === "steam") {
      const data = JSON.parse(content);
      parsedData = parseData(data);
    } else {
      const { data, charNames, guildData, serverVars } = JSON.parse(content);
      parsedData = parseData(data, charNames, guildData, serverVars);
    }

    dispatch({ type: "data", data: { ...parsedData, manualImport: true, lastUpdated: new Date().getTime() } });
    localStorage.setItem('charactersData', JSON.stringify(parsedData));
    localStorage.setItem('lastUpdated', JSON.stringify(state?.lastUpdated));
    // handleAuth(true);
    handleClose();
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
          <Link to="/" underline="none" component={NextLinkComposed} color="inherit" noWrap variant="h6">
            Idleon Toolbox
          </Link>
          <TopNavigation signedIn={shouldDisplayMenu}/>
          {shouldDisplayMenu && state?.lastUpdated ? (
            <Box sx={{ marginLeft: "auto", mr: 1 }}>
              <Typography component={"div"} variant={"caption"}>
                Last Updated {`${state?.manualImport ? "(offline)" : ""}`}
              </Typography>
              <Typography component={"div"} variant={"caption"}>
                {format(state?.lastUpdated, "dd/MM/yyyy HH:mm:ss")}
              </Typography>
            </Box>
          ) : null}
          <Tooltip title="Paste JSON">
            <IconButton onClick={handleMenu} sx={{ marginLeft: "auto" }} color="inherit">
              <FileCopyIcon/>
            </IconButton>
          </Tooltip>
          <Menu id="menu-appbar" anchorEl={anchorEl} anchorOrigin={{ vertical: "top", horizontal: "right" }} keepMounted
                transformOrigin={{ vertical: "top", horizontal: "right" }} open={Boolean(anchorEl)}
                onClose={handleClose}>
            <MenuItem onClick={() => handleManualImport("steam")}>
              <Typography variant={"span"}>From extractor</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleManualImport("website")}>
              <Typography variant={"span"}>From website</Typography>
            </MenuItem>
          </Menu>
          <Tooltip title={state?.signedIn ? "Logout" : "Login"}>
            <IconButton onClick={() => handleAuth(state?.signedIn)} color="inherit">
              {shouldDisplayMenu ? <LoginIcon/> : <LogoutIcon/>}
            </IconButton>
          </Tooltip>
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
            <TopNavigation signedIn={shouldDisplayMenu} onLabelClick={handleDrawerToggle} drawer/>
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

const TopNavigation = ({ onLabelClick, signedIn, drawer }) => {
  return (
    <Box sx={{ gap: 2, flexGrow: 1, marginLeft: 3, display: { xs: drawer ? "" : "none", sm: "flex" } }}>
      {topLevelItems.map((page, index) => {
        if (!signedIn && page !== "tools") return null;
        const pageName = page === "account" ? "account/general" : page === "tools" ? "tools/card-search" : page;
        return (
          <Button component={NextLinkComposed} to={`/${pageName}`} size="medium" key={`${page}-${index}`}
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
