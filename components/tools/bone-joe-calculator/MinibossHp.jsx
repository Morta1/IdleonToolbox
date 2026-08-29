import React from 'react';
import {
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { cleanUnderscore, notateNumber, numberWithCommas } from '@utility/helpers';
import { getKillCredit, getMinibosses, getMinibossHp } from '@parsers/misc/boneJoeCalculator';
import { monsterImage } from '@utility/spriteImages';

const MinibossHp = ({
                      pickles,
                      setPickles,
                      activePrayers,
                      setPrayerLevels,
                      curse,
                      hpMulti,
                      applyToCharacters,
                      setApplyToCharacters
                    }) => {
  const minibosses = getMinibosses();
  const killCredit = getKillCredit(pickles);

  const handlePrayerLevel = (name, maxLevel) => ({ target }) => {
    const level = Math.min(Math.max(parseInt(target.value, 10) || 0, 0), maxLevel);
    setPrayerLevels((prev) => ({ ...prev, [name]: level }));
  };

  return <Card sx={{ width: 'fit-content' }}>
    <CardContent>
      <Stack gap={2}>
        <Typography variant={'h6'}>Miniboss HP</Typography>
        <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
          <TextField
            size={'small'}
            type={'number'}
            label={'Pickles'}
            sx={{ width: 120 }}
            value={pickles}
            onChange={({ target }) => setPickles(Math.max(parseInt(target.value, 10) || 0, 0))}
          />
          <Divider orientation={'vertical'} flexItem sx={{ display: { xs: 'none', sm: 'block' } }}/>
          {activePrayers.map((prayer) => <TextField
            key={prayer?.name}
            size={'small'}
            type={'number'}
            sx={{ width: 150 }}
            label={cleanUnderscore(prayer?.name)}
            value={prayer?.level}
            onChange={handlePrayerLevel(prayer?.name, prayer?.maxLevel)}
          />)}
        </Stack>
        <FormControlLabel
          control={<Switch
            checked={applyToCharacters}
            onChange={({ target }) => setApplyToCharacters(target.checked)}
          />}
          label={'Apply to characters'}
        />
        <Typography variant={'caption'}>
          Monster HP curse: +{numberWithCommas(curse)}% &middot; each kill counts
          as {numberWithCommas(killCredit)} Deathnote {killCredit === 1 ? 'kill' : 'kills'}
        </Typography>
        <TableContainer>
          <Table size={'small'}>
            <TableHead>
              <TableRow>
                <TableCell>Miniboss</TableCell>
                <TableCell align={'right'}>Base HP</TableCell>
                <TableCell align={'right'}>HP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {minibosses.map(({ rawName, name, baseHp }) => <TableRow key={rawName}>
                <TableCell>
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <img src={monsterImage(name)} alt="" width={24} height={24}
                         style={{ objectFit: 'contain' }}/>
                    {cleanUnderscore(name)}
                  </Stack>
                </TableCell>
                <TableCell align={'right'}>{notateNumber(baseHp, 'Big')}</TableCell>
                <TableCell align={'right'}>{notateNumber(getMinibossHp(baseHp, hpMulti, pickles), 'Big')}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </CardContent>
  </Card>;
};

export default MinibossHp;
