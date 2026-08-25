import React from 'react';
import { Link } from '@mui/material';
import InfoBox from './InfoBox';
import StarLadder from './StarLadder';
import { cleanUnderscore, numberWithCommas } from '@utility/helpers';
import { notateGame } from '@utility/wiki/notate';

const WORLD_NAMES = [
  'Blunder_Hills', 'YumYum_Desert', 'Frostbite_Tundra', 'Hyperion_Nebula',
  'Smolderin\'_Plateau', 'Spirited_Valley', 'Coral_Reef'
];

const CARD_TIERS = [0, 1, 2, 3, 4, 5, 6];

// Inverse of the game's hit-chance formula: hitChance = 100 * (0.95 * accuracy / Defence - 0.425).
// Solving for 5% and 100% gives half and one-and-a-half times the monster's Defence.
const accuracyFor = (defence, hitChance) => Math.ceil(defence * (hitChance / 100 + 0.425) / 0.95);

const MonsterInfo = ({ node, index, card, cardId, cardDropChance, onNavigate }) => {
  const { stats, location } = node;

  // Notated the way the game notates, not comma-grouped. Past 2^53 the raw number is not merely
  // long, it is wrong: Spearfish's health is 1e23, which numberWithCommas rendered as
  // 99,999,999,999,999,991,611,392. The game shows 10E22 and so do we.
  const information = [];
  if (stats?.attack) information.push({ label: 'Attack', value: notateGame(stats.attack) });
  if (stats?.health) information.push({ label: 'Health', value: notateGame(stats.health) });
  if (stats?.defence) {
    information.push({ label: '5% Accuracy', value: notateGame(accuracyFor(stats.defence, 5)) });
    information.push({ label: '100% Accuracy', value: notateGame(accuracyFor(stats.defence, 100)) });
    information.push({ label: 'Def for 0', value: notateGame(stats.defence) });
  }
  if (stats?.experience) information.push({ label: 'Experience', value: notateGame(stats.experience) });
  if (stats?.respawn) information.push({ label: 'Respawn', value: stats.respawn });

  const cardRows = [];
  if (card) {
    cardRows.push({
      label: 'Card',
      value: <Link component={'button'} type={'button'} variant={'body2'} underline={'hover'}
                   onClick={() => onNavigate(cardId)}>{cleanUnderscore(node.name)} Card</Link>
    });
    cardRows.push({ label: 'Effect', value: cleanUnderscore(card.effect.replace('{', card.bonus)) });
    if (card.category) cardRows.push({ label: 'Category', value: cleanUnderscore(card.category) });
    if (cardDropChance > 0) {
      cardRows.push({ label: 'Dropchance', value: `1 in ${numberWithCommas(Math.round(1 / cardDropChance))}` });
    }
  }

  const locationRows = [];
  if (location?.world) {
    locationRows.push({ label: 'World', value: cleanUnderscore(WORLD_NAMES[location.world - 1] || `World ${location.world}`) });
  }
  // The area is a real map page, and the same one the Found in section links to. World is left as
  // text on purpose: worlds are not entities in the graph, so there is nothing to point at.
  const areaId = location?.mapIndex != null ? `map:${location.mapIndex}` : null;
  if (location?.area) {
    locationRows.push({
      label: 'Area',
      value: areaId && index?.byId?.[areaId]
        ? <Link component={'button'} type={'button'} variant={'body2'} underline={'hover'}
                onClick={() => onNavigate(areaId)}>{cleanUnderscore(location.area)}</Link>
        : cleanUnderscore(location.area)
    });
  }

  return <InfoBox groups={[
    { title: 'Information', rows: information },
    {
      title: 'Card Info',
      content: card ? <StarLadder values={CARD_TIERS.map((tier) => card.bonus * (tier + 1))}/> : null,
      rows: cardRows
    },
    { title: 'Location', rows: locationRows }
  ]}/>;
};

export default MonsterInfo;
