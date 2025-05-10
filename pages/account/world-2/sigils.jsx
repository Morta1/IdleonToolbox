import React, { useContext, useMemo } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { CardTitleAndValue, PlayersList, TitleAndValue } from '@components/common/styles';
import { isArtifactAcquired } from '../../../parsers/sailing';
import { NextSeo } from 'next-seo';
import { getAchievementStatus } from '../../../parsers/achievements';
import { getSigilBonus, getVialsBonusByStat } from '../../../parsers/alchemy';
import Timer from '../../../components/common/Timer';
import Tooltip from '../../../components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getArcadeBonus } from '@parsers/arcade';

const Sigils = () => {
  const { state } = useContext(AppContext);
  const { alchemy, sailing } = state?.account || {};
  const chilledYarnArtifact = isArtifactAcquired(sailing?.artifacts, 'Chilled_Yarn');
  const hasJadeBonus = isJadeBonusUnlocked(state?.account, 'Ionized_Sigils');

  const getSigilSpeed = () => {
    const achievement = getAchievementStatus(state?.account?.achievements, 112);
    const gemStore = state?.account?.gemShopPurchases?.find((value, index) => index === 110);
    const sigilBonus = getSigilBonus(alchemy?.p2w?.sigils, 'PEA_POD');
    const vial = getVialsBonusByStat(alchemy?.vials, 'SigSpd');
    const anotherVial = getVialsBonusByStat(alchemy?.vials, '6turtle');
    const stampBonus = getStampsBonusByEffect(state?.account, '+{%_Sigil_Charge_rate');
    const winnerBonus = getWinnerBonus(state?.account, '<x Sigil SPD');
    const voteBonus = getVoteBonus(state?.account, 17);
    const arcadeBonus = getArcadeBonus(state?.account?.arcade?.shop, 'Sigil_Speed')?.bonus

    return {
      value: (1 + ((achievement ? 20 : 0) + (sigilBonus + (20 * gemStore + (vial + stampBonus)))) / 100)
        * (1 + winnerBonus / 100)
        * (1 + arcadeBonus / 100)
        * (1 + anotherVial / 100)
        * (1 + voteBonus / 100),

      breakdown: [
        { name: 'Achievement', value: (achievement ? 20 : 0) / 100 },
        { name: 'Arcade', value: arcadeBonus / 100 },
        { name: 'Sigil', value: sigilBonus / 100 },
        { name: 'Gem store', value: (20 * gemStore) / 100 },
        { name: 'Stamps', value: stampBonus / 100 },
        { name: 'Vial', value: vial / 100 },
        { name: 'Turtle Vial', value: 1 + anotherVial / 100 },
        { name: 'Summoning', value: winnerBonus },
        { name: 'Vote', value: voteBonus }
      ]
    }
  }

  const sigilSpeed = useMemo(() => getSigilSpeed(), [state]);
  const getSigilCost = ({ unlocked, boostCost, unlockCost, jadeCost }) => {
    if (unlocked === 0) {
      return boostCost;
    } else if (unlocked === 1) {
      if (hasJadeBonus) {
        return jadeCost;
      }
    } else if (unlocked === -1) {
      return unlockCost
    }
  }
  return (
    (<Stack>
      <NextSeo
        title="Sigils | Idleon Toolbox"
        description="Sigils information and progression"
      />
      <Stack direction={'row'} gap={3}>
        <CardTitleAndValue title={'Sigil Speed'}>
          <Stack direction={'row'} gap={1} justifyContent={'space-between'}>
            {notateNumber(sigilSpeed?.value, 'MultiplierInfo')}
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
            jadeCost,
            bonus,
            characters
          } = sigil;
          const cost = getSigilCost(sigil);
          const timeLeft = (cost - progress) / (characters?.length * sigilSpeed?.value) * 3600 * 1000;
          return (
            (<Card
              sx={{
                border: characters?.length > 0 ? '2px solid lightblue' : '',
                opacity: unlocked === -1 ? 0.5 : 1,
                width: { xs: 160, md: 250 }
              }}
              key={`${name}-${index}`}
            >
              <CardContent>
                <Stack gap={1} direction={'row'} alignItems={'center'}>
                  <SigilIcon unlocked={unlocked} className={'icon'} src={`${prefix}data/aSiga${index}.png`}
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
                  {progress < jadeCost && unlocked < 2 ? <>
                    <Typography>
                      Progress: {notateNumber(progress, 'Small')}/{notateNumber(cost, 'Small')}
                    </Typography>
                    {isFinite(timeLeft) ? <Timer type={'countdown'} date={new Date().getTime() + timeLeft}
                                                 lastUpdated={state?.lastUpdated}/> : null}
                  </> : (
                    <Typography color={'success.main'}>Maxed</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>)
          );
        })}
      </Stack>
    </Stack>)
  );
};

const SigilIcon = styled.img`
  object-fit: contain;
  filter: hue-rotate(${({ unlocked }) => (unlocked === 2 ? '130deg' : unlocked === 1 ? '200deg' : '0deg')});
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
