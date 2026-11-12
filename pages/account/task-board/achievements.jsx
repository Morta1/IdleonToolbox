import { useContext } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, formatNum, getTabs } from 'utility/helpers';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { PAGES } from '@components/constants';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import usePageTop from '@hooks/usePageTop';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import useTabIndex from '@hooks/useTabIndex';
import {
  getAchievementWorldTotals,
  getAchievements,
  getWorldAchievements,
  isRealAchievement
} from '@parsers/achievements';
import { gameGlyphs } from '@utility/wiki/game-glyphs.mjs';

const TABS = getTabs(PAGES.ACCOUNT['task board'].categories, 'achievements');
const ACHIEVEMENTS_TOOLBAR = { search: '', hideCompleted: false, view: 'icons' };

// The game's font draws an end-of-line # and ^ and a 论 the site can't: the marks go, 论 reads + (Sneaking's +LV)
const achievementText = (desc) => cleanUnderscore(gameGlyphs(desc));

const Achievements = () => {
  const { state } = useContext(AppContext);
  const [world] = useTabIndex(TABS);
  const failed = isSectionFailed(state?.account, 'achievements');
  const [view, setView, resetView] = useToolbarState('achievements', ACHIEVEMENTS_TOOLBAR);
  const pageTop = usePageTop();
  const hideCompleted = !failed && view.hideCompleted;
  // A failed section draws the game's list at zero, a guest's grey: no done state and no progress that would not be the player's
  const achievements = failed ? getAchievements(undefined) : state?.account?.achievements;
  const { worldTotals, combined } = getAchievementWorldTotals(achievements, TABS);
  const pair = (done, total) => (failed ? '-' : `${formatNum(done)} / ${formatNum(total)}`);

  const worldAchievements = getWorldAchievements(achievements, world)?.filter(isRealAchievement) ?? [];
  // Search reads the name and the description (the tiles are icons) in every world: each world's tab counts its matches,
  // as Star Signs' trees do
  const search = (view?.search ?? '').trim().toLowerCase();
  const visible = ({ completed, name, desc }) => !(hideCompleted && completed)
    && (!search || cleanUnderscore(`${name ?? ''} ${desc ?? ''}`).toLowerCase().includes(search));
  const shown = worldAchievements.filter(visible);
  const byWorld = TABS.map((_, index) => getWorldAchievements(achievements, index)?.filter(isRealAchievement) ?? []);
  const allAchievements = byWorld.flat();
  const tabLabels = TABS.map((tab, index) => (search ? `${tab} (${formatNum(byWorld[index].filter(visible).length)})` : tab));
  // The parser keeps a count only where the game prints "Progress:" (its own or the Steam counter)
  const underWay = ({ completed, currentQuantity }) => !failed && !completed && currentQuantity > 0;

  const progressText = (achievement) => (achievement.progressTarget
    ? `${formatNum(achievement.currentQuantity, 'whole')} / ${formatNum(achievement.progressTarget, 'whole')}`
    : formatNum(achievement.currentQuantity, 'whole'));
  const rewardsText = (achievement) => (achievement.rewards ?? []).map((reward) => cleanUnderscore(reward).trim()).join(', ');
  // The table: every achievement's name, what it asks, its progress and rewards, readable without opening a tile
  const columns = [
    {
      key: 'name', label: 'Name', sortable: true, value: ({ name }) => cleanUnderscore(name),
      icon: ({ rawName, completed }) => <GameIcon src={`data/${rawName}.png`} size={24} alt={''}
                                                  status={!failed && !completed ? 'missing' : undefined}/>
    },
    { key: 'desc', label: 'Task', from: 'md', value: ({ desc }) => achievementText(desc) },
    {
      key: 'progress', label: 'Progress', phone: true, sortable: true,
      value: (achievement) => (achievement.completed ? Infinity : achievement.currentQuantity ?? 0),
      render: (achievement) => (failed ? null : achievement.completed ? <StatusText status={'done'}>Completed</StatusText>
        : underWay(achievement) ? progressText(achievement) : '-')
    },
    { key: 'rewards', label: 'Rewards', from: 'sm', value: rewardsText }
  ];

  const details = (achievement) => <Stack gap={1}>
    <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(achievement.name)}</Typography>
    <ItemCard.Desc text={achievementText(achievement.desc)}/>
    <ItemCard.Facts rows={[
      underWay(achievement)
        ? ['Progress', progressText(achievement)]
        : null,
      !failed && achievement.completed ? ['State', <StatusText key={'done'} status={'done'}>Completed</StatusText>] : null,
      // The game's first reward line on a Steam achievement: "STEAM EXCLUSIVE"
      achievement.steamExclusive ? ['Steam', 'Steam exclusive'] : null,
      ['Rewards', rewardsText(achievement)]
    ]}/>
  </Stack>;

  return (
    <Box>
      <NextSeo
        title="Achievements | Idleon Toolbox"
        description="Track your achievement completion, reward tiers, and unlockable bonuses in Legends of Idleon"
      />
      {failed ? <MissingData name={'Achievements'} failed atZero/> : null}
      <PageSummary>
        {worldTotals.map(({ worldName, completed, total }) => <StatTile key={worldName} label={worldName}
                                                                        value={pair(completed, total)}/>)}
        <StatTile label={'Total'} value={pair(combined.completed, combined.total)}/>
      </PageSummary>
      {/* Search and filter cover every world, so they sit above the world tabs; each tab counts its matches */}
      {failed ? null : <Toolbar state={view} defaults={ACHIEVEMENTS_TOOLBAR} onChange={setView} onReset={resetView}
                                total={allAchievements.length} shown={allAchievements.filter(visible).length} noun={'achievements'}>
        <Toolbar.Search placeholder={'Search achievements'}/>
        <Toolbar.Filter name={'hideCompleted'} label={'Hide completed'}/>
        <Toolbar.View options={[['icons', 'Icons'], ['table', 'Table']]}/>
      </Toolbar>}
      <Tabber tabs={TABS} labels={tabLabels} keepChildren>
        <Box>
          {!shown.length ? null : view?.view === 'table' ? <DataTable columns={columns} rows={shown} rowKey={'rawName'}
                                                                      rowLabel={({ name }) => cleanUnderscore(name)}
                                                                      surface={'card'} stickyTop={pageTop}/>
            : <CardGrid size={'icon'}>
            {shown.map((achievement) => <IconTile key={achievement.rawName} icon={`data/${achievement.rawName}.png`}
                                                  alt={cleanUnderscore(achievement.name)}
                                                  status={achievement.completed ? undefined : 'missing'}
                                                  value={underWay(achievement) ? formatNum(achievement.currentQuantity, 'whole') : undefined}
                                                  details={details(achievement)}/>)}
          </CardGrid>}
        </Box>
      </Tabber>
    </Box>
  );
};

export default Achievements;
