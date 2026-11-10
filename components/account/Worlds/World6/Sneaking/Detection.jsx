import React from 'react';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import NumberField from '@components/common/NumberField';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import InfoButton from '@components/common/InfoButton';
import ViewSwitch from '@components/common/ViewSwitch';
import Num from '@components/common/Num';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel, { FIELD_INFO_SX } from '@components/common/cards/Panel';
import Notice from '@components/common/Notice';
import { cleanUnderscore, formatNum, parseShorthandNumber } from '@utility/helpers';
import {
  getDetectionChance,
  getFloorDifficulty,
  getFlowersForDetection,
  getNinjaStealth
} from '@parsers/world-6/sneaking';

const FLOORS = 12;

// A column of chances lines up on two decimals (94.57%, 94.56%); a chance under 0.01% keeps two significant digits
// (Precise's rule) rather than reading 0.00%.
export const formatDetection = (detection) => {
  const percent = 100 * (detection ?? 0);
  return percent > 0 && percent < 0.01 ? formatNum(percent, 'pct', { precise: true }) : formatNum(percent, 'pct', { decimals: 2 });
};

const Detection = ({ detection, characters, ninjaMastery, emptyAccount }) => {
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

  // No ninjas (a guest): each section says what it lists once there are some, not an empty grid or table
  const noNinjas = (text) => (emptyAccount
    ? <Notice tone={'signin'}>{`${text} once you sign in.`}</Notice>
    : <Notice tone={'missing'}>This account has no ninjas yet.</Notice>);

  return <Stack gap={3}>
    <Stack gap={1}>
      <Typography variant={'sectionTitle'} component={'h2'}>Current detection</Typography>
      {ninjas.length ? <Typography variant={'body2'} color={'text.secondary'}>
        Mastery {currentMastery}, each ninja on their current floor with the Funeral Flowers stacked there.
      </Typography> : noNinjas(`Each ninja's detection on their current floor shows here`)}
      <CardGrid size={'s'}>
        {ninjas.map(({ playerIndex, floor: ninjaFloor, stealth, stealthBreakdown, detection: chance }) => (
          <ItemCard key={`current-${playerIndex}`} icon={`data/ClassIcons${characters?.[playerIndex]?.classIndex}.png`}
                    title={cleanUnderscore(characters?.[playerIndex]?.name)}
                    meta={`Floor ${ninjaFloor + 1} · ${formatNum(flowerStacks?.[ninjaFloor] ?? 0, 'whole')} flowers`}>
            <ItemCard.Facts rows={[
              ['Detection', formatDetection(chance)],
              ['Stealth', <Breakdown key={'stealth'} asValue data={stealthBreakdown}><Num value={stealth}
                                                                                        game={'Ninja.Stealth'}/></Breakdown>]
            ]}/>
          </ItemCard>
        ))}
      </CardGrid>
    </Stack>

    <Panel title={'What if'} aside={<InfoButton label={'What if'}>
      Preview any mastery and floor without moving there. Funeral Flower stacks are per floor and reset when you
      change mastery, so &quot;Current&quot; stacks only count on the mastery you are on.
    </InfoButton>}>
      {/* Bottoms aligned: the switch and the i sit on the fields' line, not their labels' */}
      <Panel.Inputs>
        <TextField select label={'Mastery'} value={mastery} sx={{ width: 160 }} onChange={(e) => setMastery(e.target.value)}>
          {masteryOptions.map((value) => <MenuItem key={value} value={value}>
            {value}{value === currentMastery ? ' (current)' : ''}
          </MenuItem>)}
        </TextField>
        <TextField select label={'Floor'} value={floor} sx={{ width: 100 }} onChange={(e) => setFloor(e.target.value)}>
          {Array.from({ length: FLOORS }, (_, index) => <MenuItem key={index} value={index}>{index + 1}</MenuItem>)}
        </TextField>
        <Stack direction={'row'} alignItems={'flex-end'} gap={0.5}>
          <NumberField label={'Funeral Flowers'} sx={{ width: 160 }}
                       value={flowersInput === 'current' ? null : Number.isNaN(parsedFlowers) ? null : parsedFlowers}
                       placeholder={`Current (${formatNum(currentFlowers, 'amount')})`}
                       min={0} integer help={false}
                       // Stacks run past a million, where a phone's number pad has no letters for 1.5M.
                       inputMode={'text'}
                       onChange={(next) => setFlowersInput(next ?? 'current')}/>
          <InfoButton label={'Funeral Flowers'} sx={FIELD_INFO_SX}>
            {`Each stack gives +${flowerBonus}% stealth on its floor. Leave empty to use the stacks you have there now. Accepts shorthand like 10K or 1.5M.`}
          </InfoButton>
        </Stack>
        <Stack direction={'row'} alignItems={'flex-end'} gap={0.5}>
          <NumberField label={'Target detection'} unit={'%'} sx={{ width: 140 }}
                       value={Number.isNaN(parsedTarget) ? null : parsedTarget}
                       min={0} max={100} help={false}
                       onChange={(next) => setTargetInput(String(next ?? 0))}/>
          <InfoButton label={'Target detection'} sx={FIELD_INFO_SX}>
            The chance a ninja gets caught. Lower is better: 0% means never detected.
          </InfoButton>
        </Stack>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <ViewSwitch size={'medium'} label={'Placement'} options={[['together', 'All together'], ['alone', 'Alone']]}
                      value={placement} onChange={setPlacement}/>
          <InfoButton label={'placement'}>
            All together: every ninja shares the floor, so Smoke Bombs and Lotus Flowers boost the others. Alone: each
            ninja on the floor by themselves.
          </InfoButton>
        </Stack>
      </Panel.Inputs>
      {ninjas.length ? <DataTable
          columns={[
            {
              key: 'ninja', label: 'Ninja', value: ({ playerIndex }) => cleanUnderscore(characters?.[playerIndex]?.name),
              icon: ({ playerIndex }) => <GameIcon src={`data/ClassIcons${characters?.[playerIndex]?.classIndex}.png`} alt={''} size={24}/>
            },
            {
              key: 'level', label: 'Sneaking level', kind: 'amount', sortable: true,
              value: ({ playerIndex }) => characters?.[playerIndex]?.skillsInfo?.sneaking?.level ?? 0
            },
            // The game prints a ninja's stealth in Big: 248QQ up to 1e21, 8e26 past it
            {
              key: 'stealth', label: 'Stealth', numeric: true, sortable: true, value: ({ stealth }) => stealth,
              render: ({ stealth }) => <Num value={stealth} game={'Ninja.Stealth'}/>
            },
            // The last column says in words whether the target is met, so this one carries no color.
            {
              key: 'detection', label: 'Detection', numeric: true, sortable: true, phone: true,
              value: ({ simulated }) => simulated, render: ({ simulated }) => formatDetection(simulated)
            },
            {
              key: 'flowers', label: `Flowers for ≤ ${formatNum(100 * target, 'pct')} detection`, numeric: true, sortable: true,
              value: ({ flowersNeeded }) => flowersNeeded,
              render: ({ flowersNeeded }) => (flowersNeeded === Infinity
                ? <StatusText status={'problem'}>Unreachable</StatusText>
                : flowersNeeded === 0 ? <StatusText status={'ready'}>Reached</StatusText> : formatNum(flowersNeeded, 'whole'))
            }
          ]}
          rows={rows}
          rowKey={'playerIndex'}
          rowLabel={({ playerIndex }) => cleanUnderscore(characters?.[playerIndex]?.name)}
        />
        : <Box sx={{ p: 2 }}>{noNinjas(`Your ninjas' detection on the floor you pick shows here`)}</Box>}
    </Panel>
  </Stack>
};

export default Detection;
