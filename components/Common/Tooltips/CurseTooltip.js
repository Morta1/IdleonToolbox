import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore, kFormatter, prefix, round } from "../../../Utilities";

const CurseTooltip = ({
                        name,
                        effect,
                        curse,
                        children,
                        x1,
                        x2,
                        level,
                        maxLevel,
                        cost, soul
                      }) => {
  return (
    <CurseTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={<div className='tooltip-body'>
        <div className="info">
          {cleanUnderscore(name)}
        </div>
        <div className="item-req">
          <span className={'bonus'}>Bonus:</span> {cleanUnderscore(effect).replace('{', x1)}
        </div>
        <div className="item-req">
          <span className={'curse'}>Curse:</span> {cleanUnderscore(curse).replace('{', x2)}
        </div>
        {maxLevel === level ? <span className={'maxed'}>MAXED</span> : <div className="cost">
          <img src={`${prefix}data/${soul}.png`} alt=""/>
          <span className={'cost-span'}>Cost:</span> {kFormatter(round(cost), 2)}
        </div>}
      </div>}>
      {children}
    </CurseTooltipStyle>
  );
};

const CurseTooltipStyle = styled((props) => (
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

    .bonus {
      color: #19b219;
      font-weight: bold;
    }

    .curse {
      color: #e82929;
      font-weight: bold;
    }

    .info {
      font-weight: bold;
      font-size: 22px;
      margin-bottom: 15px;
    }

    .cost {
      display: flex;
      align-items: center;
      margin: 10px 0;

      .cost-span {
        font-weight: bold;
        margin-right: 10px;
      }
    }

    & img {
      width: 36px;
      height: 36px;
    }

    .maxed {
      color: #6cdf6c;
      display: flex;
      align-items: center;
    }
  }
`;
export default CurseTooltip;
