import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '../../../utility/helpers';
import Tooltip from 'components/Tooltip';
import { MissingData } from '../../../components/common/styles';
import { isGodEnabledBySorcerer } from '../../../parsers/lab';
import { NextSeo } from 'next-seo';
import { isCompanionBonusActive } from '../../../parsers/misc';

const Divinity = () => {
  const { state } = useContext(AppContext);
  const { deities, linkedDeities, unlockedDeities } = state?.account?.divinity || {};
  if (!state?.account?.divinity) return <MissingData name={'divinity'}/>;
  return <>
    <NextSeo
      title="Idleon Toolbox | Divinity"
      description="Keep track of your characters' gods connections and upgrades"
    />
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Divinity</Typography>
    <Stack my={2} direction={'row'} gap={2} flexWrap={'wrap'}>
      {deities?.map(({
                       name,
                       rawName,
                       majorBonus,
                       minorBonus,
                       blessing,
                       blessingMultiplier,
                       blessingBonus
                     }, godIndex) => {
        const hasLinks = state?.characters?.some((character, index) => isCompanionBonusActive(state?.account, 0) || linkedDeities?.[index] === godIndex || isGodEnabledBySorcerer(character, godIndex))
        return <Card sx={{ width: 300 }} key={rawName} variant={godIndex < unlockedDeities ? 'elevation' : 'outlined'}>
          <CardContent>
            <Stack alignItems={'center'} gap={1}>
              <img src={`${prefix}data/${rawName}.png`} alt=""/>
              <Stack gap={1} justifyContent={'space-between'} sx={{ minHeight: 250 }}>
                <Stack>
                  <Typography>{name}</Typography>
                  <Divider sx={{ my: 2 }}/>
                  <Typography variant={'body1'}>
                    Blessing: {cleanUnderscore(blessing.replace(/{/g, blessingBonus))}
                  </Typography>
                  {godIndex === 2 ? <Typography variant={'caption'}>* inaccurate</Typography> : null}
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
                                                            ? deityMinorBonus.toFixed(2)
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

const CharDeityDetails = ({ name, bonus, divStyle }) => {
  return <>
    <Typography sx={{ fontWeight: 'bold' }}>{name}</Typography>
    <Typography>Minor bonus: {cleanUnderscore(bonus)}</Typography>
    <Typography mt={1} sx={{ fontWeight: 'bold' }}>Style: {divStyle?.name}</Typography>
    <Typography>{cleanUnderscore(divStyle?.description.replace(/@/, ''))}</Typography>
  </>
}

export default Divinity;
