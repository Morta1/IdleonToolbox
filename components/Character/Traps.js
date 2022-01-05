import React from 'react';
import styled from 'styled-components';
import { prefix } from "../../Utilities";
import ItemInfoTooltip from "../Common/Tooltips/ItemInfoTooltip";
import Timer from "../Common/Timer";

const Traps = ({ traps, trap, lastUpdated }) => {
  return (
    <TrapsStyled length={traps?.length}>
      {[trap, ...traps]?.map((item, index) => {
        if (!item) return null;
        let { name, timeLeft, rawName } = item;
        return rawName?.includes('TrapBox') ? <div className={'trap'} key={name + index}>
          <ItemInfoTooltip {...item}>
            <img src={`${prefix}data/${rawName}.png`} alt=""/>
          </ItemInfoTooltip>
        </div> : <div className={'trap'} key={name + index}>
          <img src={`${prefix}data/${rawName}.png`} alt=""/>
          <span>
            <Timer type={'countdown'} date={timeLeft}
                   lastUpdated={lastUpdated}/>
          </span>
        </div>;
      })}
    </TrapsStyled>
  );
};

const TrapsStyled = styled.div`
  display: grid;
  grid-template-columns: repeat(${({ length }) => length >= 3 ? 3 : length}, auto);
  justify-content: center;
  gap: 10px;

  .trap {

    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .overtime {
    font-weight: bold;
    color: #f91d1d;
  }

  @media (max-width: 750px) {
    img {
      width: 48px;
      height: 48px;
    }
  }

  @media (max-width: 370px) {
    img {
      width: 36px;
      height: 36px;
    }
  }
`;

export default Traps;
