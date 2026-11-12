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
import { DIM } from '@components/common/cards/tokens';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import { NoteTrigger } from '@components/common/InfoButton';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import useTabIndex from '@hooks/useTabIndex';
import { getGoldenFoodBonus } from '@parsers/misc';
import { getTasks } from '@parsers/tasks';

// One tab per task unlock column (TaskUnlocks), each the game's Anvil tab of that number; the 7th holds the gem unlocks.
// The URL keeps the old "Tab N" values so shared links still open the same tab.
const tabs = [1, 2, 3, 4, 5, 6, 7].map((ind) => `Tab ${ind}`);
const tabLabels = tabs.map((tab) => `Anvil ${tab}`);
const UNLOCKS_TOOLBAR = { hideUnlocked: false };

// The board's text on a locked column: the recipes still to unlock, else the Anvil tab it waits on
const lockReason = (lock) => lock?.recipesNeeded > 0
  ? `${formatNum(lock.recipesNeeded, 'whole')} more ${lock.recipesNeeded === 1 ? 'recipe' : 'recipes'} to unlock`
  : lock?.anvilTab ? `Unlock Anvil Tab ${lock.anvilTab} first` : 'Locked';

// The data's one currency reads in the plural after an amount ("5 Gems"); every other entry is a recipe's own name
const itemName = (item) => {
  const name = cleanUnderscore(item?.displayName);
  return `${item?.amount > 0 ? `${formatNum(item.amount, 'whole')} ` : ''}${name === 'Gem' && item?.amount > 1 ? 'Gems' : name}`;
};

const Unlocks = () => {
  const { state } = useContext(AppContext);
  const [column] = useTabIndex(tabs);
  const failed = isSectionFailed(state?.account, 'tasks');
  const [view, setView, resetView] = useToolbarState('unlocks', UNLOCKS_TOOLBAR);
  const hideUnlocked = !failed && view.hideUnlocked;
  // A failed section draws the game's unlock pairs with no state (the parser's own empty save)
  const unlocks = failed ? getTasks(undefined).taskUnlocks : state?.account?.taskUnlocks;

  const list = unlocks?.taskUnlocksList?.[column] ?? [];
  const lock = failed ? null : unlocks?.columnLocks?.[column];
  const locked = Boolean(lock && !lock.open);
  const isUnlocked = ({ unlocked }) => !failed && Boolean(unlocked);
  const unlockedCount = list.filter(isUnlocked).length;
  const shown = list.filter((unlock) => !(hideUnlocked && isUnlocked(unlock)));

  return (<>
    <NextSeo
      title="Task Unlocks | Idleon Toolbox"
      description="Track your task board unlock progression, merit rewards, and task tier requirements in Legends of Idleon"
    />
    {failed ? <MissingData name={'Unlocks'} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Available unlocks'}
                value={failed ? '-' : formatNum(Math.max(0, unlocks?.unlockPointsOwned - unlocks?.unlockedRecipes))}/>
      <StatTile label={'Next unlock'}
                value={failed ? '-' : `${formatNum(unlocks?.currentPoints)} / ${formatNum(unlocks?.pointsReq)}`}/>
      <StatTile label={'Unlocked recipes'} value={failed ? '-' : formatNum(unlocks?.unlockedRecipes ?? 0)}/>
    </PageSummary>
    <Tabber tabs={tabs} labels={tabLabels} keepChildren>
      <Box>
        {failed ? null : <Toolbar state={view} defaults={UNLOCKS_TOOLBAR} onChange={setView} onReset={resetView}
                                  total={list.length} shown={shown.length} noun={'unlocks'} emptyNote={'All unlocked'}>
          <Toolbar.Filter name={'hideUnlocked'} label={'Hide unlocked'}/>
        </Toolbar>}
        {shown.length ? <Panel title={'Unlocks'}
                               meta={failed
                                 ? `${formatNum(list.length)} unlocks`
                                 : `${formatNum(unlockedCount)} / ${formatNum(list.length)} unlocked`}>
          {shown.map((unlock, index) => {
            const pair = (unlock?.unlocks ?? []).filter((item) => item?.rawName);
            const name = pair.map(itemName).join(' and ');
            return <Panel.Row key={index} name={locked ? <Box component={'span'} sx={{ opacity: DIM }}>{name}</Box> : name}
                              icon={<Stack direction={'row'} gap={0.5} sx={locked ? { opacity: DIM } : undefined}>
                                {pair.map((item, itemIndex) => <NoteTrigger key={`${item.rawName}-${itemIndex}`} label={cleanUnderscore(item.displayName)}
                                                                 note={<ItemDisplay {...item} account={state?.account}
                                                                                    getGoldenFoodBonus={getGoldenFoodBonus}/>}>
                                  <GameIcon src={`data/${item.rawName}.png`} size={32} alt={cleanUnderscore(item.displayName)}/>
                                </NoteTrigger>)}
                              </Stack>}
                              value={isUnlocked(unlock) ? <StatusText status={'done'}>Unlocked</StatusText>
                                : locked ? <StatusText status={'locked'}>{lockReason(lock)}</StatusText> : undefined}/>;
          })}
        </Panel> : null}
      </Box>
    </Tabber>
  </>);
};

export default Unlocks;
