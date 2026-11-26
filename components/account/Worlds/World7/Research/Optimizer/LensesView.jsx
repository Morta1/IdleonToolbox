import React, { useState } from 'react';
import { Box, Button, ButtonBase, Checkbox, FormControlLabel, LinearProgress, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import Notice from '@components/common/Notice';
import ViewSwitch from '@components/common/ViewSwitch';
import { applyLensDrags, getKaleidoscopeNeighbours } from '@parsers/world-7/researchOptimizer';
import { GOALS, HORIZON_LABEL, HORIZONS, gainText } from './optimizerShared';

const LENSES = [
  { src: 'data/ResMagni0.png', name: 'Magnifying Glass', plural: 'Magnifying Glasses' },
  { src: 'data/ResMagni1.png', name: 'Optical Monocle', plural: 'Optical Monocles' },
  { src: 'data/ResMagni2.png', name: 'Kaleidoscope', plural: 'Kaleidoscopes' }
];
const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
// Where an observation sits on the game's 8-wide board
const place = (observation) => `row ${Math.floor(observation / 8) + 1}, ${ORDINALS[observation % 8]}`;

const countsByObservation = (slots) => slots.reduce((map, { observation, type }) => {
  const counts = map.get(observation) ?? [0, 0, 0];
  counts[type] += 1;
  return map.set(observation, counts);
}, new Map());
const totalOn = (counts, observation) => (counts.get(observation) ?? [0, 0, 0]).reduce((sum, count) => sum + count, 0);

const DragRow = ({ drag, index, done, lit, after, onTick, nameOf }) => {
  const { type, from, to, count } = drag;
  return <Stack direction={'row'} gap={1} alignItems={'flex-start'}
                sx={{ px: 1, py: 1, borderRadius: 1, opacity: done ? 0.55 : 1, bgcolor: lit ? 'primary.soft' : undefined }}>
    <Checkbox checked={done} onChange={onTick} inputProps={{ 'aria-label': `Drag ${index + 1} done` }} sx={{ p: 0.25 }}/>
    <Stack gap={0.5} sx={{ minWidth: 0 }}>
      <Stack direction={'row'} alignItems={'center'} gap={0.75} flexWrap={'wrap'}>
        <Typography variant={'body2'} sx={{ fontWeight: 500, lineHeight: '26px' }}>
          {index + 1}. Drag {count === 1 ? `${/^[AEIOU]/.test(LENSES[type].name) ? 'an' : 'a'} ${LENSES[type].name}` : `${count} ${LENSES[type].plural}`}
        </Typography>
        <GameIcon src={LENSES[type].src} size={24} alt={''}/>
      </Stack>
      <Stack direction={'row'} alignItems={'center'} gap={0.75} flexWrap={'wrap'}>
        <Typography variant={'body2'} color={'text.secondary'}>from</Typography>
        <GameIcon src={`data/ResObj${from}.png`} size={24} alt={''}/>
        <Typography variant={'body2'}>{nameOf(from)} ({place(from)})</Typography>
        <Typography variant={'body2'} color={'text.secondary'}>to</Typography>
        <GameIcon src={`data/ResObj${to}.png`} size={24} alt={''}/>
        <Typography variant={'body2'}>{nameOf(to)} ({place(to)})</Typography>
      </Stack>
      {after != null ? <Typography variant={'caption'} color={'text.warning'}>After drag {after + 1}: {nameOf(to)} is full until then</Typography> : null}
    </Stack>
  </Stack>;
};

/**
 * The lenses half: a ticked list of drags and one board showing the layout they lead to. Most drags work in any order;
 * a drag onto an observation that starts full waits for the drag that frees it, since a lens dropped on a full
 * observation knocks a random one off.
 */
const LensesView = ({ research, optimizer, goal = 'researchExp', horizon: chosenHorizon, setHorizon, keepMonocles, setKeepMonocles }) => {
  const goalLabel = GOALS[goal].label;
  // Insight is planned for today; the horizon only counts for Research EXP.
  const horizon = goal === 'insight' ? 'now' : chosenHorizon;
  const input = research?.optimizer;
  const [done, setDone] = useState(() => new Set());
  const [focus, setFocus] = useState(null);
  const observations = research?.observations ?? [];

  if (!input?.lensSlots?.length) return <Notice>Your first lens comes at Research LV 10.</Notice>;

  const plan = optimizer.status === 'done' ? optimizer.result : null;
  const current = input.lensSlots.filter(({ observation }) => observation >= 0);
  const drags = plan?.drags ?? [];
  const before = countsByObservation(current);
  const finalLayout = countsByObservation(applyLensDrags(current, drags));
  // Lenses each observation gains and loses
  const delta = new Map();
  for (const { from, to, count } of drags) {
    delta.set(to, { on: (delta.get(to)?.on ?? 0) + count, off: delta.get(to)?.off ?? 0 });
    delta.set(from, { on: delta.get(from)?.on ?? 0, off: (delta.get(from)?.off ?? 0) + count });
  }
  // A drag onto an observation that is full at the start waits for the first drag that takes lenses off it
  const waitsFor = drags.map(({ to, count }) => (totalOn(before, to) + count > input.lensCap
    ? drags.findIndex(({ from }) => from === to)
    : null)).map((index) => (index != null && index >= 0 ? index : null));
  const anyWait = waitsFor.some((index) => index != null);
  const reached = focus != null && (finalLayout.get(focus)?.[2] ?? 0) ? getKaleidoscopeNeighbours(focus) : [];
  const nameOf = (observation) => cleanUnderscore(observations.find(({ index }) => index === observation)?.name ?? `Observation ${observation + 1}`);
  const found = observations.filter(({ index, found: isFound }) => isFound && index < input.observationsFound);
  const lensesMoved = drags.reduce((sum, { count }) => sum + count, 0);
  const toggle = (i) => {
    const next = new Set(done);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setDone(next);
  };

  return <Stack gap={3}>
    <Panel title={'Lenses inputs'}>
      <Panel.Inputs sx={{ p: 2 }}>
        {goal === 'insight' ? null : <Panel.InputGroup label={<>Plan for <InfoButton label={'Plan for'}>Monocles don&apos;t make Research EXP, so moving them
          leaves today&apos;s number the same. They make Insight: each Insight level adds Research EXP through Game Design 102,
          and early observations level up far faster. Insight only grows during research time, at your AFK rate while
          you&apos;re away.</InfoButton></>}>
          <ViewSwitch options={[['now', 'Now'], ['week', '1 week'], ['month', '1 month']]} value={horizon} onChange={setHorizon} label={'Plan for'}/>
        </Panel.InputGroup>}
        <FormControlLabel control={<Checkbox checked={keepMonocles} onChange={(event) => setKeepMonocles(event.target.checked)}/>}
                          label={'Keep my monocles where they are'}/>
      </Panel.Inputs>
    </Panel>

    {!plan ? <Panel title={'Finding the best layout'}><Box sx={{ p: 2 }}><LinearProgress/></Box></Panel> : <Stack gap={1.5}>
      <Typography variant={'sectionTitle'} component={'p'}>
        {!drags.length
          ? `For ${goalLabel} ${HORIZON_LABEL[horizon]}, your lenses are already where I'd put them.`
          : `Move ${lensesMoved} lens${lensesMoved === 1 ? '' : 'es'}: ${gainText(plan.ratioAtHorizon)} ${goalLabel} ${HORIZON_LABEL[horizon]}${plan.ratioToday >= 1 - 1e-9 ? ', nothing lost today' : ''}.`}
      </Typography>
      {drags.length && HORIZONS[horizon] ? <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        <StatTile label={`${goalLabel} today`} value={gainText(plan.ratioToday)}/>
        <StatTile label={'Insight levels gained'} value={`+${formatNum(plan.insightLevelsGained)}`}/>
      </Stack> : null}
    </Stack>}

    <Stack direction={'row'} flexWrap={'wrap'} gap={2} alignItems={'flex-start'}>
      <Panel title={'Your observations'} meta={drags.length ? 'After your drags' : undefined} sx={{ flex: '1 1 460px', minWidth: 0 }}>
        <Stack gap={1.5} sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 0.75, maxWidth: 640 }}>
            {found.map(({ index, insightLevel }) => {
              const counts = finalLayout.get(index) ?? [0, 0, 0];
              const change = delta.get(index);
              const net = change ? `${change.on ? `+${change.on}` : ''}${change.on && change.off ? ' / ' : ''}${change.off ? `−${change.off}` : ''}` : '';
              return <ButtonBase key={index} onClick={() => setFocus(focus === index ? null : index)}
                                 aria-label={`${nameOf(index)}, Insight LV ${insightLevel ?? 0}${net ? `, ${net} lenses` : ''}`}
                                 aria-pressed={focus === index}
                                 sx={{
                                   position: 'relative', flexDirection: 'column', py: 0.5, borderRadius: 1, border: change ? 2 : 1,
                                   borderColor: focus === index ? 'warning.main' : change ? 'primary.main' : 'divider',
                                   bgcolor: reached.includes(index) ? 'primary.soft' : 'background.default'
                                 }}>
                {net ? <Box component={'span'} sx={{
                  position: 'absolute', top: -9, right: -6, zIndex: 1, px: 0.5, height: 18, borderRadius: 9, bgcolor: 'primary.main',
                  color: 'primary.contrastText', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap'
                }}>{net}</Box> : null}
                <GameIcon src={`data/ResObj${index}.png`} size={32} alt={''}/>
                <Typography variant={'caption'} color={'text.secondary'} sx={{ fontSize: 10 }}>LV {insightLevel ?? 0}</Typography>
                <Stack direction={'row'} sx={{ minHeight: 16 }}>
                  {counts.map((count, type) => (count ? <Stack key={type} direction={'row'} alignItems={'center'} sx={{ fontSize: 10, fontWeight: 700 }}>
                    <GameIcon src={LENSES[type].src} size={16} alt={''}/>{count > 1 ? count : null}
                  </Stack> : null))}
                </Stack>
              </ButtonBase>;
            })}
          </Box>
          <Typography variant={'caption'} color={'text.secondary'} component={'p'}>
            Up to {input.lensCap} lenses on one observation.{drags.length ? ' Marked observations change: tap one to find its drags.' : ''} Tap
            a kaleidoscope to see the 4 observations it boosts.
          </Typography>
        </Stack>
      </Panel>

      {drags.length ? <Panel title={'Drags'} meta={`${done.size} / ${drags.length} done`} sx={{ flex: '1 1 380px', minWidth: 0 }}>
        <Stack gap={1.5} sx={{ p: 2 }}>
          {/* The rows' highlight reaches 8 px past the text, which lines up with the panel's 16 px */}
          <Stack sx={{ mx: -1 }}>
            {drags.map((drag, i) => <DragRow key={`${drag.type}-${drag.from}-${drag.to}`} drag={drag} index={i} done={done.has(i)}
                                             lit={focus != null && (drag.from === focus || drag.to === focus)} after={waitsFor[i]}
                                             onTick={() => toggle(i)} nameOf={nameOf}/>)}
          </Stack>
          {done.size ? <Button size={'small'} color={'inherit'} onClick={() => setDone(new Set())} sx={{ alignSelf: 'flex-start' }}>Clear ticks</Button> : null}
          {anyWait
            ? <Notice tone={'missing'}>A lens dropped on a full observation knocks a random one off: do the marked drags after the one they
              name. The rest work in any order.</Notice>
            : <Typography variant={'caption'} color={'text.secondary'}>Any order works.</Typography>}
        </Stack>
      </Panel> : null}
    </Stack>
  </Stack>;
};

export default LensesView;
