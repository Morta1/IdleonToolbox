import { Box, Card, CardContent, Container, Divider, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, formatNum, getCoinsArray, notateNumber, prefix } from '@utility/helpers';
import styled from '@emotion/styled';
import CoinDisplay from 'components/common/CoinDisplay';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import Tooltip from 'components/Tooltip';
import { NextSeo } from 'next-seo';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Toolbar from '@components/common/Toolbar';
import InfoButton from '@components/common/InfoButton';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import useToolbarState from '@hooks/useToolbarState';
import {
  calcStampLevels,
  evaluateStamp,
  getStampBonus,
  getStamps,
  getStampsPerDay,
  MAX_STAMP_REDUCTION,
  unobtainableStamps,
  updateStamps
} from '@parsers/world-1/stamps';
import Grid from '@mui/material/Grid2';
import { grey } from '@mui/material/colors';
import Link from '@mui/material/Link';
import { useRouter } from 'next/router';
import { useLocalStorage } from '@mantine/hooks';
import Button from '@mui/material/Button';
import { isValid } from 'date-fns';
import useFormatDate from '@hooks/useFormatDate';
import { getExaltedStampBonus } from '@parsers/world-1/stamps';
import { OPT } from '@parsers/accountOptions';

// The game's reducer grows by the Hydrogen atom's daily bonus up to 90% (Atom Collider): the what-if steps it can take
const reducerSteps = (account) => {
  const hydrogen = account?.atoms?.atoms?.[0];
  const perDay = (hydrogen?.baseBonus ?? 0) * (hydrogen?.level ?? 0);
  if (!(perDay > 0)) return [0];
  const steps = Array.from({ length: 6 }, (_, index) => index * Math.max(20, perDay)).filter((step) => step <= 90);
  return steps.at(-1) === 90 || steps.length >= 6 ? steps : [...steps, 90];
};

// A stamp's state, the Show menu's options in its order: each stamp has exactly one. 'reduction' can level up now and
// could at the reducer step below too, so its label says it levels up
const STAMP_STATES = [['upgradable', 'Can level up'], ['reduction', 'Can level up at the previous reducer'], ['money', 'Short on coins'],
  ['materials', 'Short on materials'], ['player', 'Over carry capacity'], ['impossible', 'Out of reach'],
  ['equipments', 'Costs gear'], ['level', 'Not found yet']];
const STAMPS_TOOLBAR = { show: 'all' };

