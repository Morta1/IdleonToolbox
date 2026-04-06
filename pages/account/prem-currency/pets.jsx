import { NextSeo } from 'next-seo';
import { Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import React, { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import Timer from '@components/common/Timer';
import { CardTitleAndValue } from '../../../components/common/styles';
import { companionGroups } from '@website-data';

const CompanionList = ({ title, companions }) => {
  if (!companions?.length) return null;

  return (
    <Stack gap={2}>
      <Typography variant="h5">{title}</Typography>
      <Divider />
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        {companions.map(({ name, effect, acquired = '', copies = 0, tradableCount = 0 }) => {
          return <Card key={name}
            sx={{
              width: 300,
              border: acquired ? '1px solid' : '',
              borderColor: acquired ? 'success.dark' : '',
              opacity: acquired ? 1 : 0.4
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
    </Stack>
  );
};

const Pets = () => {
  const { state } = useContext(AppContext);
  const [showTradableOnly, setShowTradableOnly] = useState(false);
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const nextCompanionClaim = new Date().getTime() + Math.max(0, 594e6 - (1e3 * state?.account?.timeAway?.GlobalTime - (state?.account?.companions?.lastFreeClaim ?? 0)));

  const allCompanions = state?.account?.companions?.list || [];

  const filterCompanions = (indices) => {
    let result = indices.map(i => allCompanions[i]).filter(Boolean);
    if (showTradableOnly) result = result.filter(comp => (comp?.tradableCount || 0) > 0);
    if (showMissingOnly) result = result.filter(comp => !comp?.acquired);
    return result;
  };

  return <>
    <NextSeo
      title="Premium Pets | Idleon Toolbox"
      description="View your companion collection, abilities, trade offers, and pet crystal upgrades in Legends of Idleon"
    />
    <Stack direction={'row'} gap={3} flexWrap={'wrap'} alignItems="center">
      <CardTitleAndValue title={'Pet Crystals'} value={numberWithCommas(state?.account?.companions?.petCrystals ?? 0)} icon='data/PremiumGem.png' imgStyle={{ filter: 'hue-rotate(280deg)', width: 24, height: 24 }} />
      <CardTitleAndValue title={'Total Box Opened'} value={numberWithCommas(state?.account?.companions?.totalBoxesOpened ?? 0)} />
      <CardTitleAndValue title={'Next free companion'} value={<Timer
        type={'countdown'} date={nextCompanionClaim}
        placeholder={'Go claim!'}
        lastUpdated={state?.lastUpdated} />} />
      <FormControlLabel
        control={<Checkbox checked={showTradableOnly} onChange={(e) => setShowTradableOnly(e.target.checked)} />}
        label="Show tradable only"
      />
      <FormControlLabel
        control={<Checkbox checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />}
        label="Show missing only"
      />
    </Stack>
    <Stack gap={4}>
      {(companionGroups || []).map((group) => (
        <CompanionList
          key={group.name}
          title={group.name}
          companions={filterCompanions(group.indices)}
        />
      ))}
    </Stack>
  </>
};

export default Pets;
