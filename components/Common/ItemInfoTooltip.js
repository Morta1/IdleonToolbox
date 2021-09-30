import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore, prefix } from "../../Utilities";

const ItemInfoTooltip = ({
                           rawName,
                           displayName,
                           Power,
                           Defence,
                           Speed,
                           Weapon_Power,
                           lvReqToEquip,
                           Class,
                           Reach,
                           STR,
                           AGI,
                           WIS,
                           LUK,
                           UQ1txt,
                           UQ1val,
                           UQ2txt,
                           UQ2val,
                           Upgrade_Slots_Left,
                           children
                         }) => {
  return (
    <ItemInfoTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={<div className='tooltip-body'>
        <div className={'item-icon-container'}>
          <img className={'item-icon'} src={`${prefix}/data/${rawName}.png`} alt=""/>
          <span className={'item-name'}>{cleanUnderscore(displayName)}</span>
        </div>
        <div className="stats">
          {Speed &&
          <span className={'item-speed'}>Speed: <span className={'item-value'}>{cleanUnderscore(Speed)}</span></span>}
          {Weapon_Power && <span className={'item-weapon-power'}>Weapon Power: <span
            className={'item-value'}>{cleanUnderscore(Weapon_Power)}</span></span>}
          {STR && <span className={'item-str'}>STR: <span className={'item-value'}>{cleanUnderscore(STR)}</span></span>}
          {AGI && <span className={'item-agi'}>AGI: <span className={'item-value'}>{cleanUnderscore(AGI)}</span></span>}
          {WIS && <span className={'item-wis'}>WIS: <span className={'item-value'}>{cleanUnderscore(WIS)}</span></span>}
          {LUK && <span className={'item-luk'}>LUK: <span className={'item-value'}>{cleanUnderscore(LUK)}</span></span>}
          {Defence && <span className={'item-defence'}>Defence: <span
            className={'item-value'}>{cleanUnderscore(Defence)}</span></span>}
          {Reach &&
          <span className={'item-reach'}>Reach: <span className={'item-value'}>{cleanUnderscore(Reach)}</span></span>}
          {UQ1txt && UQ1val && <span className={'item-misc'}>Misc: <span
            className={'item-value'}>{cleanUnderscore(`${UQ1val}${UQ1txt}`)}</span></span>}
          {Upgrade_Slots_Left >= 0 ? <span className={'item-upgrade-slots'}>Upgrade Slots Left: <span className={'item-value'}>{Upgrade_Slots_Left}</span></span> : null}
        </div>
      </div>}>
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
      .item-upgrade-slots{
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
