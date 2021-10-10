import styled from "styled-components";
import { Tooltip } from "@material-ui/core";
import React from "react";

export default styled((props) => (
  <Tooltip
    {...props}
    classes={{ popper: props.className, tooltip: "tooltip", touch: "touch" }}
  />
))`
  & .tooltip {
    background-color: white;
    color: rgba(0, 0, 0, 0.87);
    font-size: 12px;
    font-weight: bold;
  }
`;