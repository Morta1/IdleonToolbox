import React from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { commaNotation, notateNumber, prefix } from '@utility/helpers';
import HtmlTooltip from '@components/Tooltip';

const place = ({ col, row, colSpan = 1, rowSpan = 1 }) => ({
  gridColumn: `${col + 1} / span ${colSpan}`,
  gridRow: `${row + 1} / span ${rowSpan}`
});

// The game's corner glyphs, in the order it draws them.
const MARKERS = [
  { key: 'speed', icon: 'etc/JellySpeedArrow.png', label: 'Sped up by an adjacent Organelle' },
  { key: 'star', icon: 'etc/JellyStar.png', label: 'Touching a Virus' },
  { key: 'proximity', icon: 'etc/JellyProximity.png', label: 'Next to the obstruction' }
];

// The game's hover panel prints the full comma-separated DPS.
const formatDps = (dps) => dps < 1e15 ? commaNotation(Math.floor(dps)) : notateNumber(dps, 'Big');

const UnitTooltip = ({ cell, unit }) => {
  const boosts = [
    unit?.speedBoost > 1 ? { icon: 'etc/JellySpeedArrow.png', text: `Organelle: ${notateNumber(unit.speedBoost, 'MultiplierInfo')}x SPD` } : null,
    unit?.proximityBoost > 1 ? {
      icon: 'etc/JellyProximity.png',
      text: `Obstruction: ${notateNumber(unit.proximityBoost, 'MultiplierInfo')}x DMG and SPD`
    } : null,
    unit?.stars > 0 ? {
      icon: 'etc/JellyStar.png',
      text: `Virus: ${unit.stars} star${unit.stars === 1 ? '' : 's'} here (+${notateNumber(unit.stars / 10, 'MultiplierInfo')}x DMG to all cells)`
    } : null
  ].filter(Boolean);
  return (
    <Stack gap={0.5}>
      <Typography variant="subtitle2">{cell?.name}</Typography>
      <Typography variant="body2">DPS: {formatDps(cell?.dps ?? 0)}</Typography>
      {cell?.passive ? <Typography variant="body2">Passive: {cell.passive}</Typography> : null}
      {cell?.effect ? <Typography variant="body2">{cell.effect}</Typography> : null}
      {boosts.length > 0 ? <>
        <Divider sx={{ my: 0.5 }}/>
        <Typography variant="body2" color="text.secondary">Boosted by:</Typography>
        {boosts.map(({ icon, text }) => (
          <Stack key={text} direction="row" alignItems="center" gap={0.75}>
            <img src={`${prefix}${icon}`} alt="" style={{ width: 10, height: 'auto' }}/>
            <Typography variant="body2">{text}</Typography>
          </Stack>
        ))}
        {unit?.dps !== cell?.dps ? <Typography variant="body2">Boosted DPS: {formatDps(unit.dps)}</Typography> : null}
      </> : null}
    </Stack>
  );
};

const Layout = ({ layout, cells }) => {
  const {
    columns = 18,
    rows = 10,
    theme = 0,
    openSlots = [],
    units = [],
    markers = [],
    passives,
    boss
  } = layout || {};
  const open = new Set(openSlots);
  const bossCells = new Set();
  if (boss) {
    for (let r = boss.row; r < boss.row + boss.rowSpan; r++) {
      for (let c = boss.col; c < boss.col + boss.colSpan; c++) bossCells.add(r * columns + c);
    }
  }
  const tiles = Array.from({ length: columns * rows }, (_, slot) => slot).filter((slot) => !bossCells.has(slot));
  const showPassives = passives && (passives.damage > 1 || passives.speed > 1 || passives.stars > 0);

  return (
    <Stack gap={1.5} sx={{ width: '100%', maxWidth: 760 }}>
      {showPassives ? (
        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">Total passives:</Typography>
          <Typography variant="body2">{notateNumber(passives.damage, 'MultiplierInfo')}x DMG</Typography>
          <Typography variant="body2">{notateNumber(passives.speed, 'MultiplierInfo')}x SPD</Typography>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <img src={`${prefix}etc/JellyStar.png`} alt="Stars" style={{ height: 14 }}/>
            <Typography variant="body2">
              {passives.stars} (+{notateNumber(passives.stars / 10, 'MultiplierInfo')}x DMG)
            </Typography>
          </Stack>
        </Stack>
      ) : null}
      <Box sx={{
        backgroundImage: `url(${prefix}data/JellyBG_${theme}.png)`,
        backgroundSize: '100% 100%',
        pt: '7%',
        px: '3%',
        pb: '4%'
      }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, auto)`
        }}>
          {tiles.map((slot) => (
            <Box key={`tile-${slot}`} sx={{ ...place({ col: slot % columns, row: Math.floor(slot / columns) }), aspectRatio: '1' }}>
              <img
                src={`${prefix}data/JellySq${open.has(slot) ? 0 : 1}_${theme}.png`}
                alt=""
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </Box>
          ))}
          {boss ? (
            <Stack sx={{ ...place(boss), zIndex: 1, p: '8%' }} alignItems="center" justifyContent="center" gap={0.5}>
              {boss.index !== null ? <>
                <img
                  src={`${prefix}data/JellyOp${boss.index}.png`}
                  alt={boss.name}
                  style={{ width: '65%', objectFit: 'contain' }}
                />
                <Stack alignItems="center" sx={{ bgcolor: 'rgba(0, 0, 0, 0.65)', borderRadius: 1, px: 1, py: 0.25 }}>
                  <Typography variant="caption" sx={{ color: '#fff', lineHeight: 1.2, textAlign: 'center' }}>
                    {boss.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#ff8a80', fontWeight: 600, lineHeight: 1.2 }}>
                    {notateNumber(boss.hp, 'Big')} HP
                  </Typography>
                </Stack>
              </> : <Typography variant="caption">All obstructions removed</Typography>}
            </Stack>
          ) : null}
          {units.map((unit) => (
            <Box key={`unit-${unit.slot}`} sx={{ ...place(unit), zIndex: 2, p: '4%', pointerEvents: 'none' }}>
              <img
                src={`${prefix}data/JellyUnit${unit.type}.png`}
                alt={unit.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </Box>
          ))}
          {/* Hover targets follow each cell's footprint, so nothing hides under a neighbour's sprite. */}
          {units.flatMap((unit) => (unit.footprint ?? [unit]).map((cell) => (
            <HtmlTooltip key={`hit-${unit.slot}-${cell.col}-${cell.row}`} title={<UnitTooltip cell={cells?.[unit.type]} unit={unit}/>}>
              <Box sx={{ ...place(cell), zIndex: 4, cursor: 'pointer' }}/>
            </HtmlTooltip>
          )))}
          {markers.map((marker) => (
            <Stack
              key={`marker-${marker.slot}`}
              direction="row"
              sx={{ ...place(marker), zIndex: 3, pointerEvents: 'none', alignSelf: 'start', justifySelf: 'start', p: '6%' }}
            >
              {MARKERS.filter(({ key }) => marker[key]).map(({ key, icon, label }) => (
                <img key={key} src={`${prefix}${icon}`} alt={label} style={{ width: 9, height: 'auto', display: 'block' }}/>
              ))}
            </Stack>
          ))}
        </Box>
      </Box>
    </Stack>
  );
};

export default Layout;
