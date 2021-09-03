import React from 'react';
import { cleanUnderscore, prefix } from "../../Utilities";
import styled from 'styled-components';

const Prayers = ({ prayers }) => {
  return (
    <PrayersStyled>
      {prayers?.map(({ name, rawName }, index) => {
        return <img title={cleanUnderscore(name)} key={name + index}
                    src={`${prefix}data/${rawName}.png`} alt=""/>;
      })}
    </PrayersStyled>
  );
};

const PrayersStyled = styled.div`
  justify-self: center;
  display: flex;
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
