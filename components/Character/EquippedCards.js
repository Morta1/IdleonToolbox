import React from 'react';
import { prefix } from "../../Utilities";
import styled from 'styled-components';

const EquippedCards = ({ cards }) => {
  return (
    <EquippedCardsStyled>
      {cards?.equippedCards?.map(({ cardName, stars }, index) => {
        const cleanCardName = cardName.split("(", 2)[0].trim().replace(/ /, '_');
        return cardName !== 'None' ? <CardWrapper stars={stars} key={cleanCardName + index}>
          {stars > 0 ? <img className='border' src={`${prefix}cards/Tier${stars}_Border.png`} alt=""/> : null}
          <img className='card' title={cardName}
               src={`${prefix}cards/${cleanCardName}_Card.png`} alt=""/>
        </CardWrapper> : null;
      })}
    </EquippedCardsStyled>
  );
};

const EquippedCardsStyled = styled.div`
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(4, minmax(36px, 60px));
  grid-template-rows: repeat(2, minmax(36px, 100px));
  justify-content: center;
`;

const CardWrapper = styled.div`
  position: relative;

  .border {
    position: absolute;
    z-index: 1;
  }

  .card {
    width: 58px;
    height: 72px;
    justify-self: center;
    position: absolute;
    left: 5px;
    top: 5px;
  }
`

export default EquippedCards;
