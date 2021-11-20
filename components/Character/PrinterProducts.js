import React from 'react';
import { cleanUnderscore, kFormatter, prefix } from "../../Utilities";
import styled from 'styled-components';

const PrinterProducts = ({ selected, stored }) => {
  return (
    <PrinterProductsStyled>
      <div className="printing">
        <h3>Printing</h3>
        <div className="cont">
          {selected?.map(({ item, value }, index) => {
            return <div className={'product-container'} key={item + index}>
              <span className={'product-value'}>{kFormatter(value)}/hr</span>
              <img className={'print-slot'} title={cleanUnderscore(item)} src={`${prefix}data/PrintSlot.png`} alt=""/>
              <img title={cleanUnderscore(item)} src={`${prefix}materials/${item}.png`} alt=""/>
            </div>
          })}
        </div>
      </div>
      <div className="samples">
        <h3>Samples</h3>
        <div className="cont">
          {stored?.map(({ item, value }, index) => {
            return item !== 'None' && item !== 'Blank' && value > 0 ? <div className={'product-container'} key={item + index}>
              <span className={'product-value'}>{kFormatter(value)}/hr</span>
              <img className={'print-slot'} title={cleanUnderscore(item)} src={`${prefix}data/PrintSlot.png`} alt=""/>
              <img title={cleanUnderscore(item)} src={`${prefix}materials/${item}.png`} alt=""/>
            </div> : null
          })}
        </div>
      </div>
    </PrinterProductsStyled>
  );
};

const PrinterProductsStyled = styled.div`
  justify-self: center;

  & h3 {
    margin: 0 0 20px 0;
  }

  .printing {
    margin-bottom: 15px;
  }
  
  .cont {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }

  .product-container {
    position: relative;

    .print-slot {
      position: absolute;
      z-index: -1;
      height: 100%;
    }

    .product-value {
      position: absolute;
      font-weight: bold;
      background: #000000eb;
      font-size: 13px;
      padding: 0 5px;
      text-align: center;
      left: 50%;
      transform: translateX(-50%);
      top: -10px;
    }
  }

  @media (max-width: 370px) {
    img {
      width: 36px;
      height: 36px;
    }
  }
`;

export default PrinterProducts;
