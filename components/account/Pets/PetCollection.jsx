import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import Notice from '@components/common/Notice';
import { IconFlask } from '@tabler/icons-react';
import { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { getCompanionSets, isUnreleasedCompanion } from '@parsers/misc';
import { useLocalStorage } from '@mantine/hooks';
import { petsViewKey, simulatedCompanionsKey } from '@components/constants';
import { monsterSprite } from '@utility/spriteImages';
import { format, parseISO } from 'date-fns';
import { usePetMartHistory } from '@hooks/usePetMartHistory';
import { getPetMartLastSeen, lastInPetMartKey, mergePetMartHistory } from '@utility/petMartHistory';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatTile from '@components/common/cards/StatTile';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import PageSettings from '@components/common/PageSettings';
import useToolbarState from '@hooks/useToolbarState';

// The pet crystal has no sprite of its own: the toolbox tints the premium gem, as the nav does
export const PET_CRYSTAL_LOOK = { filter: 'hue-rotate(280deg)' };
export const petCrystalIcon = (size) => <Box component={'span'} sx={{ display: 'inline-flex', ...PET_CRYSTAL_LOOK }}>
  <GameIcon src={'data/PremiumGem.png'} size={size} alt={'Pet Crystals'}/>
</Box>;

// The game's effect text draws its + as {: every one, in both views
export const effectText = (text) => cleanUnderscore(`${text ?? ''}`.replaceAll('{', '+'));

const PETS_TOOLBAR = { show: 'all', sort: null };
const shortDate = (date) => format(parseISO(date), 'MMM d');

// When this pet (Base view) or upgrade (Pet Mart+ view) was last on its Pet Mart counter. A pet never seen shows
// nothing, and without the worker's history only "today" is known.
const saleLine = (sales) => {
  if (!sales) return null;
  const { lastSeen, inToday, historyLoaded } = sales;
  const text = inToday ? 'In the Pet Mart today' : historyLoaded && lastSeen ? `Last appeared ${shortDate(lastSeen)}` : null;
  if (!text) return null;
  return <Typography variant={'body2'} color={inToday ? 'text.success' : 'text.secondary'}>{text}</Typography>;
};

const PetCollection = ({ companions, sectionFailed }) => {
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

  const allCompanions = companions ?? [];
  const indexedCompanions = allCompanions.map((companion, index) => ({ ...companion, index }));
  // Simulating on someone else's profile or on the demo account would misrepresent their save.
  const ownAccount = !failed && !state?.profile && !state?.demo && !state?.emptyAccount;
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
  const inView = (indices) => indices.map((i) => indexedCompanions[i]).filter(Boolean)
    .filter((comp) => !plusView || inPlusPool(comp));
  const filterCompanions = (indices) => (editing ? inView(indices) : inView(indices).filter(matchesShow));

  const { groups, unreleasedIndices } = getCompanionSets(indexedCompanions);
  const released = groups.flatMap((group) => group.indices).map((i) => indexedCompanions[i]).filter(Boolean);
  // Pet Mart sightings: the worker's log plus today's stock from the account, read from the counter
  // that sells what the view shows (the pet itself, or its + upgrade).
  const petMart = state?.account?.tournament?.petMart;
  const now = Date.now();
  const history = mergePetMartHistory(historyData?.days, petMart, now);
  const lastSeenOf = getPetMartLastSeen(history, plusView ? 'plus' : 'base');
  const todayOffers = new Set(((plusView ? petMart?.plusOffers : petMart?.offers) ?? []).map((offer) => offer.companionIndex));
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
  const shownCount = pool.filter(matchesShow).length;

  const petState = (pet) => {
    if (failed) return null;
    if (plusView) return pet.upgraded ? { status: 'done', label: 'Upgraded' } : null;
    if (pet.simulated) return { status: 'needs', label: 'Simulated' };
    if (pet.viaToken) return { status: 'info', label: 'Token' };
    return pet.acquired ? { status: 'done', label: 'Owned' } : null;
  };
  const petMeta = (pet) => {
    if (failed) return undefined;
    if (plusView) return !pet.upgraded && !pet.copies ? 'Needs the base pet' : undefined;
    if (!pet.acquired) return 'Not owned';
    return pet.upgraded ? 'Pet Mart+' : undefined;
  };
  // A missing pet is not dimmed (its Pet Mart line keeps full contrast): its sprite greys and its meta says so
  const isMissing = (pet) => !failed && (plusView ? !pet.upgraded && !pet.copies : !pet.acquired);

  const petCard = (pet) => {
    const stateOf = petState(pet);
    const editable = editing && !plusView && pet.copies === 0 && !pet.viaToken;
    const shownEffect = plusView ? pet.upgradedEffect : pet.upgraded && pet.upgradedEffect ? pet.upgradedEffect : pet.effect;
    const upgradeCost = !pet.upgraded && pet.upgradeCost > 0 ? <Stack direction={'row'} alignItems={'center'} columnGap={1} flexWrap={'wrap'}>
      {plusView ? null : <Typography variant={'body2'} color={'text.secondary'}>Pet Mart+</Typography>}
      <ItemCard.Cost icon={petCrystalIcon(24)} iconAlt={'Pet Crystals'} need={pet.upgradeCost}
                     have={failed ? undefined : state?.account?.companions?.petCrystals ?? 0}
                     format={(value) => formatNum(value)}/>
    </Stack> : null;
    const sale = saleLine(salesOf(pet.index));
    return <ItemCard key={pet.index} icon={<GameIcon src={monsterSprite(pet.name)} size={40} alt={''}
                                                     status={isMissing(pet) ? 'missing' : undefined}/>}
                     title={`${cleanUnderscore(pet.name)}${plusView ? '+' : ''}`} meta={petMeta(pet)}
                     status={stateOf?.status} statusLabel={stateOf?.label}
                     footer={upgradeCost || sale ? <>{upgradeCost}{sale}</> : null}>
      <ItemCard.Desc text={[
        effectText(shownEffect),
        !plusView && !failed && pet.viaToken ? 'Bonus active via Pet Bonus Token' : null,
        !plusView && !failed && pet.simulated ? "Bonus simulated, you don't own this pet" : null
      ].filter(Boolean)}/>
      {failed ? null : <ItemCard.Facts rows={[
        !plusView && pet.acquired && !pet.viaToken && !pet.simulated
          ? ['Tradable', `${formatNum(pet.tradableCount ?? 0)} / ${formatNum(pet.copies ?? 0)}`] : null,
        pet.upgradedCount > 0
          ? [plusView ? 'Tradable' : 'Pet Mart+ tradable', `${formatNum(pet.upgradedTradableCount ?? 0)} / ${formatNum(pet.upgradedCount)}`]
          : null
      ]}/>}
      {editable ? <FormControlLabel label={'Count as owned'}
                                    control={<Checkbox size={'small'} checked={draft?.has(pet.index) ?? false}
                                                       onChange={() => toggleDraft(pet.index)}/>}/> : null}
    </ItemCard>;
  };

  const petList = (title, list) => (list?.length ? <Stack key={title} gap={2}>
    <Typography variant={'sectionTitle'} component={'h2'}>{title}</Typography>
    <CardGrid size={'m'}>{list.map(petCard)}</CardGrid>
  </Stack> : null);

  return <>
    {ownAccount && !plusView ? <PageSettings state={{}} defaults={{}} onChange={() => {}} onReset={() => {}}>
      <PageSettings.Action label={'Simulate pets'}
                           help={"Count pets you don't own as owned, at their base level, on every page."}
                           action={{ label: 'Edit pets', onClick: () => setDraft(new Set(simulated ?? [])) }}/>
    </PageSettings> : null}
    <Box sx={{ mb: 1 }}>
      <StatTile label={progress.label} value={failed ? '-' : `${formatNum(progress.done)} / ${formatNum(progress.total)}`}/>
    </Box>
    {editing ? <Stack gap={1.5} sx={{ my: 2 }}>
      <Notice>
        Tick the pets you don&apos;t own yet and save: the site counts them as owned, at their base level, not the Pet Mart+ level.
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
      <Toolbar.View options={[['pets', 'Base'], ['plus', 'Pet Mart+']]}/>
      {failed ? null : <Toolbar.Show options={[['all', 'All', counts.all], ['tradable', 'Tradable', counts.tradable],
        ['missing', plusView ? 'Not upgraded' : 'Missing', counts.missing]]}/>}
      {failed || !historyLoaded ? null : <Toolbar.Sort options={[['lastSeen', 'Last in the Pet Mart', 'desc']]}/>}
    </Toolbar>}
    {/* The banner says how many and turns it off; this says what the numbers mean */}
    {ownAccount && !plusView && !editing && simulatedCount > 0 ? <Box sx={{ mb: 2 }}>
      <Notice tone={'missing'} icon={IconFlask}>
        Simulated pets count at their base level, not the Pet Mart+ level of the pets you own.
      </Notice>
    </Box> : null}
    <Stack gap={4}>
      {sortedBySighting
        ? petList('All pets', bySighting)
        : groups.map((group) => petList(group.name, filterCompanions(group.indices)))}
      {!editing && !plusView && !sortedBySighting && show === 'all' && unreleasedIndices.length > 0
        ? petList('Not yet released', unreleasedIndices.map((i) => indexedCompanions[i]).filter(Boolean))
        : null}
    </Stack>
  </>;
};

export default PetCollection;
