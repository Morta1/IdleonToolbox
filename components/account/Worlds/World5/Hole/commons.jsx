import StatTile from '@components/common/cards/StatTile';
import StatusText from '@components/common/StatusText';
import { msToDate } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { CURRENCY_NAMES } from '@parsers/world-5/caverns/the-fountain';

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
