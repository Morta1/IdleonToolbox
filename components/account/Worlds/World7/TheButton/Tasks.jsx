import React, { useContext, useState } from 'react';
import {
  Button, Card, CardContent, Chip, Divider, FormControlLabel,
  LinearProgress, Stack, Switch, Typography
} from '@mui/material';
import HtmlTooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import { notateNumber } from '@utility/helpers';
import { AppContext } from '@components/common/context/AppProvider';
import { getCharacterTaskProgress } from '@parsers/world-7/button';

const PRESSES_PER_CYCLE = 45; // 9 categories × 5 presses

const Tasks = ({ taskSequence, bonuses, totalPresses, pressesIntoCurrentBonus }) => {
  const { state } = useContext(AppContext);
  const characters = state?.characters;
  const account = state?.account;

  const [page, setPage] = useState(0);
  const [hideReady, setHideReady] = useState(false);

  const categoryCount = bonuses?.length ?? 9;
  const activeBonusIndex = Math.floor(totalPresses / 5) % categoryCount;

  const getBestProgress = (task) => {
    if (!characters?.length) return { progress: task.progress, bestChar: null };

    let bestProgress = task.progress;
    let bestChar = null;

    for (const char of characters) {
      const charValue = getCharacterTaskProgress(task.index, char, account, characters);
      if (charValue !== null) {
        if (charValue > bestProgress) {
          bestProgress = charValue;
          bestChar = char;
        } else if (bestChar === null) {
          bestProgress = charValue;
          bestChar = char;
        }
      }
    }

    return { progress: bestProgress, bestChar };
  };

  // Slice one cycle based on current page
  const start = page * PRESSES_PER_CYCLE;
  const pageData = taskSequence?.slice(start, start + PRESSES_PER_CYCLE) ?? [];
  const maxPages = Math.ceil((taskSequence?.length ?? 0) / PRESSES_PER_CYCLE);

  const filtered = hideReady
    ? pageData.filter((t) => {
      const { progress } = getBestProgress(t);
      return progress < t.requirement;
    })
    : pageData;

  let lastBonusIdx = -1;
  let activeGroupShown = page > 0; // only show active indicator on first page

  return <Card sx={{ maxWidth: 900 }}>
    <CardContent>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Button size="small" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
          <Typography variant="body2">Cycle {page + 1}</Typography>
          <Button size="small" disabled={page >= maxPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
        </Stack>
        <FormControlLabel
          control={<Switch size="small" checked={hideReady} onChange={(e) => setHideReady(e.target.checked)} />}
          label={<Typography variant="body2" color="text.secondary">Hide ready</Typography>}
          sx={{ ml: 'auto' }}
        />
      </Stack>
      <Stack gap={0.5}>
        {filtered?.map((task, idx) => {
          const isFirst = page === 0 && idx === 0 && !hideReady;
          const { progress, bestChar } = getBestProgress(task);
          const isReady = progress >= task.requirement;
          const showHeader = task.bonusIdx !== lastBonusIdx;
          if (showHeader) lastBonusIdx = task.bonusIdx;
          const bonusName = bonuses?.[task.bonusIdx]?.name ?? '';
          const isActiveBonus = !activeGroupShown && task.bonusIdx === activeBonusIndex;
          if (isActiveBonus && showHeader) activeGroupShown = true;

          return <React.Fragment key={`${task.pressNumber}`}>
            {showHeader && (
              <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1.5, mb: 0.5 }}>
                <Divider sx={{ flex: 1 }} />
                <Chip
                  label={isActiveBonus ? `${bonusName} (${pressesIntoCurrentBonus}/5)` : bonusName}
                  size="small"
                  color={isActiveBonus ? 'success' : 'default'}
                  variant={isActiveBonus ? 'filled' : 'outlined'}
                />
                <Divider sx={{ flex: 1 }} />
              </Stack>
            )}
            <Stack direction="row" alignItems="center" gap={2}
                   sx={{
                     py: 0.5,
                     ...(isFirst && { borderLeft: 3, borderColor: 'success.main', pl: 1.5 })
                   }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {task.description}
                {bestChar && (
                  <Typography component="span" variant="caption" color="text.disabled">
                    {' '}({bestChar.name})
                  </Typography>
                )}
              </Typography>
              <Stack sx={{ flexShrink: 0, textAlign: 'right' }}>
                {isReady
                  ? <Typography variant="body2" color="success.main">Ready</Typography>
                  : <Typography variant="body2" color="text.secondary">
                      {notateNumber(progress, 'Big')} / {notateNumber(task.requirement, 'Big')}
                    </Typography>
                }
                {task.futureRequirements?.length > 0 && (
                  <Stack direction="row" alignItems="center" gap={0.5} justifyContent="flex-end">
                    <Typography variant="caption" color="text.disabled">
                      Next: {notateNumber(task.futureRequirements[0], 'Big')}
                    </Typography>
                    <HtmlTooltip title={
                      <Stack gap={0.5}>
                        <Typography variant="body2" fontWeight="bold">Upcoming requirements</Typography>
                        {task.futureRequirements.map((req, i) => (
                          <Typography key={i} variant="caption">
                            #{i + 2}: {notateNumber(req, 'Big')}
                          </Typography>
                        ))}
                      </Stack>
                    }>
                      <InfoIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'pointer' }} />
                    </HtmlTooltip>
                  </Stack>
                )}
              </Stack>
              {isFirst && !isReady && <LinearProgress
                variant="determinate"
                value={Math.min(100, (progress / Math.max(1, task.requirement)) * 100)}
                sx={{ minWidth: 80, flexShrink: 0 }}
              />}
            </Stack>
          </React.Fragment>;
        })}
        {filtered?.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No tasks to show
          </Typography>
        )}
      </Stack>
    </CardContent>
  </Card>;
};

export default Tasks;
