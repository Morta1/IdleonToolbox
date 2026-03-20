import { bonuses, cards, cardSets } from '@website-data';
import { tryToParse } from '@utility/helpers';
import type { IdleonData, Account } from './types';

export const getCards = (idleonData: IdleonData, account: Account): Record<string, any> => {
  const cardsRaw = (idleonData as any)?.Cards?.[0] || tryToParse(idleonData?.Cards0);
  const rawRift = tryToParse(idleonData?.Rift) || idleonData?.Rift;
  return parseCards(cardsRaw, rawRift, account);
}

export const calculateStars = (tierReq: number, amountOfCards: number, cardName: string, maxStars: number, isInFiveStarList: boolean): number => {
  let cardLvCalco = 0;
  for (let i = 0; i < maxStars; i++) {
    if (cardName === 'Boss3B') {
      if (amountOfCards > 1.5 * Math.pow(i + 1 + Math.floor(i / 3), 2)) {
        cardLvCalco = i + 2;
      }
    } else {
      if (amountOfCards > tierReq * Math.pow(i + 1 + (Math.floor(i / 3) + (16 * Math.floor(i / 4) + 100 * Math.floor(i / 5))), 2)) {
        cardLvCalco = i + 2;
      }
    }
  }
  // If card is in five-star list and calculated stars < 6 (before subtracting 1), return 5 (6 stars in 0-indexed)
  // Otherwise return calculated stars (subtract 1 to match original 0-indexed behavior)
  if (isInFiveStarList && cardLvCalco < 6) {
    return 5; // 6 stars in 0-indexed is 5
  }
  return cardLvCalco > 0 ? cardLvCalco - 1 : cardLvCalco;
};

export const calculateAmountToNextLevel = (perTier: number, stars: number, amountOfCards: number): number => {
  return stars >= 6 ? 0 : Math.ceil(perTier
    * Math.pow((stars + 1)
      + (Math.floor((stars + 1) / 4)
        + (16 * Math.floor((stars + 1) / 5)
          + 100 * Math.floor((stars + 1) / 6))), 2) - amountOfCards) + 1;
}

const parseCards = (cardsRaw: any, rawRift: any, account: Account): Record<string, any> => {
  const [currentRift] = rawRift || [];
  const riftFiveStarCards = currentRift >= 45 ? 1 : 0;
  const spelunkingSixStarCards = (account as any)?.spelunking?.loreBosses?.[2]?.defeated ? 1 : 0;
  const totalFiveStarCards = riftFiveStarCards + spelunkingSixStarCards;
  const maxStars = Math.round(4 + totalFiveStarCards);

  return Object.entries(cardsRaw).reduce(
    (res: Record<string, any>, [name, amount]: [string, any]) => {
      const cardDetails = cards?.[name];
      const rawFiveStarList = (account as any)?.accountOptions?.[155] || '';
      const fiveStarList = rawFiveStarList?.toString()?.split(',') || [];
      const isInFiveStarList = fiveStarList?.includes(name);
      const stars = calculateStars(cardDetails?.perTier, amount, name, maxStars, isInFiveStarList);
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

export const calculateCardSetStars = (card: any, bonus: any): number | null => {
  if (!card || !bonus) return null;
  return (bonus / card?.bonus) - 1;
};

export const getEquippedCardBonus = (cards: any, cardInd: number): number => {
  const card = cards?.equippedCards?.find(({ cardIndex }: any) => cardIndex === cardInd);
  if (!card) return 0;
  return calcCardBonus(card);
}

export const getCardSets = (account: Account): Record<string, any> => {
  const cardSetsObject: Record<string, any> = Object.values(cardSets).reduce((res: Record<string, any>, cardSet: any, realIndex: number) => ({
    ...res,
    [cardSet?.name]: ({ ...cardSet, totalStars: 0, realIndex })
  }), {});

  const tempCards: Record<string, any[]> = Object.entries(cards)?.reduce((res: Record<string, any[]>, [, cardDetails]: [string, any]) => {
    const { category, displayName } = cardDetails;
    const { stars, amount } = (account as any)?.cards?.[displayName] || {};
    cardSetsObject[category].totalStars += (stars === 0 && amount > 0 ? 1 : stars > 0 ? stars + 1 : 0);
    return { ...res, [category]: [...(res?.[category] || []), cardDetails] };
  }, {});

  const setsArray = Object.values(cardSetsObject);
  const setsCount = setsArray.length || 1;

  // Step 3: Update each set with stars and amount
  setsArray.forEach((set: any) => {
    set.stars = Math.floor(set.totalStars / tempCards?.[set?.name]?.length) - 1;
    set.amount = set.totalStars;
  });

  return cardSetsObject;
}

export const getTotalCardBonusById = (cards: any[], bonusId: number): number => {
  return cards?.reduce((res: number, card: any) => card?.effect === bonuses?.cardBonuses?.[bonusId]
    ? res + calcCardBonus(card)
    : res, 0);
}

export const getCardBonusByEffect = (cards: Record<string, any>, effectName: string): number => {
  return Object.values(cards || {})?.reduce((sum: number, card: any) => {
    if (!card?.effect?.includes(effectName) || card?.amount <= 0) return sum;
    return sum + calcCardBonus(card);
  }, 0);
}

export const calcCardBonus = (card: any): number => {
  if (!card) return 0;
  return (card?.bonus * ((card?.stars ?? -1) + 1)) * (card?.chipBoost ?? 1) * (card?.legendBonus ?? 1);
}

export const getPlayerCards = (char: any, account: Account): Record<string, any> => {
  if (!char?.[`CSetEq`] && !char?.[`CardEquip`]) return {};
  const cardSet = char?.[`CSetEq`] || {};
  const equippedCards = getEquippedCardsData(char?.[`CardEquip`], account);
  const cardsSetObject = (cardSets as Record<string, any>)[Object.keys(cardSet)?.[0]] || {};
  return {
    cardSet: {
      ...cardsSetObject,
      bonus: Object.values(cardSet)?.[0],
      stars: calculateCardSetStars(cardsSetObject, Object.values(cardSet)?.[0])
    },
    equippedCards
  };
}

export const getEquippedCardsData = (cardsArray: any[], account: Account): any[] => {
  return cardsArray?.map((card: any) => ({
    ...(cards?.[card]?.displayName ? { cardName: cards?.[card]?.displayName } : {}),
    ...((account as any)?.cards?.[cards?.[card]?.displayName] || {})
  })).filter((_: any, ind: number) => ind < 8);
}

export const calcCardsLevels = (cards: Record<string, any> | undefined): number => {
  if (!cards) return 0;
  return Object.values(cards)?.reduce((res: number, { stars, amount }: any) => res + (amount > 0 ? (stars + 1) : 0), 0);
};
