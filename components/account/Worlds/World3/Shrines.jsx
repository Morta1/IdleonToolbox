import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatDuration, formatNum } from 'utility/helpers';
import { mapNames, shrines as shrineData } from '@website-data';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';

const pct = (value) => `+${formatNum(value ?? 0, 'pct')}`;

// The game's shrine sign (N.js): { is floor((level - 1) * per level + base), with no card bonus
const shrineSentence = ({ desc, shrineLevel }, entry) => cleanUnderscore(`${desc ?? ''}`.replace('{',
  `${shrineLevel > 0 ? Math.floor((shrineLevel - 1) * (entry?.bonusPerLevel ?? 0) + (entry?.baseBonus ?? 0)) : 0}`));
// The sign's hours: one decimal under 1,000, commas under 1M, then thousands
const gameHours = (hours, round = Math.floor) => (hours < 1e3 ? `${Math.floor(10 * hours) / 10}` : hours < 1e6
  ? formatNum(round(hours)) : `${formatNum(round(hours / 1e3))}K`);
// The hours a shrine needs for its next level
const hoursToLevel = (level) => Math.floor(20 * (level - 1) + 6 * level * Math.pow(1.63, level - 1));

const shrineDetails = (shrine, entry, contributors, perHour) => {
  const built = shrine?.shrineLevel > 0;
  const hoursReq = hoursToLevel(shrine?.shrineLevel);
  const progress = shrine?.progress ?? 0;
  return <Stack gap={1}>
    <Box>
      <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(shrine?.name)}</Typography>
      <Typography variant={'body2'} color={'text.secondary'}>{built ? formatNum(shrine.shrineLevel, 'level') : 'Not built yet'}</Typography>
    </Box>
    <Typography variant={'body2'}>{shrineSentence(shrine, entry)}</Typography>
    {built ? <ItemCard.Facts rows={[
      ['Map', cleanUnderscore(mapNames?.[shrine?.mapId])],
      ['Progress', `${gameHours(progress)} / ${gameHours(hoursReq, Math.ceil)} hours`],
      perHour !== undefined ? ['Per hour', formatNum(perHour, 'rate')] : null,
      perHour !== undefined ? ['Next level in', perHour > 0 ? formatDuration((hoursReq - progress) / perHour * 3600) : '-'] : null,
      ['With cards', pct(shrine?.bonus)],
      contributors ? ['Contributors', contributors.length ? contributors.join(', ') : 'Nobody on its map'] : null,
      shrine?.crystalShrineBonus > 0 ? ['Crystal Shrine', pct(shrine.crystalShrineBonus)] : null
    ]}/> : null}
  </Stack>;
};

// shrinesExpBonus: each character's EXP into each shrine (null when its section failed: no rate, no contributors)
const Shrines = ({ shrines, shrinesExpBonus }) => <Box sx={{ p: 1.5 }}>
  <CardGrid size={'icon'} fill>
    {(shrines ?? []).map((shrine, index) => {
      const entry = shrineData?.[`${shrine?.rawName ?? ''}`.replace('ConTowerB', '')];
      const contributors = shrinesExpBonus ? (shrinesExpBonus?.breakdown?.[index] ?? [])
        .filter(({ value }) => value > 0).map(({ name }) => name) : null;
      const perHour = shrinesExpBonus ? shrinesExpBonus?.total?.[index] ?? 0 : undefined;
      return <IconTile key={shrine?.rawName ?? index} icon={`data/${shrine?.rawName}.png`} alt={cleanUnderscore(shrine?.name)}
                       value={formatNum(shrine?.shrineLevel ?? 0)} status={shrine?.shrineLevel > 0 ? undefined : 'missing'}
                       details={shrineDetails(shrine, entry, contributors, perHour)}/>;
    })}
  </CardGrid>
</Box>;

export default Shrines;
