import { Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import withBreakdown from '@components/common/DataTable/withBreakdown';
import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, formatDuration, formatNum, shownDifference } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Timer from 'components/common/Timer';
import { NextSeo } from 'next-seo';
import { calcTotals } from '@parsers/world-3/printer';
import Box from '@mui/material/Box';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import {
  calcCost,
  calcResourceToRankUp,
  calcTimeToRankUp,
  getPowerPerCycle,
  getRefineryCycles,
  getSaltsBalance
} from '@parsers/world-3/refinery';

const REFINERY_SETTINGS = { squireCycles: false, nextLevelCost: false };

// A cycle's drawer, headed with its tile's time: the parser writes the base time as "15m:00s", so every time in the
// drawer reads in the header's format instead ("15m", "100d")
const cycleDrawer = (breakdown, text) => (breakdown ? {
  ...breakdown,
  totalValue: text,
  tree: breakdown.tree?.map((node) => (node?.name === 'Base time' ? { ...node, formatted: formatDuration(node.value) } : node))
} : undefined);

const Refinery = () => {
  const { state } = useContext(AppContext);
  const [settings, setSettings, resetSettings] = usePageSettings('refinery', REFINERY_SETTINGS);
  const sectionFailed = isSectionFailed(state?.account, 'refinery');
  const printerFailed = isSectionFailed(state?.account, 'printer');
  const refinery = state?.account?.refinery ?? {};
  const salts = refinery?.salts ?? [];
  const characters = state?.characters ?? [];
  // A failed printer section's default is {}: calcTotals and getSaltsBalance need an array
  const account = { ...state?.account, printer: Array.isArray(state?.account?.printer) ? state.account.printer : [] };
  const activePrints = calcTotals(account);
  // A salt with a printed material has its max safe rank (and the action that follows it) from the printer too, so a
  // failed printer section leaves it unknown
  const saltsBalance = getSaltsBalance(account, characters).map((salt) => (printerFailed
  && (salts?.[salt?.index]?.cost ?? []).some(({ rawName }) => !rawName?.includes('Refinery'))
    ? { ...salt, printUnknown: true }
    : salt));
  // calcTimeToRankUp below reads the same clock in render: a data page's Timer dates
  const { squiresCycles = 0, squiresCooldowns = [], cycles = [] } = getRefineryCycles(account, characters, state?.lastUpdated) ?? {};
  const unlockedSalts = salts.filter(({ unlocked }) => unlocked !== false);
  const lockedSalts = salts.filter(({ unlocked }) => unlocked === false);

  const getFuelTime = (rank, costs, saltIndex) => {
    if (!costs) return 0;
    const timeArray = [];
    costs.forEach((cost) => {
      const baseCost = calcCost(refinery, rank, cost?.quantity, cost?.rawName, saltIndex);
      if (baseCost > cost?.totalAmount) {
        timeArray.push(0)
      }
      timeArray.push((cost?.totalAmount ?? 0) / (baseCost));
    });

    return Math.min(...timeArray);
  }

  const saltPanel = (salt, saltIndex) => {
    const { saltName, refined, powerCap, rawName, rank, active, cost, autoRefinePercentage } = salt;
    const hasMaterialsForCycle = cost?.every(({ rawName, quantity, totalAmount }) =>
      totalAmount >= calcCost(refinery, rank, quantity, rawName, saltIndex));
    const powerPerCycle = getPowerPerCycle(rank, account);
    const combustionTime = cycles[Math.floor(saltIndex / 3)]?.time;
    const fuelTime = combustionTime ? getFuelTime(rank, cost, saltIndex) * combustionTime : 0;
    const saltPerHour = combustionTime ? powerPerCycle * 3600 / combustionTime : 0;
    const previousRank = saltIndex !== 0 && combustionTime ? salts?.[saltIndex - 1]?.rank : null;
    const previousPowerPerCycle = previousRank ? getPowerPerCycle(previousRank, account) : null;
    const previousSaltPerHour = previousPowerPerCycle
      ? previousPowerPerCycle * 3600 / cycles[Math.floor((saltIndex - 1) / 3)]?.time
      : null;
    const { timeLeft, totalTime, ready } = calcTimeToRankUp(account, characters, state?.lastUpdated, { squiresCycles },
      Boolean(settings?.squireCycles), rank, powerCap, refined, saltIndex);
    const saltState = !active ? <StatusText status={'info'}>Inactive</StatusText>
      : !hasMaterialsForCycle ? <StatusText status={'needs'}>Missing materials</StatusText>
        : ready ? <StatusText status={'ready'}>Rank up</StatusText> : null;
    // The game's auto refine field is a 0 / 0.01 toggle, so a percentage would read as a rounding bug
    const meta = `Rank ${formatNum(rank)} · Auto refine ${autoRefinePercentage > 0 ? 'on' : 'off'}`;
    const rows = (cost ?? []).map(({ name, rawName, quantity, totalAmount }) => {
      const cycleCost = calcCost(refinery, rank, quantity, rawName, saltIndex);
      const nextLevelCost = calcCost(refinery, rank + 1, quantity, rawName, saltIndex);
      const costPerHour = cycleCost * 3600 / combustionTime;
      const nextLevelPerHour = nextLevelCost * 3600 / combustionTime;
      const isSalt = rawName?.includes('Refinery');
      const isCritter = rawName?.includes('Critter');
      // What keeps coming in per hour: the salt above for a salt, the printer for the rest. Traps aren't counted.
      const gainPerHour = isCritter ? null : isSalt ? previousSaltPerHour : (activePrints?.[rawName]?.boostedValue || 0);
      // A failed printer section: what a material gets printed is unknown, so its rate is "-" and no short rests on it
      const printUnknown = printerFailed && !isSalt && !isCritter;
      const short = cycleCost > totalAmount;
      const gain = gainPerHour ?? 0;
      const uncovered = (amount) => !printUnknown && short && gain < amount;
      return {
        name, rawName, totalAmount, gainPerHour, printUnknown, showNext: Boolean(settings?.nextLevelCost),
        cycle: { value: cycleCost, next: nextLevelCost, short: uncovered(cycleCost), nextShort: uncovered(nextLevelCost) },
        hour: {
          value: costPerHour,
          next: nextLevelPerHour,
          short: uncovered(costPerHour) || (isSalt && costPerHour > previousSaltPerHour),
          nextShort: uncovered(nextLevelPerHour) || (isSalt && nextLevelPerHour > previousSaltPerHour)
        },
        rankUp: {
          value: calcResourceToRankUp(rank, refined, powerCap, cycleCost),
          next: calcResourceToRankUp(rank + 1, refined, powerCap, nextLevelCost),
          short,
          nextShort: nextLevelCost > totalAmount
        }
      };
    });
    return <Panel key={`${saltName}-${saltIndex}`} icon={`data/${rawName}.png`} title={cleanUnderscore(saltName)}
                  meta={meta} aside={saltState}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 320px) 1fr' },
        alignItems: 'start'
      }}>
        <Box sx={{ py: 1 }}>
          <Panel.KV label={'Rank up in'} value={active ? <Timer type={'countdown'} component={'span'}
                                                                lastUpdated={state?.lastUpdated}
                                                                pause={!hasMaterialsForCycle} date={timeLeft}
                                                                placeholder={hasMaterialsForCycle
                                                                  ? <StatusText status={'ready'}/>
                                                                  : <Typography component={'span'} variant={'body2'} color={'text.secondary'}>Paused</Typography>}/>
            : '-'}/>
          <Panel.KV label={'From empty'} value={<Timer staticTime component={'span'} date={totalTime}
                                                       lastUpdated={state?.lastUpdated}/>}/>
          <Panel.KV label={'Fuel lasts'} value={fuelTime ? <Timer type={'countdown'} component={'span'}
                                                                  date={new Date().getTime() + fuelTime * 1000}
                                                                  lastUpdated={state?.lastUpdated} placeholder={'Empty'}/> : 'Empty'}/>
          <Panel.KV label={'Power per cycle'} value={formatNum(powerPerCycle)}/>
          <Panel.KV label={'Power per hour'} value={formatNum(saltPerHour)}/>
          <Box sx={{ px: 2, pt: 1, pb: 1 }}>
            {/* The game draws a salt's power as Whole(refined) / Whole(PowerCAP) */}
            <ItemCard.Progress label={'Power'} percent={powerCap > 0 ? Math.min(100, (refined / powerCap) * 100) : 0}
                               value={formatGame(refined ?? 0, 'Refinery.PowerCAP', { whole: true })}
                               max={formatGame(powerCap ?? 0, 'Refinery.PowerCAP', { whole: true })}/>
          </Box>
        </Box>
        <Box sx={{ width: '100%', minWidth: 0, p: 2 }}>
          <DataTable columns={COST_COLUMNS} rows={rows} rowKey={'rawName'} rowLabel={({ name }) => cleanUnderscore(name)}/>
        </Box>
      </Box>
    </Panel>;
  };

  return <>
    <NextSeo
      title="Refinery | Idleon Toolbox"
      description="Keep track of your refinery levels, timing, required materials and more"
    />
    {unlockedSalts.length ? <PageSettings state={settings} defaults={REFINERY_SETTINGS} onChange={setSettings}
                                          onReset={resetSettings}>
      <PageSettings.Toggle name={'squireCycles'} label={'Count squire cycles'}
                           help={'Adds the cycles your squires\' Refinery Throttle makes each day to every rank up time.'}/>
      <PageSettings.Toggle name={'nextLevelCost'} label={'Show next level cost'}
                           help={'Each cost also shows what the next rank costs.'}/>
    </PageSettings> : null}
    {sectionFailed ? <MissingData name={'Refinery'} failed atZero={!isParseFailed(state?.account)}/> : printerFailed ? <MissingData name={'Printer'} failed/> : null}
    <PageSummary>
      {cycles.map(({ name, time, breakdown }) => {
        const text = formatDuration(time);
        return <StatTile key={name} label={`${name} cycle time`} value={text}
                         sub={`${formatNum(3600 / time, 'amount', { precise: true })} cycles per hour`}
                         breakdown={cycleDrawer(breakdown, text)}
                         breakdownTitle={`${name} cycle time`}/>;
      })}
      {squiresCooldowns.length ? <StatTile label={'Squire cycles'} value={`${formatNum(squiresCycles)} per day`}
                                           sub={settings?.squireCycles ? 'Counted in rank up times' : 'Not counted'}/> : null}
    </PageSummary>
    {squiresCooldowns.length ? <Panel icon={'data/UISkillIcon130.png'} title={'Refinery Throttle'}
                                      meta={'Each squire\'s next cast'} sx={{ mb: 3 }}>
      <Box sx={{ py: 1 }}>
        {squiresCooldowns.map(({ name, cooldown }, index) => <Panel.KV key={`${name}-${index}`} label={name}
                                                                       value={<Timer type={'countdown'} component={'span'}
                                                                                     date={cooldown} lastUpdated={state?.lastUpdated}
                                                                                     placeholder={<StatusText status={'ready'}/>}/>}/>)}
      </Box>
    </Panel> : null}
    <SaltChainSummary balances={saltsBalance}/>
    {unlockedSalts.length ? <Stack gap={2} sx={{ mt: 3 }}>
      {salts.map((salt, saltIndex) => (salt?.unlocked === false ? null : saltPanel(salt, saltIndex)))}
    </Stack> : null}
    {lockedSalts.length ? <Panel title={'Locked salts'} sx={{ mt: 3 }}>
      <Box sx={{ p: 2 }}>
        <CardGrid size={'icon'}>
          {lockedSalts.map(({ saltName, rawName }) => <IconTile key={rawName} icon={`data/${rawName}.png`}
                                                                alt={cleanUnderscore(saltName)} status={'missing'}
                                                                details={`${cleanUnderscore(saltName)}: locked`}/>)}
        </CardGrid>
      </Box>
    </Panel> : null}
  </>
};

