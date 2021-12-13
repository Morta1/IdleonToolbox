import React, { useContext } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import { extVersion, screens } from "../Utilities";
import JsonImport from "./JsonImport";
import { AppContext } from "./Common/context";

const NavBar = () => {
  const { display, setUserDisplay, userData } = useContext(AppContext);
  const router = useRouter();

  const familyRoutes = Object.keys(screens).map((word) => word.replace(/([A-Z])/g, " $1"));

  const isDemo = () => {
    return router?.query?.hasOwnProperty('demo');
  }

  return (
    <ListWrapper>
      <CustomList>
        {userData?.version === extVersion ?
          <ul className={'family-navigation'}>
            {familyRoutes.map((route, index) => (
              <ListItem onClick={() => setUserDisplay(index, route)} active={display?.view === index} inner={true}
                        key={route + index}>{route}</ListItem>))}
          </ul> : null}
        {!isDemo() ? <JsonImport/> : null}
      </CustomList>
    </ListWrapper>
  );
};

const ListWrapper = styled.div`
  background-color: #393e46;

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

const CustomList = styled.ul`
  display: flex;
  align-items: center;
  list-style-type: none;
  margin: 0 auto;
  padding: 10px 0;
  width: 95%;
  min-height: 40px;
  flex-wrap: wrap;
  gap: 10px;

  > span {
    color: white;
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

export default NavBar;
