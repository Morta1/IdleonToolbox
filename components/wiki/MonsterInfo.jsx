import React from 'react';
import { Link } from '@mui/material';
import InfoBox from './InfoBox';
import StarLadder from './StarLadder';
import { linkProps, navigateOnPlainClick } from './links';
import { cleanUnderscore, numberWithCommas } from '@utility/helpers';
import { notateGame } from '@utility/wiki/notate';
import { cardEffect } from '@utility/wiki/effects.mjs';
import { entityName } from '@utility/wiki/names.mjs';
import { worldOf } from '@utility/wiki/page-graph';
import { accuracyForHitChance, HIT_CURVE } from '@utility/hit-chance.mjs';

const CARD_TIERS = [0, 1, 2, 3, 4, 5, 6];

// A row's value that goes to another page: a real anchor when the caller can address it, a button
// when it cannot.
const PageLink = ({ id, label, hrefFor, onNavigate }) => <Link
  {...linkProps(hrefFor, id)}
  variant={'body2'}
  underline={'hover'}
  onClick={navigateOnPlainClick(onNavigate, id, Boolean(hrefFor?.(id)))}
>
  {label}
</Link>;

// The rows, kept apart from the component so EntityPanel can ask whether any of them would draw.
export const monsterGroups = ({ node, index, card, cardId, cardDropChance, hrefFor, onNavigate }) => {
  const { stats, location } = node;
  const pageLink = (id, label) => <PageLink id={id} label={label} hrefFor={hrefFor} onNavigate={onNavigate}/>;

  // Notated the way the game notates, not comma-grouped. Past 2^53 the raw number is not merely
  // long, it is wrong: Spearfish's health is 1e23, which numberWithCommas rendered as
  // 99,999,999,999,999,991,611,392. The game shows 10E22 and so do we.
  const information = [];
  if (stats?.attack) information.push({ label: 'Attack', value: notateGame(stats.attack) });
  if (stats?.health) information.push({ label: 'Health', value: notateGame(stats.health) });
  if (stats?.defence) {
    // A graph built before the curve was stored only ever held monster figures.
    const curve = stats.hitCurve ?? HIT_CURVE.MONSTER;
    information.push({ label: '5% Accuracy', value: notateGame(accuracyForHitChance(stats.defence, 5, curve)) });
    information.push({ label: '100% Accuracy', value: notateGame(accuracyForHitChance(stats.defence, 100, curve)) });
    information.push({ label: 'Def for 0', value: notateGame(stats.defence) });
  }
  if (stats?.experience) information.push({ label: 'Experience', value: notateGame(stats.experience) });
  if (stats?.respawn) information.push({ label: 'Respawn', value: stats.respawn });

  const cardRows = [];
  if (card) {
    cardRows.push({ label: 'Card', value: pageLink(cardId, `${cleanUnderscore(node.name)} Card`) });
    cardRows.push({ label: 'Effect', value: cardEffect(card) });
    if (card.category) cardRows.push({ label: 'Category', value: cleanUnderscore(card.category) });
    if (cardDropChance > 0) {
      cardRows.push({ label: 'Dropchance', value: `1 in ${numberWithCommas(Math.round(1 / cardDropChance))}` });
    }
  }

  // Both rows name a page: the world's name is read off its node, which the page's slice carries
  // (see worldOf), and the area is the same map page the Found in section links to.
  const locationRows = [];
  const worldId = worldOf(node);
  if (worldId) {
    const world = index?.byId?.[worldId];
    locationRows.push({
      label: 'World',
      value: world && world.navigable !== false
        ? pageLink(worldId, entityName(world))
        : `World ${location.world}`
    });
  }
  const areaId = location?.mapIndex != null ? `map:${location.mapIndex}` : null;
  if (location?.area) {
    const area = areaId ? index?.byId?.[areaId] : null;
    locationRows.push({
      label: 'Area',
      value: area && area.navigable !== false
        ? pageLink(areaId, cleanUnderscore(location.area))
        : cleanUnderscore(location.area)
    });
  }

  return [
    { title: 'Information', rows: information },
    {
      title: 'Card Info',
      content: card ? <StarLadder values={CARD_TIERS.map((tier) => card.bonus * (tier + 1))}/> : null,
      rows: cardRows
    },
    { title: 'Location', rows: locationRows }
  ];
};

const MonsterInfo = (props) => <InfoBox groups={monsterGroups(props)}/>;

export default MonsterInfo;
