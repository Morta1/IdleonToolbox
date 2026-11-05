import React, { useState } from 'react';
import { Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { minorBonusText } from '@utility/gameNotation';
import NumberField from '@components/common/NumberField';
import Panel from '@components/common/cards/Panel';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import { gods } from '@website-data';
import {
  GOD_SLOT,
  getBigPBubbleBonus,
  getBigPBubbleShape,
  getGodMinorBonusMultiplier,
  getMinCoralKidLevel,
  getMinorDivinityBonusCap,
  getMinorDivinityBonusValue,
  getRequiredBigPLevel,
  getRequiredCoralKidLevel,
  getRequiredDivinityLevel
} from '@parsers/world-5/divinity';

// The inputs share a wrapping row at one height: each takes its share of the width, none a fixed one
const FIELD_SX = { flex: '1 1 150px', minWidth: 0 };
const precise = (value) => formatNum(value, 'amount', { precise: true });

const MinorBonusCalculator = ({ characters, account }) => {
  const [godSlot, setGodSlot] = useState(GOD_SLOT.Arctis);
  const [characterIndex, setCharacterIndex] = useState(0);
  // Every field starts out following the save, and only stops once it has been typed into.
  const [overrides, setOverrides] = useState({});

  const bubbleShape = getBigPBubbleShape(account);
  const savedDivinityLevel = characters?.[characterIndex]?.skillsInfo?.divinity?.level ?? 0;
  const savedCoralKidLevel = account?.coralReef?.coralKidUpgrades?.[3]?.level ?? 0;

  const divinityLevel = overrides?.divinityLevel ?? savedDivinityLevel;
  const bigPLevel = overrides?.bigPLevel ?? bubbleShape?.level;
  const coralKidLevel = overrides?.coralKidLevel ?? savedCoralKidLevel;

  const multiplier = getGodMinorBonusMultiplier(godSlot);
  const bigPBubble = getBigPBubbleBonus(bigPLevel, bubbleShape?.x1, bubbleShape?.x2, bubbleShape?.prismaMultiplier);
  // Coral Kid's divinity upgrade rounds its level into a flat percent.
  const coralKidUpgBonus = Math.round(coralKidLevel);
  const inputs = { divinityLevel, bigPBubble, multiplier, coralKidUpgBonus };
  const currentBonus = getMinorDivinityBonusValue(inputs);
  const cap = getMinorDivinityBonusCap(inputs);

  // Arctis is the only god whose bonus lands on whole steps, since it is ceiled into talent levels.
  const isTalentTarget = godSlot === GOD_SLOT.Arctis;
  const target = overrides?.target ?? Math.ceil(currentBonus) + 1;
  const targetBonus = isTalentTarget ? target - 1 : target;
  const bubbleCap = (1 + bubbleShape?.x1) * (bubbleShape?.prismaMultiplier ?? 1);

  const requirements = [
    {
      label: 'BIG P bubble level',
      current: bigPLevel,
      required: getRequiredBigPLevel({
        targetBonus,
        divinityLevel,
        multiplier,
        coralKidUpgBonus,
        x1: bubbleShape?.x1,
        x2: bubbleShape?.x2,
        prismaMultiplier: bubbleShape?.prismaMultiplier
      }),
      note: Number.isFinite(bubbleCap) ? `caps at ${formatNum(bubbleCap, 'mult')}` : null
    },
    {
      label: 'Divinity level',
      current: divinityLevel,
      required: getRequiredDivinityLevel({ targetBonus, bigPBubble, multiplier, coralKidUpgBonus })
    },
    {
      label: 'Coral Kid level',
      current: coralKidLevel,
      required: getRequiredCoralKidLevel({ targetBonus, divinityLevel, bigPBubble, multiplier })
    }
  ];
  const coralKidFloor = getMinCoralKidLevel({
    targetBonus,
    multiplier,
    x1: bubbleShape?.x1,
    prismaMultiplier: bubbleShape?.prismaMultiplier
  });
  const reached = currentBonus > targetBonus;
  // Coral Kid has no ceiling, so it is the only knob that can still be the answer once the bubble
  // and divinity level have both run out.
  const coralKidOnly = requirements?.[0]?.required === null && requirements?.[1]?.required === null;

  // An emptied field reads 0.
  const handleOverride = (field) => (next) => setOverrides((prev) => ({ ...prev, [field]: next ?? 0 }));
  // A bonus and its cap carry the god's unit: a percent as its line reads, Arctis its talent levels
  const percent = gods?.[godSlot]?.minorBonus?.includes('{%') ? '%' : '';
  // No-break spaces: "talent LV" has letters, so the row would break inside its value
  const withTalents = (bonus) => (isTalentTarget ? `${precise(bonus)} (+${formatNum(Math.ceil(bonus), 'whole')} talent LV)` : `${precise(bonus)}${percent}`);

  return <Panel title={'Bonus calculator'} meta={'What a god is worth now, and what a target costs.'}>
    <Stack gap={2} sx={{ p: 2 }}>
      <Stack gap={0.5}>
        <Typography variant={'body2'}>
          Minor link bonus = div lv / (60 + div lv) × BIG P bubble × god multi × (1 + Coral Kid / 100)
        </Typography>
        <Typography variant={'body2'} color={'text.secondary'}>
          {characters?.length ? 'Fields start from your save. Change any of them to test a setup.' : 'Change any field to test a setup.'}
        </Typography>
      </Stack>
      <Panel.Inputs sx={{ p: 0 }}>
        <TextField select label={'God'} sx={FIELD_SX} value={godSlot}
                   onChange={({ target: { value } }) => setGodSlot(Number(value))}>
          {gods?.map((god, index) => <MenuItem key={god?.name} value={index}>
            <Stack direction={'row'} gap={1} alignItems={'center'}>
              <GameIcon src={`data/DivGod${index}.png`} size={24} alt={''}/>
              {god?.name}
            </Stack>
          </MenuItem>)}
        </TextField>
        {characters?.length > 0 ? <TextField select label={'Character'} sx={FIELD_SX} value={characterIndex}
                                             onChange={({ target: { value } }) => {
                                               setCharacterIndex(Number(value));
                                               // The divinity level belongs to the character, so a new pick takes over the field again.
                                               setOverrides((prev) => ({ ...prev, divinityLevel: null }));
                                             }}>
          {characters?.map(({ name }, index) => <MenuItem key={name} value={index}>{name}</MenuItem>)}
        </TextField> : null}
        <NumberField label={'Divinity level'} sx={FIELD_SX} min={0} integer help={false} value={divinityLevel}
                     onChange={handleOverride('divinityLevel')}/>
        <NumberField label={'BIG P level'} sx={FIELD_SX} min={0} integer help={false} value={bigPLevel}
                     onChange={handleOverride('bigPLevel')}/>
        <NumberField label={'Coral Kid level'} sx={FIELD_SX} min={0} integer help={false} value={coralKidLevel}
                     onChange={handleOverride('coralKidLevel')}/>
        <NumberField label={isTalentTarget ? 'Target talent LV' : 'Target bonus'} sx={FIELD_SX} min={0}
          // Arctis hands out whole talent levels; the other gods' bonus is a percent with decimals.
                     integer={isTalentTarget} help={false} value={Number.isFinite(target) ? target : null}
                     onChange={handleOverride('target')}/>
      </Panel.Inputs>
      <Divider/>
      <Stack gap={1}>
        <ItemCard.Facts rows={[
          ['Current bonus', withTalents(currentBonus)],
          ['Divinity levels alone top out at', withTalents(cap)]
        ]}/>
        <Typography variant={'body2'} color={'text.secondary'}>{cleanUnderscore(gods?.[godSlot]?.minorBonus?.replace(/{/g, minorBonusText(currentBonus, isTalentTarget)))}</Typography>
      </Stack>
      <Divider/>
      {reached
        ? <StatusText status={'done'} wrap>Already there: {precise(currentBonus)}{percent} clears {formatNum(targetBonus)}{percent}.</StatusText>
        : <Stack gap={1}>
          <Typography variant={'body2'} color={'text.secondary'}>
            {isTalentTarget
              ? `+${formatNum(target, 'whole')} talent LV needs a bonus above ${formatNum(targetBonus)}. Each line raises one thing, the others unchanged.`
              : `Needs a bonus above ${formatNum(targetBonus)}${percent}. Each line raises one thing, the others unchanged.`}
          </Typography>
          <ItemCard.Facts rows={requirements.map(({ label, current, required, note }) => [label, required === null
            ? `Out of reach${note ? ` (${note})` : ''}`
            : `${formatNum(required, 'whole')} (you have ${formatNum(current, 'whole')}, +${formatNum(Math.max(0, required - current), 'whole')})`])}/>
          {coralKidOnly && coralKidFloor !== null
            ? <StatusText status={'needs'} wrap>Only Coral Kid can get there, and never below level {formatNum(coralKidFloor, 'whole')}.</StatusText>
            : null}
        </Stack>}
    </Stack>
  </Panel>;
};

export default MinorBonusCalculator;
