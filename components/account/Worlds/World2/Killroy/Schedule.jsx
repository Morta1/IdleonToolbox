import { Box, Stack, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import useFormatDate from '@hooks/useFormatDate';
import Notice from '@components/common/Notice';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

// Under 100 kills is the equinox challenge threshold, same rule as the dashboard alert.
const EQUINOX_KILLS = 100;
// A block, not inline: an inline line sits on its first item's baseline, the sprite's bottom for the number and the words
// for the label, which set the two 3 px apart
const LINE_SX = { display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' };
const DOT_SIZE = 8;
const Dot = ({ sx }) => <Box component={'span'} aria-hidden={'true'} sx={{
  display: 'inline-block', width: DOT_SIZE, height: DOT_SIZE, borderRadius: '50%', bgcolor: 'text.success', ...sx
}}/>;

// The weeks follow the save's game clock: a guest has none until they sign in, and a save can come without one
const Schedule = ({ killroy, schedule, guest, sectionFailed }) => {
  const formatDate = useFormatDate();
  if (!schedule?.length) {
    return guest
      ? <Notice tone={'signin'}>Killroy&apos;s schedule follows your save&apos;s clock: it shows here once you sign in.</Notice>
      : <Notice tone={'missing'}>Killroy&apos;s schedule follows your save&apos;s game clock, and this save has none.</Notice>;
  }
  const list = killroy?.list ?? [];

  // Two rooms can ask for the same class, so each row is named by its room too
  const roomRow = ({ className, classIndex }, room, monsters) => {
    const monster = monsters?.[room];
    const name = cleanUnderscore(monster?.Name ?? '');
    const kills = Number(list.find((mob) => mob.name === monster?.Name)?.killRoyKills) || 0;
    // A failed section's kills are unknown: no number and no dot. Every row keeps the dot's slot, so the numbers line up
    const value = <Box component={'span'} sx={LINE_SX}>
      <GameIcon src={`data/Mface${monster?.MonsterFace}.png`} size={24} alt={name}/>
      {sectionFailed ? '-' : formatGame(kills, 'Save.KillroyBest', { whole: true })}
      <Box component={'span'} sx={{ display: 'inline-flex', width: DOT_SIZE }}>
        {!sectionFailed && kills < EQUINOX_KILLS ? <>
          <Dot/>
          <Box component={'span'} sx={visuallyHidden}>Under 100</Box>
        </> : null}
      </Box>
    </Box>;
    const label = <Box component={'span'} sx={LINE_SX}>
      {`Room ${room + 1} · `}
      <GameIcon src={`data/ClassIcons${classIndex}.png`} size={24} alt={''}/>
      {cleanUnderscore(className ?? '')}
    </Box>;
    return [label, value];
  };

  const weekCard = ({ classes, date, monsters }, week) => <ItemCard key={`week-${week}`} title={formatDate(date, { showSeconds: false })}>
    <ItemCard.Facts rows={(classes ?? []).map((room, index) => roomRow(room, index, monsters))}/>
  </ItemCard>;
  const [thisWeek, ...coming] = schedule;

  // This week apart from the coming ones, under their own headings, as Arcade's Current rotation: a muted line on the first
  // card was all that told it from the rest
  return <Stack gap={2}>
    {sectionFailed ? null : <Typography variant={'body2'} color={'text.secondary'}>
      A green dot <Dot sx={{ mx: 0.25 }}/> marks a room under 100 kills: it still counts for the Equinox challenge.
    </Typography>}
    <Stack gap={1.5}>
      <Typography variant={'sectionTitle'} component={'h2'}>This week</Typography>
      <CardGrid size={'m'}>{weekCard(thisWeek, 0)}</CardGrid>
    </Stack>
    {coming.length ? <Stack gap={1.5} sx={{ mt: 2 }}>
      <Typography variant={'sectionTitle'} component={'h2'}>Coming weeks</Typography>
      <CardGrid size={'m'}>{coming.map((week, index) => weekCard(week, index + 1))}</CardGrid>
    </Stack> : null}
  </Stack>;
};

export default Schedule;
