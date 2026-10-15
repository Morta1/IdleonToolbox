import React from 'react';
import InfoBox from './InfoBox';
import StarLadder from './StarLadder';
import { calculateAmountToNextLevel } from '@parsers/cardMath';
import { cleanUnderscore, numberWithCommas } from '@utility/helpers';
import { notateGame } from '@utility/wiki/notate';
import { cardEffect, cardTiers } from '@utility/wiki/effects.mjs';

// UPKEEP: the set level is floor(sum of CardLv over every card in the category / their count), and an unfound card's CardLv is 0 (N.js:85869).
// Not extracted: the rule is an init-time loop with no handler key (ActorEvents_312.init), and this is its wording.
const SET_TIER_NOTE = 'The average tier of its cards, rounded down; an unfound card counts one below Base';

// UPKEEP: the card panel prefixes a set bonus with "+" (N.js:84779); the set effects carry none of their own.
// Not extracted: it is drawn by a numbered card panel event, which no locator may anchor on.
const SET_PREFIX = '+';

// calculateAmountToNextLevel returns the count that must be EXCEEDED, so the threshold is one less.
const cumulativeAt = (perTier, tier) => calculateAmountToNextLevel(perTier, tier, 0) - 1;

// The panel asks the same question the box answers, so it cannot draw while the empty state shows.
export const cardBonusShows = (card) => Boolean(card?.effect);

const CardBonus = ({ card, dropChance }) => {
  if (!cardBonusShows(card)) return null;

  // The tiers are the game data's; without them the ladders are left out.
  const tiers = cardTiers();
  const bonusLadder = tiers ? <StarLadder values={tiers.bonus.map((tier) => card.bonus * (tier + 1))}/> : null;

  // The wiki lists what each tier costs on top of the one before it, not the running total.
  //
  // Notated the game's own way, not comma-grouped: six tiers share a 340px box, so a cell is
  // 42px, and a ten-character number overlapped its neighbours on both sides.
  const requirements = card.perTier && tiers ? <StarLadder
    startTier={1}
    values={tiers.requirement.map((tier) =>
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
      rows: [{ label: 'Effect', value: cardEffect(card) }]
    },
    card.set && {
      title: 'Card Set',
      content: tiers ? <StarLadder values={tiers.bonus.map((tier) => card.set.bonus * (tier + 1))}/> : null,
      rows: [
        { label: 'Effect', value: `${SET_PREFIX}${cardEffect(card.set)}` },
        { label: 'Set tier', value: SET_TIER_NOTE }
      ]
    },
    { title: 'Tier Requirements', content: requirements },
    { title: 'Other Details', rows: details }
  ].filter(Boolean)}/>;
};

export default CardBonus;
