import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { formatNum, prefix } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';

const SLOT_EFFECT_NAMES = ['Regular', 'Hot Slot', 'Cold Slot', 'Milktoast Slot'];
const SLOT_EFFECT_DESCS = ['No bonus', '+Bucks generated', '+Knowledge XP for all lower-tiered sushi',
  '+Knowledge XP for this sushi'];
const FIREPLACE_NAMES = ['Charcoal', 'Barium', 'Copper', 'Lithium', 'Potassium'];
const FIREPLACE_DESCS = [
  '+Fuel gen per tier',
  '+Bucks generated',
  '+Tier up chance',
  '+Knowledge XP',
  '+Sparks/sec'
];

// The game's board: 15 columns of 8 slots, a fireplace under each column. Decision 7: every visitor sees the whole
// board, filled from the save where it has slots (the parser builds them from the save; Leftovers).
const COLUMNS = 15;
const SLOT_COUNT = 120;
const EMPTY_SLOT = { tier: -1, slotEffect: -1, fireplaceType: -1, currencyPerSlot: 0 };

// A filled slot's details, a tap or a click away (Decision 5: the board stays the game's picture)
const slotNote = (slot, sushiName) => <Stack gap={0.5}>
  <Typography variant={'body2'}>{sushiName} (Tier {slot.tier + 1})</Typography>
  <Panel.KV label={'Bucks per hour'} value={formatGame(Math.floor(slot.currencyPerSlot ?? 0), 'SushiStuff.CurrencyperHR')}/>
  {slot.fireplaceType === 0 ? <Panel.KV label={'Fuel gen'} value={`+${slot.tier + 1}% (Charcoal)`}/> : null}
  {slot.slotEffect >= 0 ? <Panel.KV label={SLOT_EFFECT_NAMES[slot.slotEffect]} value={SLOT_EFFECT_DESCS[slot.slotEffect]}/> : null}
  <Panel.KV label={'Fireplace'} value={slot.fireplaceType >= 0 ? FIREPLACE_NAMES[slot.fireplaceType] : 'None'}/>
</Stack>;

const Sushi = ({ slots, knowledge, fireplaces }) => {
  const board = Array.from({ length: SLOT_COUNT }, (_, i) => slots?.[i] ?? EMPTY_SLOT);
  const hearths = Array.from({ length: COLUMNS }, (_, i) => fireplaces?.[i] ?? { index: i, type: -1, active: false });
  const filled = board.filter((slot) => slot.tier >= 0).length;

  return (
    <Stack gap={3}>
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        <StatTile label={'Slots filled'} value={`${formatNum(filled)} / ${formatNum(SLOT_COUNT)}`}/>
      </Stack>
      {/* The 15-wide grid keeps the game's layout; on a phone it scrolls on its own instead of widening the page */}
      <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Box sx={{
          bgcolor: 'identity.sushi.board',
          border: 2,
          borderColor: 'identity.sushi.edge',
          borderRadius: 1,
          overflow: 'hidden',
          width: 'fit-content',
          p: '2px'
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLUMNS}, 42px)`,
            gridTemplateRows: 'repeat(8, 42px)',
            gap: '2px'
          }}>
            {board.map((slot, i) => {
              const isEmpty = slot.tier < 0;
              const hasSlotEffect = slot.slotEffect >= 0;
              const sushiName = isEmpty ? null : (knowledge?.[slot.tier]?.name ?? `Tier ${slot.tier}`);
              const box = <Box sx={{
                width: 42,
                height: 42,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: hasSlotEffect ? `url(${prefix}data/SushiSlot${slot.slotEffect}.png)` : 'none',
                backgroundSize: '100% 100%',
                bgcolor: hasSlotEffect ? 'transparent' : 'identity.sushi.slot'
              }}>
                {isEmpty ? null : <GameIcon src={`data/Sushi${slot.tier}.png`} size={32} fit={'canvas'} alt={''}/>}
              </Box>;
              // An empty slot has nothing to say beyond being empty, so it is no stop
              return isEmpty
                ? <Box key={i}>{box}</Box>
                : <NoteTrigger key={i} note={slotNote(slot, sushiName)} label={`${sushiName}, slot ${i + 1}`}>{box}</NoteTrigger>;
            })}
          </Box>
          {/* The fireplaces: a lit one's name is its alt and the legend's */}
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${COLUMNS}, 42px)`, gap: '2px', mt: '4px' }}>
            {hearths.map((fp, i) => (
              <Box key={i} sx={{ width: 42, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {fp.active ? <GameIcon src={`etc/Charfire${fp.type}.gif`} size={32} fit={'canvas'} alt={FIREPLACE_NAMES[fp.type]}/> : null}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={'flex-start'}>
        <Panel title={'Fireplaces'}>
          {FIREPLACE_NAMES.map((name, i) => <Panel.Row key={name} icon={`etc/Charfire${i}.gif`} name={name} sub={FIREPLACE_DESCS[i]}/>)}
        </Panel>
        <Panel title={'Slots'}>
          {SLOT_EFFECT_NAMES.slice(1).map((name, i) => <Panel.Row key={name} icon={`data/SushiSlot${i + 1}.png`} name={name}
                                                                  sub={SLOT_EFFECT_DESCS[i + 1]}/>)}
        </Panel>
      </Stack>
    </Stack>
  );
};

export default Sushi;
