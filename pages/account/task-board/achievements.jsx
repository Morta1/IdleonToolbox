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
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import useTabIndex from '@hooks/useTabIndex';
import {
  getAchievementWorldTotals,
  getAchievements,
  getWorldAchievements,
  isRealAchievement
} from '@parsers/achievements';

const TABS = getTabs(PAGES.ACCOUNT['task board'].categories, 'achievements');
const ACHIEVEMENTS_TOOLBAR = { hideCompleted: false };

// The game's font draws an end-of-line # and ^ and a 论 the site can't: the marks go, 论 reads + (Sneaking's +LV)
const achievementText = (desc) => cleanUnderscore(`${desc ?? ''}`.replace(/_?[#^]$/, '').replace(/论/g, '+'));

const Achievements = () => {
  const { state } = useContext(AppContext);
  const [world] = useTabIndex(TABS);
  const failed = isSectionFailed(state?.account, 'achievements');
  const [view, setView, resetView] = useToolbarState('achievements', ACHIEVEMENTS_TOOLBAR);
  const hideCompleted = !failed && view.hideCompleted;
  // A failed section draws the game's list at zero: no done state and no progress that would not be the player's
  const achievements = failed ? getAchievements(undefined) : state?.account?.achievements;
  const { worldTotals, combined } = getAchievementWorldTotals(achievements, TABS);
  const pair = (done, total) => (failed ? '-' : `${formatNum(done)} / ${formatNum(total)}`);

  const worldAchievements = getWorldAchievements(achievements, world)?.filter(isRealAchievement) ?? [];
  const shown = worldAchievements.filter(({ completed }) => !(hideCompleted && completed));
  const underWay = ({ completed, currentQuantity, quantity }) => !failed && !completed && quantity > 1 && currentQuantity > 0;

  const details = (achievement) => <Stack gap={1}>
    <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(achievement.name)}</Typography>
    <ItemCard.Desc text={achievementText(achievement.desc)}/>
    <ItemCard.Facts rows={[
      underWay(achievement)
        ? ['Progress', `${formatNum(achievement.currentQuantity)} / ${formatNum(achievement.quantity)}`]
        : null,
      !failed && achievement.completed ? ['State', <StatusText key={'done'} status={'done'}>Completed</StatusText>] : null,
      ['Rewards', cleanUnderscore((achievement.rewards ?? []).join(', '))]
    ]}/>
  </Stack>;

  return (
    <Box>
      <NextSeo
        title="Achievements | Idleon Toolbox"
        description="Track your achievement completion, reward tiers, and unlockable bonuses in Legends of Idleon"
      />
      {failed ? <MissingData name={'Achievements'} failed/> : null}
      <PageSummary>
        {worldTotals.map(({ worldName, completed, total }) => <StatTile key={worldName} label={worldName}
                                                                        value={pair(completed, total)}/>)}
        <StatTile label={'Total'} value={pair(combined.completed, combined.total)}/>
      </PageSummary>
      <Tabber tabs={TABS} keepChildren>
        <Box>
          {failed ? null : <Toolbar state={view} defaults={ACHIEVEMENTS_TOOLBAR} onChange={setView} onReset={resetView}
                                    total={worldAchievements.length} shown={shown.length} noun={'achievements'}>
            <Toolbar.Filter name={'hideCompleted'} label={'Hide completed'}/>
          </Toolbar>}
          {shown.length ? <CardGrid size={'icon'}>
            {shown.map((achievement) => <IconTile key={achievement.rawName} icon={`data/${achievement.rawName}.png`}
                                                  alt={cleanUnderscore(achievement.name)}
                                                  status={failed || achievement.completed ? undefined : 'missing'}
                                                  value={underWay(achievement) ? formatNum(achievement.currentQuantity) : undefined}
                                                  details={details(achievement)}/>)}
          </CardGrid> : null}
        </Box>
      </Tabber>
    </Box>
  );
};

export default Achievements;
