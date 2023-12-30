import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getBitIndex, getCoinsArray, notateNumber, prefix } from '@utility/helpers';
import Tooltip from 'components/Tooltip';
import { MissingData } from '@components/common/styles';
import { isGodEnabledBySorcerer } from '../../../parsers/lab';
import { NextSeo } from 'next-seo';
import { isCompanionBonusActive } from '../../../parsers/misc';
import { getMinorDivinityBonus } from '../../../parsers/divinity';
import CoinDisplay from '../../../components/common/CoinDisplay';

const Divinity = () => {
  const { state } = useContext(AppContext);
  const { deities, linkedDeities, unlockedDeities } = state?.account?.divinity || {};
  const [showCost, setShowCost] = useState(false);
  if (!state?.account?.divinity) return <MissingData name={'divinity'}/>;
  return <>
    <NextSeo
      title="Idleon Toolbox | Divinity"
      description="Keep track of your characters' gods connections and upgrades"
    />
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Divinity</Typography>
    <FormControlLabel
      control={<Checkbox name={'mini'} checked={showCost}
                         size={'small'}
                         onChange={() => setShowCost(!showCost)}/>}
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
                       level
                     }, godIndex) => {
        const hasLinks = state?.characters?.some((character, index) => isCompanionBonusActive(state?.account, 0) || linkedDeities?.[index] === godIndex || isGodEnabledBySorcerer(character, godIndex));
        return <Card sx={{ width: 300 }} key={rawName} variant={godIndex < unlockedDeities ? 'elevation' : 'outlined'}>
          <CardContent>
            <Stack alignItems={'center'} gap={1}>
              <img src={`${prefix}data/${rawName}.png`} alt=""/>
              <Stack gap={1} justifyContent={'space-between'} sx={{ minHeight: 250 }}>
                <Stack>
                  <Typography>{name}</Typography>
                  <Typography variant={'body2'}>Lv. {level} / 100</Typography>
                  <Divider sx={{ my: 2 }}/>
                  <Typography variant={'body1'}>
                    Blessing: {cleanUnderscore(blessing.replace(/{/g, blessingBonus))}
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
                                               secondLinkedDeityIndex, secondDeityMinorBonus = 0
                                             }, index) => {
                      const compBonus = (isCompanionBonusActive(state?.account, 0) && blessingBonus > 0);
                      const isLinked = compBonus || linkedDeities?.[index] === godIndex;
                      const isSecondLinked = compBonus || secondLinkedDeityIndex === godIndex;
                      return compBonus || isLinked || isSecondLinked ?
                        <Tooltip title={<CharDeityDetails name={name}
                                                          divStyle={divStyle}
                                                          bonus={minorBonus.replace(/{/g, isLinked
                                                            ? getMinorDivinityBonus(state?.characters?.[index], state?.account, godIndex).toFixed(2)
                                                            : isSecondLinked ? secondDeityMinorBonus.toFixed(2) : 0)}/>}
                                 key={name}>
                          <img src={`${prefix}data/ClassIcons${classIndex}.png`}
                               alt=""/>
                        </Tooltip> : null;
                    })}
                  </Stack>
                </> : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const Cost = ({ type, cost, title }) => {
  if (type === 'coins') {
    // console.log('cost', cost)
    // console.log('3.477182763180816e+22', getCoinsArray(3.477182763180816e+22))
    // console.log('3.477182763180816e+22', getCoinsArray(3.477182763180816e+22))
    // console.log('3.477182763180816e+22', getCoinsArray(3.477182763180816e+22))
    // console.log('3.477182763180816e+22', getCoinsArray(3.477182763180816e+22))
  }
  const currencyIcon = type === 'bits' ? `etc/Bits_${getBitIndex(cost)}` : type === 'sailingGold'
    ? 'data/SailT0'
    : 'etc/Particle';
  return type !== 'coins' ? <Stack alignItems={'center'} direction={'row'} gap={1} mt={1}>
    <Typography variant={'body2'}>
      {title}: {cost === 'MAX' ? cost : notateNumber(cost, 'Big')}
    </Typography>
    <img src={`${prefix}${currencyIcon}.png`} alt={''}/>
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
  </>
}

export default Divinity;
