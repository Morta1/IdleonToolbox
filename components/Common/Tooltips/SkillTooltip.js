import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore, kFormatter } from "../../../Utilities";
import { LinearProgressWithLabel } from "../commonStyles";

const SkillTooltip = ({ name, level, exp, expReq, children, charName }) => {
  const percent = exp / expReq * 100;
  return (
    <SkillTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={<div className='tooltip-body'>
        <div className={'title'}>{charName}</div>
        <div className={'title'}>
          {cleanUnderscore(name.capitalize())} Lv.{level}
        </div>
        {kFormatter(exp)} / {kFormatter(expReq)}
        <LinearProgressWithLabel barColor={'#e1e131'} barBgColor={'#2a2828'} value={percent > 100 ? 100 : percent}/>
      </div>}>
      {children}
    </SkillTooltipStyle>
  );
};

const SkillTooltipStyle = styled((props) => (
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
    width: 330px;
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

export default SkillTooltip;
