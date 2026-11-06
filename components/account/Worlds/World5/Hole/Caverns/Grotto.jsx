import { Stack } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import StatTile from '@components/common/cards/StatTile';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

// The three Grotto schematics in the Engineer's list (its 45th, 47th and 48th), whose totals the cavern shows
const LOOTIE = 44;
const EXPIE = 46;
const OPIE = 47;

const Grotto = ({ hole }) => {
  const grotto = hole?.caverns?.grotto;
  const schematics = hole?.engineerBonuses ?? [];
  return <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
    <StatTile label={'Layer'} value={grotto?.layer ?? 0} kind={'amount'}/>
    <StatTile label={'Monarch HP'} value={formatGame(grotto?.monarchHp ?? 0, 'Holes.MonarchHP')}/>
    <StatTile label={'Mushroom kills'}
              value={`${formatNum(Math.ceil(grotto?.mushroomKills ?? 0))} / ${formatNum(Math.ceil(grotto?.mushroomKillsReq ?? 0))}`}/>
    <StatTile label={'Mushroom kills left'} value={Math.ceil(grotto?.mushroomKillsLeft ?? 0)} kind={{ game: 'Holes.MushKillsLeft' }}/>
    {opalsFoundTile(hole, 8)}
    <StatTile label={'Lootie bonus'} value={schematics?.[LOOTIE]?.totalBonus ?? 0} kind={'pct'}/>
    <StatTile label={'Expie bonus'} value={schematics?.[EXPIE]?.totalBonus ?? 0} kind={'pct'}/>
    <StatTile label={'Opie bonus'} value={schematics?.[OPIE]?.totalBonus ?? 0} kind={'pct'}/>
  </Stack>;
};

export default Grotto;
