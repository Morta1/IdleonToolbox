import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { CLASSES, talentPagesMap } from '@parsers/talents';
import {
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix, tryToParse } from '@utility/helpers';
import styled from '@emotion/styled';
import { NextSeo } from 'next-seo';
import Tooltip from '@components/Tooltip';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';

const Apocalypses = () => {
  const { state } = useContext(AppContext);
  const [filteredCharacters, setFilteredCharacters] = useState([0]);

  const handleFilteredCharacters = (event, newCharacters) => {
    newCharacters?.length > 0 && setFilteredCharacters(newCharacters)
    localStorage.setItem('apocalypseCharacters', JSON.stringify(newCharacters));
  };

  const handleSelectAll = () => {
    const allSelected = filteredCharacters?.length === state?.characters?.length;
    const chars = Array.from(Array(allSelected ? 1 : state?.characters?.length).keys());
    setFilteredCharacters(chars);
  };

  useEffect(() => {
    const chars = tryToParse(localStorage.getItem('apocalypseCharacters'));
    if (chars) {
      setFilteredCharacters(tryToParse(localStorage.getItem('apocalypseCharacters')));
    } else {
      if (state?.characters) {
        const localManiacs = state?.characters?.filter((character) => {
          const isBarbarian = talentPagesMap[character?.class]?.includes(CLASSES.Barbarian);
          const isBloodBerserker = talentPagesMap[character?.class]?.includes(CLASSES.Blood_Berserker);
          return isBarbarian || isBloodBerserker;
        });
        setFilteredCharacters(localManiacs?.map(({ playerId }) => playerId))
      }
    }
  }, []);

  return (
    <>
      <NextSeo
        title="Apocalypses | Idleon Toolbox"
        description="Dedicated to the barbarian/blood berserker class to keep track of Zow and Chow talents"
      />
      <Stack direction={'row'} my={2} justifyContent={'center'} flexWrap={'wrap'}>
        <ToggleButtonGroup
          size={'small'}
          sx={{ display: 'flex', flexWrap: 'wrap' }}
          value={filteredCharacters}
          onChange={handleFilteredCharacters}>
          {state?.characters?.map((character, index) => {
            return (
              <ToggleButton
                sx={{ height: 'inherit' }}
                title={character?.name}
                value={index}
                key={character?.name + '' + index}>
                <img
                  src={`${prefix}data/ClassIcons${character?.classIndex}.png`}
                  alt=""
                />
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
        <ToggleButtonGroup sx={{ display: 'flex', flexWrap: 'wrap' }}
                           size={'small'}>
          <ToggleButton
            sx={{ height: 'inherit' }}
            onClick={handleSelectAll}
            title="Select all"
            value={'all'}>
            <FormatAlignCenterIcon/>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Typography mb={3} component={'div'} variant={'caption'}>* Listed monsters are the ones you haven't
        zowed/chowed and how many you've already killed</Typography>
      <Stack gap={4}>
        {filteredCharacters.length === 0 ? <Typography variant={'h3'} sx={{ textAlign: 'center' }}>Please select at
          least one character</Typography> : null}
        {state?.characters?.map(({ name, zow, chow, wow, playerId }, index) => {
          if (filteredCharacters?.indexOf(playerId) === -1) return null;
          return <Stack key={`${name}-zow-chow`} gap={2}>
            <ApocDisplay apocName={'zow'} charName={name} key={`${name}-zow`} monsters={zow}/>
            <ApocDisplay apocName={'chow'} charName={name} key={`${name}-chow`} monsters={chow}/>
            <ApocDisplay apocName={'wow'} charName={name} key={`${name}-wow`} monsters={wow}/>
            {index < filteredCharacters.length - 1 ? <Divider my={5}/> : null}
          </Stack>
        })}
      </Stack>
    </>
  )
};

const ApocDisplay = ({ apocName, charName, monsters }) => {
  const [onlySuperChows, setOnlySuperChows] = useState(false);

  const allDone = monsters?.list?.every(({ done }) => done.every((done) => done));
  return <Stack gap={2}>
    <Typography variant={'h4'}>{charName} {apocName}ed {apocName === 'zow' || apocName === 'wow'
      ? monsters.finished.at(0)
      : monsters?.finished?.join('/') ?? 0} monsters</Typography>
    {apocName === 'chow' ?
      <Typography component={'div'} variant={'caption'}>* Normal Chow requires 1M kills / Super Chow requires 100M
        kills</Typography> : null}
    {apocName === 'wow' ?
      <Typography component={'div'} variant={'caption'}>* Wow requires 1 billion kills</Typography> : null}
    {apocName === 'chow' ? <FormControlLabel
      control={<Checkbox checked={onlySuperChows} onChange={() => setOnlySuperChows(!onlySuperChows)}/>}
      name={'onlySuperChows'}
      label="Hide super chow"/> : null}
    <Card>
      <CardContent sx={{
        '&:last-child': { padding: '8px' }
      }}>
        {allDone ? <Typography>You're Done</Typography> : monsters ? <Stack gap={1} direction={'row'} flexWrap={'wrap'}>
          {monsters?.list?.map(({
                                  mapName,
                                  name,
                                  monsterFace,
                                  kills,
                                  done,
                                  thresholds
                                }, index) => {
            if (onlySuperChows && kills > 1e6) return;
            return !done.every((done) => done) ?
              <Tooltip title={`${cleanUnderscore(mapName)} - ${numberWithCommas(Math.floor(kills))}`}
                       key={`${charName}-${name}-${index}`}>
                <Card sx={{ width: 75, height: 75 }} variant={'outlined'}>
                  <CardContent sx={{ '&:last-child': { padding: 0 } }}>
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
