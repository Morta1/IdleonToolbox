import {
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import StatusText from '@components/common/StatusText';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import withBreakdown from '@components/common/DataTable/withBreakdown';
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, kFormatter, notateNumber, numberWithCommas, prefix } from 'utility/helpers';
import Timer from 'components/common/Timer';
import ProgressBar from 'components/common/ProgressBar';
import { NextSeo } from 'next-seo';
import { calcTotals } from '@parsers/world-3/printer';
import Box from '@mui/material/Box';
import { CardTitleAndValue } from '@components/common/styles';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import {
  calcCost,
  calcResourceToRankUp,
  calcTimeToRankUp,
  getPowerPerCycle,
  getRefineryCycles,
  getSaltsBalance
} from '@parsers/world-3/refinery';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const saltsColors = ['#EF476F', '#ff8d00', '#00dcff', '#cdff68', '#d822cb', '#9a9ca4', 'yellow']
const boldSx = { fontWeight: 'bold' };

const Refinery = () => {
  const { state } = useContext(AppContext);
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const { refinery } = state?.account;
  const [includeSquireCycles, setIncludeSquireCycles] = useState(false);
  const [squiresCycles, setSquiresCycles] = useState(0);
  const [showNextLevelCost, setShowNextLevelCost] = useState(false);
  const [squiresCooldown, setSquiresCooldown] = useState([]);
  const [refineryCycles, setRefineryCycles] = useState([]);
  const activePrints = calcTotals(state?.account);
  const saltsBalance = getSaltsBalance(state?.account, state?.characters);

  useEffect(() => {
    const {
      squiresCycles,
      squiresCooldowns,
      cycles
    } = getRefineryCycles(state?.account, state?.characters, state?.lastUpdated);

    setSquiresCycles(squiresCycles);
    setSquiresCooldown(squiresCooldowns);
    setRefineryCycles(cycles);
  }, [state?.lastUpdated]);

  const getFuelTime = (rank, costs, saltIndex) => {
    if (!costs) return [];
    const timeArray = [];
    costs.forEach((cost) => {
      const baseCost = calcCost(state?.account?.refinery, rank, cost?.quantity, cost?.rawName, saltIndex);
      if (baseCost > cost?.totalAmount) {
        timeArray.push(0)
      }
      timeArray.push((cost?.totalAmount ?? 0) / (baseCost));
    });

    return Math.min(...timeArray);
  }

  return <>
    <NextSeo
      title="Refinery | Idleon Toolbox"
      description="Keep track of your refinery levels, timing, required materials and more"
    />
    <Stack mt={3} direction={'row'} flexWrap={'wrap'} gap={2}>
      {squiresCooldown?.map(({ name, cooldown, talentId }, index) => {
        return <Card sx={{ display: 'flex', alignItems: 'center' }} key={name + ' ' + index}>
          <CardContent sx={{ '&:last-child': { padding: 2 } }}>
            <Stack direction={'row'} gap={1} alignItems={'center'}>
              <img src={`${prefix}data/UISkillIcon130.png`} alt="skill-icon"/>
              <Stack alignItems={'center'}>
                <Typography sx={boldSx}>{name}</Typography>
                <Timer placeholder={<StatusText status={'ready'}/>}
                       type={'countdown'} date={cooldown} lastUpdated={state?.lastUpdated}/>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
      {refineryCycles?.map((cycle, index) => {
        const { name, time, timePast, breakdown } = cycle;
        const minutes = Math.floor((time) / 60);
        const seconds = Math.floor(time % 60);
        return <Card key={`${name}-${index}`}>
          <CardContent>
            <Stack direction={'row'} gap={2} alignItems={'center'}>
              <Typography
                sx={{ ...boldSx, color: index === 0 ? 'error.light' : index === 1 ? 'success.light' : 'warning.light' }}
                variant={'body1'}>{name}</Typography>
              <Breakdown data={breakdown}>
                <Stack alignContent={'center'}>
                  <IconInfoCircleFilled size={18}/>
                </Stack>
              </Breakdown>
            </Stack>
            <Typography sx={boldSx}>Max cycle time: <span
              style={{ fontWeight: 400 }}>{minutes}m:{seconds < 10 ? `0${seconds}` : seconds}s</span></Typography>
            <Typography sx={boldSx}>Cycles: <span
              style={{ fontWeight: 400 }}>{kFormatter(3600 / time, 2)}/hr</span></Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Stack mt={3} mb={3} direction={'row'} gap={2}>
      <CardTitleAndValue title={'More cycles'} stackProps>
        <FormControlLabel
          control={<Checkbox checked={includeSquireCycles}
                             onChange={(e) => setIncludeSquireCycles(e.target.checked)}/>}
          label="Include squires cycles"/>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Material cost'} stackProps>
        <FormControlLabel
          control={<Checkbox checked={showNextLevelCost}
                             onChange={(e) => setShowNextLevelCost(e.target.checked)}/>}
          label="Show next level cost"/>
      </CardTitleAndValue>
    </Stack>
    <SaltChainSummary balances={saltsBalance}/>
    <Stack mt={3} gap={3} direction={'row'} flexWrap={'wrap'}>
      {refinery?.salts?.map((salt, saltIndex) => {
        const { saltName, refined, powerCap, rawName, rank, active, cost, autoRefinePercentage, unlocked } = salt;
        // Locked salts are rendered in their own row below - they're small enough that they'd
        // otherwise wrap up beside the last unlocked salt.
        if (unlocked === false) return null;
        const progressPercentage = refined / powerCap * 100;
        const hasMaterialsForCycle = cost?.every(({
                                                    rawName,
                                                    quantity,
                                                    totalAmount
                                                  }) => totalAmount >= calcCost(state?.account?.refinery, rank, quantity, rawName, saltIndex));
        const powerPerCycle = getPowerPerCycle(rank, state?.account);
        let fuelTime, combustionTime, saltPerHour, previousSaltPerHour, previousPowerPerCycle;
        if (refineryCycles.length) {
          fuelTime = getFuelTime(rank, cost, saltIndex) * refineryCycles[Math.floor(saltIndex / 3)]?.time;
          combustionTime = refineryCycles[Math.floor(saltIndex / 3)]?.time;
          saltPerHour = powerPerCycle * 3600 / combustionTime;
          if (saltIndex !== 0) {
            const previousCombustionTime = refineryCycles[Math.floor((saltIndex - 1) / 3)]?.time;
            const previousRank = refinery?.salts?.[saltIndex - 1]?.rank;
            previousPowerPerCycle = previousRank ? getPowerPerCycle(previousRank, state?.account) : null;
            previousSaltPerHour = previousPowerPerCycle ? previousPowerPerCycle * 3600 / previousCombustionTime : null;
          }
        }
        const {
          timeLeft,
          totalTime
        } = calcTimeToRankUp(state?.account, state?.characters, state?.lastUpdated, { squiresCycles }, includeSquireCycles, rank, powerCap, refined, saltIndex);
        return <Card key={`${saltName}-${saltIndex}`} sx={{ width: 'fit-content', pr: 3 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'flex-start'} gap={3} flexWrap={'wrap'}>
              <Stack alignItems={'center'} alignSelf={'center'}>
                <img src={`${prefix}data/${rawName}.png`} alt="salt-icon"/>
                Rank: {rank}
              </Stack>
              <Stack alignSelf={'center'} sx={{ width: { md: 250 } }} gap={.5}>
                <Typography variant={'cardTitle'} component={'h3'}>{cleanUnderscore(saltName)}</Typography>
                {/* The game's auto refine field is a 0 / 0.01 toggle, so a percentage reads as a
                    rounding bug rather than a setting. */}
                <Typography>Auto refine: {autoRefinePercentage > 0 ? 'On' : 'Off'}</Typography>
                {/* Separates the timers from the settings above without a divider. */}
                <Typography component={'span'} sx={{ ...boldSx, mt: .5 }}>Rank up: {active ? <Timer
                    type={'countdown'}
                    lastUpdated={state?.lastUpdated}
                    pause={!active || !hasMaterialsForCycle}
                    component={'span'}
                    placeholder={hasMaterialsForCycle
                      ? <StatusText status={'ready'}>RANK UP</StatusText>
                      : <StatusText status={'needs'}>Missing Mats</StatusText>}
                    date={timeLeft}/> :
                  <Typography component={'span'} color={'text.error'}>Inactive</Typography>}</Typography>
                <Typography component={'span'} color={'text.secondary'}>From empty: <Timer
                  staticTime
                  date={totalTime}
                  lastUpdated={state?.lastUpdated}/></Typography>
                <Typography component={'span'} color={'text.secondary'}>Fuel: {fuelTime ? <Timer
                  type={'countdown'}
                  date={new Date().getTime() + fuelTime * 1000}
                  lastUpdated={state?.lastUpdated}
                /> : 'Empty'}</Typography>
                <ProgressBar percent={progressPercentage} bgColor={saltsColors?.[saltIndex]}
                             labelText={`${numberWithCommas(refined)} / ${numberWithCommas(powerCap)}`}/>
              </Stack>
              {isXs ? null : <Divider sx={{ mx: 2 }} orientation={'vertical'} flexItem/>}
              {/* Its own line below md, as wide as the card: sized to its cells it left a third of a phone card empty */}
              <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
              <DataTable
                columns={COST_COLUMNS}
                rows={(cost ?? []).map(({ name, rawName, quantity, totalAmount }) => {
                  const cycleCost = calcCost(state?.account?.refinery, rank, quantity, rawName, saltIndex);
                  const nextLevelCost = calcCost(state?.account?.refinery, rank + 1, quantity, rawName, saltIndex);
                  const costPerHour = cycleCost * 3600 / combustionTime;
                  const nextLevelPerHour = nextLevelCost * 3600 / combustionTime;
                  const isSalt = rawName?.includes('Refinery');
                  const isCritter = rawName?.includes('Critter');
                  // What keeps coming in per hour: the salt above for a salt, the printer for the rest. Traps aren't counted.
                  const gainPerHour = isCritter ? null : isSalt ? previousSaltPerHour : (activePrints?.[rawName]?.boostedValue || 0);
                  const short = cycleCost > totalAmount;
                  const gain = gainPerHour ?? 0;
                  return {
                    name, rawName, totalAmount, gainPerHour, showNext: showNextLevelCost,
                    cycle: { value: cycleCost, next: nextLevelCost, short: short && gain < cycleCost, nextShort: short && gain < nextLevelCost },
                    hour: {
                      value: costPerHour,
                      next: nextLevelPerHour,
                      short: (short && gain < costPerHour) || (isSalt && costPerHour > previousSaltPerHour),
                      nextShort: (short && gain < nextLevelPerHour) || (isSalt && nextLevelPerHour > previousSaltPerHour)
                    },
                    rankUp: {
                      value: calcResourceToRankUp(rank, refined, powerCap, cycleCost),
                      next: calcResourceToRankUp(rank + 1, refined, powerCap, nextLevelCost),
                      short,
                      nextShort: nextLevelCost > totalAmount
                    }
                  };
                })}
                rowKey={'rawName'}
                rowLabel={({ name }) => cleanUnderscore(name)}
              />
              </Box>
              {isXs ? null : <Divider sx={{ mx: 2 }} orientation={'vertical'} flexItem/>}
              <Stack>
                <Stack direction={'row'} justifyContent={'center'} gap={5}>
                  <Typography sx={{ width: 50, textAlign: 'center' }} fontWeight={'bold'}>Cycle</Typography>
                  <Typography sx={{ width: 50, textAlign: 'center' }} fontWeight={'bold'}>Hour</Typography>
                </Stack>
                <Stack direction={'row'} gap={5} alignItems={'center'}
                       justifyContent={'center'}>
                  <Stack sx={{ width: 50 }} alignSelf={'center'} alignItems={'center'}>
                    <img width={32} height={32} src={`${prefix}data/${rawName}.png`} alt={rawName}/>
                    <Typography>{notateNumber(powerPerCycle)}</Typography>
                  </Stack>
                  <Stack sx={{ width: 50 }} alignSelf={'center'} alignItems={'center'}>
                    <img width={32} height={32} src={`${prefix}data/${rawName}.png`} alt={rawName}/>
                    <Typography>{notateNumber(saltPerHour)}</Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Stack mt={3} gap={3} direction={'row'} flexWrap={'wrap'}>
      {refinery?.salts?.map(({ saltName, rawName, unlocked }, saltIndex) => {
        if (unlocked !== false) return null;
        return <Card key={`${saltName}-${saltIndex}`} sx={{ width: 'fit-content', opacity: 0.5 }}>
          <CardContent>
            <Stack alignItems={'center'} gap={1}>
              <img src={`${prefix}data/${rawName}.png`} alt="salt-icon" style={{ filter: 'grayscale(1)' }}/>
              <Typography variant={'cardTitle'} component={'h3'}>{cleanUnderscore(saltName)}</Typography>
              <Typography color={'text.secondary'}>Locked</Typography>
            </Stack>
          </CardContent>
        </Card>;
      })}
    </Stack>
  </>
};

// Each salt is fuelled by the one above it, so the numbers that matter are comparisons down the
// chain - a table reads them at a glance where per-card lines would need scrolling between salts.
// Ranks are permanent, so a salt past its limit can't be walked back - it only recovers when the
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
                         limitedBy
                       }) => {
  if (!unlocked || !active || outputMaxed) return null;
  if (rank >= maxSafeRank) {
    if (!limitedBy) return null;
    return limitedBy.isPrinter
      ? { label: `Print more ${cleanUnderscore(limitedBy.name)}`, color: 'text.warning' }
      : { label: `Wait for ${cleanUnderscore(limitedBy.name)}`, color: 'text.secondary' };
  }
  // Auto refine never lets a salt bank power to its cap, so its rank is frozen. Only worth
  // mentioning when something downstream is starving on it - otherwise it's a deliberate setting.
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
    <Typography variant={'body2'} sx={boldSx} color={color}>{label}</Typography>
    <Typography variant={'body2'}>{text}</Typography>
  </Stack>)}
</Stack>;

const CappedRank = ({ rank }) => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: .5 }}>
  {numberWithCommas(rank)} (capped)
  <InfoButton label={'capped rank'}>Power per cycle is capped, so ranking up adds cost but no output</InfoButton>
</Box>;

// notateNumber leaves negatives unformatted, so the magnitude is notated and the sign carried.
const signedRate = (value) => `${value > 0 ? '+' : value < 0 ? '-' : ''}${notateNumber(Math.abs(value))}`;

const SALT_COLUMNS = [
  {
    key: 'salt', label: 'Salt', sortable: true, value: (salt) => cleanUnderscore(salt.saltName),
    icon: (salt) => <GameIcon src={`data/${salt.rawName}.png`} alt={''} size={32} status={salt.unlocked ? undefined : 'missing'}/>
  },
  { key: 'rank', label: 'Rank', numeric: true, sortable: true, value: (salt) => salt.rank,
    render: (salt) => numberWithCommas(salt.rank) },
  { key: 'produced', label: 'Produced /hr', numeric: true, sortable: true, value: (salt) => salt.outputPerHour,
    render: (salt) => notateNumber(salt.outputPerHour) },
  {
    key: 'consumed', label: 'Consumed /hr', numeric: true, sortable: true,
    value: (salt) => (salt.consumedPerHour > 0 ? salt.consumedPerHour : null),
    render: (salt) => (salt.consumedPerHour > 0 ? notateNumber(salt.consumedPerHour) : null)
  },
  // The phone's one number, as the board picks it. A salt nothing consumes is not in surplus: no color.
  {
    key: 'balance', label: 'Balance /hr', numeric: true, change: 'higher', sortable: true, phone: true,
    value: (salt) => salt.balancePerHour,
    render: (salt) => signedRate(salt.balancePerHour),
    tone: (salt) => (salt.consumedPerHour === 0 ? null : salt.isDeficit ? 'bad' : 'good')
  },
  {
    key: 'maxSafeRank', label: 'Max safe rank', numeric: true, sortable: true, info: MAX_RANK_NOTE,
    value: (salt) => (salt.outputMaxed ? salt.rank : salt.maxSafeRank),
    render: (salt) => (salt.outputMaxed ? <CappedRank rank={salt.rank}/> : numberWithCommas(salt.maxSafeRank)),
    wrap: withBreakdown((salt) => salt.maxSafeRankBreakdown)
  },
  {
    key: 'action', label: 'Action', info: <ActionLegend/>, render: (salt) => {
      const action = getSaltAction(salt);
      return action ? <Typography component={'span'} variant={'body2'} color={action.color} noWrap>{action.label}</Typography> : null;
    }
  }
];

const SaltChainSummary = ({ balances }) => {
  if (!balances?.length) return null;
  return <Box sx={{ mt: 3, width: 'fit-content', maxWidth: '100%' }}>
    <DataTable columns={SALT_COLUMNS} rows={balances} rowKey={'rawName'}
               rowLabel={(salt) => cleanUnderscore(salt.saltName)}
               muted={(salt) => (salt.unlocked ? null : 'Locked')} surface={'card'}/>
  </Box>;
}

// A cost cell: the amount, a problem when the stock and what comes in can't cover it, and with Show next level
// cost on, the next level's amount under it.
const CostAmount = ({ value, next, short, nextShort, showNext }) => <>
  {short ? <StatusText status={'problem'}>{notateNumber(value)}</StatusText> : notateNumber(value)}
  {showNext && next ? <Typography variant={'caption'} component={'div'} color={nextShort ? 'text.error' : 'text.secondary'}>
    ({notateNumber(next)})
  </Typography> : null}
</>;

const costColumn = (key, label) => ({
  key, label, numeric: true,
  render: (row) => <CostAmount {...row[key]} showNext={row.showNext}/>
});

const COST_COLUMNS = [
  {
    key: 'material', label: 'Material', value: ({ name }) => cleanUnderscore(name),
    icon: ({ rawName }) => <GameIcon src={`data/${rawName}.png`} alt={''} size={32}/>
  },
  costColumn('cycle', 'Cycle'),
  costColumn('hour', 'Hour'),
  costColumn('rankUp', 'Rank up'),
  { key: 'owned', label: 'Owned', numeric: true, render: ({ totalAmount }) => notateNumber(totalAmount) },
  {
    key: 'printing', label: 'Printing /hr', numeric: true,
    info: 'What keeps coming in per hour: the printer for a material, the salt above for a salt. Trapped critters are not counted.',
    render: ({ gainPerHour }) => (gainPerHour == null ? null : notateNumber(gainPerHour))
  }
];

export default Refinery;
