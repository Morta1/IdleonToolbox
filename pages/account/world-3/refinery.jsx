import { LinearProgress, Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import InfoButton, { DottedValue } from '@components/common/InfoButton';
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
// A card per salt holds only what that salt costs. What players compare down the chain (power, the rank up and fuel
// timers) sits in the salt table: in nine cards, the one salt about to run dry was the sixth card down.
// 600: a salt with short rows on most materials (Anionic's six) needs about 520 px of table, and a card gives it 34 less
const SALTS_GRID_SX = { mt: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(min(600px, 100%), 1fr))' };

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
  const account = state?.account;
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

  // One salt's timers, power and material rows: the salt table reads the first, its card the rows
  const saltFacts = (salt, saltIndex) => {
    const { refined, powerCap, rank, active, cost, autoRefinePercentage } = salt;
    const hasMaterialsForCycle = cost?.every(({ rawName, quantity, totalAmount }) =>
      totalAmount >= calcCost(refinery, rank, quantity, rawName, saltIndex));
    const powerPerCycle = getPowerPerCycle(rank, account);
    const combustionTime = cycles[Math.floor(saltIndex / 3)]?.time;
    const fuelTime = combustionTime ? getFuelTime(rank, cost, saltIndex) * combustionTime : 0;
    const previousRank = saltIndex !== 0 && combustionTime ? salts?.[saltIndex - 1]?.rank : null;
    const previousPowerPerCycle = previousRank ? getPowerPerCycle(previousRank, account) : null;
    const previousSaltPerHour = previousPowerPerCycle
      ? previousPowerPerCycle * 3600 / cycles[Math.floor((saltIndex - 1) / 3)]?.time
      : null;
    const { timeLeft, totalTime } = calcTimeToRankUp(account, characters, state?.lastUpdated, { squiresCycles },
      Boolean(settings?.squireCycles), rank, powerCap, refined, saltIndex);
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
    return {
      active, hasMaterialsForCycle, timeLeft, totalTime, fuelTime, powerPerCycle, rows,
      autoRefine: autoRefinePercentage > 0,
      // The game draws a salt's power as Whole(refined) / Whole(PowerCAP)
      power: { refined: refined ?? 0, cap: powerCap ?? 0, percent: powerCap > 0 ? Math.min(100, (refined / powerCap) * 100) : 0 },
      // What runs a salt dry: the materials its stock and what comes in can't cover, as its card marks them short
      short: rows.filter(({ cycle }) => cycle.short).map(({ name, rawName }) => ({ name, rawName }))
    };
  };
  const factsOf = salts.map((salt, saltIndex) => (salt?.unlocked === false ? null : saltFacts(salt, saltIndex)));
  const chainRows = saltsBalance.map((row) => ({ ...row, facts: factsOf[row.index] ?? null, lastUpdated: state?.lastUpdated }));

  // Its card: what the salt costs. The state is why it can't run (inactive, short of materials); whether it is worth
  // ranking up is the salt table's Action, so the card no longer says "Rank up" where the table says "Wait"
  const saltPanel = (salt, saltIndex) => {
    const { saltName, rawName, rank, autoRefinePercentage } = salt;
    const { active, hasMaterialsForCycle, rows } = factsOf[saltIndex];
    const saltState = !active ? <StatusText status={'info'}>Inactive</StatusText>
      : !hasMaterialsForCycle ? <StatusText status={'needs'}>Missing materials</StatusText> : null;
    // The game's auto refine field is a 0 / 0.01 toggle, so a percentage would read as a rounding bug
    const meta = `Rank ${formatNum(rank)} · Auto refine ${autoRefinePercentage > 0 ? 'on' : 'off'}`;
    return <Panel key={`${saltName}-${saltIndex}`} icon={`data/${rawName}.png`} title={cleanUnderscore(saltName)}
                  meta={meta} aside={saltState}>
      {/* The card's body is the container its columns' room is measured on */}
      <Box sx={{ containerType: 'inline-size' }}><Box sx={{ p: 2 }}>
        {/* dense: six columns at the usual padding outgrew a 580 px card (three across at 2,410 px) and scrolled sideways */}
        <DataTable dense columns={COST_COLUMNS} rows={rows} rowKey={'rawName'} rowLabel={({ name }) => cleanUnderscore(name)}/>
      </Box></Box>
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
      {/* A tile per squire, as the old page had them: a full-width panel put each name a page's width from its time */}
      {squiresCooldowns.map(({ name, cooldown }, index) => <StatTile key={`${name}-${index}`} icon={'data/UISkillIcon130.png'}
                                                                     label={name} sub={'Refinery Throttle'}
                                                                     value={<Timer type={'countdown'} component={'span'}
                                                                                   date={cooldown} lastUpdated={state?.lastUpdated}
                                                                                   placeholder={<StatusText status={'ready'}/>}/>}/>)}
    </PageSummary>
    {/* Locked salts are the table's Locked rows: a panel of their dim sprites repeated them */}
    <SaltChainSummary balances={chainRows} failed={sectionFailed}/>
    {unlockedSalts.length ? <CardGrid size={'l'} sx={SALTS_GRID_SX}>
      {salts.map((salt, saltIndex) => (salt?.unlocked === false ? null : saltPanel(salt, saltIndex)))}
    </CardGrid> : null}
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

const MUTED = (text) => <Typography component={'span'} variant={'body2'} color={'text.secondary'} noWrap>{text}</Typography>;

// Power to its cap: the numbers over a bar, green when full. A note holds the rest of what the card's facts had
const PowerCell = ({ power, powerPerCycle, totalTime, lastUpdated }) => <Box sx={{ minWidth: 88 }}>
  <DottedValue label={'power'} note={<Stack gap={0.5}>
    <Typography variant={'body2'}>Power per cycle: {formatNum(powerPerCycle)}</Typography>
    <Typography variant={'body2'} component={'div'}>
      Full from empty in <Timer staticTime component={'span'} date={totalTime} lastUpdated={lastUpdated}/>
    </Typography>
  </Stack>}>
    {formatGame(power.refined, 'Refinery.PowerCAP', { whole: true })} / {formatGame(power.cap, 'Refinery.PowerCAP', { whole: true })}
  </DottedValue>
  <LinearProgress variant={'determinate'} value={power.percent} color={power.percent >= 100 ? 'success' : 'primary'}
                  aria-label={'Power'} sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: 'divider' }}/>
