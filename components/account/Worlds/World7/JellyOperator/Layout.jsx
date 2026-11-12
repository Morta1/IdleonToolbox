import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { formatNum, prefix } from '@utility/helpers';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';
import Num from '@components/common/Num';
import { NoteTrigger } from '@components/common/InfoButton';
import { ON_ART } from '@utility/colorSets';

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

// A placed cell's details, a tap or a click away (Decision 5). DPS is the game's cell card, one format with the Cells
// tab; the boosted one is the board's own number, which the game doesn't print, so the amount kind.
const UnitNote = ({ cell, unit }) => {
  const boosts = [
    unit?.speedBoost > 1 ? { icon: 'etc/JellySpeedArrow.png', text: `Organelle: ${formatNum(unit.speedBoost, 'mult')} SPD` } : null,
    unit?.proximityBoost > 1 ? {
      icon: 'etc/JellyProximity.png',
      text: `Obstruction: ${formatNum(unit.proximityBoost, 'mult')} DMG and SPD`
    } : null,
    unit?.stars > 0 ? {
      icon: 'etc/JellyStar.png',
      text: `Virus: ${unit.stars} ${unit.stars === 1 ? 'star' : 'stars'} here (${formatNum(unit.stars / 10, 'mult', { signed: true })} DMG to all cells)`
    } : null
  ].filter(Boolean);
  return (
    <Stack gap={0.5}>
      <Typography variant={'body2'}>{cell?.name}</Typography>
      <Panel.KV label={'DPS'} value={cell?.dps ?? 0} kind={{ game: 'JellyOperation.CellDPS' }}/>
      {cell?.passive ? <Panel.KV label={'Passive'} value={cell.passive}/> : null}
      {cell?.effect ? <Typography variant={'body2'}>{cell.effect}</Typography> : null}
      {boosts.length > 0 ? <>
        <Typography variant={'body2'} color={'text.secondary'}>Boosted by</Typography>
        {boosts.map(({ icon, text }) => (
          <Stack key={text} direction={'row'} alignItems={'center'} gap={0.75}>
            <GameIcon src={icon} size={16} alt={''}/>
            <Typography variant={'body2'}>{text}</Typography>
          </Stack>
        ))}
        {unit?.dps !== cell?.dps ? <Panel.KV label={'Boosted DPS'} value={formatNum(unit?.dps ?? 0)}/> : null}
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
        <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
          <StatTile label={'Passive damage'} icon={'etc/JellyPassiveDamage.png'} value={<Num value={passives.damage} game={'JellyOperation.UnitSumAtk'} unit={'x'}/>}/>
          <StatTile label={'Passive speed'} icon={'etc/JellyPassiveSpeed.png'} value={<Num value={passives.speed} game={'JellyOperation.UnitSumAtkCD'} unit={'x'}/>}/>
          <StatTile label={'Virus stars'} icon={'etc/JellyPassiveStar.png'} value={formatNum(passives.stars)}
                    sub={`${formatNum(passives.stars / 10, 'mult', { signed: true })} DMG`}/>
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
          {/* The plate sits out of the flow inside its footprint, so it never sets the rows' heights: at 384 its caption
              stretched rows 4 to 7. The sprite gives up height to the caption. */}
          {boss ? <Box sx={{ ...place(boss), position: 'relative', zIndex: 1 }}>
            <Stack sx={{ position: 'absolute', inset: 0, p: '8%' }} alignItems="center" justifyContent="center" gap={0.5}>
              {boss.index !== null ? <>
                <img
                  src={`${prefix}data/JellyOp${boss.index}.png`}
                  alt={boss.name}
                  style={{ width: '65%', minHeight: 0, flex: '0 1 auto', objectFit: 'contain' }}
                />
                <Stack data-on-art alignItems="center" sx={{ bgcolor: ON_ART.plate, borderRadius: 1, px: 1, py: 0.25 }}>
                  <Typography variant="caption" sx={{ color: ON_ART.text, lineHeight: 1.2, textAlign: 'center' }}>
                    {boss.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: ON_ART.error, lineHeight: 1.2 }}>
                    {formatNum(boss.hp ?? 0)} HP
                  </Typography>
                </Stack>
              </> : <Typography variant="caption">All obstructions removed</Typography>}
            </Stack>
          </Box> : null}
          {units.map((unit) => (
            <Box key={`unit-${unit.slot}`} sx={{ ...place(unit), zIndex: 2, p: '4%', pointerEvents: 'none' }}>
              <img
                src={`${prefix}data/JellyUnit${unit.type}.png`}
                alt={unit.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </Box>
          ))}
          {/* The triggers follow each cell's footprint, so nothing hides under a neighbour's sprite; a tap, a click or
              Enter pins the cell's details */}
          {units.flatMap((unit) => (unit.footprint ?? [unit]).map((cell) => (
            <Box key={`hit-${unit.slot}-${cell.col}-${cell.row}`} sx={{ ...place(cell), zIndex: 4, display: 'grid' }}>
              <NoteTrigger block note={<UnitNote cell={cells?.[unit.type]} unit={unit}/>} label={cells?.[unit.type]?.name ?? 'Cell'}>
                <Box sx={{ width: '100%', height: '100%' }}/>
              </NoteTrigger>
            </Box>
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
