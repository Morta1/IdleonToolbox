import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore, pascalCase } from "../../../Utilities";

const StatueTooltip = ({ effect, bonus, name, level, children }) => {
  const calcBonus = Math.round(level * bonus);
  const nextLv = Math.round(Math.pow(level, 1.17) * Math.pow(1.35, level / 10) + 1);
  const desc = cleanUnderscore(pascalCase(effect?.replace(/(%?)(@)/, '$2$1_').replace('@', calcBonus)));
  return (
    <StatueTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={<div className='tooltip-body'>
        <div className={'title'}>
          {cleanUnderscore(name.toLowerCase().capitalize())} Lv.{level}
        </div>
        <div>{cleanUnderscore(desc)}</div>
        <div>Statues needed for next level: {nextLv}</div>
      </div>}>
      {children}
    </StatueTooltipStyle>
  );
};

const StatueTooltipStyle = styled((props) => (
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

export default StatueTooltip;
