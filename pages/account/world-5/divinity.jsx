import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getBitIndex, getCoinsArray, notateNumber, prefix } from '@utility/helpers';
import Tooltip from 'components/Tooltip';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { isGodEnabledBySorcerer } from '../../../parsers/lab';
import { NextSeo } from 'next-seo';
import { isCompanionBonusActive } from '../../../parsers/misc';
import { getMinorDivinityBonus } from '../../../parsers/divinity';
import CoinDisplay from '../../../components/common/CoinDisplay';

const Divinity = () => {
  const { state } = useContext(AppContext);
  const { deities, linkedDeities, godRank } = state?.account?.divinity || {};
  const [showCost, setShowCost] = useState(false);
  if (!state?.account?.divinity) return <MissingData name={'divinity'}/>;
  return <>
    <NextSeo
      title="Divinity | Idleon Toolbox"
      description="Keep track of your characters' gods connections and upgrades"
    />
    <CardTitleAndValue title={'God Rank'} value={godRank || 1}/>
    <FormControlLabel
      control={<Checkbox name={'mini'} checked={showCost} size={'small'} onChange={() => setShowCost(!showCost)}/>}
      label={'Show upgrade cost'}/>
    <Stack my={2} direction={'row'} gap={2} flexWrap={'wrap'}>
      {deities?.map(({
                       name,
                       rawName,
                       majorBonus,
                       minorBonus,
                       blessing,
                       blessingMultiplier,
                       blessingBonus,
                       cost,
                       level,
                       unlocked
                     }, godIndex) => {
        const hasLinks = state?.characters?.some((character, index) => isCompanionBonusActive(state?.account, 0) || linkedDeities?.[index] === godIndex || isGodEnabledBySorcerer(character, godIndex));
        const highestDivinityCharacter = state?.characters?.reduce((prev, curr) => {
          const prevBonus = prev?.skillsInfo?.divinity?.level;
          const currBonus = curr?.skillsInfo?.divinity?.level;
          return prevBonus > currBonus ? prev : curr;
        }, state?.characters?.[0]);
        return (
          (<Card sx={{ width: 300, opacity: unlocked ? 1 : .5 }} key={rawName}>
            <CardContent>
              <Stack>
                <Stack direction={'row'} gap={2}>
                  <img style={{ width: 42 }} src={`${prefix}data/${rawName}.png`} alt="god-icon"/>
                  <Stack>
                    <Typography>{name}</Typography>
                    <Typography variant={'body2'}>Lv. {level} / 100</Typography>
                  </Stack>
                </Stack>
                <Stack gap={1} justifyContent={'space-between'} sx={{ minHeight: 250 }}>
                  <Stack>
                    <Divider sx={{ my: 2 }}/>
                    <Typography variant={'body1'}>
                      Blessing: {cleanUnderscore(blessing.replace(/{/g, blessingBonus.toFixed(2).replace('.00', '')))}
                    </Typography>
                    {godIndex === 2 ? <Typography variant={'caption'}>* inaccurate</Typography> : null}
                    {cost?.cost !== 'MAX' && showCost ? <>
                      <Cost title={'Cost'} {...cost} cost={cost?.cost}/>
                      <Cost title={'Next Level Cost'} {...cost} cost={cost?.nextLevelCost}/>
                      <Cost title={'Cost To Max'} {...cost} cost={cost?.costToMax}/>
                    </> : null}
                    <Divider sx={{ my: 2 }}/>
                    <Typography sx={{ minHeight: 100 }} variant={'body1'}>{cleanUnderscore(majorBonus)}</Typography>
                  </Stack>
                  {hasLinks ? <>
                    <Divider sx={{ my: 2 }}/>
                    <Stack direction={'row'} flexWrap={'wrap'} mt={'auto'}>
                      {state?.characters?.map(({
                                                 classIndex, name, deityMinorBonus = 0, divStyle,
                                                 secondLinkedDeityIndex, secondDeityMinorBonus = 0,
                                                 playerId
                                               }, index) => {
                        const compBonus = (isCompanionBonusActive(state?.account, 0) && blessingBonus > 0);
                        const isLinked = compBonus || linkedDeities?.[index] === godIndex;
                        const isSecondLinked = compBonus || secondLinkedDeityIndex === godIndex;
                        if (godIndex === 6 && compBonus && highestDivinityCharacter?.playerId !== playerId) return null;
                        return compBonus || isLinked || isSecondLinked ?
                          <Tooltip title={<CharDeityDetails name={name}
                                                            divStyle={divStyle}
                                                            bonus={minorBonus.replace(/{/g, isLinked
                                                              ? getMinorDivinityBonus(state?.characters?.[index], state?.account, godIndex).toFixed(2)
                                                              : isSecondLinked
                                                                ? secondDeityMinorBonus.toFixed(2)
                                                                : 0)}/>}
                                   key={name}>
                            <img src={`${prefix}data/ClassIcons${classIndex}.png`} alt="class-icon"/>
                          </Tooltip> : null;
                      })}
                    </Stack>
                  </> : null}
                </Stack>
              </Stack>
            </CardContent>
          </Card>)
        );
      })}
    </Stack>
  </>;
};

const Cost = ({ type, cost, title }) => {
  const currencyIcon = type === 'bits' ? `etc/Bits_${getBitIndex(cost)}` : type === 'sailingGold'
    ? 'data/SailT0'
    : 'etc/Particle';
  return type !== 'coins' ? <Stack alignItems={'center'} direction={'row'} gap={1} mt={1}>
    <Typography variant={'body2'}>
      {title}: {cost === 'MAX' ? cost : notateNumber(cost, type === 'bits' ? 'bits' : 'Big')}
    </Typography>
    <img style={{ width: 24 }} src={`${prefix}${currencyIcon}.png`} alt={''}/>
  </Stack> : <CoinDisplay title={title}
                          noShadow
                          centered={false}
                          money={getCoinsArray(cost)}/>
}

const CharDeityDetails = ({ name, bonus, divStyle }) => {
  return <>
    <Typography sx={{ fontWeight: 'bold' }}>{name}</Typography>
    <Typography>Minor bonus: {cleanUnderscore(bonus)}</Typography>
    <Typography mt={1} sx={{ fontWeight: 'bold' }}>Style: {divStyle?.name}</Typography>
    <Typography>{cleanUnderscore(divStyle?.description.replace(/@/, ''))}</Typography>
  </>;
}

export default Divinity;
