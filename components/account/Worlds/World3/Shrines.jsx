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
// The sign's hours: one decimal under 1,000, commas under 1M, then thousands. Past 1B hours the thousands would print
// short themselves ("7.56e73K"), so the hours print short on their own.
const gameHours = (hours, round = Math.floor) => (hours < 1e3 ? `${Math.floor(10 * hours) / 10}` : hours < 1e6
  ? formatNum(round(hours)) : hours < 1e9 ? `${formatNum(round(hours / 1e3))}K` : formatNum(round(hours)));
// A shrine every character feeds (one that applies on every map) reads as a count, not 11 names down the note
const contributorsText = (contributors, characterCount) => (!contributors.length ? 'Nobody on its map'
  : contributors.length > 1 && contributors.length === characterCount ? `All ${characterCount} characters` : contributors.join(', '));
// The hours a shrine needs for its next level
const hoursToLevel = (level) => Math.floor(20 * (level - 1) + 6 * level * Math.pow(1.63, level - 1));

// Three blocks a glance can tell apart: which shrine and where, what it gives, and how its next level is coming. The EXP
// block holds the Crystal Shrine's boost, since that speeds the EXP, not the bonus.
const shrineDetails = (shrine, entry, contributors, perHour, characterCount) => {
  const built = shrine?.shrineLevel > 0;
  const hoursReq = hoursToLevel(shrine?.shrineLevel);
  const progress = shrine?.progress ?? 0;
  const map = cleanUnderscore(mapNames?.[shrine?.mapId]);
  return <Stack gap={1.25}>
    <Box>
      <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(shrine?.name)}</Typography>
      <Typography variant={'body2'} color={'text.secondary'}>
        {built ? `${formatNum(shrine.shrineLevel, 'level')}${map ? ` · ${map}` : ''}` : 'Not built yet'}
      </Typography>
    </Box>
    <Typography variant={'body2'}>{shrineSentence(shrine, entry)}</Typography>
    {built ? <ItemCard.Facts rows={[['With cards', pct(shrine?.bonus)]]}/> : null}
    {built ? <ItemCard.Section label={'Next level'}>
      <ItemCard.Progress label={'Hours'} value={gameHours(progress)} max={gameHours(hoursReq, Math.ceil)}
                         percent={Math.min(100, (progress / hoursReq) * 100 || 0)}/>
      <ItemCard.Facts rows={[
        perHour !== undefined ? ['Per hour', formatNum(perHour, 'rate')] : null,
        perHour !== undefined ? ['Time left', perHour > 0 ? formatDuration((hoursReq - progress) / perHour * 3600) : '-'] : null,
        contributors ? ['Contributors', contributorsText(contributors, characterCount)] : null,
        shrine?.crystalShrineBonus > 0 ? ['Crystal Shrine', `${pct(shrine.crystalShrineBonus)} EXP`] : null
      ]}/>
    </ItemCard.Section> : null}
  </Stack>;
};

// shrinesExpBonus: each character's EXP into each shrine (null when its section failed: no rate, no contributors)
const Shrines = ({ shrines, shrinesExpBonus, characterCount }) => <Box sx={{ p: 1.5 }}>
  <CardGrid size={'icon'} fill>
    {(shrines ?? []).map((shrine, index) => {
      const entry = shrineData?.[`${shrine?.rawName ?? ''}`.replace('ConTowerB', '')];
      const contributors = shrinesExpBonus ? (shrinesExpBonus?.breakdown?.[index] ?? [])
        .filter(({ value }) => value > 0).map(({ name }) => name) : null;
      const perHour = shrinesExpBonus ? shrinesExpBonus?.total?.[index] ?? 0 : undefined;
      const built = shrine?.shrineLevel > 0;
      return <IconTile key={shrine?.rawName ?? index} icon={`data/${shrine?.rawName}.png`} alt={cleanUnderscore(shrine?.name)}
                       value={formatNum(shrine?.shrineLevel ?? 0)} status={built ? undefined : 'missing'}
                       progress={built ? (shrine?.progress ?? 0) / hoursToLevel(shrine.shrineLevel) : undefined}
                       details={shrineDetails(shrine, entry, contributors, perHour, characterCount)}/>;
    })}
  </CardGrid>
</Box>;

export default Shrines;
