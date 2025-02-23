import { bonuses, cards, cardSets } from '../data/website-data';
import { tryToParse } from '../utility/helpers';

export const getCards = (idleonData, account) => {
  const cardsRaw = idleonData?.Cards?.[0] || tryToParse(idleonData?.Cards0);
  const rawRift = tryToParse(idleonData?.Rift) || idleonData?.Rift;
  return parseCards(cardsRaw, rawRift, account);
}

export const calculateStars = (tierReq, amountOfCards, cardName, rubyCards) => {
  let stars = 0;
  for (let i = 0; i < 4 + (+rubyCards); i++) {
    if (cardName === 'Boss3B') {
      if (amountOfCards > 1.5 * Math.pow(i + 1 + Math.floor(i / 3), 2)) {
        stars = i + 2
      }
    } else {
      if (amountOfCards > tierReq * Math.pow(i + 1 + (Math.floor(i / 3) + 16 * Math.floor(i / 4)), 2)) {
        stars = i + 2
      }
    }
  }
  return stars > 0 ? stars - 1 : stars;
};

export const calculateAmountToNextLevel = (perTier, stars, amountOfCards) => {
  return stars >= 5 ? 0 : (perTier
    * Math.pow((stars + 1)
      + (Math.floor((stars + 1) / 4)
        + 16 * Math.floor((stars + 1) / 5)), 2) - amountOfCards) + 1;
}

const parseCards = (cardsRaw, rawRift, account) => {
  const [currentRift] = rawRift || [];
  let rubyCards = currentRift >= 45;
  return Object.entries(cardsRaw).reduce(
    (res, [name, amount]) => {
      const cardDetails = cards?.[name];
      const rawSixStarList = account?.accountOptions?.[155] || '';
      const sixStarList = rawSixStarList?.toString()?.split(',') || [];
      const stars = sixStarList?.includes(name) ? 5 : calculateStars(cardDetails?.perTier, amount, name, rubyCards);
      if (!cardDetails) return res;
      return {
        ...res,
        [cardDetails?.displayName]: {
          ...cardDetails,
          amount,
          stars,
          nextLevelReq: amount + calculateAmountToNextLevel(cardDetails?.perTier, stars, amount)
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
  return cards?.reduce((res, card) => card?.effect === bonuses?.cardBonuses?.[bonusId]
    ? res + calcCardBonus(card)
    : res, 0);
}

export const getCardBonusByEffect = (cards, effectName) => {
  return Object.values(cards || {})?.reduce((sum, card) => {
    if (!card?.effect?.includes(effectName)) return sum;
    return sum + calcCardBonus(card);
  }, 0);
}

export const calcCardBonus = (card) => {
  if (!card) return 0;
  return (card?.bonus * ((card?.stars ?? -1) + 1)) * (card?.chipBoost ?? 1) ?? 0;
}

export const getPlayerCards = (char, account) => {
  if (!char?.[`CSetEq`] && !char?.[`CardEquip`]) return {};
  const cardSet = char?.[`CSetEq`] || {};
  const equippedCards = getEquippedCardsData(char?.[`CardEquip`], account);
  const cardsSetObject = cardSets[Object.keys(cardSet)?.[0]] || {};
  return {
    cardSet: {
      ...cardsSetObject,
      bonus: Object.values(cardSet)?.[0],
      stars: calculateCardSetStars(cardsSetObject, Object.values(cardSet)?.[0])
    },
    equippedCards
  };
}

export const getEquippedCardsData = (cardsArray, account) => {
  return cardsArray?.map((card) => ({
    ...(cards?.[card]?.displayName ? { cardName: cards?.[card]?.displayName } : {}),
    ...(account?.cards?.[cards?.[card]?.displayName] || {})
  })).filter((_, ind) => ind < 8);
}

export const calcCardsLevels = (cards) => {
  if (!cards) return 0;
  return Object.values(cards)?.reduce((res, { stars }) => res + (stars + 1), 0);
};