</Box>;

// Ready, a countdown, or why it isn't moving: paused on a missing material (greyed, with the time it would take once it
// runs again: #82), frozen by auto refine (its power never banks to the cap), or inactive
const rankUpIn = ({ active, autoRefine, hasMaterialsForCycle, timeLeft }, lastUpdated) => {
  if (!active) return MUTED('Inactive');
  if (autoRefine) return MUTED('Auto refine');
  if (!hasMaterialsForCycle) {
    if (!Number.isFinite(timeLeft) || timeLeft <= Date.now()) return MUTED('Paused');
    return MUTED(<><Timer type={'countdown'} staticTime component={'span'} date={timeLeft}/>, paused</>);
  }
  return <Timer type={'countdown'} component={'span'} lastUpdated={lastUpdated} date={timeLeft}
                placeholder={<StatusText status={'ready'}/>}/>;
};

// How long the stock runs, and when it's empty, the sprites of what ran out (their names are on the salt's card)
const FuelCell = ({ fuelTime, short, lastUpdated }) => <Stack direction={'row'} gap={0.75} alignItems={'center'}
                                                               justifyContent={'flex-end'} sx={{ whiteSpace: 'nowrap' }}>
  {fuelTime ? <Timer type={'countdown'} component={'span'} date={new Date().getTime() + fuelTime * 1000}
                     lastUpdated={lastUpdated} placeholder={<StatusText status={'needs'}>Empty</StatusText>}/>
    : <StatusText status={'needs'}>Empty</StatusText>}
  {short.map(({ name, rawName }) => <GameIcon key={rawName} src={`data/${rawName}.png`} size={24} alt={cleanUnderscore(name)}/>)}
</Stack>;

// The columns join by the page's width, not the window's: beside one side ad the page is the window less 364 px, and
// columns that came in by the window scrolled the table sideways from 900 px to about 1,300 (a 1280 laptop included).
// Every column takes 1,260 to 1,390 px (more with a fuel cell's sprites), so the ones a player reads least wait in the
// row's Details first: Produced and Consumed (Balance is their difference), then Rank (its card's meta has it), then Max
// safe rank (Action says what it means). Rooms measured on the demo, with about 60 px for four sprites.
const FLOW = { room: 1460 };
const ROOM = { rank: { room: 1200 }, maxSafeRank: { room: 1100 }, action: { room: 900 }, fuel: { room: 700 }, rankUpIn: { room: 520 }, power: { room: 430 } };
const SALT_COLUMNS = [
  {
    key: 'salt', label: 'Salt', sortable: true, value: (salt) => cleanUnderscore(salt.saltName),
    icon: (salt) => <GameIcon src={`data/${salt.rawName}.png`} alt={''} size={24} status={salt.unlocked ? undefined : 'missing'}/>
  },
  { key: 'rank', label: 'Rank', numeric: true, sortable: true, from: ROOM.rank, value: (salt) => salt.rank,
    render: (salt) => formatNum(salt.rank) },
  {
    key: 'power', label: 'Power', numeric: true, sortable: true, from: ROOM.power, value: (salt) => salt.facts?.power?.percent ?? null,
    render: ({ facts, lastUpdated }) => (facts ? <PowerCell {...facts} lastUpdated={lastUpdated}/> : null)
  },
  {
    key: 'rankUpIn', label: 'Rank up in', numeric: true, sortable: true, from: ROOM.rankUpIn,
    value: ({ facts }) => (facts?.active && !facts?.autoRefine ? facts.timeLeft : null),
    render: ({ facts, lastUpdated }) => (facts ? rankUpIn(facts, lastUpdated) : null)
  },
  {
    key: 'fuel', label: 'Fuel lasts', numeric: true, sortable: true, from: ROOM.fuel, value: ({ facts }) => facts?.fuelTime ?? null,
    render: ({ facts, lastUpdated }) => (facts ? <FuelCell {...facts} lastUpdated={lastUpdated}/> : null)
  },
  { key: 'produced', label: 'Produced /hr', numeric: true, sortable: true, from: FLOW, value: (salt) => salt.outputPerHour,
    render: (salt) => formatNum(salt.outputPerHour) },
  {
    key: 'consumed', label: 'Consumed /hr', numeric: true, sortable: true, from: FLOW,
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
    key: 'maxSafeRank', label: 'Max safe rank', numeric: true, sortable: true, info: MAX_RANK_NOTE, from: ROOM.maxSafeRank,
    value: (salt) => (salt.outputMaxed ? salt.rank : salt.printUnknown ? null : salt.maxSafeRank),
    render: (salt) => (salt.outputMaxed ? <CappedRank rank={salt.rank}/> : salt.printUnknown ? '-' : formatNum(salt.maxSafeRank)),
    wrap: withBreakdown((salt) => (salt.printUnknown && !salt.outputMaxed ? null : salt.maxSafeRankBreakdown))
  },
  {
    key: 'action', label: 'Action', info: <ActionLegend/>, from: ROOM.action, render: (salt) => {
      const action = getSaltAction(salt);
      return action ? <Typography component={'span'} variant={'body2'} color={action.color} noWrap>{action.label}</Typography> : null;
    }
  }
];

