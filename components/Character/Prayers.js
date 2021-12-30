import React from 'react';
import { prefix } from "../../Utilities";
import styled from 'styled-components';
import CurseTooltip from "../Common/Tooltips/CurseTooltip";

const Prayers = ({ prayers }) => {
  return (
    <PrayersStyled>
      {prayers?.map((prayer, index) => {
        const { name, x1, x2, level, costMulti, id, prayerIndex } = prayer
        const multiplier = name === 'The_Royal_Sampler' ? 1.25 : 1.5;
        const calculatedBonus = x1 + (x1 * (level - 1)) / 10;
        const calculatedCurse = x2 + (x2 * (level - 1)) / 10;
        const cost = Math.min(2e9, costMulti * (1 + (4 + (id / 25))) * level) * Math.pow(multiplier, level - 5);
        return <CurseTooltip key={name + index} {...{ ...prayer, x1: calculatedBonus, x2: calculatedCurse, cost }}><img
          src={`${prefix}data/Prayer${prayerIndex}.png`} alt=""/></CurseTooltip>;
      })}
    </PrayersStyled>
  );
};

const PrayersStyled = styled.div`
  display: grid;
  grid-template-columns: repeat(3, auto);
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

export default Prayers;
