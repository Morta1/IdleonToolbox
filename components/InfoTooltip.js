import { Tooltip } from "@material-ui/core";
import styled from 'styled-components';

const InfoTooltip = ({ children }) => {
  return (
    <StyledTooltip
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={
        <div>
          Head over to <a href="https://github.com/Corbeno/Idleon-Api-Downloader"
                          rel={'noreferrer'}
                          target={'_blank'}>Idleon-Api-Downloader</a> and use it to copy the&nbsp;<b>&apos;Clean
          JSON&apos;</b> option and click <b>&apos;Import JSON&apos;</b>
        </div>
      }
    >
      {children}
    </StyledTooltip>
  );
};

const StyledTooltip = styled(((props) =>
    <Tooltip {...props} classes={{ popper: props.className, tooltip: "tooltip"}}  />
))`
  & .tooltip {
    color: black;
    font-size: 16px;
    background-color: #f5f5f9;
    border: 1px solid #dadde9;
    box-shadow: rgba(0, 0, 0, 0.24) 0 3px 8px;
    max-width: 300px;
    @media only screen and (max-width: 600px) {
      max-width: 200px;
    }
  }
`;

export default InfoTooltip
