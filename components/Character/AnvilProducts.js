import React from 'react';
import { cleanUnderscore, prefix } from "../../Utilities";
import styled from 'styled-components';

const AnvilProducts = ({ products }) => {
  return (
    <AnvilProductsStyled>
      {products?.map((product, index) => {
        return <img title={cleanUnderscore(product)} key={product + index}
                    src={`${prefix}materials/${product}.png`} alt=""/>;
      })}
    </AnvilProductsStyled>
  );
};

const AnvilProductsStyled = styled.div`
  justify-self: center;
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

export default AnvilProducts;
