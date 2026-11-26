import React, { useState } from 'react';
import { Box, Button, ButtonBase, Checkbox, FormControlLabel, LinearProgress, Stack, Typography } from '@mui/material';
import { IconCheck } from '@tabler/icons-react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import Notice from '@components/common/Notice';
import ViewSwitch from '@components/common/ViewSwitch';
import { applyLensDrags, createResearchScorer, getKaleidoscopeNeighbours, scoreLensLayout } from '@parsers/world-7/researchOptimizer';
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

const DragRow = ({ drag, index, state, gainSoFar, onPick, nameOf }) => {
  const { type, from, to, count } = drag;
  return <ButtonBase onClick={onPick} sx={{
    justifyContent: 'flex-start', textAlign: 'left', borderRadius: 1, px: 1, py: 1.25, gap: 1.5, alignItems: 'flex-start',
    opacity: state === 'done' ? 0.55 : 1, bgcolor: state === 'current' ? 'primary.soft' : undefined
  }}>
    <Box sx={{ width: 20, flexShrink: 0, lineHeight: '20px', color: state === 'done' ? 'text.success' : 'text.secondary', fontWeight: 700, fontSize: 14 }}>
      {state === 'done' ? <IconCheck size={18}/> : index + 1}
    </Box>
    <Stack gap={0.5} sx={{ minWidth: 0 }}>
      <Stack direction={'row'} alignItems={'center'} gap={0.75} flexWrap={'wrap'}>
        <Typography variant={'body2'} sx={{ fontWeight: 500 }}>Drag {count === 1 ? `a ${LENSES[type].name}` : `${count} ${LENSES[type].plural}`}</Typography>
        <GameIcon src={LENSES[type].src} size={24} alt={''}/>
      </Stack>
      <Typography variant={'caption'} color={'text.success'}>{gainText(gainSoFar)} so far</Typography>
      <Stack direction={'row'} alignItems={'center'} gap={0.75} flexWrap={'wrap'}>
        <Typography variant={'body2'} color={'text.secondary'}>from</Typography>
        <GameIcon src={`data/ResObj${from}.png`} size={24} alt={''}/>
        <Typography variant={'body2'}>{nameOf(from)} ({place(from)})</Typography>
        <Typography variant={'body2'} color={'text.secondary'}>to</Typography>
        <GameIcon src={`data/ResObj${to}.png`} size={24} alt={''}/>
        <Typography variant={'body2'}>{nameOf(to)} ({place(to)})</Typography>
      </Stack>
    </Stack>
  </ButtonBase>;
};

/**
 * The lenses half. Drags are walked with a cursor, as the shapes are: the observations show the lenses after the drags
 * so far with the next drag marked on them, and each drag says what the drags up to it give.
 */
