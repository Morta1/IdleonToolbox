import React, { useState } from 'react';
import { Box, Card, CardContent, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import { gods } from '@website-data';
import {
  ARCTIS_GOD_SLOT,
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

const parseLevel = (value) => Math.max(0, parseInt(value, 10) || 0);

const MinorBonusCalculator = ({ characters, account }) => {
  const [godSlot, setGodSlot] = useState(ARCTIS_GOD_SLOT);
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

  // Arctis is the only god whose bonus lands on whole steps, since it is ceiled into talent levels.
  const isTalentTarget = godSlot === ARCTIS_GOD_SLOT;
  const target = overrides?.target ?? Math.ceil(currentBonus) + 1;
  const targetBonus = isTalentTarget ? target - 1 : target;

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
      note: `caps at ${Math.round((1 + bubbleShape?.x1) * (bubbleShape?.prismaMultiplier ?? 1) * 100) / 100}x`
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

  const handleOverride = (field) => ({ target: { value } }) => setOverrides((prev) => ({
    ...prev,
    [field]: parseLevel(value)
  }));

  return <Card sx={{ width: 'fit-content' }}>
    <CardContent>
      <Stack gap={2}>
        <Typography variant={'body2'} sx={{ maxWidth: 600 }}>Minor Link Bonus:</Typography>
        <Box
          component={'pre'}
          sx={{
            m: 0,
            p: 1.5,
            borderRadius: 1,
            overflowX: 'auto',
            fontSize: 13,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <code>div lv / (60 + div lv) * BIG P bubble * god multiplier * (1 + coral kid / 100)</code>
        </Box>
        <Typography variant={'body2'} sx={{ maxWidth: 600 }}>
          Fields start from your save. Change any of them to test a setup.
        </Typography>
        <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
          <TextField
            select
            size={'small'}
            label={'God'}
            sx={{ width: 190 }}
            value={godSlot}
            onChange={({ target: { value } }) => setGodSlot(Number(value))}
          >
            {gods?.map((god, index) => <MenuItem key={god?.name} value={index}>
              <Stack direction={'row'} gap={1} alignItems={'center'}>
                <img width={20} height={20} src={`${prefix}data/DivGod${index}.png`} alt=""/>
                {god?.name}
              </Stack>
            </MenuItem>)}
          </TextField>
          {characters?.length > 0 ? <TextField
            select
            size={'small'}
            label={'Character'}
            sx={{ width: 170 }}
            value={characterIndex}
            onChange={({ target: { value } }) => {
              setCharacterIndex(Number(value));
              // The divinity level belongs to the character, so a new pick takes over the field again.
              setOverrides((prev) => ({ ...prev, divinityLevel: null }));
            }}
          >
            {characters?.map(({ name }, index) => <MenuItem key={name} value={index}>{name}</MenuItem>)}
          </TextField> : null}
        </Stack>
        <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
          <TextField
            size={'small'}
            type={'number'}
            label={'Divinity level'}
            sx={{ width: 150 }}
            value={divinityLevel}
            onChange={handleOverride('divinityLevel')}
          />
          <TextField
            size={'small'}
            type={'number'}
            label={'BIG P level'}
            sx={{ width: 150 }}
            value={bigPLevel}
            onChange={handleOverride('bigPLevel')}
          />
          <TextField
            size={'small'}
            type={'number'}
            label={'Coral Kid level'}
            sx={{ width: 150 }}
            value={coralKidLevel}
            onChange={handleOverride('coralKidLevel')}
          />
          <Divider orientation={'vertical'} flexItem sx={{ display: { xs: 'none', sm: 'block' } }}/>
          <TextField
            size={'small'}
            type={'number'}
            label={isTalentTarget ? 'Target talent LV' : 'Target bonus'}
            sx={{ width: 170 }}
            value={target}
            onChange={handleOverride('target')}
          />
        </Stack>
        <Divider/>
        <Stack gap={0.5}>
          <Typography>
            Current bonus: <strong>{currentBonus.toFixed(2)}</strong>
            {isTalentTarget ? ` (+${numberWithCommas(Math.ceil(currentBonus))} talent LV)` : null}
          </Typography>
          <Typography variant={'body2'}>
            Divinity levels alone top out at {getMinorDivinityBonusCap(inputs).toFixed(2)}
            {isTalentTarget ? ` (+${numberWithCommas(Math.ceil(getMinorDivinityBonusCap(inputs)))} talent LV)` : null}
          </Typography>
          <Typography variant={'caption'}>{cleanUnderscore(gods?.[godSlot]?.minorBonus?.replace(/{/g, ''))}</Typography>
        </Stack>
        <Divider/>
        {reached
          ? <Typography color={'success.main'}>
            Already there: {currentBonus.toFixed(2)} clears {numberWithCommas(targetBonus)}.
          </Typography>
          : <Stack gap={1}>
            <Typography variant={'body2'} sx={{ maxWidth: 600 }}>
              {isTalentTarget
                ? `+${numberWithCommas(target)} talent LV needs a bonus above ${numberWithCommas(targetBonus)}. Each line raises one thing, the others unchanged.`
                : `Needs a bonus above ${numberWithCommas(targetBonus)}. Each line raises one thing, the others unchanged.`}
            </Typography>
            {requirements.map(({ label, current, required, note }) => <Typography key={label} variant={'body2'}>
              {label}: {required === null
              ? <span>out of reach{note ? ` (${note})` : ''}</span>
              : <strong>{numberWithCommas(required)}</strong>}
              {required === null ? null : ` (you have ${numberWithCommas(current)}, +${numberWithCommas(Math.max(0, required - current))})`}
            </Typography>)}
            {coralKidOnly && coralKidFloor !== null ? <Typography variant={'body2'} color={'warning.main'}
                                                                 sx={{ maxWidth: 600 }}>
              Only Coral Kid can get there, and never below level {numberWithCommas(coralKidFloor)}.
            </Typography> : null}
          </Stack>}
      </Stack>
    </CardContent>
  </Card>;
};

export default MinorBonusCalculator;
