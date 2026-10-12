import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { CardTitleAndValue, PlayersList } from '@components/common/styles';
import { CardWithBreakdown } from '@components/common/Breakdown/CardWithBreakdown';
import { isArtifactAcquired } from '@parsers/world-5/sailing';
import { NextSeo } from 'next-seo';
import Timer from '../../../components/common/Timer';

const Sigils = () => {
  const { state } = useContext(AppContext);
  const { alchemy, sailing } = state?.account || {};
  const chilledYarnArtifact = isArtifactAcquired(sailing?.artifacts, 'Chilled_Yarn');
  const sigilSpeed = alchemy?.p2w?.sigilSpeed;

  return (
    (<Stack>
      <NextSeo
        title="Sigils | Idleon Toolbox"
        description="View your sigil levels, unlock progress, and bonus effects for alchemy in Legends of Idleon"
      />
      <Stack mb={3} direction={'row'} gap={3}>
        <CardWithBreakdown title={'Sigil Speed'} value={notateNumber(sigilSpeed?.value, 'MultiplierInfo')}
          breakdown={sigilSpeed?.breakdown} />
        <CardTitleAndValue title={'Sigil Syrup'} value={state?.account?.accountOptions?.[409] ?? 0}
          imgStyle={{ width: 24, height: 24, objectFit: 'contain' }}
          icon={'data/SigilSyrup.png'} />
      </Stack>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {alchemy?.p2w?.sigils?.map((sigil, index) => {
          if (index > 24) return null;
          const { name, progress, effect, unlocked, nextCost, chargeRate, bonus, characters } = sigil;
          const isMaxed = nextCost == null;
          const isReady = !isMaxed && progress >= nextCost;
          const timeLeft = (nextCost - progress) / chargeRate * 3600 * 1000;
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
                    alt="" />
                  <Stack>
                    <Typography>{cleanUnderscore(name)}</Typography>
                    <PlayersList players={characters} characters={state?.characters} />
                  </Stack>
                </Stack>
                <Stack mt={2} gap={2}>
                  <Typography
                    sx={{
                      color: chilledYarnArtifact
                        ? 'info.light'
                        : ''
                    }}>Effect: {cleanUnderscore(effect?.replace(/{/g, bonus))}</Typography>
                  {isMaxed ? (
                    <Typography color={'success.main'}>Maxed</Typography>
                  ) : <>
                    <Typography>
                      Progress: {notateNumber(progress, 'Small')}/{notateNumber(nextCost, 'Small')}
                    </Typography>
                    {isReady ? <Typography color={'success.main'}>Ready to level up</Typography> : null}
                    {!isReady && isFinite(timeLeft) ? <Timer type={'countdown'} date={new Date().getTime() + timeLeft}
                      lastUpdated={state?.lastUpdated} /> : null}
                  </>}
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
  filter: hue-rotate(${({ unlocked }) => (unlocked === 4 ? '280deg' : unlocked === 3 ? '60deg' : unlocked === 2 ? '130deg' : unlocked === 1
    ? '200deg'
    : '0deg')});
`;

export default Sigils;
