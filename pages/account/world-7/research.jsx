import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { notateNumber, commaNotation } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { getTabs } from '@utility/helpers';
import Grid from '@components/account/Worlds/World7/Research/Grid';
import Observations from '@components/account/Worlds/World7/Research/Observations';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Research = () => {
  const { state } = useContext(AppContext);
  const research = state?.account?.research;

  if (!state?.account?.research) return <MissingData name={'research'} />;

  const {
    occurrencesToBeFound,
    totalOccurrencesFound,
    maxRoll,
    rollsPerDay,
    researchEXPmulti,
    researchEXPmultiBreakdown,
    researchEXPrateTOT,
    gridPTSearned,
    gridPTSpent,
    shapesOwned,
    magnifiersOwned,
    kaleidoscopeOwned,
    gridSquares,
    observations
  } = research;

  const overview = (
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
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

      <CardTitleAndValue
        title={'Grid PTs'}
        value={`${commaNotation(gridPTSpent ?? 0)} / ${commaNotation(gridPTSearned ?? 0)}`}
      />
      <CardTitleAndValue title={'Shapes Owned'} value={shapesOwned ?? 0} />
      <CardTitleAndValue title={'Magnifiers'} value={magnifiersOwned ?? 0} />
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
    </Tabber>
  </>
};

export default Research;
