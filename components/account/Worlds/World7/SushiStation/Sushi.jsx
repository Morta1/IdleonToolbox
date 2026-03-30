import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { commaNotation, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';

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

const Sushi = ({ slots, knowledge, fireplaces }) => {
  if (!slots || slots.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">No sushi data available</Typography>
      </Box>
    );
  }

  const filledSlots = slots.filter((s) => s.tier >= 0).length;

  return (
    <Stack gap={3}>
      {/* Sushi Grid - 15 columns x 8 rows */}
      <Typography variant="body2" color="text.secondary" mb={0.5}>
        {filledSlots} / 120 slots filled
      </Typography>
      <Box sx={{
        backgroundColor: '#1a2a1a',
        border: '2px solid #3a5a3a',
        borderRadius: 1,
        overflow: 'hidden',
        width: 'fit-content',
        p: '2px'
      }}>
        {/* Sushi slots grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(15, 42px)',
          gridTemplateRows: 'repeat(8, 42px)',
          gap: '2px'
        }}>
          {slots.slice(0, 120).map((slot, i) => {
            const isEmpty = slot.tier < 0;
            const hasSlotEffect = slot.slotEffect >= 0;
            const hasFireplace = slot.fireplaceType >= 0;
            const sushiName = !isEmpty ? (knowledge?.[slot.tier]?.name ?? `Tier ${slot.tier}`) : null;
            const tooltipContent = isEmpty
              ? `Slot ${i + 1}: Empty`
              : <Stack>
                <Typography variant="body2" fontWeight={600}>{sushiName} (Tier {slot.tier})</Typography>
                <Typography variant="body2">Bucks/hr: {commaNotation(Math.floor(slot.currencyPerSlot))}</Typography>
                {slot.fireplaceType === 0 &&
                  <Typography variant="body2">Fuel gen: +{slot.tier + 1}% (Charcoal)</Typography>}
                {hasSlotEffect && <Typography
                  variant="body2">{SLOT_EFFECT_NAMES[slot.slotEffect]}: {SLOT_EFFECT_DESCS[slot.slotEffect]}</Typography>}
                {hasFireplace
                  ? <Typography variant="body2"
                                color="warning.main">Fireplace: {FIREPLACE_NAMES[slot.fireplaceType]}</Typography>
                  : <Typography variant="body2" color="text.disabled">No fireplace</Typography>}
              </Stack>;
            return (
              <Tooltip key={i} title={tooltipContent}>
                <Box sx={{
                  width: 42,
                  height: 42,
                  backgroundImage: hasSlotEffect
                    ? `url(${prefix}data/SushiSlot${slot.slotEffect}.png)`
                    : 'none',
                  backgroundSize: '100% 100%',
                  backgroundColor: hasSlotEffect ? 'transparent' : '#2a3e2a',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {!isEmpty && (
                    <img
                      src={`${prefix}data/Sushi${slot.tier}.png`}
                      alt={`Tier ${slot.tier}`}
                      style={{ width: 34, height: 34, objectFit: 'contain' }}
                    />
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
        {/* Fireplace row */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(15, 42px)',
          gap: '2px',
          mt: '4px'
        }}>
          {fireplaces?.map((fp, i) => (
            <Tooltip key={i} title={fp.active ? FIREPLACE_NAMES[fp.type] : ''}>
              <Box sx={{
                width: 42,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {fp.active && (
                  <img
                    src={`${prefix}etc/Charfire${fp.type}.gif`}
                    alt={FIREPLACE_NAMES[fp.type]}
                    style={{ width: 32, height: 32, objectFit: 'contain' }}
                  />
                )}
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Legends */}
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
        <Card variant="outlined" sx={{ width: 'fit-content' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="body2" fontWeight={600} mb={1}>Fireplaces</Typography>
            <Stack gap={1}>
              {FIREPLACE_NAMES.map((name, i) => (
                <Stack key={i} direction="row" gap={1} alignItems="center">
                  <img
                    src={`${prefix}etc/Charfire${i}.gif`}
                    alt={name}
                    style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }}
                  />
                  <Stack>
                    <Typography variant="body2" fontWeight={500}>{name}</Typography>
                    <Typography variant="caption" color="text.secondary">{FIREPLACE_DESCS[i]}</Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ width: 'fit-content' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="body2" fontWeight={600} mb={1}>Slots</Typography>
            <Stack gap={1}>
              {SLOT_EFFECT_NAMES.slice(1).map((name, i) => (
                <Stack key={i} direction="row" gap={1} alignItems="center">
                  <img
                    src={`${prefix}data/SushiSlot${i + 1}.png`}
                    alt={name}
                    style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }}
                  />
                  <Stack>
                    <Typography variant="body2" fontWeight={500}>{name}</Typography>
                    <Typography variant="caption" color="text.secondary">{SLOT_EFFECT_DESCS[i + 1]}</Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>


    </Stack>
  );
};

export default Sushi;
