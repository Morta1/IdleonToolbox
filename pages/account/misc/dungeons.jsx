import React, { useContext, useMemo } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material';
import { getRealDateInMs, getTabs, prefix } from 'utility/helpers';
import { AppContext } from 'components/common/context/AppProvider';
import styled from '@emotion/styled';
import Timer from 'components/common/Timer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { calcHappyHours } from '../../../parsers/dungeons';
import { NextSeo } from 'next-seo';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '../../../components/Tooltip';
import { CardTitleAndValue } from '@components/common/styles';
import Upgrades from '../../../components/account/Misc/Dungeons/Upgrades';
import Tabber from '../../../components/common/Tabber';
import RngItems from '../../../components/account/Misc/Dungeons/RngItems';
import Traits from '../../../components/account/Misc/Dungeons/Traits';
import { PAGES } from '@components/constants';

const Dungeons = () => {
  const { state } = useContext(AppContext);
  const { dungeons } = state?.account || {};

  const nextHappyHours = useMemo(() => calcHappyHours(state?.serverVars?.HappyHours) || [], [state]);

  return (
    <>
      <NextSeo
        title="Dungeons | Idleon Toolbox"
        description="Dungeon information including happy hour times, currency, upgrades and more"
      />
      <Stack direction="row" flexWrap={'wrap'} gap={4}>
        <CardTitleAndValue title={'Rank'}>
          <Stack direction={'row'} gap={2}>
            <CurrencyIcon src={`${prefix}data/Dung_Rank${dungeons?.rank}.png`} alt="dungeon-icon"/>
            <Stack>
              <Typography>Rank: {dungeons?.rank}</Typography>
              <Typography>Exp: {dungeons?.progress} / {dungeons?.rankReq}</Typography>
            </Stack>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Boosted Runs'}>
          <Stack direction={'row'} gap={1}>
            <img src={`${prefix}etc/boosted-runs.png`} alt="boosted-run-icon"/>
            <Typography>{dungeons?.boostedRuns}</Typography>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Credits'}>
          <Stack direction={'row'} gap={1}>
            <CurrencyIcon src={`${prefix}data/DungCredits1.png`} alt="credits-icon"/>
            {dungeons?.credits}
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Flurbos'}>
          <Stack direction={'row'} gap={1}>
            <CurrencyIcon src={`${prefix}data/DungCredits2.png`} alt="flurbos-icon"/>
            {dungeons?.flurbos}
          </Stack>
        </CardTitleAndValue>
      </Stack>

      <Stack my={2} direction="row" gap={4}>
        <Accordion>
          <AccordionSummary expandIcon={nextHappyHours.length > 1 ? <ExpandMoreIcon/> : null}>
            <Stack direction="row" gap={2}>
              <Typography>Next Happy Hour:</Typography>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                {nextHappyHours?.length > 0 ?
                  <>
                    <Timer type={'countdown'} date={nextHappyHours?.[0]} lastUpdated={state?.lastUpdated}/>
                    <Tooltip title={getRealDateInMs(nextHappyHours?.[0])}>
                      <InfoIcon fontSize={'small'}/>
                    </Tooltip>
                  </> : 'waiting for lava to set them'}
              </Stack>
            </Stack>
          </AccordionSummary>
          {nextHappyHours.length > 1 ? (
            <AccordionDetails>
              <Typography mb={1}>Future happy hours</Typography>
              <Stack gap={2}>
                {nextHappyHours.map((nextHappyHour, index) => {
                  if (index === 0) return null;
                  return <Stack key={`next-happy-hour-${index}`} direction={'row'} gap={3}>
                    <Typography sx={{ width: 40 }}>#{index}</Typography>
                    <Timer key={`happy-${index}`} date={nextHappyHour} lastUpdated={state?.lastUpdated}/>
                    <Tooltip title={getRealDateInMs(nextHappyHour)}>
                      <InfoIcon fontSize={'small'}/>
                    </Tooltip>
                  </Stack>
                })}
              </Stack>
            </AccordionDetails>
          ) : null}
        </Accordion>
      </Stack>
      <Tabber tabs={getTabs(PAGES.ACCOUNT.misc.categories, 'dungeons')}>
        <Upgrades {...dungeons}/>
        <RngItems {...dungeons}/>
        <Traits {...dungeons}/>
      </Tabber>
    </>
  );
};

const CurrencyIcon = styled.img`
  width: 25px;
  object-fit: contain;
`;

export default Dungeons;
