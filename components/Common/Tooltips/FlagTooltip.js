import { Tooltip } from "@material-ui/core";
import styled from 'styled-components';
import { cleanUnderscore, kFormatter } from "../../../Utilities";

const FlagTooltip = ({ cog, currentAmount, requiredAmount, character, children }) => {
  return (
    <StyledTooltip
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={
        <div>
          {character ? <span className={'character-name'}>{character}</span> : null}
          {currentAmount < requiredAmount ? <span>
            {kFormatter(currentAmount, 2)} / {kFormatter(requiredAmount, 2)} ({kFormatter(currentAmount / requiredAmount * 100, 2)}%)
          </span> : null}
          {Object.values(cog?.stats)?.map(({ name, value }, index) => name ? <div
            key={`${name}-${index}`}>{kFormatter(value, 2)}{cleanUnderscore(name)}</div> : null)}
        </div>
      }
    >
      {children}
    </StyledTooltip>
  );
};

const StyledTooltip = styled(((props) =>
    <Tooltip {...props} classes={{ popper: props.className, tooltip: "tooltip" }}/>
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

    .character-name {
      font-weight: bold;
    }
  }
`;

export default FlagTooltip
