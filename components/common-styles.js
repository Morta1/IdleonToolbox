import styled from "styled-components";
import Tabs from "@material-ui/core/Tabs";

const Wrapper = styled.div`
  width: 95%;
  margin: 20px auto 0;
  
  @media (max-width: 1440px) {
    width: 98%;
  }
  
  @media (max-width: 750px) {
    width: 100%;
    margin: 0;
  }
`;

const StyledTabs = styled(Tabs)`
  && {
    background-color: #545456;
  }

  & .MuiTabs-indicator {
    background-color: #50ff00;
  }
`;

export { Wrapper, StyledTabs };
