import styled from 'styled-components'
import { cleanUnderscore, prefix } from "../../Utilities";

const ItemDisplay = ({
                       style,
                       Type,
                       description,
                       lvReqToEquip,
                       Class: className,
                       rawName,
                       displayName,
                       Defence,
                       Speed,
                       Weapon_Power,
                       Reach,
                       STR,
                       AGI,
                       WIS,
                       LUK,
                       UQ1txt,
                       UQ1val,
                       UQ2txt,
                       UQ2val,
                       Upgrade_Slots_Left
                     }) => {
  return displayName ? <ItemDisplayStyle style={style}>
    <div className={'top'}>
      <div className='item-image'>
        {rawName ? <img src={`${prefix}data/${rawName}.png`} alt=""/> : null}
      </div>
      <div className="item-desc">
        {displayName ? <span className={'item-name'}>{cleanUnderscore(displayName).toUpperCase()}</span> : null}
        <div>
          {className ? <span>Class: {className}</span> : null}
          {lvReqToEquip ? <span>Lv Req: {lvReqToEquip}</span> : null}
        </div>
      </div>
    </div>
    <div className="separator">
      <div className="dot"/>
      <div className="rest"/>
      <div className="dot"/>
    </div>
    <div className="body">
      {Type ? <span>Type: {cleanUnderscore(Type)}</span> : null}
      {description ? <span>{cleanUnderscore(description)}</span> : null}
      {Speed ? <span>Speed: {Speed}</span> : null}
      {Weapon_Power ? <span>Weapon Power: {Weapon_Power}</span> : null}
      {STR ? <span>STR: {STR}</span> : null}
      {AGI ? <span>AGI: {AGI}</span> : null}
      {WIS ? <span>WIS: {WIS}</span> : null}
      {LUK ? <span>LUK: {LUK}</span> : null}
      {Defence ? <span>Defence: {Defence}</span> : null}
      {Reach ? <span>Reach: {Reach}</span> : null}
      {UQ1txt && UQ1val && <span>Misc: {cleanUnderscore(`+${UQ1val}${UQ1txt}`)}</span>}
      {UQ2txt && UQ2val && <span>Misc: {cleanUnderscore(`+${UQ2val}${UQ2txt}`)}</span>}
      {Upgrade_Slots_Left >= 0 ? <span>Upgrade Slots Left: <span>{Upgrade_Slots_Left}</span></span> : null}
    </div>
  </ItemDisplayStyle> : null;
};

const ItemDisplayStyle = styled.div`
  max-width: 300px;
  background-color: #000142a8;
  padding: 10px;

  .top {
    position: relative;
    display: flex;

    .item-image {
      width: 74px;
      height: 74px;
      background-color: #c1c1d1;
      padding: 1px;

      & img {
        border: 1px solid #000142a8;
      }
    }

    .item-desc {
      margin-left: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .item-name {
        font-weight: bold;
      }

      div {
        margin-top: 15px;
        display: flex;
        flex-direction: column;
      }
    }
  }

  .separator {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    height: 1px;
    margin: 15px 0;
    width: 100%;
    flex-basis: 100%;

    .dot {
      width: 3px;
      height: 3px;
      background-color: #a5a5b5;
    }

    .rest {
      width: 95%;
      height: 3px;
      background-color: #a5a5b5;
    }
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
`;

export default ItemDisplay;
