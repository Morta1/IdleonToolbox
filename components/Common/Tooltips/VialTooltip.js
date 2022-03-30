import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore, kFormatter, prefix } from "../../../Utilities";
import { growth } from "../../General/calculationHelper";

const VialTooltip = ({
                       name,
                       itemReq,
                       desc,
                       level,
                       x1,
                       x2,
                       func,
                       children
                     }) => {
  const vialCost = [0, 100, 1E3, 2500, 1E4, 5E4, 1E5, 5E5, 1000001, 5E6, 25E6, 1E8, 1E9, 5E10];
  return (
    <VialTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={<div className='tooltip-body'>
        <div className="info">
          {cleanUnderscore(name)}
        </div>
        <div>
          {cleanUnderscore(desc).replace(/{|\$/g, growth(func, level, x1, x2))}
        </div>
        {itemReq?.map(({ name, rawName }, index) => {
          return name && name !== 'Blank' && name !== 'ERROR' ? <div className={'item-wrapper'} key={name + '' + index}>
              <span
                className={'amount'}>{name?.includes('Liquid') ? 3 * level : kFormatter(vialCost[parseFloat(level)])}</span>
            <img className={'item-img'} src={`${prefix}data/${rawName}.png`} alt=""/>
          </div> : null
        })}
      </div>}>
      {children}
    </VialTooltipStyle>
  );
};

const VialTooltipStyle = styled((props) => (
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
      font-weight: bold;
      margin-bottom: 15px;
    }

    .item-wrapper {
      margin: 20px 10px 0 0;
      position: relative;
      display: inline-block;

      .item-img {
        width: 50px;
        height: 50px;
      }

      .amount {
        position: absolute;
        top: -10px;
        right: 0;
        font-weight: bold;
        background: #000000eb;
        font-size: 13px;
        padding: 0 5px;
      }
    }
  }
`;
export default VialTooltip;
