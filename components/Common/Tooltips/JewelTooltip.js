import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore } from "../../../Utilities";

const JewelTooltip = ({ effect, bonus, name, children }) => {
  return (
    <JewelTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={<div className='tooltip-body'>
        <div className={'title'}>
          {cleanUnderscore(name.toLowerCase().capitalize())}
        </div>
        <div>{cleanUnderscore(effect?.replace(/}/g, bonus)).split('@')[0]}</div>
      </div>}>
      {children}
    </JewelTooltipStyle>
  );
};

const JewelTooltipStyle = styled((props) => (
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
    min-width: 330px;

  }

  & .touch {
  }

  .tooltip-body {
    min-width: 330px;
    padding: 10px;

    .info {
      margin-bottom: 15px;
    }
  }

  .title {
    font-size: 22px;
    margin-bottom: 15px;
    font-weight: bold;
  }
`;

export default JewelTooltip;
