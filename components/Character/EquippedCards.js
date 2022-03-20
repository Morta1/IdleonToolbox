import React from 'react';
import { cleanUnderscore, prefix } from "../../Utilities";
import styled from 'styled-components';
import CardTooltip from "../Common/Tooltips/CardTooltip";
import { calcCardBonus } from "../../parser/parserUtils";

const EquippedCards = ({ cards }) => {
  return (
    <EquippedCardsStyled>
      {cards?.cardSet?.rawName ? <div className={'card-set'}>
        {cards?.cardSet?.stars > 0 ?
          <img className='border' title={cleanUnderscore(cards?.cardSet?.name)}
               src={`${prefix}data/CardEquipBorder${cards?.cardSet?.stars + 1}.png`} alt=""/> : null}
        <CardTooltip cardName={cards?.cardSet?.name} effect={cards?.cardSet.effect} bonus={cards?.cardSet?.bonus}
                     stars={cards?.cardSet?.stars}>
          <img className={'card'}
               src={`${prefix}data/${cards?.cardSet?.rawName}.png`}
               alt=""/>
        </CardTooltip>
      </div> : null}
      {cards?.equippedCards?.map((card, index) => {
        const { cardName, cardIndex, stars } = card;
        const cleanCardName = cardName?.split("(", 2)[0].trim().replace(/ /, '_') || '';
        const bonus = calcCardBonus(card);
        return cardName && cardName !== 'None' ? <CardWrapper stars={stars} key={cleanCardName + index}>
            {stars > 0 ?
              <img title={cardName} className='border' src={`${prefix}data/CardEquipBorder${stars}.png`} alt=""/> : null}
            <CardTooltip {...card} bonus={bonus}>
              <img className='card'
                   src={`${prefix}data/2Cards${cardIndex}.png`} alt=""/>
            </CardTooltip>
          </CardWrapper> :
          <CardWrapper key={cleanCardName + index}>
            <img src={`${prefix}data/EmptyCard.png`} alt=""/>
          </CardWrapper>;
      })}
    </EquippedCardsStyled>
  );
};

const EquippedCardsStyled = styled.div`
  position: relative;
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(4, minmax(36px, 60px));
  grid-template-rows: repeat(3, minmax(36px, 100px));;
  justify-content: center;

  .card-set {
    grid-column: span 4;
    justify-self: center;

    .border {
      pointer-events: none;
      position: absolute;
      z-index: 1;
      height: 88px;
      width: 65px;
    }

    .card {
      width: 58px;
      height: 72px;
    }
  }
`;

const CardWrapper = styled.div`
  position: relative;

  .border {
    pointer-events: none;
    position: absolute;
    z-index: 1;
  }

  .card {
    width: 58px;
    height: 72px;
    justify-self: center;
    position: absolute;
    left: 5px;
    top: 4px;
    object-fit: contain;
  }
`

export default EquippedCards;
