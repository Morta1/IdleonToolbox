import React from 'react';
import { prefix } from "../../Utilities";
import styled from 'styled-components';
import CurseTooltip from "../Common/Tooltips/CurseTooltip";

const PlayerPrayers = ({ prayers }) => {
  const calcCost = (prayer) => {
    const { level, costMulti, prayerIndex } = prayer
    if (level < 6) {
      return Math.round(costMulti * (1 + (4 + prayerIndex / 25) * level));
    }
    return Math.round(Math.min(2e9, costMulti * (1 + (1 + prayerIndex / 20) * level) * Math.pow(prayerIndex === 9 ? 1.3 : 1.12, level - 5)))
  }
  return (
    <PrayersStyled length={prayers?.length}>
      {prayers?.map((prayer, index) => {
        const { name, x1, x2, level, prayerIndex } = prayer
        const calculatedBonus = x1 + (x1 * (level - 1)) / 10;
        const calculatedCurse = x2 + (x2 * (level - 1)) / 10;
        const cost = calcCost(prayer);
        return <CurseTooltip key={name + index} {...{ ...prayer, x1: calculatedBonus, x2: calculatedCurse, cost }}>
          <img src={`${prefix}data/Prayer${prayerIndex}.png`} alt=""/>
        </CurseTooltip>;
      })}
    </PrayersStyled>
  );
};

const PrayersStyled = styled.div`
  display: grid;
  grid-template-columns: repeat(${({ length }) => length >= 3 ? 3 : length}, auto);
  justify-content: center;
  gap: 10px;

  img {
    width: 60px;
    height: 60px;
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

export default PlayerPrayers;
