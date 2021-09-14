import React from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import { prefix } from "../Utilities";
import JsonImport from "./JsonImport";

const NavBar = () => {
  const router = useRouter();

  const names = [
    { label: "Card Search", path: prefix ? prefix : "/" },
    { label: "Family", path: `${prefix}family` },
  ];

  const handleClick = (e, path) => {
    e.preventDefault();
    router.push(path);
  };

  return (
    <ListWrapper>
      <List>
        {names.map(({ label, path }, index) => {
          return (
            <React.Fragment key={label + "-" + index}>
              <ListItem
                active={router?.pathname.endsWith(path)}
                onClick={(e) => handleClick(e, path)}>
                {label}
              </ListItem>
              {index !== names.length - 1 ? <span>|</span> : null}
            </React.Fragment>
          );
        })}
        {router?.pathname.endsWith(`family`) ? <JsonImport /> : null}
      </List>
    </ListWrapper>
  );
};

const ListWrapper = styled.div`
  background-color: #393e46;
  box-shadow: 0px 2px 4px -1px rgb(0 0 0 / 20%),
    0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
`;

const List = styled.ul`
  display: flex;
  align-items: center;
  list-style-type: none;
  margin: 0 auto;
  padding: 10px 0;
  width: 95%;
  min-height: 40px;
  flex-wrap: wrap;

  > span {
    color: white;
    margin: 0 10px;
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

  ${({ active }) => (active ? "border-bottom: 1px solid white;" : "")}
  ${({ active }) => (active ? "font-weight: bold;" : "")}
  &::after {
    position: absolute;
    content: "";
    top: 100%;
    left: 0;
    width: 100%;
    height: 3px;
    background: white;
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
