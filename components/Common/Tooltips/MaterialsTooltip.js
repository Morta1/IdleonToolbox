import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore, prefix } from "../../../Utilities";

const MaterialsTooltip = ({
                            name,
                            items,
                            children
                          }) => {
  return (
    <MaterialsTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={<div className='tooltip-body'>
        <div className="info">
          {cleanUnderscore(name)}
        </div>
        {items?.map(({ rawName, itemQuantity }, index) => {
          return <div className={'item-wrapper'} key={rawName + '' + index}>
            <span className={'amount'}>{itemQuantity}</span>
            <img className={'item-img'} src={`${prefix}data/${rawName}.png`} alt=""/>
          </div>
        })}
      </div>}>
      {children}
    </MaterialsTooltipStyle>
  );
};

const MaterialsTooltipStyle = styled((props) => (
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
      margin-bottom: 15px;
      font-size: 24px;
      font-weight: bold;
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
export default MaterialsTooltip;
