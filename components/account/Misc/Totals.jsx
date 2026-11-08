import React from 'react';
import { formatNum } from 'utility/helpers';
import { calcStampLevels } from '@parsers/world-1/stamps';
import { calcStatueLevels } from '@parsers/world-1/statues';
import { calcShrineLevels } from '@parsers/world-3/shrines';
import { calcBubbleLevels } from '@parsers/world-2/alchemy';
import { getGiantMobChance, getLifetimeStat, LIFETIME_STATS } from '@parsers/misc';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import Panel from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';
import ShortAmount from '@components/common/ShortAmount';
import { Breakdown } from '@components/common/Breakdown/Breakdown';

const pct = (value) => formatNum(value ?? 0, 'pct', { precise: true });
// A list as dense as Colosseum's and Minigame's beside it: 24 px sprites and 6 px padding, about 36 px a row, not 53
const ROW_SX = { py: 0.75 };
const icon = (name) => <GameIcon src={`data/${name}.png`} size={24} alt={''}/>;

// failedOf: whether a section the page reads failed; a total it feeds reads "-"
const Totals = ({ account, characters, failedOf = () => false }) => {
  // A lifetime stat can be a numeric string in the save ("3.76e+27")
  const totalOf = (section, total) => (failedOf(section) ? '-' : <ShortAmount amount={Number(total) || 0}/>);
  const totals = [
    ['Bubbles', 'aBrewOptionA0', totalOf('alchemy', calcBubbleLevels(account?.alchemy?.bubbles))],
    ['Stamps', 'StampA34', totalOf('stamps', calcStampLevels(account?.stamps))],
    ['Statues', 'EquipmentStatues1', totalOf('statues', calcStatueLevels(account?.statues))],
    ['Shrines', 'UISkillIcon639', totalOf('shrines', calcShrineLevels(account?.shrines))],
    ...LIFETIME_STATS.map((stat) => [stat.name, stat.icon, totalOf('tasks', getLifetimeStat(account, stat))])
  ];
  // The first character's chance, as the game rolls it for whoever is on the map; the shrine (its cards and artifacts),
  // the vial and the prayer feed it
  const giantFailed = ['shrines', 'alchemy', 'cards', 'sailing', 'prayers'].some(failedOf);
  const giantMob = characters?.length && !giantFailed ? getGiantMobChance(characters[0], account) : null;
  const giantText = giantMob?.chance > 0 ? formatNum(giantMob.chance, 'odds') : '-';
  // Its sources are a list, so a breakdown (Info board step 5), headed with the row's own odds
  const giantBreakdown = giantMob?.chance > 0 ? createBreakdown('Giant mob chance', giantText, flatLines([
    { name: 'Crescent Shrine', value: giantMob?.crescentShrineBonus ?? 0, formatted: `+${pct(giantMob?.crescentShrineBonus)}` },
    { name: 'Shaved Ice vial', value: giantMob?.giantMobVial ?? 0, formatted: `+${pct(giantMob?.giantMobVial)}` },
    giantMob?.glitterbugPrayer > 0
      ? { name: 'Glitterbug prayer', value: -giantMob.glitterbugPrayer, formatted: `-${pct(giantMob.glitterbugPrayer)}` }
      : null
  ].filter(Boolean)), { combine: 'list' }) : null;

  return <Panel title={'Totals'}>
    {totals.map(([name, iconName, value]) => <Panel.Row key={name} icon={icon(iconName)} name={name} value={value} sx={ROW_SX}/>)}
    {account?.finishedWorlds?.World2 ? <Panel.Row icon={icon('Prayer5')} name={'Giant mob chance'} sx={ROW_SX}
                                                  sub={giantMob ? `${formatNum(giantMob?.giantsAlreadySpawned ?? 0)} spawned this week` : undefined}
                                                  value={giantBreakdown
                                                    ? <Breakdown asValue data={giantBreakdown} title={'Giant mob chance'}>{giantText}</Breakdown>
                                                    : giantText}/> : null}
  </Panel>;
};

export default Totals;
