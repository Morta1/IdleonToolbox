import styled from 'styled-components'
import { AppBar, Menu, MenuItem, Toolbar } from "@material-ui/core";
import { useRouter } from "next/router";
import React, { useContext, useState } from "react";
import { AppContext } from "./context";
import { screens } from "../../Utilities";
import JsonImport from "../JsonImport";
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

const Navigation = () => {
  const { userData, display, setUserDisplay } = useContext(AppContext);
  const router = useRouter();
  const routes = Object.entries(screens).map(([, value]) => value);
  const [menu, setMenu] = useState();
  const [anchorEl, setAnchorEl] = useState(null);

  const isDemo = () => {
    return router?.query?.hasOwnProperty('demo');
  }

  const onNavLinkClick = (e, index, route, action, category) => {
    if (route.menu) {
      setAnchorEl(e.currentTarget);
      setMenu(route.menu)
    } else {
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', action, {
          event_category: category,
          event_label: route.label,
          value: 1,
        })
      }
      setAnchorEl(null);
      setUserDisplay(index, route.index);
    }
  }

  const handleClose = () => {
    setAnchorEl(null);
  }

  return (
    <NavigationStyle>
      <StyledAppbar position="fixed" color={'default'}>
        <Toolbar>
          <ul className={'family-navigation'}>
            {routes.map((route, index) => (
              !userData && route.main || userData ?
                <ListItem onClick={(e) => onNavLinkClick(e, index, route, 'handle_nav', 'engagement', display?.view)}
                          active={display?.view === index} inner={true}
                          alignItems={'center'}
                          key={route + index}>
                  {route.label}
                  {route?.menu ? <ArrowDropDownIcon/> : null}
                </ListItem> : null))}
          </ul>
          {menu ? <StyledMenu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {menu?.map((menuItem, menuItemIndex) => <MenuItem key={menuItemIndex + menuItem}
                                                              onClick={(e) => onNavLinkClick(e, menuItem?.index, menuItem, 'handle_nav', 'engagement', display?.view)}>
              {menuItem?.label.capitalize().replace(/([A-Z])/g, " $1")}
            </MenuItem>)}
          </StyledMenu> : null}
          {!isDemo() ? <JsonImport/> : null}
        </Toolbar>
      </StyledAppbar>
    </NavigationStyle>
  );
};

const StyledAppbar = styled(AppBar)`
  && {
    background-color: #393e46;
  }
`;

const StyledMenu = styled(Menu)`
  && .MuiMenu-list {
    background-color: #393e46;
  }
`;

const ListItem = styled.li`
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  padding: 4px 0;
  color: white;
  text-decoration: none;
  text-transform: capitalize;
  transition: 0.5s;

  ${({ active, inner }) => (active ? `border-bottom: 1px solid ${inner ? '#00ADB5' : 'white'};` : "")}
  ${({ active }) => (active ? "font-weight: bold;" : "")}
  &::after {
    position: absolute;
    content: "";
    top: 100%;
    left: 0;
    width: 100%;
    height: 3px;
    background: ${({ inner }) => (inner ? "#00ADB5" : "white")};
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.5s;
  }

  &:hover {
  }

  &:hover::after {
    transform: scaleX(1);
    transform-origin: left;
  }

  a {
    text-decoration: none;
    color: black;

    &:visited {
      color: black;
    }
  }
`;

const NavigationStyle = styled.div`
  z-index: 1300;
  position: relative;

  .family-navigation {
    list-style-type: none;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
    padding-left: 0;

    > li {
      cursor: pointer;
      padding-bottom: 4px;

      &.active {
        border-bottom: 1px solid #00ADB5;
        font-weight: bold;
      }
    }
  }
`;

export default Navigation;