// Each salt is fuelled by the one above it, so the numbers that matter are comparisons down the
// chain: a table reads them at a glance where per-card lines would need scrolling between salts.
// Ranks are permanent, so a salt past its limit can't be walked back: it only recovers when the
// salt feeding it grows. That makes "wait for the one above" the honest answer for those rows,
// where the numbers alone leave the reader stuck.
const getSaltAction = ({
                         unlocked,
                         active,
                         autoRefinePercentage,
                         rank,
                         maxSafeRank,
                         outputMaxed,
                         isDeficit,
                         limitedBy,
                         printUnknown
                       }) => {
  if (!unlocked || !active || outputMaxed) return null;
  // A failed printer section: the rank it allows is unknown, and so is what to do
  if (printUnknown) return { label: '-', color: 'text.secondary' };
  if (rank >= maxSafeRank) {
    if (!limitedBy) return null;
    return limitedBy.isPrinter
      ? { label: `Print more ${cleanUnderscore(limitedBy.name)}`, color: 'text.warning' }
      : { label: `Wait for ${cleanUnderscore(limitedBy.name)}`, color: 'text.secondary' };
  }
  // Auto refine never lets a salt bank power to its cap, so its rank is frozen. Only worth
  // mentioning when something downstream is starving on it: otherwise it's a deliberate setting.
  if (autoRefinePercentage > 0) {
    return isDeficit ? { label: 'Turn auto refine off', color: 'text.warning' } : null;
  }
  return { label: 'Rank up', color: 'text.success' };
}

