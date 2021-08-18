import React from 'react';
import { prefix } from "../../Utilities";
import styled from 'styled-components';

const EquippedCards = ({ cards }) => {
  return (
    <EquippedCardsStyled>
      {cards?.map(({ name, stars }, index) => {
        const cardName = name.split("(", 2)[0].trim().replace(/ /, '_');
        return cardName !== 'None' ? <img title={name} key={cardName + index}
                    src={`${prefix}cards/${cardName}_Card.png`} alt=""/> : null;
      })}
    </EquippedCardsStyled>
  );
};

const EquippedCardsStyled = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(36px, 1fr));

  img {
    width: 52px;
    height: 72px;
    justify-self: center;
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

export default EquippedCards;
