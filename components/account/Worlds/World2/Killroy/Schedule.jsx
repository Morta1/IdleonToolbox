import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';
import Notice from '@components/common/Notice';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';

// Under 100 kills is the equinox challenge threshold, same rule as the dashboard alert.
const EQUINOX_KILLS = 100;
const LINE_SX = { display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' };

// The weeks follow the save's game clock: a guest has none until they sign in, and a save can come without one
const Schedule = ({ killroy, schedule, hasClock, guest, sectionFailed }) => {
  const formatDate = useFormatDate();
  if (!hasClock) {
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
    // A failed section's kills are unknown: no number and no Under 100. Where the room's class leaves no room for
    // it (a Beginner row on a 1920 card), Under 100 takes a second line under the kills
    const value = <Box component={'span'} sx={{ ...LINE_SX, columnGap: 0.5, rowGap: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <GameIcon src={`data/Mface${monster?.MonsterFace}.png`} size={24} alt={name}/>
      {sectionFailed ? '-' : formatNum(kills)}
      {!sectionFailed && kills < EQUINOX_KILLS ? <StatusText status={'ready'}>Under 100</StatusText> : null}
    </Box>;
    const label = <Box component={'span'} sx={LINE_SX}>
      {`Room ${room + 1} · `}
      <GameIcon src={`data/ClassIcons${classIndex}.png`} size={24} alt={''}/>
      {cleanUnderscore(className ?? '')}
    </Box>;
    return [label, value];
  };

  return <Stack gap={2}>
    {sectionFailed ? null : <Typography variant={'body2'} color={'text.secondary'}>
      Rooms marked Under 100 still count for the Equinox challenge.
    </Typography>}
    <CardGrid size={'m'}>
      {schedule?.map(({ classes, date, monsters }, week) => <ItemCard key={`week-${week}`} title={formatDate(date)}
                                                                      meta={week === 0 ? 'This week' : undefined}>
        <ItemCard.Facts rows={(classes ?? []).map((room, index) => roomRow(room, index, monsters))}/>
      </ItemCard>)}
    </CardGrid>
  </Stack>;
};

export default Schedule;
