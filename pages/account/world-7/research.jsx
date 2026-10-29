import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { CardTitleAndValue, MissingData, isSectionFailed } from '@components/common/styles';
import { notateNumber, commaNotation, secondsToShortDuration } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { getTabs } from '@utility/helpers';
import Grid from '@components/account/Worlds/World7/Research/Grid';
import Observations from '@components/account/Worlds/World7/Research/Observations';
import PostyNotes from '@components/account/Worlds/World7/Research/PostyNotes';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Research = () => {
  const { state } = useContext(AppContext);
  const research = state?.account?.research;

  const sectionFailed = isSectionFailed(state?.account, 'research');
  if (!state?.account?.research || sectionFailed) return <MissingData name={'Research'} failed={sectionFailed}/>;

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
  } = research;

  const allPostyNotesUnlocked = (postyNotes?.length ?? 0) > 0 && postyNotes.every(({ unlocked }) => unlocked);
  const formatEta = (hours) => (hours > 0 ? secondsToShortDuration(hours * 3600, { minUnit: 'minute' }) : '-');

  const overview = (
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue
        title={'Research Level'}
        value={`${researchLevel ?? 0} (${(researchEXPpercent ?? 0).toFixed(2)}%)`}
      />
      <CardTitleAndValue title={'Time To Level'} value={formatEta(timeToLevel)}/>
      <CardTitleAndValue title={'Time With Registrant'}>
        <Stack direction="row" alignItems="center" gap={1}>
          <span>{formatEta(timeToLevelRegistrant)}</span>
          <Tooltip
            title={`Research Registrant banks 12hrs of research gains every time you register for the tournament. Registering daily is a flat 1.5x rate.${researchRegistrantOwned ? '' : ' You don\'t own this upgrade yet.'}`}>
            <Stack alignContent="center" sx={{ cursor: 'pointer' }}>
              <IconInfoCircleFilled size={18}/>
            </Stack>
          </Tooltip>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Time To Next Posty'}>
        <Stack direction="row" alignItems="center" gap={1}>
          <span>{allPostyNotesUnlocked ? '-' : formatEta(timeToNextUnlock)}</span>
          <Tooltip
            title={allPostyNotesUnlocked
              ? 'All Posty Notes are unlocked.'
              : `Next Posty Note unlocks at Research LV ${nextUnlockResearchLv}. Estimate assumes your current EXP rate. With Registrant: ${formatEta(timeToNextUnlockRegistrant)}`}>
            <Stack alignContent="center" sx={{ cursor: 'pointer' }}>
              <IconInfoCircleFilled size={18}/>
            </Stack>
          </Tooltip>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue
        title={'Observations Found'}
        value={`${totalOccurrencesFound ?? 0} / ${occurrencesToBeFound ?? 0}`}
      />
      <CardTitleAndValue title={'Max Roll'} value={maxRoll ?? 0} />
      <CardTitleAndValue title={'Rolls Per Day'} value={rollsPerDay ?? 3} />
      <CardTitleAndValue
        title={'Research EXP Rate'}
        value={`${notateNumber(researchEXPrateTOT ?? 0, 'Big')} / hr`}
      />
      <CardTitleAndValue title={'Research EXP Multi'}>
        <Stack direction="row" alignItems="center" gap={1}>
          <span>{notateNumber(researchEXPmulti ?? 1, 'MultiplierInfo')}</span>
          {researchEXPmultiBreakdown && (
            <Breakdown data={researchEXPmultiBreakdown} valueNotation="MultiplierInfo">
              <Stack alignContent="center" sx={{ cursor: 'pointer' }}>
                <IconInfoCircleFilled size={18} />
              </Stack>
            </Breakdown>
          )}
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Research AFK Gains'}>
        <Stack direction="row" alignItems="center" gap={1}>
          <span>{notateNumber(researchAFKrate ?? 1, 'MultiplierInfo')}%</span>
          {researchAFKrateBreakdown && (
            <Breakdown data={researchAFKrateBreakdown} valueNotation="MultiplierInfo">
              <Stack alignContent="center" sx={{ cursor: 'pointer' }}>
                <IconInfoCircleFilled size={18} />
              </Stack>
            </Breakdown>
          )}
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Offline Research EXP Rate'}>
        <Stack direction="row" alignItems="center" gap={1}>
          <span>{`${notateNumber(researchEXPrateAFK ?? 0, 'Big')} / hr`}</span>
          <Tooltip
            title={'Research EXP per hour while you are away, at your Research AFK Gains rate. It also sets how fast Insight, Minehead currency and Sushi Station fuel build up offline. While the game is open, research runs at the full rate.'}>
            <Stack alignContent="center" sx={{ cursor: 'pointer' }}>
              <IconInfoCircleFilled size={18}/>
            </Stack>
          </Tooltip>
        </Stack>
      </CardTitleAndValue>

      <CardTitleAndValue
        title={'Grid PTs'}
        value={`${commaNotation(gridPTSpent ?? 0)} / ${commaNotation(gridPTSearned ?? 0)}`}
      />
      <CardTitleAndValue title={'Shapes Owned'} value={shapesOwned ?? 0} />
      <CardTitleAndValue title={'Total Lenses'} value={magnifiersOwned ?? 0} />
      <CardTitleAndValue title={'Magnifying Glasses'} value={magnifyingGlassOwned ?? 0} />
      <CardTitleAndValue title={'Optical Monocles'} value={opticalMonocleOwned ?? 0} />
      <CardTitleAndValue title={'Kaleidoscopes'} value={kaleidoscopeOwned ?? 0} />
    </Stack>
  );

  return <>
    <NextSeo
      title="Research | Idleon Toolbox"
      description="Keep track of your research level, observations and grid bonuses"
    />
    {overview}
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'research')}>
      <Stack alignItems="center" sx={{ width: '100%' }}>
        <Grid gridSquares={gridSquares} />
      </Stack>
      <Stack alignItems="stretch">
        <Observations observations={observations} />
      </Stack>
      <PostyNotes postyNotes={postyNotes} />
    </Tabber>
  </>
};

export default Research;