const MAX_RANK_NOTE = 'Highest rank the salt above and your printer can both keep up with. Only materials being printed count, stockpiled ones run on the fuel timer';

const ACTIONS = [
  { label: 'Rank up', color: 'text.success', text: 'Room to grow before it out-consumes the salt above or your printer' },
  { label: 'Print more', color: 'text.warning', text: 'Your printer makes less of a material than the next rank needs' },
  { label: 'Turn auto refine off', color: 'text.warning', text: 'Auto refine freezes the rank' },
  { label: 'Wait for a salt', color: 'text.secondary', text: 'Ranks are permanent. This one recovers when the salt above grows' }
];

const ActionLegend = () => <Stack gap={1.5}>
  {ACTIONS.map(({ label, color, text }) => <Stack key={label}>
    <Typography variant={'body2'} color={color}>{label}</Typography>
    <Typography variant={'body2'}>{text}</Typography>
  </Stack>)}
</Stack>;

const CappedRank = ({ rank }) => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: .5 }}>
  {formatNum(rank)} (capped)
  <InfoButton label={'capped rank'}>Power per cycle is capped, so ranking up adds cost but no output</InfoButton>
</Box>;

const SALT_COLUMNS = [
  {
    key: 'salt', label: 'Salt', sortable: true, value: (salt) => cleanUnderscore(salt.saltName),
    icon: (salt) => <GameIcon src={`data/${salt.rawName}.png`} alt={''} size={24} status={salt.unlocked ? undefined : 'missing'}/>
  },
  { key: 'rank', label: 'Rank', numeric: true, sortable: true, value: (salt) => salt.rank,
    render: (salt) => formatNum(salt.rank) },
  { key: 'produced', label: 'Produced /hr', numeric: true, sortable: true, value: (salt) => salt.outputPerHour,
    render: (salt) => formatNum(salt.outputPerHour) },
  {
    key: 'consumed', label: 'Consumed /hr', numeric: true, sortable: true,
    value: (salt) => (salt.consumedPerHour > 0 ? salt.consumedPerHour : null),
    render: (salt) => (salt.consumedPerHour > 0 ? formatNum(salt.consumedPerHour) : null)
  },
  // The phone's one number, as the board picks it. A salt nothing consumes is not in surplus: no color. Beside the two
  // rates it is their difference as shown (the bracket rule), so "146" and "12" read "+134"
  {
    key: 'balance', label: 'Balance /hr', numeric: true, change: 'higher', sortable: true, phone: true,
    value: (salt) => salt.balancePerHour,
    render: (salt) => formatNum(salt.consumedPerHour > 0
      ? shownDifference(formatNum(salt.consumedPerHour), formatNum(salt.outputPerHour))
      : salt.balancePerHour, 'amount', { signed: true }),
    tone: (salt) => (salt.consumedPerHour === 0 ? null : salt.isDeficit ? 'bad' : 'good')
  },
  {
    key: 'maxSafeRank', label: 'Max safe rank', numeric: true, sortable: true, info: MAX_RANK_NOTE,
    value: (salt) => (salt.outputMaxed ? salt.rank : salt.printUnknown ? null : salt.maxSafeRank),
    render: (salt) => (salt.outputMaxed ? <CappedRank rank={salt.rank}/> : salt.printUnknown ? '-' : formatNum(salt.maxSafeRank)),
    wrap: withBreakdown((salt) => (salt.printUnknown && !salt.outputMaxed ? null : salt.maxSafeRankBreakdown))
  },
  {
    // Below a 1000 px window the row has no room for it: it waits in the row's Details, under the chevron
    key: 'action', label: 'Action', info: <ActionLegend/>, from: 1000, render: (salt) => {
      const action = getSaltAction(salt);
      return action ? <Typography component={'span'} variant={'body2'} color={action.color} noWrap>{action.label}</Typography> : null;
    }
  }
];

