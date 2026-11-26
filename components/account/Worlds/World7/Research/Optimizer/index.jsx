import React, { useEffect, useState } from 'react';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import Panel from '@components/common/cards/Panel';
import ViewSwitch from '@components/common/ViewSwitch';
import { getOptimizerKey, useResearchOptimizer } from '@hooks/useResearchOptimizer';
import ShapesView from './ShapesView';
import LensesView from './LensesView';
import { GOALS, HORIZON_LABEL, HORIZONS, gainText, pickMoves } from './optimizerShared';

const shapesLine = (optimizer, shapesOwned, goal) => {
  if (!shapesOwned) return 'Your first shape comes at Research LV 20.';
  if (optimizer.status !== 'done') return 'Working it out…';
  const plans = optimizer.result?.plans ?? [];
  const plan = plans[pickMoves(plans) - 1];
  if (!plan || plan.ratio - 1 < 0.0005) return 'Already where I\'d put them.';
  return `Move ${plan.steps.length} shape${plan.steps.length === 1 ? '' : 's'} for ${gainText(plan.ratio)} ${GOALS[goal].label}.`;
};

const lensesLine = (optimizer, when, lensCount, goal) => {
  if (!lensCount) return 'Your first lens comes at Research LV 10.';
  if (optimizer.status !== 'done') return 'Working it out…';
  const plan = optimizer.result;
  if (!plan?.drags?.length) return `Already where I'd put them for ${GOALS[goal].label} ${HORIZON_LABEL[when]}.`;
  const lenses = plan.drags.reduce((sum, { count }) => sum + count, 0);
  return `Move ${lenses} lens${lenses === 1 ? '' : 'es'} for ${gainText(plan.ratioAtHorizon)} ${GOALS[goal].label} ${HORIZON_LABEL[when]}.`;
};

const hasMoves = (half, shapes, lenses) => (half === 'shapes'
  ? shapes.status === 'done' && (shapes.result?.plans ?? []).some(({ ratio }) => ratio - 1 >= 0.0005)
  : lenses.status === 'done' && (lenses.result?.drags?.length ?? 0) > 0);

const Dot = () => <Box component={'span'} aria-label={'has moves'} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', ml: 1 }}/>;

/** Research Optimizer tab: where to put the grid shapes and the observation lenses for the chosen goal. */
const Optimizer = ({ research, squares }) => {
  const input = research?.optimizer;
  const shapes = useResearchOptimizer();
  const lenses = useResearchOptimizer();
  const [goal, setGoal] = useState('researchExp');
  const [half, setHalf] = useState('shapes');
  const [horizon, setHorizon] = useState('month');
  const [keepMonocles, setKeepMonocles] = useState(false);
  // Insight is planned for today: a horizon only matters for the Research EXP that Insight levels bring later.
  const when = goal === 'insight' ? 'now' : horizon;
  const shapesKey = JSON.stringify([goal, input?.owners, input?.placements, input?.levels]);
  const lensesKey = JSON.stringify([goal, input?.lensSlots, input?.insightLevels, when, keepMonocles]);
  const lensCount = (input?.lensSlots ?? []).filter(({ observation }) => observation >= 0).length;

  // The searches rerun on any change to what they read; the views (and their ticks) reset only when the layout does.
  const shapesOptions = { goal };
  const lensesOptions = { goal, realHours: HORIZONS[when], keepMonocles };
  const shapesRunKey = getOptimizerKey('shapes', input, shapesOptions);
  const lensesRunKey = getOptimizerKey('lenses', input, lensesOptions);
  useEffect(() => {
    if (input?.shapesOwned) shapes.run('shapes', input, shapesOptions);
  }, [shapesRunKey]);
  useEffect(() => {
    if (lensCount) lenses.run('lenses', input, lensesOptions);
  }, [lensesRunKey]);

  return <Stack gap={3}>
    <Panel title={'Research Optimizer'}>
      <Stack gap={2} sx={{ p: 2 }}>
        <Stack direction={'row'} flexWrap={'wrap'} gap={3} alignItems={'flex-start'}>
          <TextField select label={'Goal'} value={goal} onChange={(event) => setGoal(event.target.value)} sx={{ minWidth: 240 }}>
            {Object.entries(GOALS).map(([key, { label }]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
          </TextField>
          <Stack gap={0.75} sx={{ flex: '1 1 320px' }}>
            <Typography variant={'caption'} color={'text.secondary'} sx={{ fontWeight: 500 }}>What to do</Typography>
            <Typography variant={'body2'}><b>Shapes</b> · {shapesLine(shapes, input?.shapesOwned, goal)}</Typography>
            <Typography variant={'body2'}><b>Lenses</b> · {lensesLine(lenses, when, lensCount, goal)}</Typography>
          </Stack>
        </Stack>
        <ViewSwitch label={'Optimize'} value={half} onChange={setHalf} options={[
          ['shapes', <React.Fragment key={'shapes'}>Shapes{hasMoves('shapes', shapes, lenses) ? <Dot/> : null}</React.Fragment>],
          ['lenses', <React.Fragment key={'lenses'}>Lenses{hasMoves('lenses', shapes, lenses) ? <Dot/> : null}</React.Fragment>]
        ]}/>
      </Stack>
    </Panel>
    {half === 'shapes'
      ? <ShapesView key={shapesKey} research={research} squares={squares} optimizer={shapes} goal={goal}/>
      : <LensesView key={lensesKey} research={research} optimizer={lenses} goal={goal} horizon={horizon} setHorizon={setHorizon}
                    keepMonocles={keepMonocles} setKeepMonocles={setKeepMonocles}/>}
  </Stack>;
};

export default Optimizer;
