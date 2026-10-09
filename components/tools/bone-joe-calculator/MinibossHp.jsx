import React from 'react';
import {
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  Typography
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Tooltip from '@components/Tooltip';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import { getKillCredit, getMinibosses, getMinibossHp } from '@parsers/misc/boneJoeCalculator';
import { monsterImage } from '@utility/spriteImages';

const MinibossHp = ({
                      pickles,
                      setPickles,
                      activePrayers,
                      levelsFromAccount,
                      setPrayerLevel,
                      togglePrayer,
                      curse,
                      hpMulti,
                      applyToCharacters,
                      setApplyToCharacters
                    }) => {
  const minibosses = getMinibosses();
  const killCredit = getKillCredit(pickles);

  const handlePrayerLevel = (name, maxLevel) => ({ target }) => {
    const level = Math.min(Math.max(parseInt(target.value, 10) || 0, 0), maxLevel);
    setPrayerLevel(name, level);
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
          {activePrayers.map((prayer) => {
            const levelField = <TextField
              size={'small'}
              type={'number'}
              label={cleanUnderscore(prayer?.name)}
              value={prayer?.level}
              onChange={handlePrayerLevel(prayer?.name, prayer?.maxLevel)}
              sx={{
                width: levelsFromAccount ? 170 : 150,
                ...(prayer?.enabled ? {} : { '& .MuiInputBase-input': { color: 'text.disabled' } })
              }}
              slotProps={levelsFromAccount && prayer?.level !== prayer?.accountLevel ? {
                input: {
                  endAdornment: <InputAdornment position={'end'}>
                    <Tooltip title={`Reset to account level (Lv ${prayer?.accountLevel})`}>
                      <IconButton
                        size={'small'}
                        edge={'end'}
                        aria-label={`Reset ${cleanUnderscore(prayer?.name)} to account level`}
                        onClick={() => setPrayerLevel(prayer?.name, prayer?.accountLevel)}
                      >
                        <RestartAltIcon fontSize={'small'}/>
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                }
              } : undefined}
            />;
            if (!levelsFromAccount) return React.cloneElement(levelField, { key: prayer?.name });
            return <Stack key={prayer?.name} direction={'row'} gap={0.5} alignItems={'center'}>
              <Tooltip title={prayer?.enabled ? 'Equipped, click to unequip' : 'Not equipped, click to equip'}>
                <ToggleButton
                  value={prayer?.name}
                  size={'small'}
                  selected={!!prayer?.enabled}
                  color={'primary'}
                  aria-label={`Equip ${cleanUnderscore(prayer?.name)}`}
                  onChange={() => togglePrayer(prayer?.name)}
                  // Same height and resting border as the level field beside it, so the pair reads as one control.
                  sx={(theme) => ({
                    width: 40,
                    height: 40,
                    p: 0,
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                    '&.Mui-selected': { borderColor: theme.palette.primary.main }
                  })}
                >
                  <img src={`${prefix}data/Prayer${prayer?.prayerIndex}.png`} alt="" width={24} height={24}
                       style={{
                         objectFit: 'contain',
                         filter: prayer?.enabled ? 'none' : 'grayscale(1)',
                         opacity: prayer?.enabled ? 1 : 0.5
                       }}/>
                </ToggleButton>
              </Tooltip>
              {levelField}
            </Stack>;
          })}
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
