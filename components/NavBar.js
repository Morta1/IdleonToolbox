import React from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import { prefix } from "../Utilities";

const NavBar = () => {
  const router = useRouter();

  const names = [
    { label: "Card Search", path: `${prefix}/` },
    { label: "Family", path: `${prefix}/family` },
  ];
  const handleClick = (e, name) => {
    e.preventDefault();
    window.location.href = name.includes("Card") ? "/" : name;
  };
  return (
    <List>
      {names.map(({ label, path }, index) => {
        return (
          <React.Fragment key={label + "-" + index}>
            <ListItem
              active={router?.pathname === path}
              onClick={(e) => handleClick(e, path)}
            >
              {label}
            </ListItem>
            {index !== names.length - 1 ? <span>|</span> : null}
          </React.Fragment>
        );
      })}
    </List>
  );
};

const List = styled.ul`
  display: flex;
  align-items: center;
  list-style-type: none;
  margin: 0;
  padding: 10px;
  background-color: #5454547a;
  border-radius: 5px;

  > span {
    color: white;
    margin: 0 10px;
  }
`;

const ListItem = styled.li`
  //margin-right: 15px;
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
