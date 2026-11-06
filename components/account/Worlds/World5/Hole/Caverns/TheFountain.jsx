import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import StatusText from '@components/common/StatusText';
import { cleanUnderscore, formatNum, msToDate } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { CURRENCY_NAMES } from '@parsers/world-5/caverns/the-fountain';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';
import { DIM } from '@components/common/cards/tokens';
import InfoButton, { NoteTrigger } from '@components/common/InfoButton';
import ViewSwitch from '@components/common/ViewSwitch';
import { Duration } from '@components/common/Num';
import useToolbarState from '@hooks/useToolbarState';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

const NODE = 56;
const PAD = 36;
const SCALE = 1.4; // spread the graph out vs the in-game compact layout

// A phone opens on the list, the tree one tap away. A choice that differs from its width's default is stored, and a
// stored choice wins at any width.
const FOUNTAIN_VIEW = { view: 'graph' };
const FOUNTAIN_VIEW_PHONE = { view: 'list' };

// Each currency's balance reads like its costs (Holes.Cost_FountainUPG)
const currencyText = (value) => formatGame(value ?? 0, 'Holes.Cost_FountainUPG', { whole: true });

// "1 in N" (the game's own line, Holes2.Fount_DuckChance) rides after the percent only under 50%, and never beside a 0%
const duckText = (chance) => {
  const percent = formatNum(chance * 100, 'pct');
  return chance < 0.5 && percent !== '0%' ? `${percent} (${formatNum(chance, 'odds')})` : percent;
};

const parsePos = (position) => {
  if (!position || typeof position !== 'string' || !position.includes(',')) {
    return null;
  }
  const [x, y] = position.split(',').map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
};

// An upgrade's cost on the shared cost line: its coin named, the coins owned beside it
const upgradeCost = (upgrade, currencies) => <ItemCard.Cost icon={`data/HoleFountainCoin${upgrade?.currencyType}.png`}
  iconAlt={`${CURRENCY_NAMES[upgrade?.currencyType] ?? 'Fountain'} coin`} need={upgrade?.cost ?? 0}
  have={currencies?.find((currency) => currency.type === upgrade?.currencyType)?.amount} game={'Holes.Cost_FountainUPG'}/>;
const upgradeLevel = (upgrade) => `Lv ${formatNum(upgrade?.level ?? 0)}${upgrade?.marbleTier > 0
  ? ` · Marble ${formatNum(upgrade.marbleMulti, 'mult')}` : ''}`;
const upgradeNeeds = (upgrade) => (!upgrade?.unlocked && upgrade?.prereqName
  ? `Needs ${cleanUnderscore(upgrade.prereqName)} ${upgrade.prereqCurrentLevel}/${upgrade.prereqRequiredLevel}` : null);
// What an upgrade opens at Lv 10, by name
const opensNames = (upgrade, water) => (upgrade?.unlocks ?? [])
  .map((index) => cleanUnderscore(water?.upgrades?.[index]?.name ?? '')).filter(Boolean);
// An upgrade's details, once: the graph's note on a node
const upgradeNote = (upgrade, water, currencies) => <Stack gap={0.75} sx={{ maxWidth: 320 }}>
  <Typography variant={'body2'} component={'div'}>{cleanUnderscore(upgrade?.name)}</Typography>
  <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{upgradeLevel(upgrade)}</Typography>
  {upgradeNeeds(upgrade) ? <StatusText status={'locked'} wrap>{upgradeNeeds(upgrade)}</StatusText> : null}
  <ItemCard.Desc text={upgrade?.description}/>
  {upgradeCost(upgrade, currencies)}
  {opensNames(upgrade, water).length ? <Typography variant={'body2'} color={'text.secondary'} component={'div'}>
    {`Opens at Lv 10: ${opensNames(upgrade, water).join(', ')}`}</Typography> : null}
</Stack>;

