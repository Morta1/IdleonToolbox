import React from 'react';
import { cleanUnderscore, prefix } from "../../Utilities";
import styled from 'styled-components';

const Obols = ({ obols, type }) => {
  const getImgName = (name, rawName, shape) => {
    switch (name) {
      case 'Locked': {
        return `Obol_Locked_${shape}`;
      }
      case 'Empty': {
        return `Obol_Empty_${shape}`;
      }
      default: {
        return rawName;
      }
    }
  };

  return (
    <ObolsStyled>
      {(type === 'character' ? [5, 9, 12, 16, 23] : [5, 10, 14, 19, 24]).map((endInd, rowNumber, array) => {
        const startInd = rowNumber === 0 ? 0 : array[rowNumber - 1];
        const relevantArray = obols?.slice(startInd, endInd);
        return <div className={'obol-row'} key={startInd + rowNumber}>
          {relevantArray?.map(({ name, rawName, lvReq, shape }, index) => {
            const imgName = getImgName(name, rawName, shape);
            return <div className={'obol-wrapper'} key={name + index}>
              {lvReq && name === 'Locked' ? <span className={'lv-req'}>{lvReq}</span> : null}
              <img title={cleanUnderscore(name)} src={`${prefix}data/${imgName}.png`}
                   alt=""/>
            </div>;
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

  .obol-wrapper {
    position: relative;
    display: inline;

    .lv-req {
      position: absolute;
      font-size: 14px;
      font-weight: bold;
      left: 50%;
      transform: translateX(-50%);
      bottom: 20px;
      text-shadow: 2px 2px 2px black;
    }
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
