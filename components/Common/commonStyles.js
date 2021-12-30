import styled from "styled-components";
import Tabs from "@material-ui/core/Tabs";
import { Box, LinearProgress, Typography } from "@material-ui/core";

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
    background-color: #393E46;
  }

  & .MuiTabs-indicator {
    background-color: #00ADB5;
  }
`;


const LinearProgressWithLabel = (props) => {
  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <StyledLinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={38}>
        <Typography variant="body2">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

const StyledLinearProgress = styled(LinearProgress)`
  && {
    width: 100%;
    background-color: ${({ barbgcolor }) => barbgcolor || 'black'};

    .MuiLinearProgress-barColorPrimary {
      background-color: ${({
                             barcolor
                           }) => barcolor || 'white'};
    }
  }
`;

export { Wrapper, StyledTabs, LinearProgressWithLabel };
