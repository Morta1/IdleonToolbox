import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, msToDate, notateNumber, prefix } from '@utility/helpers';
import { CURRENCY_NAMES } from '@parsers/world-5/caverns/the-fountain';
import { IconHierarchy3, IconInfoCircleFilled, IconList } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const NODE = 56;
const PAD = 36;
const SCALE = 1.4; // spread the graph out vs the in-game compact layout

const CostWithIcon = ({ upgrade }) => (
  <Stack direction={'row'} alignItems={'center'} gap={0.5}>
    <Typography variant={'caption'}>Cost: {notateNumber(upgrade.cost, 'Big')}</Typography>
    <img
      src={`${prefix}data/HoleFountainCoin${upgrade.currencyType}.png`}
      width={32} height={32}
      style={{ objectFit: 'contain', marginTop: -10 }}
      alt={CURRENCY_NAMES[upgrade.currencyType] ?? `currency-${upgrade.currencyType}`}/>
  </Stack>
);

const parsePos = (position) => {
  if (!position || typeof position !== 'string' || !position.includes(',')) {
    return null;
  }
  const [x, y] = position.split(',').map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
};

const UpgradeTooltip = ({ upgrade, water }) => {
  const dependentNames = (upgrade.unlocks || [])
    .map((idx) => cleanUnderscore(water.upgrades[idx]?.name ?? ''))
    .filter(Boolean);
  return (
    <Stack sx={{ p: 0.5, maxWidth: 320 }} gap={0.5}>
      <Typography variant={'body2'} sx={{ fontWeight: 'bold' }}>
        {cleanUnderscore(upgrade.name)}
      </Typography>
      <Typography variant={'caption'} color={'text.secondary'}>
        Lv {upgrade.level}
        {upgrade.marbleTier > 0 ? ` · Marble ×${upgrade.marbleMulti}` : ''}
      </Typography>
      {!upgrade.unlocked && upgrade.prereqName ? (
        <Typography variant={'caption'} color={'warning.light'}>
          Requires: {cleanUnderscore(upgrade.prereqName)} {upgrade.prereqCurrentLevel}/{upgrade.prereqRequiredLevel}
        </Typography>
      ) : null}
      <Typography variant={'caption'}>
        {cleanUnderscore(upgrade.description)}
      </Typography>
      <CostWithIcon upgrade={upgrade}/>
      {dependentNames.length > 0 ? (
        <Typography variant={'caption'} color={'text.secondary'}>
          Unlocks at Lv 10: {dependentNames.join(', ')}
        </Typography>
      ) : null}
    </Stack>
  );
};

