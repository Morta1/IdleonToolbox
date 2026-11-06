import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import { formatDuration, formatNum, getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Num from '@components/common/Num';
import PageSummary, { SummaryFailed } from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import Grid from '@components/account/Worlds/World7/Research/Grid';
import Observations from '@components/account/Worlds/World7/Research/Observations';
import PostyNotes from '@components/account/Worlds/World7/Research/PostyNotes';

// Time left in the Numbers board's style; no rate, no time
const timeText = (hours) => (hours > 0 ? formatDuration(hours * 3600) : '-');

const Research = () => {
  const { state } = useContext(AppContext);
  const section = state?.account?.research;
  const sectionFailed = isSectionFailed(state?.account, 'research');
  const parseFailed = isParseFailed(state?.account);
  const {
    occurrencesToBeFound,
    totalOccurrencesFound,
    maxRoll,
    rollsPerDay,
    researchEXPmulti,
    researchEXPmultiBreakdown,
    researchEXPrateTOT,
    researchAFKrate,
    researchAFKrateBreakdown,
    researchEXPrateAFK,
    gridPTSearned,
    gridPTSpent,
    shapesOwned,
    magnifiersOwned,
    magnifyingGlassOwned,
    opticalMonocleOwned,
    kaleidoscopeOwned,
    gridSquares,
    observations,
    postyNotes,
    researchLevel,
    researchEXPpercent,
    researchRegistrantOwned,
    timeToLevel,
    timeToLevelRegistrant,
    nextUnlockResearchLv,
    timeToNextUnlock,
    timeToNextUnlockRegistrant
  } = section ?? {};

  const allPostyNotesUnlocked = (postyNotes?.length ?? 0) > 0 && postyNotes.every(({ unlocked }) => unlocked);
  // The parser's AFK total is a MultiplierInfo string; the drawer reads the tile's own number (the game's Small)
  const afkText = `${formatGame(researchAFKrate ?? 0, 'AFKgainrates.Research')}%`;
  const registrantNote = 'Research Registrant banks 12 hours of research gains each time you register for the tournament: '
    + `registering daily is a flat 1.5x rate.${researchRegistrantOwned ? '' : " You don't own it yet."}`;

  return <SummaryFailed value={sectionFailed}>
    <NextSeo
      title="Research | Idleon Toolbox"
      description="Keep track of your research level, observations and grid bonuses"
    />
    {!section || sectionFailed ? <MissingData name={'Research'} failed={sectionFailed} atZero={!parseFailed}/>
      : <NotReached name={'Research'} reached={section?.researchLevel > 0}/>}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Research level'}
                value={`${formatNum(researchLevel ?? 0)} (${formatNum(researchEXPpercent ?? 0, 'pct')})`}/>
      <StatTile label={'Time to level'} value={timeText(timeToLevel)}/>
      <StatTile label={'Time with registrant'} value={timeText(timeToLevelRegistrant)} info={registrantNote}/>
      <StatTile label={'Time to next Posty Note'} value={allPostyNotesUnlocked ? '-' : timeText(timeToNextUnlock)}
                info={allPostyNotesUnlocked
                  ? 'Every Posty Note is unlocked.'
                  : `The next one unlocks at Research LV ${formatNum(nextUnlockResearchLv ?? 0)}${timeToNextUnlockRegistrant > 0
                    ? `, at your current EXP rate: ${timeText(timeToNextUnlockRegistrant)} with Registrant` : ''}.`}/>
      <StatTile label={'Research EXP rate'}
                value={`${formatGame(researchEXPrateTOT ?? 0, 'ResearchStuff.ResearchEXPrateTOT')}/hr`}/>
      <StatTile label={'Research EXP multi'}
                value={<Num value={researchEXPmulti ?? 1} game={'ResearchStuff.ResearchEXPmulti'} unit={'x'}/>}
                breakdown={researchEXPmultiBreakdown} breakdownTitle={'Research EXP multi'}/>
      <StatTile label={'Research AFK gains'} value={afkText}
                breakdown={researchAFKrateBreakdown ? { ...researchAFKrateBreakdown, totalValue: afkText } : undefined}
                breakdownTitle={'Research AFK gains'}/>
      {/* The same stat as Research EXP rate at the AFK rate, so the same rule */}
      <StatTile label={'Offline research EXP rate'}
                value={`${formatGame(researchEXPrateAFK ?? 0, 'ResearchStuff.ResearchEXPrateTOT')}/hr`}
                info={'Research EXP per hour while you are away, at your Research AFK gains rate. It also sets how fast Insight, Minehead currency and Sushi Station fuel build up offline; with the game open, research runs at the full rate.'}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'research')}>
      {/* Decision 6: the numbers that count one tab's list sit at that tab's top */}
      <Stack gap={3}>
        <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
          <StatTile label={'Grid points'} value={`${formatNum(gridPTSpent ?? 0)} / ${formatNum(gridPTSearned ?? 0)}`} failed={sectionFailed}/>
          <StatTile label={'Shapes owned'} value={shapesOwned ?? 0} kind={'amount'} failed={sectionFailed}/>
          <StatTile label={'Lenses'} value={magnifiersOwned ?? 0} kind={'amount'} failed={sectionFailed}/>
          <StatTile label={'Magnifying Glasses'} icon={'data/ResMagni0.png'} value={magnifyingGlassOwned ?? 0}
                    kind={'amount'} failed={sectionFailed}/>
          <StatTile label={'Optical Monocles'} icon={'data/ResMagni1.png'} value={opticalMonocleOwned ?? 0}
                    kind={'amount'} failed={sectionFailed}/>
          <StatTile label={'Kaleidoscopes'} icon={'data/ResMagni2.png'} value={kaleidoscopeOwned ?? 0} kind={'amount'} failed={sectionFailed}/>
        </Stack>
        {parseFailed ? null : <Grid gridSquares={gridSquares}/>}
      </Stack>
      <Stack gap={3}>
        <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
          <StatTile label={'Observations found'} failed={sectionFailed}
                    value={`${formatNum(totalOccurrencesFound ?? 0)} / ${formatNum(occurrencesToBeFound ?? 0)}`}/>
          <StatTile label={'Max roll'} value={maxRoll ?? 0} kind={'amount'} failed={sectionFailed}/>
          <StatTile label={'Rolls per day'} value={rollsPerDay ?? 3} kind={'amount'} failed={sectionFailed}/>
        </Stack>
        {parseFailed ? null : <Observations observations={observations}/>}
      </Stack>
      <PostyNotes postyNotes={postyNotes}/>
    </Tabber>
  </SummaryFailed>;
};

export default Research;
