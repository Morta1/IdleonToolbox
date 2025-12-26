import { NextSeo } from 'next-seo';
import { Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import React, { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import Timer from '@components/common/Timer';
import { CardTitleAndValue } from '../../../components/common/styles';

const CompanionList = ({ title, companions }) => {
  const hasCompanions = companions && companions.length > 0;

  return (
    <Stack gap={2}>
      <Typography variant="h5">{title}</Typography>
      <Divider />
      {hasCompanions ? (
        <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
          {companions.map(({ name, effect, acquired = '', copies = 0, tradableCount = 0 }) => {
            return <Card key={name}
              sx={{
                width: 300,
                border: acquired ? '1px solid' : '',
                borderColor: acquired ? 'success.dark' : ''
              }}>
              <CardContent sx={{ '&:last-child': { padding: 1.5 }, height: '100%' }}>
                <Stack gap={2}>
                  <Stack direction='row' gap={2}>
                    <img width={42} height={42}
                      style={{ objectFit: 'contain' }}
                      src={`${prefix}afk_targets/${name}.png`} alt={''} />
                    <Stack gap={1}>
                      <Typography variant='body1'>{cleanUnderscore(name)}</Typography>
                      <Typography variant='body2' color='text.secondary'>{cleanUnderscore(effect?.replace('{', '+'))}</Typography>
                      {acquired && (
                        <Typography variant="body2">
                          Tradable: {numberWithCommas(tradableCount)}/{numberWithCommas(copies)}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          })}
        </Stack>
      ) : (
        <Typography variant="body1" color="text.secondary">
          No tradable companions to display
        </Typography>
      )}
    </Stack>
  );
};

const Companions = () => {
  const { state } = useContext(AppContext);
  const [showTradableOnly, setShowTradableOnly] = useState(false);
  const nextCompanionClaim = new Date().getTime() + Math.max(0, 594e6 - (1e3 * state?.account?.timeAway?.GlobalTime - (state?.account?.companions?.lastFreeClaim ?? 0)));

  const allLegacy = state?.account?.companions?.list?.slice(0, 11) || [];
  const allFallenSpirits = state?.account?.companions?.list?.slice(12, 24) || [];
  const allShallowWaters = state?.account?.companions?.list?.slice(37, 49) || [];
  const exclusiveIndexes = [11, 49, 50, 51];
  const allExclusive = [
    ...exclusiveIndexes.map(idx => state?.account?.companions?.list?.[idx]),
    ...(state?.account?.companions?.list?.slice(24, 37) || [])
  ].filter(Boolean);

  const filterTradable = (companions) => {
    if (!showTradableOnly) return companions;
    return companions?.filter(comp => (comp?.tradableCount || 0) > 0) || [];
  };

  const legacy = filterTradable(allLegacy);
  const fallenSpirits = filterTradable(allFallenSpirits);
  const shallowWaters = filterTradable(allShallowWaters);
  const exclusive = filterTradable(allExclusive);

  return <>
    <NextSeo
      title="Companions | Idleon Toolbox"
      description="Detailed information about companions and their bonuses"
    />
    <Stack direction={'row'} gap={3} flexWrap={'wrap'} alignItems="center">
      <CardTitleAndValue title={'Pet Crystals'} value={numberWithCommas(state?.account?.companions?.petCrystals ?? 0)} icon='data/PremiumGem.png' imgStyle={{ filter: 'hue-rotate(280deg)', width: 24, height: 24 }} />
      <CardTitleAndValue title={'Total Box Opened'} value={numberWithCommas(state?.account?.companions?.totalBoxesOpened ?? 0)} />
      <CardTitleAndValue title={'Next free companion'} value={<Timer
        type={'countdown'} date={nextCompanionClaim}
        placeholder={'Go claim!'}
        lastUpdated={state?.lastUpdated} />} />
      <FormControlLabel
        control={
          <Checkbox
            checked={showTradableOnly}
            onChange={(e) => setShowTradableOnly(e.target.checked)}
          />
        }
        label="Show tradable only"
      />
    </Stack>
    <Stack gap={4}>
      <CompanionList title="Legacy Companions" companions={legacy} />
      <CompanionList title="Fallen Spirits" companions={fallenSpirits} />
      <CompanionList title="Shallow Waters" companions={shallowWaters} />
      <CompanionList title="Exclusive Companions" companions={exclusive} />
    </Stack>
  </>
};

export default Companions;