const FountainGraph = ({ water, t }) => {
  const nodes = water.upgrades.map((u) => ({ ...u, pos: parsePos(u.position) }));
  const positioned = nodes.filter((n) => n.pos !== null);

  const wrapperRef = useRef(null);
  const [wrapperWidth, setWrapperWidth] = useState(0);
  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setWrapperWidth(entry.contentRect.width);
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  if (positioned.length === 0) return null;

  const xs = positioned.map((n) => n.pos.x);
  const ys = positioned.map((n) => n.pos.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const width = (maxX - minX) * SCALE + PAD * 2 + NODE;
  const height = (maxY - minY) * SCALE + PAD * 2 + NODE + 14;

  // On screens narrower than the natural graph width, scale the whole graph down to fit.
  const fitScale = wrapperWidth > 0 ? Math.min(1, wrapperWidth / width) : 1;
  const scaledHeight = height * fitScale;

  const nodeAt = (idx) => nodes[idx]?.pos
    ? {
      x: (nodes[idx].pos.x - minX) * SCALE + PAD,
      y: (nodes[idx].pos.y - minY) * SCALE + PAD
    }
    : null;

  return (
    <Box ref={wrapperRef} sx={{ width: '100%', height: scaledHeight, mt: 1 }}>
      <Box sx={{
        position: 'relative',
        width,
        height,
        transformOrigin: 'top left',
        transform: `scale(${fitScale})`
      }}>
        <svg width={width} height={height}
             style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          <defs>
            <marker id={`arrow-${t}-on`} viewBox={'0 0 10 10'} refX={9} refY={5}
                    markerWidth={6} markerHeight={6} orient={'auto'}>
              <path d={'M0,0 L10,5 L0,10 z'} fill={'#4caf50'}/>
            </marker>
            <marker id={`arrow-${t}-off`} viewBox={'0 0 10 10'} refX={9} refY={5}
                    markerWidth={6} markerHeight={6} orient={'auto'}>
              <path d={'M0,0 L10,5 L0,10 z'} fill={'#888'}/>
            </marker>
          </defs>
          {nodes.map((n) => {
            if (n.prereqIndex === -1) return null;
            const from = nodeAt(n.prereqIndex);
            const to = nodeAt(n.index);
            if (!from || !to) return null;
            const fromX = from.x + NODE / 2;
            const fromY = from.y + NODE / 2;
            const toX = to.x + NODE / 2;
            const toY = to.y + NODE / 2;
            const dx = toX - fromX;
            const dy = toY - fromY;
            const len = Math.sqrt(dx * dx + dy * dy);
            const k = len > 0 ? (NODE / 2 + 4) / len : 0;
            const x1 = fromX + dx * k;
            const y1 = fromY + dy * k;
            const x2 = toX - dx * k;
            const y2 = toY - dy * k;
            return (
              <line key={`line-${t}-${n.index}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={n.unlocked ? '#4caf50' : '#888'}
                    strokeWidth={2}
                    strokeOpacity={n.unlocked ? 0.9 : 0.5}
                    strokeDasharray={n.unlocked ? '0' : '5 3'}
                    markerEnd={`url(#arrow-${t}-${n.unlocked ? 'on' : 'off'})`}/>
            );
          })}
        </svg>
        {nodes.map((u) => {
          if (!u.pos) return null;
          const np = nodeAt(u.index);
          const maxed = u.level >= u.maxLevel;
          return (
            <Tooltip key={`upg-${t}-${u.index}`} title={<UpgradeTooltip upgrade={u} water={water}/>}
                     arrow placement={'top'}>
              <Box sx={{
                position: 'absolute',
                left: np.x,
                top: np.y,
                width: NODE,
                height: NODE + 14,
                opacity: u.unlocked ? 1 : 0.45,
                cursor: 'help',
                filter: maxed ? 'drop-shadow(0 0 4px rgba(255,200,0,0.8))' : 'none'
              }}>
                <img
                  src={`${prefix}data/HoleFountainUpg${t}_${u.index}.png`}
                  width={NODE} height={NODE} style={{ objectFit: 'contain' }}
                  alt={`upg-${t}-${u.index}`}/>
                <Typography sx={{
                  position: 'absolute',
                  bottom: -2,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontSize: 11,
                  lineHeight: 1,
                  fontWeight: 'bold',
                  textShadow: '0 0 3px rgba(0,0,0,0.9)'
                }}>
                  Lv {u.level}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

const groupByDepth = (upgrades) => {
  const map = new Map();
  for (const u of upgrades) {
    const arr = map.get(u.depth) ?? [];
    arr.push(u);
    map.set(u.depth, arr);
  }
  return [...map.entries()].sort(([a], [b]) => a - b);
};

const FountainList = ({ water, t }) => {
  const groups = groupByDepth(water.upgrades);
  return (
    <Box
      sx={{
        mt: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 2,
        alignItems: 'flex-start'
      }}>
      {groups.map(([depth, ups]) => (
        <Stack key={`tier-${t}-${depth}`}>
          <Typography variant={'overline'} color={'text.secondary'} sx={{ mb: 0.5 }}>
            {depth === 0 ? 'Starting upgrades' : `Tier ${depth + 1}`}
          </Typography>
          <Stack gap={1}>
            {ups.map((u) => (
              <Card key={`upg-${t}-${u.index}`} sx={{ opacity: u.unlocked ? 1 : 0.55 }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, width: 220 }}>
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <img
                      src={`${prefix}data/HoleFountainUpg${t}_${u.index}.png`}
                      style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
                      alt={`upg-${t}-${u.index}`}/>
                    <Stack sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant={'caption'} sx={{ fontWeight: 'bold', lineHeight: 1.2 }}
                                  noWrap>
                        {cleanUnderscore(u.name)}
                      </Typography>
                      <Typography variant={'caption'} color={'text.secondary'} sx={{ lineHeight: 1.2 }}>
                        Lv {u.level}
                        {u.marbleTier > 0 ? ` · Marble ×${u.marbleMulti}` : ''}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography variant={'caption'} sx={{ display: 'block', mt: 0.5, lineHeight: 1.3 }}>
                    {cleanUnderscore(u.description)}
                  </Typography>
                  <Stack direction={'row'} alignItems={'center'} sx={{ mt: 0.5 }}>
                    <CostWithIcon upgrade={u}/>
                  </Stack>
                  {!u.unlocked && u.prereqName ? (
                    <Chip
                      label={`${cleanUnderscore(u.prereqName)} ${u.prereqCurrentLevel}/${u.prereqRequiredLevel}`}
                      size={'small'} color={'warning'} variant={'outlined'}
                      sx={{ mt: 0.5, height: 18, fontSize: 10 }}/>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      ))}
    </Box>
  );
};

const TheFountain = ({ hole }) => {
  const fountain = hole?.caverns?.theFountain;
  const [view, setView] = useState('graph');
  if (!fountain) return null;
  const visibleWaters = fountain.waters.filter((w) => w.implemented);

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Marble Currency'} value={commaNotation(fountain.marbleCurrency)}/>
      <CardTitleAndValue
        title={'Max coins'}
        value={
          <Stack direction={'row'} alignItems={'center'} gap={0.5} component={'span'}>
            <span>{fountain.spacesOwned * fountain.maxStackSize}</span>
            <Tooltip
              title={`${fountain.spacesOwned} spaces × ${fountain.maxStackSize} per stack — the most coins that can sit on the floor before they auto-collect.`}>
              <IconInfoCircleFilled size={14}/>
            </Tooltip>
          </Stack>
        }/>
      {fountain.currencies.map((c) => (
        <CardTitleAndValue
          key={`cur-${c.type}`}
          title={c.name}
          icon={`data/HoleFountainCoin${c.type}.png`}
          imgStyle={{ width: 28, height: 28, marginTop: -10 }}
          value={notateNumber(c.amount, 'Big')}/>
      ))}

    </Stack>
    {fountain.fountainBars.length > 0 ? (
      <CardTitleAndValue title={'Active fountain bars'} cardSx={{ mt: 2 }}>
        <Stack gap={1.5} sx={{ minWidth: 280 }}>
          {fountain.fountainBars.map((bar) => (
            <Stack key={`bar-${bar.tier}`} gap={0.5}>
              <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                  <Typography variant={'caption'} sx={{ fontWeight: 'bold' }}>
                    {bar.name}
                  </Typography>
                  <Tooltip title={bar.description}>
                    <IconInfoCircleFilled size={14} style={{ cursor: 'help', opacity: 0.7 }}/>
                  </Tooltip>
                </Stack>
                <Typography variant={'caption'} color={'text.secondary'}>
                  {commaNotation(bar.progress)} / {commaNotation(bar.req)}
                </Typography>
              </Stack>
              <LinearProgress
                variant={'determinate'}
                sx={{ height: 8, borderRadius: 4 }}
                value={Math.max(0, Math.min(100, (bar.progress / bar.req) * 100))}/>
              <Stack direction={'row'} flexWrap={'wrap'} columnGap={2} rowGap={0}>
                <Typography variant={'caption'} color={'text.secondary'}>
                  Time to full:&nbsp;{msToDate(bar.timeToFullMs)}
                </Typography>
                <Typography variant={'caption'} color={'text.secondary'} sx={{ cursor: 'help' }}>
                  Full cycle:&nbsp;{msToDate(bar.timeFullCycleMs)}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </CardTitleAndValue>
    ) : null}
    <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mt: 2 }}>
      <ToggleButtonGroup
        value={view}
        exclusive
        sx={{ ml: 'auto' }}
        size={'small'}
        onChange={(_, v) => v && setView(v)}>
        <Tooltip arrow title={'Graph view'}>
          <ToggleButton value={'graph'} aria-label={'graph view'}>
            <IconHierarchy3 size={18}/>
          </ToggleButton>
        </Tooltip>
        <Tooltip arrow title={'List view'}>
          <ToggleButton value={'list'} aria-label={'list view'}>
            <IconList size={18}/>
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    {visibleWaters.map((water, idx) => {
      const t = water.tier;
      const isLast = idx === visibleWaters.length - 1;
      return (
        <Stack key={`water-${t}`} sx={{ mb: 3 }}>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <Typography variant={'h6'}>{water.name} Water</Typography>
            {!water.unlocked
              ? <Typography variant={'caption'} color={'text.secondary'}>(Locked)</Typography>
              : null}
          </Stack>
          {view === 'graph'
            ? <FountainGraph water={water} t={t}/>
            : <FountainList water={water} t={t}/>}
          {!isLast ? <Divider sx={{ mt: 2 }}/> : null}
        </Stack>
      );
    })}
  </>;
};

export default TheFountain;
