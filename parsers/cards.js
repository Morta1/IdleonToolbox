import { bonuses, cards, cardSets } from "../data/website-data";
import { tryToParse } from "../utility/helpers";

export const getCards = (idleonData) => {
  const cardsRaw = idleonData?.Cards?.[0] || tryToParse(idleonData?.Cards0);
  return parseCards(cardsRaw);
}

export const calculateStars = (tierReq, amountOfCards) => {
  if (amountOfCards > tierReq * 25) {
    return 4;
  } else if (amountOfCards > tierReq * 9) {
    return 3;
  } else if (amountOfCards > tierReq * 4) {
    return 2;
  } else if (amountOfCards > tierReq) {
    return 1;
  }
  return 0;
};

export const calculateAmountToNextLevel = (tierReq, amountOfCards) => {
  if (amountOfCards < tierReq) {
    return tierReq + 1;
  } else if (amountOfCards < tierReq * 4) {
    return tierReq * 4 + 1;
  } else if (amountOfCards < tierReq * 9) {
    return tierReq * 9 + 1;
  } else if (amountOfCards < tierReq * 25) {
    return tierReq * 25 + 1;
  }
  return 0;
}

const parseCards = (cardsRaw) => {
  return Object.entries(cardsRaw).reduce(
    (res, [name, amount]) => {
      const cardDetails = cards?.[name];
      if (!cardDetails) return res;
      return {
        ...res,
        [cardDetails?.displayName]: {
          ...cardDetails,
          amount,
          stars: calculateStars(cardDetails?.perTier, amount)
        }
      }
    }, {});
}


export const calculateCardSetStars = (card, bonus) => {
  if (!card || !bonus) return null;
  return (bonus / card?.bonus) - 1;
};

export const getEquippedCardBonus = (cards, cardInd) => {
  const card = cards?.equippedCards?.find(({ cardIndex }) => cardIndex === cardInd);
  if (!card) return 0;
  return calcCardBonus(card);
}

export const getTotalCardBonusById = (cards, bonusId) => {
  return cards?.reduce((res, card) => card?.effect === bonuses?.cardBonuses?.[bonusId] ? res + calcCardBonus(card) : res, 0);
}

export const getCardBonusByEffect = (cards, effectName) => {
  return Object.values(cards)?.reduce((sum, card) => {
    if (!card?.effect?.includes(effectName)) return sum;
    return sum + calcCardBonus(card);
  }, 0);
}

export const calcCardBonus = (card) => {
  if (!card) return 0;
  return (card?.bonus * ((card?.stars ?? 0) + 1)) * (card?.chipBoost ?? 1) ?? 0;
}

export const getPlayerCards = (char, account) => {
  const cardSet = char?.[`CSetEq`];
  const equippedCards = char?.[`CardEquip`]
    .map((card) => ({
      cardName: cards?.[card]?.displayName,
      stars: account?.cards?.[cards?.[card]?.displayName]?.stars,
      amount: account?.cards?.[cards?.[card]?.displayName]?.amount,
      ...cards?.[card]
    }))
    .filter((_, ind) => ind < 8); //cardEquipMap
  const cardsSetObject = cardSets[Object.keys(cardSet)?.[0]] || {};
  return {
    cardSet: {
      ...cardsSetObject,
      bonus: Object.values(cardSet)?.[0],
      stars: calculateCardSetStars(cardsSetObject, Object.values(cardSet)?.[0])
    },
    equippedCards,
  };
}