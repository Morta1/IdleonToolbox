import React from 'react';
import InfoBox from './InfoBox';
import StarLadder from './StarLadder';
import { calculateAmountToNextLevel } from '@parsers/cards';
import { cleanUnderscore, numberWithCommas } from '@utility/helpers';
import { notateGame } from '@utility/wiki/notate';

const BONUS_TIERS = [0, 1, 2, 3, 4, 5, 6];
const REQUIREMENT_TIERS = [0, 1, 2, 3, 4, 5];

// calculateAmountToNextLevel returns the count that must be EXCEEDED, so the threshold is one less.
const cumulativeAt = (perTier, tier) => calculateAmountToNextLevel(perTier, tier, 0) - 1;

const CardBonus = ({ card, dropChance }) => {
  if (!card?.effect) return null;

  const bonusLadder = <StarLadder values={BONUS_TIERS.map((tier) => card.bonus * (tier + 1))}/>;

  // The wiki lists what each tier costs on top of the one before it, not the running total.
  //
  // Notated the game's own way, not comma-grouped: six tiers share a 340px box, so a cell is
  // 42px, and a ten-character number overlapped its neighbours on both sides.
  const requirements = card.perTier ? <StarLadder
    startTier={1}
    values={REQUIREMENT_TIERS.map((tier) =>
      notateGame(cumulativeAt(card.perTier, tier) - (tier === 0 ? 0 : cumulativeAt(card.perTier, tier - 1))))}
  /> : null;

  const details = [];
  if (dropChance > 0) details.push({ label: 'Dropchance', value: `1 in ${numberWithCommas(Math.round(1 / dropChance))}` });
  if (card.category) details.push({ label: 'Category', value: cleanUnderscore(card.category) });
  if (card.order != null) details.push({ label: 'Order', value: card.order });

  return <InfoBox groups={[
    {
      title: 'Card Bonus',
      content: bonusLadder,
      rows: [{ label: 'Effect', value: cleanUnderscore(card.effect.replace('{', card.bonus)) }]
    },
    { title: 'Tier Requirements', content: requirements },
    { title: 'Other Details', rows: details }
  ]}/>;
};

export default CardBonus;
