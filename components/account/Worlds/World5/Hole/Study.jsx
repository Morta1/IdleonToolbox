import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { CAVERN_LABELS, villagerTiles } from '@components/account/Worlds/World5/Hole/commons';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import InfoButton from '@components/common/InfoButton';
import { Duration } from '@components/common/Num';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const STUDY_TOOLBAR = { sort: null, details: false };

const Study = ({ account, sectionFailed }) => {
  const hole = account?.hole;
  const study = hole?.villagers?.[4];
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('hole-studies', STUDY_TOOLBAR);
  const perHour = hole?.studies?.studyPerHour ?? 0;
  // The game's order, kept for each card's key once the list is sorted
  const studies = (hole?.studies?.studies ?? []).map((entry, index) => ({ ...entry, index }));
  // Seconds to a study's next level at today's study rate
  const secondsLeft = (entry) => (perHour > 0
    ? Math.max(0, (entry?.req ?? 0) - (entry?.progress ?? 0)) / perHour * 3600 : Infinity);
  const byTime = toolbar?.sort?.key === 'time';
  const direction = toolbar?.sort?.order === 'desc' ? -1 : 1;
  const sorted = byTime ? [...studies].sort((a, b) => direction * (secondsLeft(a) - secondsLeft(b))) : studies;
  // The game's four study lists, in its order (the parser's location)
  const lists = [...new Set(studies.map((entry) => entry?.location))];

  // A study is its cavern's, in the caverns' order: it takes the name the cavern strip and picker show ("The Bottomless
  // Trench", where the game's study list says "Trench"). Its bonus is its text, so the card keeps it whole with the time
  // to its next level; the study points behind that time show with the Details pill.
  const studyCard = (entry) => <ItemCard key={`study-${entry?.index}`}
                                         title={CAVERN_LABELS[entry?.index] ?? cleanUnderscore(entry?.name)}
                                         level={{ value: entry?.level ?? 0 }}
                                         meta={byTime ? entry?.location : undefined}
                                         status={entry?.active || entry?.peripheralVisionActive ? 'active' : undefined}
                                         statusLabel={entry?.peripheralVisionActive ? 'Active (Peripheral Vision)' : undefined}
                                         aside={entry?.name === 'The_bell'
                                           ? <InfoButton label={'The Bell study'}>Its bonus triggers on rings 19, 39, 59 and
                                             79, then every 20 rings.</InfoButton> : null}
                                         more={<ItemCard.Facts rows={[
                                           ['Progress', `${formatGame(entry?.progress ?? 0, 'Holes.StudyReqForBolaia', { whole: true })} / ${formatGame(entry?.req ?? 0, 'Holes.StudyReqForBolaia', { whole: true })}`]
                                         ]}/>}
                                         footer={<ItemCard.Facts rows={[
                                           ['Next level', <Duration key={'next'} seconds={secondsLeft(entry)}/>]
                                         ]}/>}>
    <ItemCard.Desc text={entry?.description}/>
  </ItemCard>;

  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Study rate'} icon={'etc/Study_Rate.png'}
                value={`${formatGame(perHour, 'Holes.BolaiaStudyRate')}/hr`}/>
      {villagerTiles(study)}
    </Stack>
    <Box>
      {sectionFailed ? null : <Toolbar state={toolbar} defaults={STUDY_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
               total={studies.length} shown={studies.length} noun={'studies'}>
        <Toolbar.Filter name={'details'} label={'Details'} display/>
        <Toolbar.Sort options={[['time', 'Time to next level', 'asc']]}/>
      </Toolbar>}
      {byTime
        ? <CardGrid size={'m'} details={toolbar?.details}>{sorted.map(studyCard)}</CardGrid>
        : <Stack gap={3}>{lists.map((list) => <Stack key={list} gap={1}>
          <Typography variant={'sectionTitle'} component={'h2'}>{list}</Typography>
          <CardGrid size={'m'} details={toolbar?.details}>{studies.filter((entry) => entry?.location === list).map(studyCard)}</CardGrid>
        </Stack>)}</Stack>}
    </Box>
  </>;
};

export default Study;
