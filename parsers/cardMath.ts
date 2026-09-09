// Pure card arithmetic with no data imports. The wiki renders card tiers and bonuses on static
// pages whose data arrives through getStaticProps; importing these two from cards.ts pulled in
// the website data barrel, and through its side effects 1.65 MB of items and shared data, onto
// every wiki page. cards.ts re-exports both, so account-side importers are unaffected.

export const calculateAmountToNextLevel = (perTier: number, stars: number, amountOfCards: number): number => {
  return stars >= 7 ? 0 : Math.ceil(perTier
    * Math.pow((stars + 1)
      + (Math.floor((stars + 1) / 4)
        + (16 * Math.floor((stars + 1) / 5)
          + 100 * Math.floor((stars + 1) / 6))), 2) - amountOfCards) + 1;
};

export const calcCardBonus = (card: any): number => {
  if (!card) return 0;
  return (card?.bonus * ((card?.stars ?? -1) + 1)) * (card?.chipBoost ?? 1) * (card?.legendBonus ?? 1);
};
