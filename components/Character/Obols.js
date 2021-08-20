import React from 'react';
import { cleanUnderscore, prefix } from "../../Utilities";
import styled from 'styled-components';

const Obols = ({ obols, type }) => {
  const getImgName = (name, shape) => {
    switch (name) {
      case 'Locked': {
        return `Obol_Locked_${shape}`;
      }
      case 'Empty': {
        return `Obol_Empty_${shape}`;
      }
      default: {
        return name;
      }
    }
  };

  return (
    <ObolsStyled>
      {/*The array is temporary hard coded just for Character - will change when I add family Obols*/}
      {(type === 'character' ? [5, 9, 12, 16, 23] : [5, 10, 14, 19, 24]).map((endInd, rowNumber, array) => {
        const startInd = rowNumber === 0 ? 0 : array[rowNumber - 1];
        const relevantArray = obols?.slice(startInd, endInd);
        return <div className={'obol-row'} key={startInd + rowNumber}>
      {relevantArray?.map(({name, shape}, index) => {
        const imgName = getImgName(name, shape);
        return <img title={cleanUnderscore(name)} key={name + index} src={`${prefix}materials/${imgName}.png`}
        alt=""/>;
      })}
        </div>;
      })}
    </ObolsStyled>
  );
};

const ObolsStyled = styled.div`
  .obol-row {
    text-align: center;
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

export default Obols;
