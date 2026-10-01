import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import { notateNumber, numberWithCommas, parseShorthandNumber, prefix } from '@utility/helpers';
import {
  getDetectionChance,
  getFloorDifficulty,
  getFlowersForDetection,
  getNinjaStealth
} from '@parsers/world-6/sneaking';

const FLOORS = 12;

const formatDetection = (detection) => `${(100 * detection).toFixed(detection > 0 && detection < 0.01 ? 4 : 2)}%`;

const Detection = ({ detection, characters, ninjaMastery }) => {
  const { ninjas = [], flowerStacks = [], flowerBonus = 0, mastery: currentMastery = 0 } = detection || {};
  const [storedMastery, setMastery] = useLocalStorage({ key: 'sneaking-detection-mastery' });
  const [floor, setFloor] = useLocalStorage({ key: 'sneaking-detection-floor', defaultValue: 0 });
  const [flowersInput, setFlowersInput] = useLocalStorage({ key: 'sneaking-detection-flowers', defaultValue: 'current' });
  const [placement, setPlacement] = useLocalStorage({ key: 'sneaking-detection-placement', defaultValue: 'together' });
  const [targetInput, setTargetInput] = useLocalStorage({ key: 'sneaking-detection-target', defaultValue: '0' });

  const masteryOptions = Array.from({ length: Math.max(ninjaMastery ?? 0, currentMastery) + 2 }, (_, index) => index);
  const mastery = masteryOptions.includes(storedMastery) ? storedMastery : currentMastery;
  const isCurrentMastery = mastery === currentMastery;
  // Changing mastery wipes every floor's stacks, so "current" only means something on the mastery you're on
  const currentFlowers = isCurrentMastery ? (flowerStacks?.[floor] ?? 0) : 0;
  const parsedFlowers = parseShorthandNumber(String(flowersInput));
  const flowers = flowersInput === 'current' ? currentFlowers : (isNaN(parsedFlowers) ? 0 : parsedFlowers);
  const parsedTarget = parseFloat(targetInput);
  const target = isNaN(parsedTarget) ? 0 : Math.min(100, Math.max(0, parsedTarget)) / 100;
  const difficulty = getFloorDifficulty(floor, mastery);

  const rows = ninjas.map((ninja) => {
    const floorMates = placement === 'together' ? ninjas.filter((mate) => mate.playerIndex !== ninja.playerIndex) : [];
    const stealth = getNinjaStealth(ninja, flowers, flowerBonus, floorMates);
    return {
      ...ninja,
      stealth,
      simulated: getDetectionChance(stealth, difficulty),
      flowersNeeded: getFlowersForDetection(ninja, target, difficulty, flowerBonus, floorMates)
    };
  });

  return <Stack gap={3}>
    <Stack gap={1}>
      <Typography variant={'h6'}>Current detection</Typography>
      <Typography variant={'body2'} color={'text.secondary'}>
        Mastery {currentMastery}, each ninja on their current floor with the Funeral Flowers stacked there.
      </Typography>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        {ninjas.map(({ playerIndex, floor: ninjaFloor, stealth, detection: chance }) => (
          <Paper key={`current-${playerIndex}`} variant={'outlined'} sx={{ p: 1.5, width: 170 }}>
            <Typography variant={'body2'} fontWeight={600} noWrap>{characters?.[playerIndex]?.name}</Typography>
            <Typography variant={'caption'} component={'div'} color={'text.secondary'}>
              Floor {ninjaFloor + 1} · {numberWithCommas(flowerStacks?.[ninjaFloor] ?? 0)} flowers
            </Typography>
            <Stack direction={'row'} alignItems={'center'} gap={0.5}>
              <Typography variant={'body2'}>{formatDetection(chance)}</Typography>
              <Tooltip title={`Stealth: ${notateNumber(stealth, 'Big')}`}>
                <IconInfoCircleFilled size={14}/>
              </Tooltip>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>

    <Stack gap={2}>
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        <Typography variant={'h6'}>What if</Typography>
        <Tooltip title={'Preview any mastery and floor without moving there. Funeral Flower stacks are per floor and reset when you change mastery, so "Current" stacks only count on the mastery you are on.'}>
          <IconInfoCircleFilled size={16}/>
        </Tooltip>
      </Stack>
      <Stack direction={'row'} gap={2} alignItems={'center'} flexWrap={'wrap'}>
        <FormControl size={'small'} sx={{ width: 160 }}>
          <InputLabel id={'detection-mastery'}>Mastery</InputLabel>
          <Select labelId={'detection-mastery'} label={'Mastery'} value={mastery}
                  onChange={(e) => setMastery(e.target.value)}>
            {masteryOptions.map((value) => <MenuItem key={value} value={value}>
              {value}{value === currentMastery ? ' (current)' : ''}
            </MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size={'small'} sx={{ width: 100 }}>
          <InputLabel id={'detection-floor'}>Floor</InputLabel>
          <Select labelId={'detection-floor'} label={'Floor'} value={floor}
                  onChange={(e) => setFloor(e.target.value)}>
            {Array.from({ length: FLOORS }, (_, index) => <MenuItem key={index} value={index}>{index + 1}</MenuItem>)}
          </Select>
        </FormControl>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <TextField size={'small'} sx={{ width: 160 }} label={'Funeral Flowers'}
                     value={flowersInput === 'current' ? '' : flowersInput}
                     placeholder={`Current (${numberWithCommas(currentFlowers)})`}
                     InputLabelProps={{ shrink: true }}
                     onChange={(e) => setFlowersInput(e.target.value === '' ? 'current' : e.target.value)}/>
          <Tooltip title={`Each stack gives +${flowerBonus}% stealth on its floor. Leave empty to use the stacks you have there now. Accepts shorthand like 10K or 1.5M.`}>
            <IconInfoCircleFilled size={16}/>
          </Tooltip>
        </Stack>
        <TextField size={'small'} sx={{ width: 140 }} label={'Target detection %'}
                   value={targetInput}
                   onChange={(e) => setTargetInput(e.target.value)}/>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <ToggleButtonGroup size={'small'} exclusive value={placement}
                             onChange={(_, value) => value && setPlacement(value)}>
            <ToggleButton value={'together'}>All together</ToggleButton>
            <ToggleButton value={'alone'}>Alone</ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title={'All together: every ninja shares the floor, so Smoke Bombs and Lotus Flowers boost the others. Alone: each ninja on the floor by themselves.'}>
            <IconInfoCircleFilled size={16}/>
          </Tooltip>
        </Stack>
      </Stack>
      <TableContainer component={Paper} sx={{ maxWidth: 900, overflowX: 'auto' }}>
        <Table size={'small'}>
          <TableHead>
            <TableRow>
              <TableCell>Ninja</TableCell>
              <TableCell>Sneaking LV</TableCell>
              <TableCell>Stealth</TableCell>
              <TableCell>Detection</TableCell>
              <TableCell>Flowers needed for {formatDetection(target)}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ playerIndex, stealth, simulated, flowersNeeded }) => <TableRow key={`row-${playerIndex}`}>
              <TableCell>
                <Stack direction={'row'} alignItems={'center'} gap={1}>
                  <img width={20} src={`${prefix}data/ClassIcons${characters?.[playerIndex]?.classIndex}.png`} alt={''}/>
                  <Typography variant={'body2'}>{characters?.[playerIndex]?.name}</Typography>
                </Stack>
              </TableCell>
              <TableCell>{characters?.[playerIndex]?.skillsInfo?.sneaking?.level ?? 0}</TableCell>
              <TableCell>{notateNumber(stealth, 'Big')}</TableCell>
              <TableCell sx={{ color: simulated <= target ? 'success.light' : undefined }}>
                {formatDetection(simulated)}
              </TableCell>
              <TableCell>
                {flowersNeeded === Infinity ? 'Unreachable' : flowersNeeded === 0 ? 'Reached' : numberWithCommas(flowersNeeded)}
              </TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  </Stack>
};

export default Detection;
