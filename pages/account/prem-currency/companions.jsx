import { NextSeo } from 'next-seo';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { cleanUnderscore, numberWithCommas, prefix } from '../../../utility/helpers';
import Timer from '@components/common/Timer';
import { CardTitleAndValue } from '../../../components/common/styles';

const CompanionList = ({ title, companions }) => {
  return (
    <Stack gap={2}>
      <Typography variant="h5">{title}</Typography>
      <Divider />
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        {companions?.map(({ name, effect, acquired = '' }) => {
          return <Card key={name}
            sx={{
              width: 300,
              border: acquired ? '1px solid' : '',
              borderColor: acquired ? 'success.dark' : ''
            }}>
            <CardContent sx={{ '&:last-child': { padding: 1.5 }, height: '100%' }}>
              <Stack gap={2} direction='row'>
                <img width={42} height={42}
                  style={{ objectFit: 'contain' }}
                  src={`${prefix}afk_targets/${name}.png`} alt={''} />
                <Typography>{cleanUnderscore(effect?.replace('{', '+'))}</Typography>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </Stack>
  );
};

const Companions = () => {
  const { state } = useContext(AppContext);
  const nextCompanionClaim = new Date().getTime() + Math.max(0, 594e6 - (1e3 * state?.account?.timeAway?.GlobalTime - (state?.account?.companions?.lastFreeClaim ?? 0)));
  const legacy = state?.account?.companions?.list?.slice(0, 11);
  const fallenSpirits = state?.account?.companions?.list?.slice(12, 24);
  const exclusive = [state?.account?.companions?.list[11], ...state?.account?.companions?.list?.slice(24)];

  return <>
    <NextSeo
      title="Companions | Idleon Toolbox"
      description="Detailed information about companions and their bonuses"
    />
    <Stack direction={'row'} gap={3} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Pet Crystals'} value={numberWithCommas(state?.account?.companions?.petCrystals ?? 0)} icon='data/PremiumGem.png' imgStyle={{ filter: 'hue-rotate(280deg)', width: 24, height: 24 }} />
      <CardTitleAndValue title={'Total Box Opened'} value={numberWithCommas(state?.account?.companions?.totalBoxesOpened ?? 0)} />
      <CardTitleAndValue title={'Next free companion'} value={<Timer
        type={'countdown'} date={nextCompanionClaim}
        placeholder={'Go claim!'}
        lastUpdated={state?.lastUpdated} />} />
    </Stack>
    <Stack gap={4}>
      <CompanionList title="Legacy Companions" companions={legacy} />
      <CompanionList title="Fallen Spirits" companions={fallenSpirits} />
      <CompanionList title="Exclusive Companions" companions={exclusive} />
    </Stack>
  </>
};

export default Companions;
