import { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import { cleanUnderscore, formatNum, worldsArray } from '@utility/helpers';
import { Box } from '@mui/material';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import useTabIndex from '@hooks/useTabIndex';
import { getTasks } from '@parsers/tasks';

const MERITS_TOOLBAR = { hideMaxed: false };

const meritSentence = ({ description, descLine2 }) => cleanUnderscore(`${description ?? ''}${descLine2 && descLine2 !== 'Descline2'
  ? ` ${descLine2}`
  : ''}`);

const Merits = () => {
  const { state } = useContext(AppContext);
  const [world] = useTabIndex(worldsArray);
  const failed = isSectionFailed(state?.account, 'tasks');
  const [view, setView, resetView] = useToolbarState('merits', MERITS_TOOLBAR);
  const hideMaxed = !failed && view.hideMaxed;
  // A failed section draws the game's merits at zero (the parser's own empty save), with no purchases or price state
  const parsed = failed ? getTasks(undefined) : state?.account;
  // Merits to spend per world: Tasks[4][world + 1] (Tasks[4][0] is the unlock points)
  const meritsOf = (index) => (failed ? null : state?.account?.tasks?.[4]?.[index + 1] ?? 0);

  const worldMerits = parsed?.meritsDescriptions?.[world]
    ?.filter(({ descLine1, meritCost }) => descLine1 !== 'IDK_YET' && meritCost !== null) ?? [];
  const isMaxed = ({ level, totalLevels }) => !failed && (level ?? 0) >= totalLevels;
  const shown = worldMerits.filter((merit) => !(hideMaxed && isMaxed(merit)));

  // The merit shop's second line (N.js, the TaskShopDesc draw): a gated merit asks for its world's task [num2] at rank
  // num3 plus the purchases so far, and turns green once that task reaches it
  const meritGate = (merit) => {
    if (!Number(merit?.num1)) return null;
    const task = parsed?.tasksDescriptions?.[world]?.[merit.num2];
    const rank = Number(merit.num3) + (merit.level ?? 0);
    return { name: cleanUnderscore(task?.name), rank, met: !failed && (task?.level ?? 0) >= rank };
  };

  const meritCard = (merit, index) => {
    const maxed = isMaxed(merit);
    const gate = maxed ? null : meritGate(merit);
    return <ItemCard key={index} icon={`data/${merit.icon}.png`} title={meritSentence(merit)}
                     meta={failed ? undefined : `Purchases ${formatNum(merit.level ?? 0)} / ${formatNum(merit.totalLevels)}`}
                     status={maxed ? 'maxed' : undefined}
                     footer={failed ? null : <ItemCard.Cost icon={`etc/Merit_${world}.png`} iconAlt={'Merits'}
                                                            need={merit.meritCost} have={meritsOf(world)}/>}>
      {gate ? <ItemCard.Facts rows={[['Needs', failed
        ? `${gate.name} at rank ${formatNum(gate.rank)}`
        : <StatusText key={'gate'} status={gate.met ? 'done' : 'needs'} wrap>{`${gate.name} at rank ${formatNum(gate.rank)}`}</StatusText>]]}/>
        : null}
    </ItemCard>;
  };

  return (<>
    <NextSeo
      title="Merits | Idleon Toolbox"
      description="Track your merit shop purchases, point spending, and available upgrades in Legends of Idleon"
    />
    {failed ? <MissingData name={'Merits'} failed atZero/> : null}
    <PageSummary>
      {worldsArray.map((name, index) => <StatTile key={name} label={name} icon={`etc/Merit_${index}.png`}
                                                  value={failed ? '-' : formatNum(meritsOf(index))}/>)}
    </PageSummary>
    <Tabber tabs={worldsArray} keepChildren>
      <Box>
        {failed ? null : <Toolbar state={view} defaults={MERITS_TOOLBAR} onChange={setView} onReset={resetView}
                                  total={worldMerits.length} shown={shown.length} noun={'merits'}>
          <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
        </Toolbar>}
        {shown.length ? <CardGrid size={'m'}>{shown.map(meritCard)}</CardGrid> : null}
      </Box>
    </Tabber>
  </>);
};

export default Merits;
