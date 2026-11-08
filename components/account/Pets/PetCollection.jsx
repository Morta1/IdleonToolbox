import { Box, Button, Stack, Typography } from '@mui/material';
import Notice from '@components/common/Notice';
import { IconFlask } from '@tabler/icons-react';
import { useContext, useDeferredValue, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { getCompanionSets, isUnreleasedCompanion } from '@parsers/misc';
import { useLocalStorage } from '@mantine/hooks';
import { petsViewKey, simulatedCompanionsKey } from '@components/constants';
import { monsterSprite } from '@utility/spriteImages';
import { format, parseISO } from 'date-fns';
import { usePetMartHistory } from '@hooks/usePetMartHistory';
import { getPetMartLastSeen, getPetMartToday, lastInPetMartKey, mergePetMartHistory } from '@utility/petMartHistory';
import CardGrid, { LABELED_TILE_MIN } from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import StatTile from '@components/common/cards/StatTile';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import PageSettings, { PageSettingsRoom } from '@components/common/PageSettings';
import useToolbarState from '@hooks/useToolbarState';

// The pet crystal has no sprite of its own: the toolbox tints the premium gem, as the nav does
export const PET_CRYSTAL_LOOK = { filter: 'hue-rotate(280deg)' };
// Simulating on someone else's profile or on the demo account would misrepresent their save.
export const canSimulatePets = (state, failed) => !failed && !state?.profile && !state?.demo && !state?.emptyAccount;
export const petCrystalIcon = (size) => <Box component={'span'} sx={{ display: 'inline-flex', ...PET_CRYSTAL_LOOK }}>
  <GameIcon src={'data/PremiumGem.png'} size={size} alt={'Pet Crystals'}/>
</Box>;

// The clock, read once per render after the data loader (the export is the loader). Pet Mart sightings: the worker's log
// plus today's stock from the account, read from the counter that sells what the view shows (the pet itself, or its +
// upgrade). Today's rotation is the one open now (the Pet Mart tab's): the save's copy only while the save is today's
const readSightings = (days, petMart, lastUpdated, plusView) => {
  const now = Date.now();
  return {
    lastSeenOf: getPetMartLastSeen(mergePetMartHistory(days, petMart, now), plusView ? 'plus' : 'base'),
    today: getPetMartToday(days, petMart, lastUpdated, now)
  };
};

// The game's effect text draws its + as {: every one, in both views
export const effectText = (text) => cleanUnderscore(`${text ?? ''}`.replaceAll('{', '+'));

const PETS_TOOLBAR = { search: '', show: 'all', sort: null, details: false };
const shortDate = (date) => format(parseISO(date), 'MMM d');

const PetCollection = ({ companions, sectionFailed, tournamentFailed }) => {
  const { state, reparseOwnAccount } = useContext(AppContext);
  const [view, setView] = useLocalStorage({ key: petsViewKey, defaultValue: 'pets' });
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('pets', PETS_TOOLBAR);
  const { data: historyData, isSuccess: historyLoaded, isError: historyFailed } = usePetMartHistory();
  const [simulated, setSimulated] = useLocalStorage({ key: simulatedCompanionsKey, defaultValue: [] });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const plusView = view === 'plus';
  const failed = Boolean(sectionFailed);
  const show = failed ? 'all' : toolbar.show;
  const sort = failed ? null : toolbar.sort;
  // The cards follow the search a beat behind the box, so typing stays responsive
  const searchText = useDeferredValue(toolbar.search ?? '');
  const query = failed ? '' : searchText.trim().toLowerCase();

  const allCompanions = companions ?? [];
  const indexedCompanions = allCompanions.map((companion, index) => ({ ...companion, index }));
  const ownAccount = canSimulatePets(state, failed);
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

  // The Pet Mart+ pool: every released pet with a + price.
  const inPlusPool = (comp) => comp.upgradeCost > 0 && !isUnreleasedCompanion(comp);
  const matchesShow = (comp) => {
    if (plusView) {
      if (show === 'tradable') return (comp?.upgradedTradableCount || 0) > 0;
      if (show === 'missing') return !comp?.upgraded;
      return true;
    }
    if (show === 'tradable') return (comp?.tradableCount || 0) > 0;
    if (show === 'missing') return !comp?.acquired;
    return true;
  };
  const matchesSearch = (comp) => !query || cleanUnderscore(comp?.name).toLowerCase().includes(query);
  const matches = (comp) => matchesShow(comp) && matchesSearch(comp);
  const inView = (indices) => indices.map((i) => indexedCompanions[i]).filter(Boolean)
    .filter((comp) => !plusView || inPlusPool(comp));
  // Editing hides the Toolbar, so it lists every pet
  const filterCompanions = (indices) => (editing ? inView(indices) : inView(indices).filter(matches));

  const { groups, unreleasedIndices } = getCompanionSets(indexedCompanions);
  const released = groups.flatMap((group) => group.indices).map((i) => indexedCompanions[i]).filter(Boolean);
  const petMart = tournamentFailed ? null : state?.account?.tournament?.petMart;
  const { lastSeenOf, today } = readSightings(historyData?.days, petMart, state?.lastUpdated, plusView);
  const todayOffers = new Set(((plusView ? today?.plus : today?.base) ?? []).map((offer) => offer.index));
  const salesOf = (index) => ({ lastSeen: lastSeenOf.get(index), inToday: todayOffers.has(index), historyLoaded });
  // Ascending puts pets never in the Pet Mart first; descending puts today's offers first and them last.
  const sortedBySighting = sort?.key === 'lastSeen' && !editing;
  const direction = sort?.order === 'desc' ? -1 : 1;
  const bySighting = sortedBySighting
    ? filterCompanions(groups.flatMap((group) => group.indices))
      .toSorted((a, b) => {
        const keyA = lastInPetMartKey(lastSeenOf.get(a.index), todayOffers.has(a.index));
        const keyB = lastInPetMartKey(lastSeenOf.get(b.index), todayOffers.has(b.index));
        return (keyA < keyB ? -1 : keyA > keyB ? 1 : 0) * direction;
      })
    : [];

  const pool = released.filter((comp) => !plusView || inPlusPool(comp));
  const progress = plusView
    ? { label: 'Upgraded', done: pool.filter((comp) => comp.upgraded).length, total: pool.length }
    : { label: 'Owned', done: pool.filter((comp) => comp.copies > 0).length, total: pool.length };
  const counts = {
    all: pool.length,
    tradable: pool.filter((comp) => (plusView ? comp?.upgradedTradableCount : comp?.tradableCount) > 0).length,
    missing: pool.filter((comp) => (plusView ? !comp?.upgraded : !comp?.acquired)).length
  };
  const shownCount = pool.filter(matches).length;
  // An empty option has no pill unless it is the one on (a view switch keeps the pick)
  const showOptions = [['all', 'All', counts.all], ['tradable', 'Tradable', counts.tradable],
    ['missing', plusView ? 'Not upgraded' : 'Missing', counts.missing]].filter(([key, , count]) => key === 'all' || count > 0 || key === show);

  // Simulated and Token change what the bonus means; owned needs no word, the dim says which aren't
  const petState = (pet) => {
    if (failed || plusView) return null;
    if (pet.simulated) return { status: 'needs', label: 'Simulated' };
    return pet.viaToken ? { status: 'info', label: 'Token' } : null;
  };
  // A missing pet's card dims: in the Pet Mart+ view only one with no copy to upgrade
  const isMissing = (pet) => !failed && (plusView ? !pet.upgraded && !pet.copies : !pet.acquired);
  const petName = (pet) => `${cleanUnderscore(pet.name)}${plusView || pet.upgraded ? '+' : ''}`;
  const crystals = (amount) => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
    {petCrystalIcon(16)}{formatNum(amount, 'whole')}
  </Box>;
  // When this pet (Base view) or upgrade (Pet Mart+ view) was last on its counter: today in green. A pet never seen has
  // no row, and without the worker's history only today is known.
  const saleRow = ({ lastSeen, inToday, historyLoaded: known }) => {
    if (inToday) return ['Last in the Pet Mart', <Box key={'today'} component={'span'} sx={{ color: 'text.success' }}>Today</Box>];
    return known && lastSeen ? ['Last in the Pet Mart', shortDate(lastSeen)] : null;
  };

  // The old page's card, tighter: the bonus under the name, the copies at the top right, the rest behind Details (a fact
  // row on every card ran the page as tall as the old one). A row the page is about stays out: the tradable copies
  // under the Tradable filter, the price in the Pet Mart+ view, the date while sorted by it. The date is the Pet Mart's,
  // not the pet's, so it sits under the card's line, at its foot. A tile each said only the name, so sorting by the Pet
  // Mart showed no dates.
  const petCard = (pet) => {
    const stateOf = petState(pet);
    const shownEffect = plusView ? pet.upgradedEffect : pet.upgraded && pet.upgradedEffect ? pet.upgradedEffect : pet.effect;
    const copies = plusView ? pet.upgradedCount : pet.copies;
    const tradable = !copies || (!plusView && (pet.viaToken || pet.simulated)) ? null
      : ['Tradable', `${formatNum((plusView ? pet.upgradedTradableCount : pet.tradableCount) ?? 0)} / ${formatNum(copies)}`];
    const plusTradable = !plusView && pet.upgradedCount > 0
      ? ['Pet Mart+ tradable', `${formatNum(pet.upgradedTradableCount ?? 0)} / ${formatNum(pet.upgradedCount)}`] : null;
    const price = !pet.upgraded && pet.upgradeCost > 0 ? ['Pet Mart+', crystals(pet.upgradeCost)] : null;
    const sale = saleRow(salesOf(pet.index));
    const facts = (rows) => (failed || !rows.some(Boolean) ? null : <ItemCard.Facts rows={rows}/>);
    const filteredTradable = show === 'tradable';
    const lines = failed ? [] : [
      plusView && !pet.upgraded && !pet.copies ? 'Needs the base pet' : null,
      !plusView && pet.viaToken ? 'Bonus active via Pet Bonus Token' : null,
      !plusView && pet.simulated ? "Bonus simulated, you don't own this pet" : null
    ].filter(Boolean);
    return <ItemCard key={pet.index} icon={monsterSprite(pet.name)} iconAlt={petName(pet)} title={petName(pet)}
                     meta={effectText(shownEffect)} status={stateOf?.status} statusLabel={stateOf?.label} dimmed={isMissing(pet)}
                     aside={!failed && copies > 0 ? <Typography variant={'body2'}>x{formatNum(copies)}</Typography> : null}
                     more={facts([filteredTradable ? null : tradable, plusTradable, plusView ? null : price])}
                     footer={!failed && sale && (toolbar.details || sortedBySighting) ? <ItemCard.Facts rows={[sale]}/> : undefined}>
      {lines.length ? <ItemCard.Desc text={lines}/> : null}
      {facts([filteredTradable ? tradable : null, plusView ? price : null])}
    </ItemCard>;
  };

  // While simulating, a pet you could count as owned is picked by its tile
  const petTile = (pet) => {
    const editable = !plusView && pet.copies === 0 && !pet.viaToken;
    return <IconTile key={pet.index} icon={monsterSprite(pet.name)} alt={petName(pet)} label={petName(pet)}
                     status={isMissing(pet) ? 'missing' : undefined}
                     {...(editable ? { onSelect: () => toggleDraft(pet.index), selected: draft?.has(pet.index) ?? false } : {})}/>;
  };

  const petList = (title, list) => (list?.length ? <Stack key={title} gap={1.5}>
    <Typography variant={'sectionTitle'} component={'h2'}>{title}</Typography>
    {editing
      ? <CardGrid size={'icon'} fill={LABELED_TILE_MIN}>{list.map(petTile)}</CardGrid>
      : <CardGrid size={'s'} details={!failed && toolbar.details}>{list.map(petCard)}</CardGrid>}
  </Stack> : null);

  return <>
    {ownAccount && !plusView ? <PageSettings state={{}} defaults={{}} onChange={() => {}} onReset={() => {}}>
      <PageSettings.Action label={'Simulate pets'}
                           help={"Count pets you don't own as owned, at their base level, on every page."}
                           action={{ label: 'Edit pets', onClick: () => setDraft(new Set(simulated ?? [])) }}/>
    </PageSettings> : ownAccount ? <PageSettingsRoom/> : null}
    <Box sx={{ mb: 1 }}>
      <StatTile label={progress.label} value={failed ? '-' : `${formatNum(progress.done)} / ${formatNum(progress.total)}`}/>
    </Box>
    {editing ? <Stack gap={1.5} sx={{ my: 2 }}>
      <Notice>
        Pick the pets you don&apos;t own yet and save: the site counts them as owned, at their base level, not the Pet Mart+ level.
      </Notice>
      <Stack direction={'row'} gap={1}>
        <Button variant={'contained'} disabled={saving} onClick={handleSave}>Save</Button>
        <Button disabled={saving} onClick={() => setDraft(null)}>Cancel</Button>
      </Stack>
    </Stack> : <Toolbar state={{ ...toolbar, view }} defaults={{ ...PETS_TOOLBAR, view: 'pets' }} total={pool.length}
                        shown={failed ? pool.length : shownCount} noun={'pets'}
                        onChange={(patch) => {
                          if (patch.view) setView(patch.view);
                          const { view: _view, ...rest } = patch;
                          if (Object.keys(rest).length) setToolbar(rest);
                        }}
                        onReset={() => {
                          resetToolbar();
                          setView('pets');
                        }}
                        note={historyFailed
                          ? <Notice tone={'info'}>The Pet Mart history didn&apos;t load: only your save&apos;s rotation is marked.</Notice>
                          : null}>
      {failed ? null : <Toolbar.Search placeholder={'Search pets'}/>}
      <Toolbar.View options={[['pets', 'Base'], ['plus', 'Pet Mart+']]}/>
      {failed || showOptions.length < 2 ? null : <Toolbar.Show pills options={showOptions}/>}
      {failed ? null : <Toolbar.Filter name={'details'} label={'Details'} display/>}
      {failed || !historyLoaded ? null : <Toolbar.Sort options={[['lastSeen', 'Last in the Pet Mart', 'desc', ['Longest ago first', 'Most recent first']]]}/>}
    </Toolbar>}
    {/* The banner says how many and turns it off; this says what the numbers mean */}
    {ownAccount && !plusView && !editing && simulatedCount > 0 ? <Box sx={{ mb: 2 }}>
      <Notice tone={'missing'} icon={IconFlask}>
        Simulated pets count at their base level, not the Pet Mart+ level of the pets you own.
      </Notice>
    </Box> : null}
    <Stack gap={3}>
      {sortedBySighting
        ? petList('All pets', bySighting)
        : groups.map((group) => petList(group.name, filterCompanions(group.indices)))}
      {/* Outside the counted list, so like a Show option a search hides it rather than leave it beside a "no match" note */}
      {!editing && !plusView && !sortedBySighting && show === 'all' && !query && unreleasedIndices.length > 0
        ? petList('Not yet released', unreleasedIndices.map((i) => indexedCompanions[i]).filter(Boolean))
        : null}
    </Stack>
  </>;
};

export default PetCollection;