const LensesView = ({ research, optimizer, goal = 'researchExp', horizon: chosenHorizon, setHorizon, keepMonocles, setKeepMonocles }) => {
  const goalLabel = GOALS[goal].label;
  // Insight is planned for today; the horizon only counts for Research EXP.
  const horizon = goal === 'insight' ? 'now' : chosenHorizon;
  const input = research?.optimizer;
  const [cursor, setCursor] = useState(0);
  const [reach, setReach] = useState(null);
  const observations = research?.observations ?? [];

  if (!input?.lensSlots?.length) return <Notice>Your first lens comes at Research LV 10.</Notice>;

  const plan = optimizer.status === 'done' ? optimizer.result : null;
  const current = input.lensSlots.filter(({ observation }) => observation >= 0);
  const drags = plan?.drags ?? [];
  const at = Math.min(cursor, drags.length);
  const finished = at >= drags.length;
  const next = drags[at];
  const shown = countsByObservation(applyLensDrags(current, drags.slice(0, at)));
  const reached = reach != null ? getKaleidoscopeNeighbours(reach) : [];
  const nameOf = (observation) => cleanUnderscore(observations.find(({ index }) => index === observation)?.name ?? `Observation ${observation + 1}`);
  const found = observations.filter(({ index, found: isFound }) => isFound && index < input.observationsFound);
  const lensesMoved = drags.reduce((sum, { count }) => sum + count, 0);
  const scorer = createResearchScorer(input);
  const scoring = { goal, realHours: HORIZONS[horizon], scorer };
  const base = scoreLensLayout(input, current, scoring) || 1;
  const gainAfter = drags.map((_, i) => scoreLensLayout(input, applyLensDrags(current, drags.slice(0, i + 1)), scoring) / base);

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
      <Panel title={'Your observations'} meta={drags.length ? (finished ? 'After every drag' : at ? `After ${at} drag${at === 1 ? '' : 's'}` : 'Now') : undefined}
             sx={{ flex: '1 1 460px', minWidth: 0 }}>
        <Stack gap={1.5} sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 0.75, maxWidth: 640 }}>
            {found.map(({ index, insightLevel }) => {
              const counts = shown.get(index) ?? [0, 0, 0];
              const target = next?.to === index;
              const source = next?.from === index;
              return <ButtonBase key={index} onClick={() => setReach(counts[2] ? index : null)}
                                 aria-label={`${nameOf(index)}, Insight LV ${insightLevel ?? 0}`}
                                 sx={{
                                   position: 'relative', flexDirection: 'column', py: 0.5, borderRadius: 1, border: target || source ? 2 : 1,
                                   borderStyle: source ? 'dashed' : 'solid',
                                   borderColor: target ? 'primary.main' : source ? 'warning.main' : 'divider',
                                   bgcolor: reached.includes(index) ? 'primary.soft' : 'background.default'
                                 }}>
                {target ? <Box component={'span'} sx={{
                  position: 'absolute', top: -8, right: -6, width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main',
                  color: 'primary.contrastText', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{at + 1}</Box> : null}
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
            Up to {input.lensCap} lenses on one observation. The next drag takes lenses off the dashed observation and puts them on the
            numbered one. Tap a kaleidoscope to see the 4 observations it boosts.
          </Typography>
        </Stack>
      </Panel>

      {drags.length ? <Panel title={'Steps to apply'} meta={`${at} / ${drags.length}`} sx={{ flex: '1 1 380px', minWidth: 0 }}>
        <Stack gap={2} sx={{ p: 2 }}>
          <LinearProgress variant={'determinate'} value={(at / drags.length) * 100} sx={{ height: 6, borderRadius: 3 }}/>
          <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
            <Button size={'small'} variant={'outlined'} disabled={at === 0} onClick={() => setCursor(at - 1)}>Back</Button>
            <Button size={'small'} variant={'contained'} disabled={finished} onClick={() => setCursor(at + 1)}>Next</Button>
            <Typography variant={'body2'} color={'text.secondary'}>
              {finished ? `${drags.length === 1 ? 'Done' : `All ${drags.length} drags done`}: ${gainText(plan.ratioAtHorizon)} ${goalLabel} ${HORIZON_LABEL[horizon]}`
                : `Drag ${at + 1} of ${drags.length}`}
            </Typography>
            {at > 0 ? <Button size={'small'} color={'inherit'} onClick={() => setCursor(0)}>Reset</Button> : null}
          </Stack>
          {/* The rows' highlight reaches 8 px past the text, which lines up with the panel's 16 px */}
          <Stack sx={{ mx: -1 }}>
            {drags.map((drag, i) => <DragRow key={`${drag.type}-${drag.from}-${drag.to}`} drag={drag} index={i} gainSoFar={gainAfter[i]}
                                             state={i < at ? 'done' : i === at ? 'current' : 'next'} onPick={() => setCursor(i)} nameOf={nameOf}/>)}
          </Stack>
          <Notice tone={'missing'}>Take lenses off before putting them on, in this order: a lens dropped on a full observation knocks a
            random one off.</Notice>
        </Stack>
      </Panel> : null}
    </Stack>
  </Stack>;
};

export default LensesView;