const FountainGraph = ({ water, t, currencies }) => {
  const nodes = (water?.upgrades ?? []).map((u) => ({ ...u, pos: parsePos(u.position) }));
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

  // Decision 4: the game's tree, fitted to its box after load (a data page: the layout never runs in the export)
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
              <path d={'M0,0 L10,5 L0,10 z'} style={{ fill: 'var(--mui-palette-success-main)' }}/>
            </marker>
            <marker id={`arrow-${t}-off`} viewBox={'0 0 10 10'} refX={9} refY={5}
                    markerWidth={6} markerHeight={6} orient={'auto'}>
              <path d={'M0,0 L10,5 L0,10 z'} style={{ fill: 'var(--mui-palette-text-muted)' }}/>
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
                    style={{ stroke: n.unlocked ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-text-muted)' }}
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
          // A click, a tap or Enter pins the upgrade's details; a hover previews them
          return <Box key={`upg-${t}-${u.index}`} sx={{ position: 'absolute', left: np.x, top: np.y }}>
            <NoteTrigger block label={cleanUnderscore(u.name)} note={upgradeNote(u, water, currencies)}>
              <Box sx={{ position: 'relative', width: NODE, height: NODE + 14, opacity: u.unlocked ? 1 : DIM }}>
                <GameIcon src={`data/HoleFountainUpg${t}_${u.index}.png`} size={56} fit={'canvas'} alt={''}/>
                <Typography variant={'caption'} component={'div'} sx={{
                  position: 'absolute', bottom: -2, left: 0, right: 0, textAlign: 'center', lineHeight: 1,
                  // A short tag over game art: the page color behind its letters keeps it legible
                  textShadow: '0 0 3px var(--mui-palette-background-default)'
                }}>{`Lv ${formatNum(u.level ?? 0)}`}</Typography>
              </Box>
            </NoteTrigger>
          </Box>;
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

const FountainList = ({ water, t, currencies }) => <Stack gap={2} sx={{ mt: 1 }}>
  {groupByDepth(water?.upgrades ?? []).map(([depth, ups]) => <Stack key={`tier-${t}-${depth}`} gap={1}>
    <Typography variant={'groupLabel'} component={'div'} color={'text.secondary'}>
      {depth === 0 ? 'Starting upgrades' : `Tier ${depth + 1}`}
    </Typography>
    <CardGrid size={'s'}>
      {ups.map((u) => <ItemCard key={`upg-${t}-${u.index}`} icon={`data/HoleFountainUpg${t}_${u.index}.png`}
                                title={cleanUnderscore(u.name)} meta={upgradeLevel(u)}
                                status={u.unlocked ? undefined : 'locked'} footer={upgradeCost(u, currencies)}>
        {/* The header says Locked; what it waits on wraps here, where a long name has room */}
        {upgradeNeeds(u) ? <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{upgradeNeeds(u)}</Typography> : null}
        <ItemCard.Desc text={u.description}/>
      </ItemCard>)}
    </CardGrid>
  </Stack>)}
</Stack>;

const TheFountain = ({ hole, sectionFailed }) => {
  const fountain = hole?.caverns?.theFountain;
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [shown, setShown] = useToolbarState('hole-fountain', isPhone ? FOUNTAIN_VIEW_PHONE : FOUNTAIN_VIEW);
  const visibleWaters = (fountain?.waters ?? []).filter((w) => w?.implemented);
  const currencies = fountain?.currencies ?? [];
  const bars = fountain?.fountainBars ?? [];

  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Marbles'} value={formatGame(fountain?.marbleCurrency ?? 0, 'Save.FountainMarbles', { whole: true })}/>
      <StatTile label={'Max coins'} value={formatGame((fountain?.spacesOwned ?? 0) * (fountain?.maxStackSize ?? 0), 'Holes2.MaxCoinz', { whole: true })}
                info={`The most coins the floor holds before they collect themselves: ${formatGame(fountain?.spacesOwned ?? 0, 'Holes2.SpacesOwned', { whole: true })} spaces of ${formatGame(fountain?.maxStackSize ?? 0, 'Holes2.MaxStackSize', { whole: true })}.`}/>
      {currencies.map((currency) => <StatTile key={`cur-${currency.type}`} label={currency.name}
                                              icon={`data/HoleFountainCoin${currency.type}.png`}
                                              value={currencyText(currency.amount)}/>)}
      {opalsFoundTile(hole, 15)}
      <StatTile label={'Total fountain upgrades'} value={getHoleLeaderboardTotals(hole).fountainUpgrades} kind={'amount'}/>
    </Stack>
    {bars.length > 0 ? <Panel title={'Fountain bars'} sx={{ mb: 3 }}>
      {bars.map((bar) => <Stack key={`bar-${bar.tier}`} gap={1} sx={{ px: 2, py: 1.5 }}>
        <ItemCard.Progress label={<>{bar.name} <InfoButton label={bar.name}>{bar.description}</InfoButton></>} barLabel={bar.name}
                           value={bar.progress ?? 0} max={bar.req ?? 0} kind={'whole'}/>
        <ItemCard.Facts rows={[
          ['Time to full', <Duration key={'full'} seconds={(bar.timeToFullMs ?? 0) / 1000}/>],
          ['Full cycle', msToDate(bar.timeFullCycleMs ?? 0)],
          bar.tier === 0 && bar.activeMulti > 1 ? [<Fragment key={'active'}>Active fill <InfoButton label={'Active fill'}>The fill
            speed while a character stands in the Fountain cavern.</InfoButton></Fragment>, formatNum(bar.activeMulti, 'mult')] : null,
          bar.tier === 2 && bar.duckChance != null ? [<Fragment key={'duck'}>Rubber Ducky chance <InfoButton
            label={'Rubber Ducky chance'}>The chance per full bar to gain one more Rubber Ducky stack.</InfoButton></Fragment>,
            duckText(bar.duckChance)] : null
        ]}/>
      </Stack>)}
    </Panel> : null}
    {visibleWaters.length ? <>
      <Stack direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'} mb={2}>
        <Typography variant={'sectionTitle'} component={'h2'}>Upgrades</Typography>
        {sectionFailed ? null : <ViewSwitch options={[['graph', 'Graph'], ['list', 'List']]} value={shown?.view}
                    onChange={(view) => setShown({ view })} label={'The Fountain view'} sx={{ ml: 'auto' }}/>}
      </Stack>
      <Stack gap={3}>
        {visibleWaters.map((water) => <Stack key={`water-${water.tier}`}>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <Typography variant={'sectionTitle'} component={'h3'}>{water.name} Water</Typography>
            {!water.unlocked ? <StatusText status={'locked'}/> : null}
          </Stack>
          {shown?.view === 'list'
            ? <FountainList water={water} t={water.tier} currencies={currencies}/>
            : <FountainGraph water={water} t={water.tier} currencies={currencies}/>}
        </Stack>)}
      </Stack>
    </> : null}
  </>;
};

export default TheFountain;
