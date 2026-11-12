import { Box } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import React from 'react';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Notice from '@components/common/Notice';
import StatTile from '@components/common/cards/StatTile';

// Off by default, so the completed ones stay hidden as before: a Filter away from its default is what the Toolbar
// names as narrowing, and "Hide completed" on by default would read as a filter when it was turned off
const CHALLENGES_TOOLBAR = { showDone: false };

const stateOf = ({ current, goal, active, locked }) => {
  if (current === -1) return { status: 'done', statusLabel: 'Completed' };
  if (locked) return { status: 'locked', statusLabel: 'Requires Research G8' };
  if (active) return { status: 'active', statusLabel: 'Active' };
  if (current >= goal) return { status: 'ready', statusLabel: 'Requirements met' };
  return {};
};

// sectionFailed: the progress is unknown, so no card carries a state
const Challenges = ({ challenges, sectionFailed }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('equinox-challenges', CHALLENGES_TOOLBAR);
  const list = challenges ?? [];
  const shown = list.filter(({ current }) => toolbar?.showDone || current !== -1);

  const completed = list.filter(({ current }) => current === -1).length;
  return <Box>
    {/* The completed ones hide by default, so the count says how far along the clouds are */}
    <StatTile label={'Completed'} value={sectionFailed ? '-' : `${formatNum(completed)} / ${formatNum(list.length)}`}
              sx={{ mb: 2 }}/>
    <Toolbar state={toolbar} defaults={CHALLENGES_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={list.length} shown={shown.length} noun={'challenges'}>
      <Toolbar.Filter name={'showDone'} label={'Show completed'}/>
    </Toolbar>
    {list.length && !shown.length ? <Notice tone={'info'}>Every challenge is completed.</Notice> : null}
    <CardGrid size={'m'}>
      {shown.map((challenge, index) => {
        const { label, reward, goal, current } = challenge;
        const { status, statusLabel } = sectionFailed ? {} : stateOf(challenge);
        return <ItemCard key={`${label}-${index}`} title={cleanUnderscore(label?.capitalize?.() ?? label)}
                         status={status} statusLabel={statusLabel}>
          <ItemCard.Facts rows={[['Reward', cleanUnderscore(reward)]]}/>
          {current !== -1 ? <ItemCard.Progress label={'Progress'} value={current ?? 0} max={goal ?? 0} kind={'whole'}/> : null}
        </ItemCard>;
      })}
    </CardGrid>
  </Box>;
};

export default Challenges;
