import React from 'react';
import { cleanUnderscore, kFormatter, prefix } from "../../Utilities";
import styled from 'styled-components';

const PrinterProducts = ({ products }) => {
  return (
    <PrinterProductsStyled>
      {products?.map(({ item, value }, index) => {
        return <div className={'product-container'} key={item + index}>
          <span className={'product-value'}>{kFormatter(value)}/hr</span>
          <img className={'print-slot'} title={cleanUnderscore(item)} src={`${prefix}data/PrintSlot.png`} alt=""/>
          <img title={cleanUnderscore(item)} src={`${prefix}materials/${item}.png`} alt=""/>
        </div>

      })}
    </PrinterProductsStyled>
  );
};

const PrinterProductsStyled = styled.div`
  justify-self: center;

  .product-container {
    position: relative;
    display: inline-block;

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
      right: 0;
      top: -10px;
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

export default PrinterProducts;
