import React from 'react';
import { prefix } from "../../Utilities";
import styled from 'styled-components';
import ItemInfoTooltip from "../Common/Tooltips/ItemInfoTooltip";

const shapes = {
  'Circle': '1',
  'Square': '2',
  'Hexagon': '3',
  'Sparkle': '4'
};

const Obols = ({ obols, type }) => {
  const getImgName = (name, rawName, shape) => {
    switch (true) {
      case rawName.includes('Locked'): {
        return `ObolLocked${shapes[shape]}`;
      }
      case rawName.includes('Blank'): {
        return `ObolEmpty${shapes[shape]}`;
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
          {relevantArray?.map((item, index) => {
            const { displayName, rawName, levelReq, shape } = item;
            const imgName = getImgName(displayName, rawName, shape);
            return <div className={'obol-wrapper'} key={rawName + '' + index}>
              {levelReq && rawName.includes('Locked') ? <span className={'lv-req'}>{levelReq}</span> : null}
              <ItemInfoTooltip key={displayName + "" + index} {...item}>
                <img src={`${prefix}data/${imgName}.png`}
                     alt=""/>
              </ItemInfoTooltip>
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
