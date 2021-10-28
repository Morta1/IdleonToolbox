import React, { useState } from 'react';
import styled from "styled-components";
import { kFormatter, prefix } from "../../Utilities";
import ItemInfoTooltip from "../Common/Tooltips/ItemInfoTooltip";

const Equipment = ({ equipment, tools, foods }) => {
  const [items, setItems] = useState(equipment);
  const [active, setActive] = useState('tab1');
  const [equipsInd, setEquipsInd] = useState(0);

  const switchEquips = (ind) => {
    const temp = [...equipment];
    setEquipsInd(ind);
    setItems(ind === 0 ? temp.slice(0, 8) : temp.slice(8, temp.length));
  }

  const switchTabs = (tab, data, specials) => {
    if (specials) {
      switchEquips(equipsInd);
    } else {
      setItems(data);
    }
    setActive(tab);
  }

  return (
    <EquipmentStyle active={active} equipsInd={equipsInd}>
      <div className={'tabs'}>
        {equipment ?
          <img onClick={() => switchTabs('tab1', equipment, true)} className={`tab1 ${active === 'tab1' && 'active'}`}
               src={`${prefix}data/UIinventoryEquipTabs1.png`}
               alt=""/> : null}
        {tools ?
          <img onClick={() => switchTabs('tab2', tools)} className={`tab2 ${active === 'tab2' && 'active'}`}
               src={`${prefix}data/UIinventoryEquipTabs2.png`}
               alt=""/> : null}
        {foods ?
          <img onClick={() => switchTabs('tab3', foods)} className={`tab3 ${active === 'tab3' && 'active'}`}
               src={`${prefix}data/UIinventoryEquipTabs3.png`}
               alt=""/> : null}
      </div>
      {items?.map((item, equipIndex) => {
        const { name: equipName, rawName, amount } = item;
        if (equipIndex > 7) return null;
        if (rawName === 'Blank' || active === 'tab3')
          return <Box key={equipName + amount + equipIndex} aria-label={equipName} role="img"
                      img={rawName}>{amount > 0 ?
            <span>{kFormatter(amount)}</span> : null}</Box>;
        return (
          <ItemInfoTooltip key={equipName + equipIndex} {...item}>
            <Box aria-label={equipName} role="img" img={rawName}>{amount > 0 ?
              <span>{kFormatter(amount)}</span> : null}</Box>
          </ItemInfoTooltip>
        );
      })}
      {active === 'tab1' ? <div className={'equips-arrows'}>
        {equipsInd === 1 ?
          <img onClick={() => switchEquips(0)} className={'arrow'} src={`${prefix}data/UIAnvilArrows2.png`}
               alt=""/> : null}
        <span className={'arrow-text'}>{equipsInd === 0 ? 'Equipment' : 'Specials'}</span>
        {equipsInd === 0 ?
          <img onClick={() => switchEquips(1)} className={'arrow'} src={`${prefix}data/UIAnvilArrows1.png`}
               alt=""/> : null}
      </div> : null}
    </EquipmentStyle>
  );
};

const EquipmentStyle = styled.div`
  height: 455px;
  position: relative;
  display: grid;
  justify-content: center;
  grid-template-columns: repeat(2, max-content);
  grid-template-rows: repeat(1, 60px) repeat(4, 85px);
  background: url(${() => `${prefix}data/UIinventoryEquips.png`}) no-repeat center;
  background-size: contain;
  padding-top: 15px;
  grid-row-gap: 2px;
  grid-column-gap: 5px;

  .equips-arrows {
    height: 80%;
    grid-column: span 2;
    display: grid;
    grid-template-columns: ${({ equipsInd }) => equipsInd === 0 ? '2fr 1fr' : '1fr 2fr'};

    .arrow-text {
      justify-self: ${({ equipsInd }) => equipsInd === 0 ? 'right' : 'left'};
      align-self: center;
    }

    .arrow {
      cursor: pointer;
      height: 25px;
      place-self: center;
    }
  }

  .tabs {
    grid-column: span 2;
    position: relative;

    .tab1, .tab2, .tab3 {
      position: absolute;
      height: 50px;
      cursor: pointer;
      filter: brightness(0.5);
    }

    .tab1 {
      left: -15px;
      top: -5px;
    }

    .tab2 {
      position: absolute;
      height: 50px;
      left: 55px;
      top: -5px;
    }

    .tab3 {
      left: 125px;
      top: -5px;
    }

    > .active {
      filter: brightness(1);
    }
  }
}`;

const Box = styled.div`
  width: 85px;
  height: 85px;
  border: 1px solid #7b7b7b8c;
  position: relative;
  background: url(${({ img }) => img !== 'None' && img !== 'Blank' ? `${prefix}data/${img}.png` : ''}) no-repeat;
  background-size: contain;

  > span {
    right: 5px;
    bottom: 5px;
    padding: 0 5px;
    font-weight: bold;
    font-size: 13px;
    text-align: center;
    position: absolute;

    background: #000000eb;
  }
}
`;

export default Equipment;
