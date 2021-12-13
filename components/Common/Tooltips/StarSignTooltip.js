import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore } from "../../../Utilities";

const StarSignTooltip = ({
                           name,
                           bonuses,
                           children
                         }) => {
  return (
    <StarSignTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"right-start"}
      title={<div className='tooltip-body'>
        <div className="info">
          {cleanUnderscore(name)}
        </div>
        <div className="item-req">
          {cleanUnderscore(bonuses.join(', '))}
        </div>
      </div>}>
      {children}
    </StarSignTooltipStyle>
  );
};

const StarSignTooltipStyle = styled((props) => (
  <Tooltip
    {...props}
    classes={{ popper: props.className, tooltip: "tooltip", touch: "touch" }}
  />
))`

  & .tooltip {
    will-change: contents;
    background-color: #393e46;
    box-shadow: 0 2px 4px -1px rgb(0 0 0 / 20%),
    0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
    font-size: 16px;
    min-width: 200px;
  }

  & .touch {
  }

  .tooltip-body {
    padding: 10px;

    .info {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
    }
  }
`;
export default StarSignTooltip;
