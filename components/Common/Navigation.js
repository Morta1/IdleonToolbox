import styled from 'styled-components'
import { AppBar, Toolbar } from "@material-ui/core";
import { useRouter } from "next/router";
import React, { useContext } from "react";
import { AppContext } from "./context";
import { screens } from "../../Utilities";
import JsonImport from "../JsonImport";

const Navigation = () => {
  const { userData, display, setUserDisplay, outdated } = useContext(AppContext);
  const router = useRouter();
  const familyRoutes = Object.keys(screens).map((word) => word.replace(/([A-Z])/g, " $1"));

  const isDemo = () => {
    return router?.query?.hasOwnProperty('demo');
  }

  const onNavLinkClick = (index, route, action, category) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', action, {
        event_category: category,
        event_label: route,
        value: 1,
      })
    }
    setUserDisplay(index, route)
  }

  return (
    <NavigationStyle>
      <StyledAppbar position="fixed" color={'default'}>
        <Toolbar>
          {userData && !outdated ? <ul className={'family-navigation'}>
            {familyRoutes.map((route, index) => (
              <ListItem onClick={() => onNavLinkClick(index, route, 'handle_nav', 'engagement', display?.view)}
                        active={display?.view === index} inner={true}
                        key={route + index}>{route}</ListItem>))}
          </ul> : null}
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


const ListItem = styled.li`
  cursor: pointer;
  position: relative;
  display: block;
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
