import StatTile from '@components/common/cards/StatTile';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import { cleanUnderscore, formatNum, getTabs, msToDate } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { CURRENCY_NAMES } from '@parsers/world-5/caverns/the-fountain';
import { PAGES } from '@components/constants';

// The 18 caverns in the game's order. Five names became URL values in lower case (?nt=The well), which links, alerts
// and goals keep: the strip, the picker and the studies show them as their siblings read
export const CAVERN_TABS = getTabs(PAGES.ACCOUNT['world 5'].categories, 'hole', 'Explore');
export const CAVERN_LABELS = CAVERN_TABS.map((tab) => tab.replace(/^The ([a-z])/, (match, letter) => `The ${letter.toUpperCase()}`));

// A hole resource's sprite (getHoleResourceIcon) as an ItemCard.Cost icon, or the empty sprite when there is none
export const holeCostIcon = (icon) => icon ? `data/${icon}.png` : 'afk_targets/Nothing.png';

// A hole resource's name for its icon's alt, by its sprite (the index space getHoleResourceIcon reads: sediment,
// harp notes, rupies, fountain coins). The game data names only the coins (Leftovers: z-processing).
const RESOURCE_NAMES = [
  [/^HoleWellFill(\d+)$/, (number) => `Sediment ${number}`],
  [/^HoleHarpNote(\d+)$/, (number) => `Harp note ${number + 1}`],
  [/^HoleJarR(\d+)$/, (number) => `Rupie tier ${number + 1}`],
  [/^HoleFountainCoin(\d+)$/, (number) => `${CURRENCY_NAMES[number] ?? 'Fountain'} coin`]
];
export const holeResourceName = (sprite) => {
  for (const [pattern, name] of RESOURCE_NAMES) {
    const match = sprite?.match(pattern);
    if (match) return name(Number(match[1]));
  }
  return '';
};

// The opals a cavern has given (Holes[7], one count per cavern), at the top of its tab
export const opalsFoundTile = (hole, cavernIndex) => <StatTile label={'Opals found'} icon={'data/Opal.png'}
                                                                value={hole?.holesObject?.opalsPerCavern?.[cavernIndex] ?? 0}
                                                                kind={'amount'}/>;

// One villager's five numbers, at the top of its tab. The EXP pair is the parser's text, already the game's rule
// (Holes.VillagerExpREQ); the rate is the game's "Xp per Hr" (Holes.VillagerExpPerHour), and its drawer is named and
// headed as the tile.
export const villagerTiles = (villager) => {
  const rate = villager?.expRate?.value ?? 0;
  const rateText = `${formatGame(rate, 'Holes.VillagerExpPerHour')}/hr`;
  const breakdown = villager?.expRate?.breakdown;
  const timeLeft = villager?.readyToLevel ? <StatusText status={'ready'}/>
    : rate > 0 && villager?.timeLeft >= 0 ? msToDate(villager.timeLeft) : '-';
  return <>
    <StatTile label={'Level'} value={villager?.level ?? 0} kind={'amount'}/>
    <StatTile label={'EXP'} value={`${villager?.exp ?? 0} / ${villager?.expReq ?? 0}`}/>
    <StatTile label={'EXP rate'} value={rateText} breakdownTitle={'EXP rate'}
              breakdown={breakdown ? { ...breakdown, totalValue: rateText } : undefined}/>
    <StatTile label={'Time to level'} value={timeLeft}/>
    <StatTile label={'Opals invested'} icon={'data/Opal.png'} value={villager?.opalInvested ?? 0} kind={'amount'}/>
  </>;
};

// The game's next-reward line (the monument panel, N.js): { and } the sword damage range in commas, ~ the dash
// between them, $ Justice's starting coins, # Wisdom's starting attempts
export const monumentRewardText = (reward, hole) => cleanUnderscore((reward ?? '')
  .replace('{', formatGame(hole?.caverns?.bravery?.damage?.min ?? 0, 'Holes.Bravery_MinDMG'))
  .replace('~', ' - ')
  .replace('}', formatGame(hole?.caverns?.bravery?.damage?.max ?? 0, 'Holes.Bravery_MaxDMG'))
  .replace('$', formatNum(hole?.caverns?.justice?.coins ?? 0))
  .replace('#', formatNum(hole?.caverns?.wisdom?.attempts ?? 0)));

// The tiles every monument shows after its own: the opal odds, its hours and reward multi, the next fight, the AFK
// hours the next reward needs, and that reward. The three parsers hand the same fields.
export const monumentTiles = (monument, hole) => {
  const next = monument?.nextHourBreakpoint;
  const nextHours = Number(next?.hours ?? 0);
  const afkHours = monument?.monumentAfkReq;
  const afkText = formatNum(afkHours?.totalValue ?? 0);
  return <>
    <StatTile label={'Opal chance'} icon={'data/Opal.png'} value={(monument?.opalChance ?? 0) * 100} kind={'pct'}/>
    <StatTile label={'Hours'} value={monument?.hours ?? 0} kind={'amount'}/>
    <StatTile label={'Reward multi'} value={(monument?.rewardMulti ?? 0) < 1 ? 0 : monument.rewardMulti} kind={'mult'}/>
    <StatTile label={'Next fight in'}
              value={monument?.timeForNextFight > 0 ? msToDate(monument.timeForNextFight * 1000) : <StatusText status={'ready'}/>}/>
    {afkHours ? <StatTile label={'AFK hours needed'} value={afkText} breakdownTitle={'AFK hours needed'}
                          breakdown={{ ...afkHours, totalValue: afkText }}/> : null}
    {next ? <StatTile label={'Next hour reward'} value={`${formatNum(nextHours)} ${nextHours === 1 ? 'hour' : 'hours'}`}
                      sub={monumentRewardText(next.reward, hole)}/> : null}
  </>;
};

// One monument bonus: the game's own sentence, its level beside the level that reaches the cap, and the bar to the
// cap with both numbers on the card (Decision 6)
export const monumentBonusCard = ({ description, level, bonus, cap, progression, scalingValue, levelToReachCap }, index) => (
  <ItemCard key={`bonus-${index}`} dimmed={!(level > 0)} level={{ value: level ?? 0, max: levelToReachCap ?? null }}>
    <ItemCard.Desc text={description}/>
    {cap === null || cap === undefined
      ? <ItemCard.Desc>{`+${formatNum(scalingValue ?? 0, 'amount', { precise: true })} per level`}</ItemCard.Desc>
      : <ItemCard.Progress label={'Bonus'} value={formatNum(bonus ?? 0, 'amount', { precise: true })}
                           max={`${formatNum(cap, 'amount', { precise: true })} cap`} percent={progression ?? 0}/>}
  </ItemCard>);

// A skilling cavern's numbers: the efficiency its layer asks for and what it has gathered of the layer's need (both the
// parser's text: commas under 1e9, then Big), the layer, and the opals found there
export const skillingTiles = ({ hole, cavernIndex, effLabel, eff, layerLabel = 'Layer', layer, resource, icon, done, required }) => <>
  <StatTile label={effLabel} value={eff ?? 0}/>
  <StatTile label={layerLabel} value={layer ?? 0} kind={'amount'}/>
  <StatTile label={resource} icon={icon} value={`${done ?? 0} / ${required ?? 0}`}/>
  {opalsFoundTile(hole, cavernIndex)}
</>;
