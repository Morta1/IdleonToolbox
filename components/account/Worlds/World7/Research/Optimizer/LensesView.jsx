import React, { useState } from 'react';
import { Box, ButtonBase, Checkbox, FormControlLabel, LinearProgress, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import Notice from '@components/common/Notice';
import ViewSwitch from '@components/common/ViewSwitch';
import { getKaleidoscopeNeighbours } from '@parsers/world-7/researchOptimizer';
import { gainText } from './optimizerShared';

const LENSES = [
  { src: 'data/ResMagni0.png', name: 'Magnifying Glass', plural: 'Magnifying Glasses' },
  { src: 'data/ResMagni1.png', name: 'Optical Monocle', plural: 'Optical Monocles' },
  { src: 'data/ResMagni2.png', name: 'Kaleidoscope', plural: 'Kaleidoscopes' }
];
import { HORIZON_LABEL, HORIZONS } from './optimizerShared';
const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
// Where an observation sits on the game's 8-wide board
const place = (observation) => `row ${Math.floor(observation / 8) + 1}, ${ORDINALS[observation % 8]}`;

const countsByObservation = (slots) => slots.reduce((map, { observation, type }) => {
  const counts = map.get(observation) ?? [0, 0, 0];
  counts[type] += 1;
  return map.set(observation, counts);
}, new Map());

const LensesView = ({ research, optimizer, horizon, setHorizon, keepMonocles, setKeepMonocles }) => {
  const input = research?.optimizer;
  const [view, setView] = useState('suggested');
  const [done, setDone] = useState({});
  const [reach, setReach] = useState(null);
  const observations = research?.observations ?? [];

  if (!input?.lensSlots?.length) return <Notice>Your first lens comes at Research LV 10.</Notice>;

  const plan = optimizer.status === 'done' ? optimizer.result : null;
  const current = input.lensSlots.filter(({ observation }) => observation >= 0);
  const shown = countsByObservation(view === 'now' || !plan ? current : plan.slots);
  const drags = plan?.drags ?? [];
  const toStep = new Map(drags.map(({ to }, i) => [to, i + 1]));
  const leaving = new Set(drags.map(({ from }) => from));
  const reached = reach != null ? getKaleidoscopeNeighbours(reach) : [];
  const nameOf = (observation) => cleanUnderscore(observations.find(({ index }) => index === observation)?.name ?? `Observation ${observation + 1}`);
  const found = observations.filter(({ index, found: isFound }) => isFound && index < input.observationsFound);
  const nothingToDo = plan && drags.length === 0;

  return <Stack gap={3}>
    <Panel title={'Lenses inputs'}>
      <Panel.Inputs sx={{ p: 2 }}>
        <Panel.InputGroup label={<>Plan for <InfoButton label={'Plan for'}>Monocles don&apos;t make Research EXP, so moving them
          leaves today&apos;s number the same. They make Insight: each Insight level adds Research EXP through Game Design 102,
          and early observations level up far faster. Insight only grows during research time, at your AFK rate while
          you&apos;re away.</InfoButton></>}>
          <ViewSwitch options={[['now', 'Now'], ['week', '1 week'], ['month', '1 month']]} value={horizon} onChange={setHorizon} label={'Plan for'}/>
        </Panel.InputGroup>
        <FormControlLabel control={<Checkbox checked={keepMonocles} onChange={(event) => setKeepMonocles(event.target.checked)}/>}
                          label={'Keep my monocles where they are'}/>
      </Panel.Inputs>
    </Panel>

    {!plan ? <Panel title={'Finding the best layout'}><Box sx={{ p: 2 }}><LinearProgress/></Box></Panel> : <Stack gap={1.5}>
      <Typography variant={'sectionTitle'} component={'p'}>
        {nothingToDo
          ? `For Research EXP ${HORIZON_LABEL[horizon]}, your lenses are already where I'd put them.`
          : `Move ${drags.reduce((sum, { count }) => sum + count, 0)} lenses: ${gainText(plan.ratioAtHorizon)} Research EXP ${HORIZON_LABEL[horizon]}${plan.ratioToday >= 1 - 1e-9 ? ', nothing lost today' : ''}.`}
      </Typography>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        <StatTile label={'Research EXP today'} value={gainText(plan.ratioToday)}/>
        {HORIZONS[horizon] ? <StatTile label={`Research EXP ${HORIZON_LABEL[horizon]}`} value={gainText(plan.ratioAtHorizon)}/> : null}
        <StatTile label={'Lenses to move'} value={`${drags.reduce((sum, { count }) => sum + count, 0)} of ${current.length}`}/>
        {HORIZONS[horizon] ? <StatTile label={'Insight levels gained'} value={`+${formatNum(plan.insightLevelsGained)}`}/> : null}
      </Stack>
    </Stack>}

    <Panel title={'Your observations'} aside={<ViewSwitch options={[['suggested', 'Suggested'], ['now', 'Now']]} value={view} onChange={setView}/>}>
      <Box sx={{ p: 1.5, display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 0.75, maxWidth: 640 }}>
        {found.map(({ index, insightLevel }) => {
          const counts = shown.get(index) ?? [0, 0, 0];
          const step = view === 'suggested' ? toStep.get(index) : undefined;
          const from = view === 'suggested' && leaving.has(index);
          return <ButtonBase key={index} onClick={() => setReach(counts[2] ? index : null)}
                             aria-label={`${nameOf(index)}, Insight LV ${insightLevel ?? 0}`}
                             sx={{
                               position: 'relative', flexDirection: 'column', py: 0.5, borderRadius: 1, border: 1,
                               borderStyle: from ? 'dashed' : 'solid',
                               borderColor: step ? 'primary.main' : from ? 'warning.main' : 'divider',
                               bgcolor: reached.includes(index) ? 'primary.soft' : 'background.default'
                             }}>
            {step ? <Box component={'span'} sx={{
              position: 'absolute', top: -8, right: -6, width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main',
              color: 'primary.contrastText', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{step}</Box> : null}
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
      <Typography variant={'caption'} color={'text.secondary'} component={'p'} sx={{ px: 2, pb: 1.5 }}>
        Up to {input.lensCap} lenses on one observation. Tap a kaleidoscope to see the 4 observations it boosts.
      </Typography>
    </Panel>

    {drags.length ? <Panel title={'In the game'} meta={`${Object.values(done).filter(Boolean).length} of ${drags.length} done`}>
      <Stack sx={{ p: 1 }}>
        {drags.map(({ type, from, to, count }, i) => <Stack key={`${type}-${from}-${to}`} direction={'row'} gap={1} alignItems={'flex-start'}
                                                             sx={{ p: 1, opacity: done[i] ? 0.55 : 1 }}>
          <Checkbox checked={Boolean(done[i])} onChange={() => setDone({ ...done, [i]: !done[i] })}
                    inputProps={{ 'aria-label': `Step ${i + 1} done` }} sx={{ p: 0.5 }}/>
          <Stack gap={0.25}>
            <Stack direction={'row'} alignItems={'center'} gap={0.75}>
              <Typography variant={'body2'} sx={{ fontWeight: 500 }}>{i + 1}. Drag {count === 1 ? `a ${LENSES[type].name}` : `${count} ${LENSES[type].plural}`}</Typography>
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
          </Stack>
        </Stack>)}
      </Stack>
    </Panel> : null}
  </Stack>;
};

export default LensesView;
