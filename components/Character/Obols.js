import React from 'react';
import { cleanUnderscore, prefix } from "../../Utilities";
import styled from 'styled-components';

const Obols = ({ obols }) => {
  return (
    <ObolsStyled>
      {obols?.map(({name}, index) => {
        const imgName = name === "Empty" ? 'Empty_Obol' : name;
        return imgName !== "Locked" ? <img title={cleanUnderscore(name)} key={name + index}
                    src={`${prefix}materials/${imgName}.png`} alt=""/>  : null;
      })}
    </ObolsStyled>
  );
};

const ObolsStyled = styled.div`
  justify-self: center;

  @media (max-width: 750px) {
    img, .empty {
      width: 48px;
      height: 48px;
    }
  }

  @media (max-width: 370px) {
    img, .empty {
      width: 36px;
      height: 36px;
    }
  }
`;

export default Obols;
