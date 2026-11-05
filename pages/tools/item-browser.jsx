import React, { useContext, useDeferredValue, useState } from 'react';
import { itemsArray } from '@website-data';
import {
  addEquippedItems,
  findItemByDescriptionInInventory,
  findItemInInventory,
  getAllItems,
  mergeItemsByOwner
} from 'parsers/items';
import { Autocomplete, Box, createFilterOptions, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import ItemDisplay from 'components/common/ItemDisplay';
import { AppContext } from 'components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';
import Notice from '@components/common/Notice';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import ShortAmount from '@components/common/ShortAmount';
import Toolbar from '@components/common/Toolbar';
import { isSectionFailed, MissingData } from '@components/common/styles';
import { ownerName } from '@components/tools/item-planner/ItemTooltip';
import useToolbarState from '@hooks/useToolbarState';

const filterOptions = createFilterOptions({ trim: true, limit: 250 });
// A description a whole catalog shares ("a") would draw every item's card: the name list has the same limit.
const RESULT_LIMIT = 250;

const BROWSER_SETTINGS = { countEquipped: true };
const BROWSER_TOOLBAR = { by: 'name', search: '' };

const itemLabel = (item) => cleanUnderscore(item?.displayName ?? '');
// The catalog keeps its words in lines: with no save to read, a search reads the words an item's card shows
const catalogForSearch = () => itemsArray.map((item) => ({
  ...item,
  description: [1, 2, 3, 4, 5, 6, 7, 8].map((line) => item?.[`desc_line${line}`]).filter((line) => line && line !== 'Filler').join(' '),
  misc: [item?.UQ1txt, item?.UQ2txt].filter(Boolean).join(' ')
}));
const ownerEntries = (owners) => Object.entries(owners ?? {}).filter(([owner]) => owner && owner !== 'undefined');

const ItemBrowser = () => {
  const { state } = useContext(AppContext);
  const [settings, setSettings, resetSettings] = usePageSettings('item-browser', BROWSER_SETTINGS);
  const [toolbar, setToolbar] = useToolbarState('item-browser', BROWSER_TOOLBAR);
  const [picked, setPicked] = useState(null);
  const search = useDeferredValue(toolbar.search.trim());
  const failed = isSectionFailed(state?.account, 'storage');
  const isGuest = Boolean(state?.emptyAccount);
  // What the page can say about owners: a guest owns nothing and a failed storage section can't say
  const knowsOwners = Boolean(state?.account) && !isGuest && !failed;
  const owned = knowsOwners ? mergeItemsByOwner([
    ...(getAllItems(state?.characters, state?.account) || []),
    ...addEquippedItems(state?.characters, settings.countEquipped)
  ]) : [];
  const owners = ownerEntries(findItemInInventory(owned, picked?.displayName));
  const totalAmount = owners.reduce((sum, [, { amount }]) => sum + amount, 0);
  const found = toolbar.by === 'description' && search ? findItemByDescriptionInInventory(knowsOwners ? owned : catalogForSearch(), search) : [];
  const results = Array.isArray(found) ? found : [];
  const changeToolbar = (patch) => {
    if (patch.by && patch.by !== toolbar.by) {
      setPicked(null);
      setToolbar({ ...patch, search: '' });
    } else {
      setToolbar(patch);
    }
  };

  return <>
    <NextSeo
      title="Item Browser | Idleon Toolbox"
      description="Browse all of your existing items with a handy search"
    />
    {failed ? <MissingData name={state?.account?.failedSections?.includes('*') ? 'your save' : 'Storage'} failed/>
      : isGuest ? <Notice tone={'signin'} sx={{ mb: 2 }}>Who owns an item shows here once you sign in.</Notice> : null}
    {state?.characters?.length ? <PageSettings state={settings} defaults={BROWSER_SETTINGS} onChange={setSettings} onReset={resetSettings}>
      <PageSettings.Toggle name={'countEquipped'} label={'Count equipped items'}
                           help={'Counts gear your characters are wearing, tools and food in their slots as owned.'}/>
    </PageSettings> : null}
    <Typography variant={'body2'} color={'text.secondary'}>Find an item and see who owns it, and how many.</Typography>
    <Box>
      {/* Search by picks how to search, not which items show: its default follows it, so it counts as no filter */}
      <Toolbar state={toolbar} defaults={{ ...BROWSER_TOOLBAR, by: toolbar.by }} onChange={changeToolbar}
               onReset={() => setToolbar({ search: '' })}
               total={knowsOwners ? owned.length : itemsArray.length} shown={results.length} noun={'items'}>
        {toolbar.by === 'name' ? <Toolbar.Lead>
          <Autocomplete
            value={picked}
            onChange={(event, next) => setPicked(next)}
            autoComplete
            options={itemsArray}
            filterOptions={filterOptions}
            isOptionEqualToValue={(option, value) => option?.rawName === value?.rawName}
            getOptionLabel={itemLabel}
            noOptionsText={'No item matches'}
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' }, width: { sm: 320 }, minWidth: 0 }}
            renderOption={({ key, ...props }, option) => <Stack component={'li'} key={key} {...props} direction={'row'} gap={1.5}>
              <GameIcon src={`data/${option?.rawName}.png`} fallback={`data/${option?.rawName}_x1.png`} size={24} alt={''}/>
              {itemLabel(option)}
            </Stack>}
            // The label sits inside, as the bar's own fields put theirs: "Item: Any", Any read as the value it is
            renderInput={(params) => <TextField {...params} placeholder={picked ? undefined : 'Any'}
                                                sx={{ '& input::placeholder': { color: 'text.primary', opacity: 1 } }}
                                                slotProps={{
                                                  htmlInput: { ...params.inputProps, 'aria-label': 'Item' },
                                                  input: {
                                                    ...params.InputProps,
                                                    startAdornment: <Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Item:</Box>
                                                  }
                                                }}/>}
          />
        </Toolbar.Lead> : <Toolbar.Search placeholder={'Search item descriptions'}/>}
        <Toolbar.Show name={'by'} label={'Search by'} options={[['name', 'Name'], ['description', 'Description']]}/>
      </Toolbar>
      {toolbar.by === 'name' && picked ? <CardGrid size={'m'}>
        <ItemCard><Box><ItemDisplay {...picked}/></Box></ItemCard>
        {knowsOwners ? <Panel title={'Owned by'}
                              meta={owners.length > 1 ? <>Total <ShortAmount amount={totalAmount}/></> : undefined}>
          {owners.length
            ? owners.map(([owner, { amount }]) => <Panel.Row key={owner} name={ownerName(owner)} value={<ShortAmount amount={amount}/>}/>)
            : <Typography variant={'body2'} color={'text.secondary'} sx={{ px: 2, py: 1.25 }}>No one has this yet.</Typography>}
        </Panel> : null}
      </CardGrid> : null}
      {toolbar.by === 'description' && !toolbar.search.trim()
        ? <Typography variant={'body2'} color={'text.secondary'}>Type part of a description to find items.</Typography>
        : null}
      {results.length ? <>
        {results.length > RESULT_LIMIT ? <Notice sx={{ mb: 2 }}>{`The first ${RESULT_LIMIT} are shown: type more to narrow them.`}</Notice> : null}
        <CardGrid size={'s'}>
          {results.slice(0, RESULT_LIMIT).map((item, index) => {
            const itemOwners = ownerEntries(findItemInInventory(owned, item?.name ?? item?.displayName));
            return <ItemCard key={`${item?.rawName}-${index}`} footer={itemOwners.length ? <Typography variant={'body2'} color={'text.secondary'}>
              {itemOwners.map(([owner, { amount }]) => `${ownerName(owner)} ${formatNum(amount, 'whole')}`).join(' · ')}
            </Typography> : null}>
              <Box><ItemDisplay {...item} owners={undefined}/></Box>
            </ItemCard>;
          })}
        </CardGrid>
      </> : null}
    </Box>
  </>;
};

export default ItemBrowser;