const Stamps = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  const [levelsSnapshot, setLevelsSnapshot] = useLocalStorage({
    key: 'stamps:levels',
    defaultValue: { snapshotTime: null, levels: {} }
  });
  const stampsFailed = isSectionFailed(state?.account, 'stamps');
  const atomsFailed = isSectionFailed(state?.account, 'atoms');
  const compassFailed = isSectionFailed(state?.account, 'compass');
  const riftFailed = isSectionFailed(state?.account, 'rift');
  // The page also reads the reducer (atoms), the exalted stamps (compass) and the gilded stamps' unlock (rift): one
  // note, naming the first that failed
  const failedName = stampsFailed ? 'Stamps' : atomsFailed ? 'Atom Collider' : compassFailed ? 'Compass'
    : riftFailed ? 'the Rift' : null;
  // A failed section lists every stamp at zero (the parser's catalog with no save), with no state
  const account = stampsFailed && !Object.keys(state?.account?.stamps ?? {}).length
    ? { ...state?.account, stamps: getStamps({}, {}) }
    : state?.account;
  const gildedStamps = isRiftBonusUnlocked(account?.rift, 'Stamp_Mastery')
    ? account?.accountOptions?.[OPT.gildedStamps] ?? 0
    : 0;
  const stampReducer = account?.atoms?.stampReducer ?? 0;
  const steps = reducerSteps(account);
  // gilded follows the account until the player changes it: a default that moves with the save, stored only as an edit
  const stampDefaults = { gilded: gildedStamps > 0, reducer: null, keepGreenstacks: false, bestCarry: false, showGained: true };
  const [settings, setSettings, resetSettings] = usePageSettings('stamps', stampDefaults);
  // A failed section's page has no settings, so a saved reducer prices nothing there
  const reducerSet = !stampsFailed && settings?.reducer !== null && settings?.reducer !== undefined;
  const reducer = reducerSet ? settings.reducer : stampReducer;
  const [view, setView, resetView] = useToolbarState('stamps', STAMPS_TOOLBAR);
  const stampsPerDay = getStampsPerDay(account);
  const localStamps = updateStamps(account, state?.characters, settings?.gilded, reducer, settings?.bestCarry, true);
  const exaltedMulti = getExaltedStampBonus(account);
  const exaltedFailed = atomsFailed || compassFailed;
  const remainingExalted = account?.compass?.remainingExaltedStamps ?? 0;
  const usedExalted = account?.compass?.usedExaltedStamps ?? 0;

  const stateOptions = {
    keepGreenstacks: settings?.keepGreenstacks, steps, reducer, account, characters: state?.characters,
    gilded: settings?.gilded, bestCarry: settings?.bestCarry
  };
  // Each stamp's state by category and index; the failed section's catalog has none, and shows whole
  const states = Object.fromEntries(Object.entries(localStamps ?? {}).map(([category, list]) => [category,
    list.map((stamp) => (stampsFailed ? null : stampState(stamp, stamp.level < stamp.maxLevel ? 'money' : 'material', stateOptions)))]));
  const allStates = Object.values(states).flat();
  const counts = Object.fromEntries(STAMP_STATES.map(([key]) => [key, allStates.filter((type) => type === key).length]));
  const show = stampsFailed ? 'all' : view?.show ?? 'all';
  const isShownState = (type) => show === 'all' || type === show;
  const shownCount = allStates.filter(isShownState).length;

  const handleSnapshot = () => {
    const levels = Object.entries(state?.account?.stamps ?? {}).reduce((result, [key, values]) => {
      return {
        ...result,
        [key]: values.map(({ level }) => level)
      }
    }, {})
    setLevelsSnapshot({ levels, snapshotTime: new Date().getTime() });
  }

  const perDayText = `${formatNum(stampsPerDay?.value ?? 0)} per day`;
  const exaltedText = formatNum(1 + (exaltedMulti?.value ?? 0) / 100, 'mult');
  const pricedGilded = Boolean(settings?.gilded) !== stampDefaults.gilded;
  const gildedSub = stampsFailed ? undefined : pricedGilded
    ? settings?.gilded ? 'Priced with gilded stamps' : 'Priced without gilded stamps'
    : `${formatNum(calcStampLevels(account?.stamps) / 100, 'pct')} chance`;

  return (
    (<div>
      <NextSeo
        title="Stamps | Idleon Toolbox"
        description="Track your stamp levels, upgrade costs, and bonus effects across all stamp categories in Legends of Idleon"
      />
      {failedName ? <MissingData name={failedName} failed/> : null}
      {/* A failed section's settings would price nothing, and its snapshot would save every level as 0 */}
      {stampsFailed ? null : <PageSettings state={settings} defaults={stampDefaults} onChange={setSettings}
                                           onReset={resetSettings}>
        <PageSettings.Toggle name={'gilded'} label={'Price with gilded stamps'}
                             help={`Costs as if each upgrade uses a gilded stamp.${riftFailed ? '' : ` You have ${formatNum(gildedStamps)}.`}`}/>
        <PageSettings.Number name={'reducer'} label={'Stamp reducer'} defaultValue={stampReducer} min={0} max={MAX_STAMP_REDUCTION}
                             integer
                             help={`Material costs at this reducer.${atomsFailed ? '' : ` Yours is ${formatNum(stampReducer, 'pct')}.`}`}/>
        <PageSettings.Toggle name={'keepGreenstacks'} label={'Keep a greenstack'}
                             help={'A material counts only what you own past 10M, so a greenstack stays.'}/>
        <PageSettings.Toggle name={'bestCarry'} label={'Best carry capacity'}
                             help={'Carry capacity as at its best: Ruck Sack on, Zerg Rushogen off, the VMan talent, the three carry star signs and a Nanochip if you own one.'}/>
        <PageSettings.Toggle name={'showGained'} label={'Show levels gained'}
                             help={'Each stamp that levelled since your snapshot shows how many levels.'}/>
        <Stack gap={0.5}>
          <Button variant={'text'} onClick={handleSnapshot} sx={{ alignSelf: 'flex-start' }}>Save levels snapshot</Button>
          <Typography variant={'caption'} color={'text.secondary'}>
            {isValid(levelsSnapshot?.snapshotTime) ? `Saved ${formatDate(levelsSnapshot.snapshotTime)}` : 'No snapshot yet'}
          </Typography>
        </Stack>
      </PageSettings>}
      <PageSummary>
        <StatTile label={'Gilded stamps'} icon={'data/GildedStamp.png'} value={riftFailed ? '-' : formatNum(gildedStamps)}
                  sub={gildedSub}/>
        <StatTile label={'No Stamp Left Behind'} value={perDayText}
                  breakdown={stampsPerDay?.breakdown ? { ...stampsPerDay.breakdown, totalValue: perDayText } : undefined}
                  breakdownTitle={'No Stamp Left Behind'}/>
        <StatTile label={'Exalted multi'} value={exaltedFailed ? '-' : exaltedText}
                  breakdown={!exaltedFailed && exaltedMulti?.breakdown ? { ...exaltedMulti.breakdown, totalValue: exaltedText } : undefined}
                  breakdownTitle={'Exalted multi'}/>
        <StatTile label={'Stamp reducer'} icon={'data/Atom0.png'}
                  value={atomsFailed && !reducerSet ? '-' : formatNum(reducer, 'pct')}
                  sub={reducerSet && !atomsFailed ? `Yours is ${formatNum(stampReducer, 'pct')}` : undefined}/>
        <StatTile label={'Exalted stamps'} icon={'etc/Exalted_Stamp_Frame.png'}
                  value={compassFailed ? '-' : `${formatNum(remainingExalted)} / ${formatNum(remainingExalted + usedExalted)}`}/>
      </PageSummary>
      <Box>
        {stampsFailed ? null : <Toolbar state={view} defaults={STAMPS_TOOLBAR} onChange={setView} onReset={resetView}
                                        total={allStates.length} shown={shownCount} noun={'stamps'}>
          <Toolbar.Lead>
            <Box sx={{ display: 'flex', alignItems: 'center', height: 40 }}>
              <InfoButton label={'Out of reach'}>{`An out of reach stamp costs more than your best carry capacity even at the ${MAX_STAMP_REDUCTION}% reducer cap, so no reducer unlocks it. Being short on the material itself is Short on materials.`}</InfoButton>
            </Box>
          </Toolbar.Lead>
          <Toolbar.Show options={[['all', 'All stamps', allStates.length], ...STAMP_STATES.map(([key, label]) => [key, label, counts[key]])]}/>
        </Toolbar>}
        <Container>
          <Grid container sx={{ justifyContent: 'center' }} spacing={2}>
            {Object.entries(localStamps || {}).map(([category, stamps], categoryIndex) => {
              // A category with no stamp in the picked state draws no heading over nothing
              if (!stamps.some((_, stampIndex) => isShownState(states[category]?.[stampIndex]))) return null;
              return (
                <Grid
                  container
                  spacing={.5}
                  columns={12}
                  sx={{ alignContent: 'start', justifyContent: 'center' }}
                  key={category + '' + categoryIndex}
                  size={{
                    xs: 12,
                    md: 6,
                    lg: 4
                  }}>
                  <Typography variant={'body1'} sx={{ flexBasis: '100%' }}
                              variable={'subtitle2'}>{category.capitalize()}</Typography>
                  {stamps.map((stamp, stampIndex) => {
                    const {
                      rawName,
                      level,
                      displayName,
                      bestCharacter
                    } = stamp;
                    const bonus = getStampBonus(account, category, rawName, bestCharacter);
                    const isBlank = displayName === 'Blank';
                    if (!isShownState(states[category]?.[stampIndex])) return;
                    let snapshotDiff;
                    if (level > levelsSnapshot?.levels?.[category]?.[stampIndex]) {
                      snapshotDiff = level - levelsSnapshot?.levels?.[category]?.[stampIndex];
                    }
                    return (
                      <Grid
                        key={rawName + stampIndex}
                        size={{ xs: 4, sm: 3 }}>
                        <Tooltip maxWidth={450}
                                 title={isBlank ? '' : <StampInfo {...stamp} bonus={bonus}
                                                                  currentReduction={reducer}
                                                                  subtractGreenStacks={settings?.keepGreenstacks}/>}>
                          <Card sx={{
                            position: 'relative',
                            overflow: 'visible',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 50
                          }}
                                variant={'outlined'}
                                onClick={() => window.open(`https://idleon.wiki/wiki/${displayName}`, '_blank')}
                          >
                            {snapshotDiff > 0 && settings?.showGained ? <img style={{
                              position: 'absolute',
                              right: -5,
                              top: -5
                            }} src={`${prefix}data/UpgArrowG.png`} alt={'level-up indicator'}/> : null}
                            <CardContent sx={{ '&:last-child': { p: 0 } }}>
  
                              <Stack direction={'row'} alignItems={'center'} justifyContent={'space-around'}
                                     sx={{ position: 'relative' }}>
                                {account?.compass?.exaltedStamps?.[category]?.[stampIndex] ? <img
                                  style={{
                                    position: 'absolute',
                                    left: 0,
                                    width: 40,
                                    height: 40
                                  }}
                                  src={`${prefix}etc/Exalted_Stamp_Frame.png`} alt="Exalted Stamp Frame"/> : null}
                                <StampIcon width={40} height={40}
                                           dim={!stampsFailed && level === 0}
                                           src={`${prefix}data/${rawName}.png`}
                                           alt={rawName}/>
                                <Typography>{level}</Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Tooltip>
                      </Grid>
                    );
                  })}
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>
    </div>)
  );
};

const StampInfo = ({
                     displayName,
                     level,
                     effect,
                     multiplier,
                     goldCost,
                     materialCost,
                     futureCosts,
                     bestCharacter,
                     subtractGreenStacks,
                     ownedMats,
                     greenStackOwnedMats,
                     hasMoney,
                     hasMaterials,
                     enoughPlayerStorage,
                     itemReq,
                     bonus,
                     maxLevel,
                     minReduction,
                     currentReduction
                   }) => {
  const materialColor = hasMaterials ? '' : 'text.error';
  const mode = level < maxLevel ? 'money' : 'material';
  return <Box sx={{ p: 1 }}>
    <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(displayName)} (Lv {level})</Typography>
    <Typography sx={{ color: level > 0 && multiplier > 1 ? 'text.info' : '' }}
                variant={'body1'}>+{cleanUnderscore(effect.replace(/\+{/, notateNumber(bonus, 'MultiplierInfo').replace('.00', '')))}</Typography>
    {unobtainableStamps[displayName] ? <Typography mt={1}>(Unobtainable)</Typography> : null}
    {level > 0 ? <>
      <CostSection hasMoney={hasMoney}
                   hasMaterials={hasMaterials}
                   enoughPlayerStorage={enoughPlayerStorage}
                   rawName={itemReq.rawName}
                   materialCost={materialCost}
                   goldCost={goldCost}
                   mode={mode}
                   level={level}/>
      {mode === 'material' ? <MinReductionInfo minReduction={minReduction}
                                              currentReduction={currentReduction}/> : null}
      <Divider variant={'middle'} sx={{ bgcolor: grey[600], my: 1 }}/>
      {futureCosts?.length ? <FutureCosts futureCosts={futureCosts}/> : null}
      <Stack direction={'row'} gap={2}>
        <div>
          <Typography mt={2} variant={'subtitle2'} gutterBottom>Max capacity</Typography>
          {(bestCharacter?.topCharacters ?? []).map(({ character, maxCapacity }, index) =>
            <Typography
              key={`${character}-${index}`}
              color={maxCapacity >= materialCost ? '' : 'text.error'}
              variant={'body2'}>{character} ({notateNumber(maxCapacity ?? 0, 'Big')})</Typography>)}
        </div>
        {mode === 'material' ? <div>
          <Typography mt={2} variant={'subtitle2'} gutterBottom>Storage Amount</Typography>
          <Typography color={materialColor} variant={'body2'}>{notateNumber((subtractGreenStacks
            ? greenStackOwnedMats
            : ownedMats) || 0, 'Big')}</Typography>
        </div> : null}
      </Stack>
    </> : null}
  </Box>;
}

// Absent entirely when a caller skipped the calculation, versus present with a null reduction,
// which is the real "no reducer value fits this in carry capacity" answer.
const isOutOfReach = (minReduction) => Boolean(minReduction) && minReduction.reduction == null;

// One of STAMP_STATES for a stamp; mode is 'money' below its max level, 'material' at it.
const stampState = (stamp, mode, { keepGreenstacks, steps, reducer, account, characters, gilded, bestCarry }) => {
  const { materials, level, hasMoney, hasMaterials, greenStackHasMaterials, enoughPlayerStorage, minReduction } = stamp;
  if (level <= 0) return 'level';
  if (!hasMoney && mode === 'money') return 'money';
  // Out of reach outranks everything below, gear cost included: no reducer value fits the cost in
  // carry capacity, so nothing about the cost's shape is actionable yet. Stored materials are
  // deliberately not part of it: a material shortage is 'materials'.
  if (mode === 'material' && isOutOfReach(minReduction)) return 'impossible';
  // Equipment cost before every remaining material state: the parser only fills `materials` when the
  // required item is gear (isEquipmentItem), and that gate outranks how many sub-materials happen to
  // be on hand.
  if (materials?.length > 0) return 'equipments';
  if (!enoughPlayerStorage && mode === 'material') return 'player';
  if (mode === 'material' && (!hasMaterials || (keepGreenstacks && !greenStackHasMaterials))) return 'materials';
  if (!hasMoney) return 'money';
  // The step below the reducer in use: a typed reducer between two steps still has one before it
  const previous = steps.filter((step) => step < reducer).at(-1);
  const atPrevious = reducer !== 0 && previous !== undefined
    ? evaluateStamp(stamp, account, characters, gilded, previous, bestCarry)
    : null;
  if (atPrevious?.materials?.length === 0 && ((atPrevious?.hasMaterials && atPrevious?.enoughPlayerStorage) || mode === 'money')
    && atPrevious?.hasMoney) {
    return 'reduction';
  }
  return 'upgradable';
};

const MinReductionInfo = ({ minReduction, currentReduction }) => {
  if (!minReduction) return null;
  const { reduction } = minReduction;
  if (reduction == null) {
    return <Typography variant={'body2'} sx={{ color: 'text.warning' }}>
      {`${MAX_STAMP_REDUCTION}% reduction still exceeds your carry capacity`}
    </Typography>;
  }
  const isAffordable = reduction <= (currentReduction ?? 0);
  return <Typography variant={'body2'} sx={{ color: isAffordable ? 'text.success' : 'text.error' }}>
    Min. reduction to carry: {reduction}%
  </Typography>;
}

// The next levels' costs: every row pays the same material, so its sprite sits once, in the header.
const FutureCosts = ({ futureCosts }) => <DataTable
  fits
  rows={futureCosts}
  rowKey={'level'}
  columns={[
    { key: 'level', label: 'Level', value: ({ level }) => level },
    {
      key: 'material',
      label: <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <GameIcon src={`data/${futureCosts[0]?.rawName}.png`} alt={''} size={16}/>Material
      </Box>,
      numeric: true,
      render: ({ materialCost }) => (materialCost ? notateNumber(materialCost, 'Big') : null)
    },
    {
      key: 'coins',
      label: 'Coins',
      numeric: true,
      render: ({ goldCost }) => <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <CoinDisplay variant={'horizontal'} title={''} maxCoins={3} money={getCoinsArray(goldCost)}/>
      </Box>
    },
    { key: 'reduction', label: 'Reduction', numeric: true, render: ({ reduction }) => (reduction >= 0 ? `${reduction}%` : null) }
  ]}
/>;

// The current level's cost: the material below the max level, the coins at it.
const CostSection = ({
                       rawName,
                       materialCost,
                       goldCost,
                       level,
                       hasMoney,
                       mode
                     }) => {
  const moneyColor = hasMoney ? '' : 'var(--mui-palette-text-error)';
  return <Stack direction={'row'} gap={3} alignItems={'center'} mt={1} justifyContent={'flex-start'}>
    <Typography variant={'subtitle2'}>{level}</Typography>
    {mode === 'material' ? <Stack my={1} direction={'row'} alignItems={'center'} gap={1}>
      <ItemIcon src={`${prefix}data/${rawName}.png`}
                alt={rawName}/>
      <Typography variant={'subtitle2'}>{materialCost
        ? notateNumber(materialCost, 'Big')
        : null}</Typography>
    </Stack> : null}
    {mode === 'money' ? <CoinDisplay style={{ color: moneyColor }}
                                                 variant={'horizontal'}
                                                 title={''} maxCoins={3}
                                                 money={getCoinsArray(goldCost)}/> : null}
  </Stack>
}

const StampIcon = styled.img`
  opacity: ${({ dim }) => dim ? .5 : 1};
`;

const ItemIcon = styled.img`
  width: 32px;
  height: 32px;
  opacity: ${({ hide }) => hide ? 0.5 : 1};
`;

export default Stamps;
