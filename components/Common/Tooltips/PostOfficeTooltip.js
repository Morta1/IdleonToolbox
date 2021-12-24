import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore } from "../../../Utilities";
import { growth } from "../../General/calculationHelper";

const PostOfficeTooltip = ({ level, name, upgrades, children }) => {
  if (name === 'Filler') return children;
  return (
    <PostOfficeTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"left-start"}
      title={<div className='tooltip-body'>
        <div className={'title'}>
          {cleanUnderscore(name)}
        </div>
        <div className={'upgrades'}>
          {upgrades?.map(({ bonus, func, x1, x2 }, index) => {
            const updatedLevel = index === 0 ? level : index === 1 ? level - 25 : level - 100;
            return <div
              key={bonus + ' ' + index}>{Math.max(0, growth(func, updatedLevel, x1, x2))}{cleanUnderscore(bonus)}</div>
          })}
        </div>
      </div>}>
      {children}
    </PostOfficeTooltipStyle>
  );
};

const PostOfficeTooltipStyle = styled((props) => (
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

export default PostOfficeTooltip;