const SaltChainSummary = ({ balances }) => {
  if (!balances?.length) return null;
  return <DataTable columns={SALT_COLUMNS} rows={balances} rowKey={'rawName'}
                    rowLabel={(salt) => cleanUnderscore(salt.saltName)}
                    mutedWord={(salt) => (salt.unlocked ? null : 'Locked')} surface={'card'}/>;
}

// A cost cell: the amount, "short" when the stock and what comes in can't cover it, and with Show next level cost on,
// the next rank's amount under it.
const CostAmount = ({ value, next, short, nextShort, showNext }) => <>
  <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
    {formatNum(value, 'whole')}
    {short ? <StatusText status={'problem'}>short</StatusText> : null}
  </Box>
  {showNext && next ? <Typography variant={'caption'} component={'div'} color={'text.secondary'} sx={{ whiteSpace: 'nowrap' }}>
    next {formatNum(next, 'whole')}{nextShort ? ', short' : ''}
  </Typography> : null}
</>;

const costColumn = (key, label) => ({
  key, label, numeric: true,
  render: (row) => <CostAmount {...row[key]} showNext={row.showNext}/>
});

const COST_COLUMNS = [
  {
    key: 'material', label: 'Material', value: ({ name }) => cleanUnderscore(name),
    icon: ({ rawName }) => <GameIcon src={`data/${rawName}.png`} alt={''} size={24}/>
  },
  costColumn('cycle', 'Cycle'),
  costColumn('hour', 'Hour'),
  costColumn('rankUp', 'Rank up'),
  { key: 'owned', label: 'Owned', numeric: true, render: ({ totalAmount }) => formatNum(totalAmount, 'whole') },
  {
    key: 'printing', label: 'Printing /hr', numeric: true,
    info: 'What keeps coming in per hour: the printer for a material, the salt above for a salt. Trapped critters are not counted.',
    render: ({ gainPerHour, printUnknown }) => (printUnknown ? '-' : gainPerHour == null ? null : formatNum(gainPerHour))
  }
];

export default Refinery;
