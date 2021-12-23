import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import ItemDisplay from "../ItemDisplay";

//Power,
//lvReqToEquip,
//Class,
//UQ2txt,
//UQ2val,

const ItemInfoTooltip = ({
                           children,
                           ...item
                         }) => {
  return (
    <ItemInfoTooltipStyle
      interactive
      enterTouchDelay={100}
      title={<ItemDisplay {...item}/>}>
      {children}
    </ItemInfoTooltipStyle>
  );
};

const ItemInfoTooltipStyle = styled((props) => (
  <Tooltip
    {...props}
    classes={{ popper: props.className, tooltip: "tooltip", touch: "touch" }}
  />
))`

  & .tooltip {
    will-change: contents;
    padding: 0;
    //background-color: #393e46;
    //box-shadow: 0 2px 4px -1px rgb(0 0 0 / 20%),
    //0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
    font-size: 16px;
    min-width: 200px;
  }

  & .touch {
  }

  .tooltip-body {
    padding: 10px;

    .item-icon-container {
      display: flex;
      margin-bottom: 15px;

      .item-name {
        display: block;
        margin-top: 10px;
        margin-bottom: 10px;
        margin-left: 10px;
        font-weight: bold;
        text-shadow: 1px 1px 1px black;
      }
    }

    .stats {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      gap: 5px;

      > span {
        color: white;
      }

      .item-value {
        text-shadow: 1px 1px 1px black;
      }

      .item-upgrade-slots {
        margin-top: 10px;
      }
    }

    .bottom-border {
      position: absolute;
      bottom: 0;
      height: 2px;
    }
  }
`;
export default ItemInfoTooltip;
