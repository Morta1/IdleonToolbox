import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../components/common/context/AppProvider';
import { talentPagesMap } from '../../parsers/talents';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '../../utility/helpers';
import styled from '@emotion/styled';
import { NextSeo } from 'next-seo';
import Tooltip from '../../components/Tooltip';

const Apocalypses = () => {
  const { state } = useContext(AppContext);
  const [maniacs, setManiacs] = useState([]);

  useEffect(() => {
    if (state?.characters) {
      const localManiacs = state?.characters?.filter((character) => {
        const isBarbarian = talentPagesMap[character?.class]?.includes('Barbarian');
        const isBloodBerserker = talentPagesMap[character?.class]?.includes('Blood_Berserker');
        return isBarbarian || isBloodBerserker;
      })
      setManiacs(localManiacs);
    }
  }, [state]);

  return (
    <>
      <NextSeo
        title="Idleon Toolbox | Apocalypses"
        description="Dedicated to the barbarian/blood berserker class to keep track of Zow and Chow talents"
      />
      <Typography textAlign={'center'} mt={2} mb={2} variant={'h2'}>Apocalypses</Typography>
      <Typography mb={3} component={'div'} variant={'caption'}>* Listed monsters are the ones you haven't
        zowed/chowed and how many you've already killed</Typography>
      <Stack gap={4}>
        {maniacs?.map(({ name, zow, chow }, index) => {
          return <Stack key={`${name}-zow-chow`} gap={4}>
            <ApocDisplay apocName={'zow'} charName={name} key={`${name}-zow`} monsters={zow}/>
            <ApocDisplay apocName={'chow'} charName={name} key={`${name}-chow`} monsters={chow}/>
            {index < maniacs.length - 1 ? <Divider my={5}/> : null}
          </Stack>
        })}
      </Stack>
    </>
  )
};

const ApocDisplay = ({ apocName, charName, monsters }) => {
  const allDone = monsters?.list?.every(({ done }) => done.every((done) => done));
  return <Stack gap={2}>
    <Typography variant={'h4'}>{charName} {apocName}ed {apocName === 'zow'
      ? monsters.finished.at(0)
      : monsters?.finished?.join('/') ?? 0} monsters</Typography>
    {apocName === 'chow' ?
      <Typography component={'div'} variant={'caption'}>* Normal Chow requires 1M kills / Super Chow requires 100M
        kills</Typography> : null}
    <Card>
      <CardContent>
        {allDone ? <Typography>You're Done</Typography> : monsters ? <Stack gap={3} direction={'row'} flexWrap={'wrap'}>
          {monsters?.list?.map(({
                                  mapName,
                                  name,
                                  monsterFace,
                                  kills,
                                  done,
                                  thresholds
                                }, index) => {
            return !done.every((done) => done) ?
              <Tooltip title={cleanUnderscore(mapName)} key={`${charName}-${name}-${index}`}>
                <Card sx={{ width: 120 }} variant={'outlined'}>
                  <CardContent>
                    <Stack alignItems={'center'} gap={1}>
                      <MonsterIcon src={`${prefix}data/Mface${monsterFace}.png`} alt=""/>
                      <Typography>{notateNumber(kills, 'Big')}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Tooltip> : null
          })}
        </Stack> : <Typography>{apocName} talent is still locked !</Typography>}
      </CardContent>
    </Card>
  </Stack>
}

const MonsterIcon = styled.img`
  width: 35px;
  height: 41px;
`

export default Apocalypses;
