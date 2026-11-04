import { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Tabber from '../../../components/common/Tabber';
import { NextSeo } from 'next-seo';
import { Box, Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import ItemDisplay from '@components/common/ItemDisplay';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import { NoteTrigger } from '@components/common/InfoButton';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import useTabIndex from '@hooks/useTabIndex';
import { getGoldenFoodBonus } from '@parsers/misc';
import { getTasks } from '@parsers/tasks';

// One tab per task unlock column (TaskUnlocks); the 7th holds the gem unlocks
const tabs = [1, 2, 3, 4, 5, 6, 7].map((ind) => `Tab ${ind}`);
const UNLOCKS_TOOLBAR = { hideUnlocked: false };

const itemName = (item) => `${item?.amount > 0 ? `${formatNum(item.amount)} ` : ''}${cleanUnderscore(item?.displayName)}`;

const Unlocks = () => {
  const { state } = useContext(AppContext);
  const [column] = useTabIndex(tabs);
  const failed = isSectionFailed(state?.account, 'tasks');
  const [view, setView, resetView] = useToolbarState('unlocks', UNLOCKS_TOOLBAR);
  const hideUnlocked = !failed && view.hideUnlocked;
  // A failed section draws the game's unlock pairs with no state (the parser's own empty save)
  const unlocks = failed ? getTasks(undefined).taskUnlocks : state?.account?.taskUnlocks;
  // With no save the parser's points owned read -10 and the next requirement -80 (parsers/tasks.ts): neither is the player's
  const hasPoints = !failed && unlocks?.pointsReq > 0;

  const list = unlocks?.taskUnlocksList?.[column] ?? [];
  const isUnlocked = ({ unlocked }) => !failed && Boolean(unlocked);
  const unlockedCount = list.filter(isUnlocked).length;
  const shown = list.filter((unlock) => !(hideUnlocked && isUnlocked(unlock)));

  return (<>
    <NextSeo
      title="Task Unlocks | Idleon Toolbox"
      description="Track your task board unlock progression, merit rewards, and task tier requirements in Legends of Idleon"
    />
    {failed ? <MissingData name={'Unlocks'} failed/> : null}
    <PageSummary>
      <StatTile label={'Available unlocks'}
                value={hasPoints ? formatNum(Math.max(0, unlocks.unlockPointsOwned - unlocks.unlockedRecipes)) : '-'}/>
      <StatTile label={'Next unlock'}
                value={hasPoints ? `${formatNum(unlocks.currentPoints)} / ${formatNum(unlocks.pointsReq)}` : '-'}/>
      <StatTile label={'Unlocked recipes'} value={failed ? '-' : formatNum(unlocks?.unlockedRecipes ?? 0)}/>
    </PageSummary>
    <Tabber tabs={tabs} keepChildren>
      <Box>
        {failed ? null : <Toolbar state={view} defaults={UNLOCKS_TOOLBAR} onChange={setView} onReset={resetView}
                                  total={list.length} shown={shown.length} noun={'unlocks'}>
          <Toolbar.Filter name={'hideUnlocked'} label={'Hide unlocked'}/>
        </Toolbar>}
        {shown.length ? <Panel title={column === tabs.length - 1 ? 'Gem unlocks' : 'Recipe unlocks'}
                               meta={failed
                                 ? `${formatNum(list.length)} unlocks`
                                 : `${formatNum(unlockedCount)} / ${formatNum(list.length)} unlocked`}>
          {shown.map((unlock, index) => {
            const pair = (unlock?.unlocks ?? []).filter((item) => item?.rawName);
            return <Panel.Row key={index} name={pair.map(itemName).join(' and ')}
                              icon={<Stack direction={'row'} gap={0.5}>
                                {pair.map((item, itemIndex) => <NoteTrigger key={`${item.rawName}-${itemIndex}`} label={cleanUnderscore(item.displayName)}
                                                                 note={<ItemDisplay {...item} account={state?.account}
                                                                                    getGoldenFoodBonus={getGoldenFoodBonus}/>}>
                                  <GameIcon src={`data/${item.rawName}.png`} size={32} alt={cleanUnderscore(item.displayName)}/>
                                </NoteTrigger>)}
                              </Stack>}
                              value={isUnlocked(unlock) ? <StatusText status={'done'}>Unlocked</StatusText> : undefined}/>;
          })}
        </Panel> : null}
      </Box>
    </Tabber>
  </>);
};

export default Unlocks;
