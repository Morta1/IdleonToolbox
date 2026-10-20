import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { CardTitleAndValue, PlayersList } from '@components/common/styles';
import { CardWithBreakdown } from '@components/common/Breakdown/CardWithBreakdown';
import { isArtifactAcquired } from '@parsers/world-5/sailing';
import { calcSigilsLevels } from '@parsers/world-2/alchemy';
import { getPrismaMulti } from '@parsers/class-specific/tesseract';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import { NextSeo } from 'next-seo';
import Timer from '../../../components/common/Timer';
import SetGoalButton from '@components/goals/SetGoalButton';
import { goalHostSx } from '@components/goals/goalHost';

const Sigils = () => {
  const { state } = useContext(AppContext);
  const { alchemy, sailing, research } = state?.account || {};
  const chilledYarnArtifact = isArtifactAcquired(sailing?.artifacts, 'Chilled_Yarn');
  const sigilSpeed = alchemy?.p2w?.sigilSpeed;
  const etherealSigils = alchemy?.p2w?.totalEtherealSigils ?? 0;
  const eclecticSigils = alchemy?.p2w?.totalEclecticSigils ?? 0;
  const prismaCapped = (getPrismaMulti(state?.account)?.value ?? 0) >= 4;
  const trueDamageMulti = research?.greenSigilTrueDMG ?? 1;

  return (
    (<Stack>
      <NextSeo
        title="Sigils | Idleon Toolbox"
        description="View your sigil levels, unlock progress, and bonus effects for alchemy in Legends of Idleon"
      />
      <Stack mb={3} direction={'row'} gap={3} flexWrap={'wrap'}>
        <CardWithBreakdown title={'Sigil Speed'} value={sigilSpeed?.display}
          breakdown={sigilSpeed?.breakdown} />
        <CardTitleAndValue title={'Sigil Syrup'} value={state?.account?.accountOptions?.[409] ?? 0}
          imgStyle={{ width: 24, height: 24, objectFit: 'contain' }}
          icon={'data/SigilSyrup.png'} />
        <CardTitleAndValue title={'Total Sigil LV'} value={calcSigilsLevels(alchemy?.p2w?.sigils)} />
        <CardTitleAndValue title={'Prisma Multi'}>
          <Stack direction={'row'} alignItems={'center'} gap={0.5}>
            <Typography>+{notateNumber(0.2 * etherealSigils, 'MultiplierInfo')}%</Typography>
            {prismaCapped ? <Tooltip title={'Your Prisma multi is already at the x4 cap, so this adds nothing right now'}>
              <InfoIcon sx={{ fontSize: 14, opacity: 0.7 }} />
            </Tooltip> : null}
          </Stack>
          <Typography variant={'caption'} color={'text.secondary'}>{etherealSigils} Ethereal sigils</Typography>
        </CardTitleAndValue>
        {research?.greenSigilsUnlocked ? <CardTitleAndValue title={'TRUE DMG Multi'}>
          <Stack direction={'row'} alignItems={'center'} gap={0.5}>
            <Typography>{notateNumber(trueDamageMulti, 'MultiplierInfo')}x</Typography>
            <Tooltip title={'Not applied by the game: the damage formula never reads this bonus (game bug)'}>
              <InfoIcon sx={{ fontSize: 14, opacity: 0.7 }} />
            </Tooltip>
          </Stack>
          <Typography variant={'caption'} color={'text.secondary'}>{eclecticSigils} Eclectic sigils</Typography>
        </CardTitleAndValue> : null}
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
                ...goalHostSx,
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
                  <Stack ml={'auto'} alignSelf={'flex-start'}>
                    <SetGoalButton system="sigil" entryKey={String(index)} />
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
