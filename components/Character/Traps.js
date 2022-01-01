import React from 'react';
import styled from 'styled-components';
import { prefix } from "../../Utilities";
import ItemInfoTooltip from "../Common/Tooltips/ItemInfoTooltip";

const Traps = ({ traps, trap }) => {
  return (
    <TrapsStyled length={traps?.length}>
      {[trap, ...traps]?.map((item, index) => {
        if (!item) return null;
        const { name, timeLeft, rawName } = item;
        const hours = parseInt(timeLeft?.match(/([0-9]+)h/g)?.[0].match(/[0-9]+/)[0]);
        return rawName?.includes('TrapBox') ? <div className={'trap'} key={name + index}>
          <ItemInfoTooltip {...item}>
            <img src={`${prefix}data/${rawName}.png`} alt=""/>
          </ItemInfoTooltip>
        </div> : <div className={'trap'} key={name + index}>
          <span className={hours === 0 ? 'overtime' : ''}>{timeLeft}</span>
          <img src={`${prefix}data/${rawName}.png`} alt=""/>
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
