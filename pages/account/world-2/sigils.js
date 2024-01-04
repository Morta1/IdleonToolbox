import React, { useContext, useMemo } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { CardTitleAndValue, PlayersList, TitleAndValue } from '../../../components/common/styles';
import { isArtifactAcquired } from '../../../parsers/sailing';
import { NextSeo } from 'next-seo';
import { getAchievementStatus } from '../../../parsers/achievements';
import { getSigilBonus, getVialsBonusByStat } from '../../../parsers/alchemy';
import Timer from '../../../components/common/Timer';
import Tooltip from '../../../components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

const Sigils = () => {
  const { state } = useContext(AppContext);
  const { alchemy, sailing } = state?.account || {};
  const chilledYarnArtifact = isArtifactAcquired(sailing?.artifacts, 'Chilled_Yarn');

  const getSigilSpeed = () => {
    const achievement = getAchievementStatus(state?.account?.achievements, 112);
    const gemStore = state?.account?.gemShopPurchases?.find((value, index) => index === 110);
    const sigilBonus = getSigilBonus(alchemy?.p2w?.sigils, 'PEA_POD');
    const vial = getVialsBonusByStat(alchemy?.vials, 'SigSpd');
    return {
      value: 1 + ((achievement ? 20 : 0) + (sigilBonus + 20 * gemStore) + vial) / 100,
      breakdown: [
        { name: 'Achievement', value: (achievement ? 20 : 0) / 100 },
        { name: 'Sigil', value: (sigilBonus) / 100 },
        { name: 'Gem store', value: (20 * gemStore) / 100 },
        { name: 'Vial', value: vial / 100 }
      ]
    }
  }

  const sigilSpeed = useMemo(() => getSigilSpeed(), [state]);

  return (
    <Stack>
      <NextSeo
        title="Sigils | Idleon Toolbox"
        description="Sigils information and progression"
      />
      <Typography variant={'h2'} mb={3}>
        Sigils
      </Typography>
      <Stack direction={'row'} gap={3}>
        <CardTitleAndValue title={'Sigil Speed'}>
          <Stack direction={'row'} gap={1} justifyContent={'space-between'}>
            {sigilSpeed?.value}
            <Tooltip title={sigilSpeed?.breakdown ? <BreakdownTooltip breakdown={sigilSpeed?.breakdown}
                                                                      notate={'MultiplierInfo'}/> : ''}>
              <InfoIcon/>
            </Tooltip>
          </Stack>
        </CardTitleAndValue>
      </Stack>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {alchemy?.p2w?.sigils?.map((sigil, index) => {
          if (index > 24) return null;
          const {
            name,
            progress,
            effect,
            unlocked,
            unlockCost,
            boostCost,
            bonus,
            characters
          } = sigil;
          const cost = unlocked === 0 ? boostCost : unlocked === -1 ? unlockCost : 0;
          const timeLeft = (cost - progress) / (characters?.length * sigilSpeed?.value) * 3600 * 1000;
          return (
            <Card
              sx={{
                border: characters?.length > 0 ? '2px solid lightblue' : '',
                opacity: unlocked === -1 ? 0.5 : 1,
                width: { xs: 160, md: 250 }
              }}
              key={`${name}-${index}`}
            >
              <CardContent>
                <Stack gap={1} direction={'row'} alignItems={'center'}>
                  <SigilIcon maxLevel={unlocked === 1} className={'icon'} src={`${prefix}data/aSiga${index}.png`}
                             alt=""/>
                  <Stack>
                    <Typography>{cleanUnderscore(name)}</Typography>
                    <PlayersList players={characters} characters={state?.characters}/>
                  </Stack>
                </Stack>
                <Stack mt={2} gap={2}>
                  <Typography
                    sx={{
                      color: chilledYarnArtifact
                        ? 'info.light'
                        : ''
                    }}>Effect: {cleanUnderscore(effect?.replace(/{/g, bonus))}</Typography>
                  {progress < boostCost ? <>
                    <Typography>
                      Progress: {notateNumber(progress, 'Small')}/{unlocked === 0
                      ? notateNumber(boostCost, 'Small')
                      : notateNumber(unlockCost, 'Small')}
                    </Typography>
                    {isFinite(timeLeft) ? <Timer type={'countdown'} date={new Date().getTime() + timeLeft}
                                                 lastUpdated={state?.lastUpdated}/> : null}
                  </> : (
                    <Typography color={'success.main'}>Maxed</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
};

const SigilIcon = styled.img`
  object-fit: contain;
  filter: hue-rotate(${({ maxLevel }) => (maxLevel ? '200deg' : '0deg')});
`;

const BreakdownTooltip = ({ breakdown, titleWidth = 120, notate = '' }) => {
  if (!breakdown) return '';
  return <Stack>
    {breakdown?.map(({ name, value }, index) => <TitleAndValue key={`${name}-${index}`}
                                                               titleStyle={{ width: titleWidth }}
                                                               title={name}
                                                               value={!isNaN(value)
                                                                 ? notateNumber(value, notate)
                                                                 : value}/>)}
  </Stack>
}

export default Sigils;
