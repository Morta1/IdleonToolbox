import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore } from "../../../Utilities";
import { growth } from "../../General/calculationHelper";

const TalentTooltip = ({ level, funcX, x1, x2, funcY, y1, y2, description, name, children }) => {
  const mainStat = level > 0 ? growth(funcX, level, x1, x2) : 0;
  const secondaryStat = level > 0 ? growth(funcY, level, y1, y2) : 0;
  return (
    <TalentTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"left-start"}
      title={<div className='tooltip-body'>
        <div className={'title'}>
          {cleanUnderscore(name)}
        </div>
        {cleanUnderscore(description).replace('{', mainStat).replace('}', secondaryStat)}
      </div>}>
      {children}
    </TalentTooltipStyle>
  );
};

const TalentTooltipStyle = styled((props) => (
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
  }

  & .touch {
  }

  .tooltip-body {
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

export default TalentTooltip;
