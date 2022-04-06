import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore } from "../../../Utilities";

const EffectTooltip = ({
                         type,
                         name,
                         desc,
                         effect,
                         multiplier = 1,
                         children
                       }) => {
  return (
    <EffectTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={<div className='tooltip-body'>
        <div className="info">
          {cleanUnderscore(name)}
        </div>
        <div className={`item-req${multiplier !== 1 ? ' lab-bonus-active' : ''}`}>
          {cleanUnderscore(desc).replace(/({}?)|\$/g, type === 'bubble' ? effect * multiplier : `+${effect * multiplier}`)}
        </div>
      </div>}>
      {children}
    </EffectTooltipStyle>
  );
};

const EffectTooltipStyle = styled((props) => (
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
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .lab-bonus-active {
      color: #66c7f5;
    }
  }
`;
export default EffectTooltip;