const SaltChainSummary = ({ balances, failed }) => {
  if (!balances?.length) return null;
  // As wide as its columns, as the old page's: stretched to the page, each salt's numbers spread 300 px apart at 2560.
  // From lg only, where every column shows: a phone's two columns would leave it short of the cards' edge. The outer box
  // is the container the columns' room is measured on: a container can't take its width from its content.
  return <Box sx={{ containerType: 'inline-size' }}>
    <Box sx={{ width: { xs: '100%', lg: 'fit-content' }, maxWidth: '100%' }}>
      {/* The Sort field leaves once Fuel lasts shows: past it only Rank, Max safe rank and the two rates fold, and the
          headers sort the rest */}
      <DataTable columns={SALT_COLUMNS} rows={balances} rowKey={'rawName'} sortField={ROOM.fuel}
                 rowLabel={(salt) => cleanUnderscore(salt.saltName)}
                 mutedWord={(salt) => (salt.unlocked ? null : failed ? '-' : 'Locked')} surface={'card'}/>
    </Box>
  </Box>;
}

// A cost cell: the amount, "short" when the stock and what comes in can't cover it, and with Show next level cost on,
// the next rank's amount. Each on its own line, so a short cost never widens its column: beside the amount it made a
// half-width salt's table scroll.
const CostAmount = ({ value, next, short, nextShort, showNext }) => <>
  <Box sx={{ whiteSpace: 'nowrap' }}>{formatNum(value, 'whole')}</Box>
  {short ? <Box sx={{ whiteSpace: 'nowrap' }}><StatusText status={'problem'}>short</StatusText></Box> : null}
  {showNext && next ? <Typography variant={'caption'} component={'div'} color={'text.secondary'} sx={{ whiteSpace: 'nowrap' }}>
    next {formatNum(next, 'whole')}{nextShort ? ', short' : ''}
  </Typography> : null}
</>;

const costColumn = (key, label, from) => ({
  key, label, numeric: true, from,
  render: (row) => <CostAmount {...row[key]} showNext={row.showNext}/>
});

// The last three join by the card's width (its body is the container), not the window's: a salt with short rows on most
// materials needs about 527 px of table, which a card gives from 570, and beside one side ad a 900 px window's card had 502
const ALL_COSTS = { room: 570 };
const COST_COLUMNS = [
  {
    key: 'material', label: 'Material', value: ({ name }) => cleanUnderscore(name),
    icon: ({ rawName }) => <GameIcon src={`data/${rawName}.png`} alt={''} size={24}/>
  },
  costColumn('cycle', 'Cycle'),
  costColumn('hour', 'Hour'),
  costColumn('rankUp', 'Rank up', ALL_COSTS),
  { key: 'owned', label: 'Owned', numeric: true, from: ALL_COSTS, render: ({ totalAmount }) => formatNum(totalAmount, 'whole') },
  {
    key: 'printing', label: 'Printing /hr', numeric: true, from: ALL_COSTS,
    info: 'What keeps coming in per hour: the printer for a material, the salt above for a salt. Trapped critters are not counted.',
    render: ({ gainPerHour, printUnknown }) => (printUnknown ? '-' : gainPerHour == null ? null : formatNum(gainPerHour))
  }
];

export default Refinery;
