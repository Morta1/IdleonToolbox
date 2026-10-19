import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import { companionGroups } from '@website-data';
import { useLocalStorage } from '@mantine/hooks';
import { petsViewKey, simulatedCompanionsKey } from '@components/constants';
import { monsterImage } from '@utility/spriteImages';
import { format, parseISO } from 'date-fns';
import { usePetMartHistory } from '@hooks/usePetMartHistory';
import {
  daysBetween,
  getPetMartHistoryStart,
  getPetMartRotationDate,
  getPetMartStats,
  longestSinceSoldKey,
  mergePetMartHistory
} from '@utility/petMartHistory';

const crystalStyle = { objectFit: 'contain', filter: 'hue-rotate(280deg)' };

// Its own component so ticking a pet re-renders that one card instead of all ~170 of them: every
// prop here is a primitive or a stable callback, which is what lets the compiler skip the rest.
const CompanionCard = ({ companion, index, editable, checked, onToggle }) => {
  const {
    name,
    effect,
    upgradedEffect,
    upgraded = false,
    acquired = '',
    copies = 0,
    tradableCount = 0,
    upgradedCount = 0,
    upgradedTradableCount = 0,
    viaToken = false,
    simulated = false,
    upgradeCost = null
  } = companion;
  const displayedEffect = upgraded && upgradedEffect ? upgradedEffect : effect;
  // The Pet Mart+ list price in Pet Crystals (CompanionDB col 8). Null on pets with no + version.
  // Once upgraded the price is spent, so the chip above replaces it.
  const showUpgradeCost = !upgraded && upgradeCost > 0;

  return <Card
    onClick={editable ? () => onToggle(index) : undefined}
    sx={{
      width: 300,
      border: acquired ? '1px solid' : '',
      borderColor: simulated ? 'info.dark' : acquired ? 'success.dark' : '',
      opacity: acquired || editable ? 1 : 0.4,
      cursor: editable ? 'pointer' : 'default'
    }}>
    <CardContent sx={{ '&:last-child': { padding: 1.5 }, height: '100%' }}>
      <Stack gap={2}>
        <Stack direction='row' gap={2}>
          {editable && <Checkbox size='small' checked={checked} sx={{ p: 0, alignSelf: 'flex-start' }}/>}
          <img width={42} height={42}
            style={{ objectFit: 'contain' }}
            src={monsterImage(name)} alt={name} />
          <Stack gap={1}>
            <Stack direction='row' gap={1} alignItems='center'>
              <Typography variant='body1'>{cleanUnderscore(name)}</Typography>
              {viaToken && <Chip label={'Token'} size={'small'} color={'primary'} sx={{ height: 18, fontSize: 10 }} />}
              {simulated && <Chip label={'Simulated'} size={'small'} color={'info'} sx={{ height: 18, fontSize: 10 }} />}
              {upgraded && <Chip label={'Pet Mart+'} size={'small'} color={'success'} sx={{ height: 18, fontSize: 10 }} />}
            </Stack>
            <Typography variant='body2' color='text.secondary'>{cleanUnderscore(displayedEffect?.replace('{', '+'))}</Typography>
            {showUpgradeCost && (
              <Stack direction='row' gap={0.5} alignItems='center'>
                <Typography variant='body2' color='text.secondary'>Pet Mart+:</Typography>
                <img width={14} height={14} style={crystalStyle}
                  src={`${prefix}data/PremiumGem.png`} alt='Pet Crystals' />
                <Typography variant='body2'>{numberWithCommas(upgradeCost)}</Typography>
              </Stack>
            )}
            {acquired && !viaToken && !simulated && (
              <Typography variant="body2">
                Tradable: {numberWithCommas(tradableCount)}/{numberWithCommas(copies)}
              </Typography>
            )}
            {upgradedCount > 0 && (
              <Typography variant="body2">
                Pet Mart+ tradable: {numberWithCommas(upgradedTradableCount)}/{numberWithCommas(upgradedCount)}
              </Typography>
            )}
            {viaToken && (
              <Typography variant="body2" color='text.secondary'>
                Bonus active via Pet Bonus Token
              </Typography>
            )}
            {simulated && (
              <Typography variant="body2" color='text.secondary'>
                Bonus simulated, you don&apos;t own this pet
              </Typography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </CardContent>
  </Card>;
};

const shortDate = (date) => format(parseISO(date), 'MMM d');

// When the + counter last sold this upgrade. Without the worker's history only "today" is known,
// so everything else stays hidden rather than claiming a pet was never sold.
const PetMartSales = ({ sales }) => {
  if (!sales) return null;
  const { stat, inToday, today, historyStart, historyLoaded } = sales;
  if (!inToday && !historyLoaded) return null;
  let primary;
  let color = 'text.primary';
  if (inToday) {
    primary = 'In the Pet Mart today';
    color = 'success.light';
  } else if (stat?.lastSold) {
    const days = daysBetween(stat.lastSold, today);
    primary = `Last sold ${days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}`;
  } else if (stat) {
    primary = `First sold ${shortDate(stat.firstSeen)}`;
  } else if (historyStart) {
    primary = `Not seen since ${shortDate(historyStart)}`;
    color = 'warning.light';
  }
  const showFirst = (inToday || stat?.lastSold) && stat?.firstSeen && stat.firstSeen !== today && stat.firstSeen !== stat.lastSold;
  return <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', pt: 1 }}>
    <Typography variant='body2' color={color}>{primary}</Typography>
    {showFirst && historyLoaded && <Typography variant='body2' color='text.secondary'>First sold {shortDate(stat.firstSeen)}</Typography>}
  </Box>;
};

// The same pet read as its Pet Mart+ version: the + bonus is the only effect. Three states: upgraded
// (green), buyable now (full card with its price), and blocked because the + counter only sells
// upgrades for pets you own a real copy of (faded, says so).
const UpgradeCard = ({ companion, sales }) => {
  const {
    name,
    upgradedEffect,
    upgraded = false,
    copies = 0,
    upgradedCount = 0,
    upgradedTradableCount = 0,
    upgradeCost = null
  } = companion;
  const needsBasePet = !upgraded && copies === 0;

  return <Card sx={{
    width: 300,
    border: upgraded ? '1px solid' : '',
    borderColor: upgraded ? 'success.dark' : '',
    opacity: needsBasePet ? 0.4 : 1
  }}>
    <CardContent sx={{ '&:last-child': { padding: 1.5 }, height: '100%' }}>
      <Stack direction='row' gap={2}>
        <img width={42} height={42} style={{ objectFit: 'contain' }} src={monsterImage(name)} alt={name}/>
        <Stack gap={1}>
          <Typography variant='body1'>{cleanUnderscore(name)}+</Typography>
          <Typography variant='body2' color='text.secondary'>{cleanUnderscore(upgradedEffect?.replace(/{/g, '+'))}</Typography>
          {!upgraded && (
            <Stack direction='row' gap={0.5} alignItems='center'>
              <img width={14} height={14} style={crystalStyle} src={`${prefix}data/PremiumGem.png`} alt='Pet Crystals'/>
              <Typography variant='body2'>{numberWithCommas(upgradeCost)}</Typography>
            </Stack>
          )}
          {needsBasePet && (
            <Typography variant='body2' color='text.secondary'>Needs the base pet</Typography>
          )}
          {upgradedCount > 0 && (
            <Typography variant='body2'>
              Tradable: {numberWithCommas(upgradedTradableCount)}/{numberWithCommas(upgradedCount)}
            </Typography>
          )}
          <PetMartSales sales={sales}/>
        </Stack>
      </Stack>
    </CardContent>
  </Card>;
};

const CompanionList = ({ title, companions, plusView, editing, draft, onToggle, salesOf }) => {
  if (!companions?.length) return null;

  return (
    <Stack gap={2}>
      <Typography variant="h5">{title}</Typography>
      <Divider />
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        {companions.map((companion) => plusView
          ? <UpgradeCard key={companion.name} companion={companion} sales={salesOf?.(companion.index)}/>
          : <CompanionCard
            key={companion.name}
            companion={companion}
            index={companion.index}
            editable={editing && companion.copies === 0 && !companion.viaToken}
            checked={draft?.has(companion.index) ?? false}
            onToggle={onToggle}
          />)}
      </Stack>
    </Stack>
  );
};

const isUnreleased = (comp) => comp.effect === 'Not_officially_in_the_game_and_may_never_be';

const PetCollection = () => {
  const { state, reparseOwnAccount } = useContext(AppContext);
  const [view, setView] = useLocalStorage({ key: petsViewKey, defaultValue: 'pets' });
  const [filter, setFilter] = useState('all');
  const [plusSort, setPlusSort] = useState('set');
  const { data: historyData, isSuccess: historyLoaded } = usePetMartHistory();
  const [simulated, setSimulated] = useLocalStorage({ key: simulatedCompanionsKey, defaultValue: [] });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const plusView = view === 'plus';

  const allCompanions = state?.account?.companions?.list || [];
  // Built once per account, not per keystroke - a fresh object per card would re-render all of them
  // on every tick.
  const indexedCompanions = allCompanions.map((companion, index) => ({ ...companion, index }));
  // Simulating on someone else's profile or on the demo account would misrepresent their save.
  const ownAccount = !state?.profile && !state?.demo && !state?.emptyAccount;
  const editing = draft !== null;
  const simulatedCount = allCompanions.filter((companion) => companion?.simulated).length;

  const toggleDraft = (index) => setDraft((current) => {
    const next = new Set(current);
    if (!next.delete(index)) next.add(index);
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    setSimulated([...draft]);
    setDraft(null);
    await reparseOwnAccount();
    setSaving(false);
  };

  const handleClear = async () => {
    setSaving(true);
    setSimulated([]);
    setDraft(null);
    await reparseOwnAccount();
    setSaving(false);
  };

  // The Pet Mart+ pool: every released pet with a + price.
  const inPlusPool = (comp) => comp.upgradeCost > 0 && !isUnreleased(comp);

  const filterCompanions = (indices) => {
    let result = indices.map(i => indexedCompanions[i]).filter(Boolean);
    if (editing) return result;
    if (plusView) {
      result = result.filter(inPlusPool);
      if (filter === 'tradable') result = result.filter(comp => (comp?.upgradedTradableCount || 0) > 0);
      if (filter === 'missing') result = result.filter(comp => !comp?.upgraded);
      return result;
    }
    if (filter === 'tradable') result = result.filter(comp => (comp?.tradableCount || 0) > 0);
    if (filter === 'missing') result = result.filter(comp => !comp?.acquired);
    return result;
  };

  // Pets the game has not put in a group yet but already priced for Pet Mart+: they are in the
  // data ahead of release, and the price is the one thing worth knowing about them early. The
  // 9999-priced filler entries read null and stay hidden; this is only the handful with a real cost.
  // The game also leaves some live pets out of every set (Glowfish): a real effect, rather than the
  // placeholder text, is what tells them apart from the unreleased ones.
  const groupedIndices = new Set((companionGroups || []).flatMap((group) => group.indices));
  const ungrouped = indexedCompanions.filter((comp) => !groupedIndices.has(comp.index) && comp.upgradeCost > 0);
  const unreleasedIndices = ungrouped.filter(isUnreleased).map((comp) => comp.index);
  const otherIndices = ungrouped.filter((comp) => !isUnreleased(comp)).map((comp) => comp.index);
  const groups = [
    ...(companionGroups || []),
    ...(otherIndices.length > 0 ? [{ name: 'Not in a set', indices: otherIndices }] : [])
  ];
  const released = groups.flatMap((group) => group.indices).map((i) => indexedCompanions[i]).filter(Boolean);
  // Pet Mart+ sales history: the worker's log plus today's stock from the account.
  const petMart = state?.account?.tournament?.petMart;
  const now = Date.now();
  const history = mergePetMartHistory(historyData?.days, petMart, now);
  const plusStats = getPetMartStats(history, 'plus');
  const todayPlus = new Set((petMart?.plusOffers ?? []).map((offer) => offer.companionIndex));
  const today = getPetMartRotationDate(now);
  const historyStart = getPetMartHistoryStart(history);
  const salesOf = (index) => ({
    stat: plusStats.get(index),
    inToday: todayPlus.has(index),
    today,
    historyStart,
    historyLoaded
  });
  const sortedBySale = plusView && plusSort === 'longest';
  const longestSinceSold = sortedBySale
    ? filterCompanions(groups.flatMap((group) => group.indices))
      .sort((a, b) => {
        const keyA = longestSinceSoldKey(plusStats.get(a.index), todayPlus.has(a.index));
        const keyB = longestSinceSoldKey(plusStats.get(b.index), todayPlus.has(b.index));
        return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
      })
    : [];

  const progress = plusView
    ? { label: 'Upgraded', done: released.filter((comp) => inPlusPool(comp) && comp.upgraded).length, total: released.filter(inPlusPool).length }
    : { label: 'Owned', done: released.filter((comp) => comp.copies > 0).length, total: released.length };

  return <>
    <Stack mb={3} direction={'row'} gap={3} flexWrap={'wrap'} alignItems="center">
      <ToggleButtonGroup size={'small'} exclusive value={view} disabled={editing}
        onChange={(e, value) => value && setView(value)}>
        <ToggleButton value={'pets'}>Base</ToggleButton>
        <ToggleButton value={'plus'}>Pet Mart+</ToggleButton>
      </ToggleButtonGroup>
      <RadioGroup row value={filter} onChange={(e) => setFilter(e.target.value)}>
        <FormControlLabel value="all" control={<Radio size="small"/>} label="All"/>
        <FormControlLabel value="tradable" control={<Radio size="small"/>} label="Tradable"/>
        <FormControlLabel value="missing" control={<Radio size="small"/>} label="Missing"/>
      </RadioGroup>
      {plusView && historyLoaded && <FormControl size={'small'} sx={{ width: 200 }}>
        <InputLabel>Sort by</InputLabel>
        <Select value={plusSort} label={'Sort by'} onChange={(e) => setPlusSort(e.target.value)}>
          <MenuItem value={'set'}>Pet set</MenuItem>
          <MenuItem value={'longest'}>Longest since sold</MenuItem>
        </Select>
      </FormControl>}
      {/* ml auto anchors the count and the edit actions to the toolbar's right edge; on a narrow
          screen the group wraps under the controls instead. */}
      <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'} sx={{ ml: 'auto' }}>
        <Typography variant={'body2'} color={'text.secondary'}>
          {progress.label} {numberWithCommas(progress.done)}/{numberWithCommas(progress.total)}
        </Typography>
        {ownAccount && !plusView && (editing ? <>
          <Button size={'small'} variant={'contained'} disabled={saving} onClick={handleSave}>Save edits</Button>
          <Button size={'small'} variant={'outlined'} disabled={saving} onClick={() => setDraft(null)}>Cancel</Button>
        </> : <>
          {simulatedCount > 0 &&
            <Button size={'small'} variant={'text'} color={'error'} disabled={saving} onClick={handleClear}>Turn off simulation</Button>}
          <Button size={'small'} variant={'outlined'} disabled={saving}
            onClick={() => setDraft(new Set(simulated ?? []))}>Edit pets</Button>
        </>)}
      </Stack>
    </Stack>
    {ownAccount && !plusView && (editing || simulatedCount > 0) && <Stack mb={3} gap={1.5}>
      {editing && <Alert severity={'info'}>
        Tick the pets you don&apos;t own yet and hit save. The site will count them as owned, so you can
        see what their bonuses would be worth: at the base level, not the Pet Mart+ upgraded level.
      </Alert>}
      {!editing && simulatedCount > 0 && <Alert severity={'warning'}>
        Pet simulation is on. {simulatedCount} unowned {simulatedCount === 1 ? 'pet is' : 'pets are'} counted as owned,
        so every bonus on the site includes {simulatedCount === 1 ? 'it' : 'them'}, at the base level: not the
        Pet Mart+ upgraded level shown on pets you actually own and have upgraded.
      </Alert>}
    </Stack>}
    <Stack gap={4}>
      {sortedBySale
        ? <CompanionList title={'Longest since sold'} companions={longestSinceSold} plusView salesOf={salesOf}/>
        : groups.map((group) => (
          <CompanionList
            key={group.name}
            title={group.name}
            companions={filterCompanions(group.indices)}
            plusView={plusView}
            editing={editing}
            draft={draft}
            onToggle={toggleDraft}
            salesOf={salesOf}
          />
        ))}
      {!editing && !plusView && filter === 'all' && unreleasedIndices.length > 0 && (
        <CompanionList
          title={'Not yet released'}
          companions={filterCompanions(unreleasedIndices)}
          editing={false}
          draft={draft}
          onToggle={toggleDraft}
        />
      )}
      {groups.every((group) => filterCompanions(group.indices).length === 0) && (
        <Typography variant="body2" color="text.secondary">No pets match the selected filter</Typography>
      )}
    </Stack>
  </>;
};

export default PetCollection;
