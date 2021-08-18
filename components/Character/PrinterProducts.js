import React from 'react';
import { cleanUnderscore, numberWithCommas, prefix } from "../../Utilities";
import styled from 'styled-components';

const PrinterProducts = ({ products }) => {
  return (
    <PrinterProductsStyled>
      {products?.map(({ item, value }, index) => {
        return <div className={'product-container'} key={item + index}>
          <span className={'product-value'}>{numberWithCommas(value)}</span>
          <img title={cleanUnderscore(item)}
               src={`${prefix}materials/${item}.png`} alt="">
          </img>
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

    .product-value {
      position: absolute;
      right: 0;
      top: -5px;
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
