import { Fragment, useState } from 'react';
import { Autocomplete, Box, Button, ButtonBase, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { IconChevronDown, IconSearch, IconX } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import { monsterSprite } from '@utility/spriteImages';
import { getPetMartLoggedPets, getPetMartSightings } from '@utility/petMartHistory';
import usePageTop from '@hooks/usePageTop';
import Panel from '@components/common/cards/Panel';
import useStickyHeader from '@components/common/DataTable/useStickyHeader';
import GameIcon from '@components/common/GameIcon';
import { petCrystalIcon } from '@components/account/Pets/PetCollection';

// Rows shown before "Show older days".
const RECENT_DAYS = 14;
// The game's shop draws five offers per counter and names none of them (N.js, TournyStuff), so a column is its slot number.
const SLOTS = [1, 2, 3, 4, 5];
const COUNTERS = [['plus', 'Pet Mart+', '+'], ['base', 'Pet Mart', '']];

// The panel is the container: its width follows the page, which at 900 px beside an ad is narrower than at 768 without one.
// Five columns of sprite, name and price need NAMES_FIT's width, where every word of a released pet's name still fits; below
// it a day stacks. A discount fits on one line from DISCOUNT_FITS. Below ROW_FITS a sprite stands over its price and a day
// opens to its names.
const NAMES_FIT = '@container (min-width: 940px)';
const DISCOUNT_FITS = '@container (min-width: 1150px)';
const ROW_FITS = '@container (min-width: 480px)';
const ANSWER_TABLE_FITS = '@container (min-width: 600px)';

const LINES_SX = { '& > * + *': { borderTop: 1, borderColor: 'divider' } };
const HIT_SX = { bgcolor: 'primary.soft', borderRadius: '4px', boxShadow: 'inset 0 0 0 1px var(--mui-palette-primary-edge)' };
const PRICE_SX = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'text.primary', '& s': { color: 'text.secondary' } };
const STACKED_PRICE_SX = { '& s': { display: 'block', fontSize: 11, lineHeight: '13px' }, '& [data-now]': { display: 'block' } };

const Price = ({ offer, sx }) => {
  if (offer.price == null) return null;
  const discounted = offer.list > offer.price;
  return <Box component={'span'} sx={[PRICE_SX, ...(Array.isArray(sx) ? sx : [sx])]}>
    {discounted ? <><s>{formatNum(offer.list, 'whole')}</s>{' '}</> : null}
    <Box component={'span'} data-now sx={discounted ? { color: 'text.success' } : undefined}>{formatNum(offer.price, 'whole')}</Box>
  </Box>;
};

const TABLE_SX = {
  display: 'none',
  [NAMES_FIT]: { display: 'table' },
  width: '100%',
  tableLayout: 'fixed',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontSize: 13,
  lineHeight: '16px',
  '& th, & td': { p: 0, fontWeight: 400, textAlign: 'left', verticalAlign: 'middle' },
  '& thead > tr > *': { px: 1, pt: 1, pb: '6px', fontSize: 12, color: 'text.muted', borderBottom: 1, borderColor: 'divider' },
  '& tbody + tbody > tr:first-of-type > *': { borderTop: 1, borderColor: 'divider' }
};
// A long table's head stays in view, as DataTable's does, on the card's color.
const pinnedHeadSx = (top) => ({
  '& thead > tr > *': { position: 'sticky', top: `calc(${top}px + var(--page-tabs-pinned, 0px))`, zIndex: (theme) => theme.zIndex.appBar - 3, bgcolor: 'background.paper' }
});
const TABLE_CELL_SX = { display: 'flex', alignItems: 'center', gap: 0.5, height: 36, px: '6px', minWidth: 0 };
const TABLE_NAME_SX = { flex: 1, minWidth: 0, overflowWrap: 'anywhere' };
const TABLE_PRICE_SX = {
  flexShrink: 0,
  textAlign: 'right',
  '& s': { display: 'block', fontSize: 12, lineHeight: '14px' },
  '& [data-now]': { display: 'block', lineHeight: '14px' },
  [DISCOUNT_FITS]: { '& s': { display: 'inline', fontSize: 'inherit', lineHeight: 'inherit' }, '& [data-now]': { display: 'inline', lineHeight: 'inherit' } }
};

const DayDate = ({ day }) => <Box sx={{ py: '7px', pl: 2 }}>
  <Box sx={{ fontSize: 14, lineHeight: '20px', fontWeight: 500, whiteSpace: 'nowrap', color: 'text.primary' }}>{format(parseISO(day.date), 'MMM d, yyyy')}</Box>
  {day.shopDay != null ? <Box sx={{ fontSize: 12, lineHeight: '16px', color: 'text.secondary' }}>Shop day {day.shopDay}</Box> : null}
</Box>;

// A day's counters in five fixed columns, whatever is on them.
const WideDay = ({ day, pets, isHit }) => {
  const counters = COUNTERS.filter(([counter]) => day[counter]?.length);
  const dateCell = <Box component={'th'} scope={'rowgroup'} rowSpan={Math.max(1, counters.length)} sx={{ '&&': { verticalAlign: 'top' } }}><DayDate day={day}/></Box>;
  return <tbody>
    {counters.length ? counters.map(([counter, label, mark], row) => <tr key={counter}>
      {row === 0 ? dateCell : null}
      <Box component={'th'} scope={'row'} sx={{ pr: 1, color: 'text.secondary', whiteSpace: 'nowrap' }}>{label}</Box>
      {SLOTS.map((slot) => {
        const offer = day[counter][slot - 1];
        const pet = offer ? pets[offer.index] : null;
        return <td key={slot}>{pet ? <Box sx={[TABLE_CELL_SX, isHit(offer) && HIT_SX]}>
          <GameIcon src={pet.src} size={24} alt={''} loading={'lazy'}/>
          <Box component={'span'} sx={TABLE_NAME_SX}>{pet.name}{mark}</Box>
          <Price offer={offer} sx={TABLE_PRICE_SX}/>
        </Box> : null}</td>;
      })}
    </tr>) : <tr>{dateCell}<td colSpan={SLOTS.length + 1}/></tr>}
  </tbody>;
};

const FIVE_SX = { display: 'grid', gridTemplateColumns: `repeat(${SLOTS.length}, 1fr)`, columnGap: '2px' };
const FIVE_CELL_SX = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', minWidth: 0, px: '2px', borderRadius: '4px', textAlign: 'center' };
const FIVE_NAME_SX = { display: 'none', [ROW_FITS]: { display: 'block' }, width: '100%', fontSize: 13, lineHeight: '16px', overflowWrap: 'anywhere' };
const FIVE_PRICE_SX = [STACKED_PRICE_SX, { fontSize: 12, lineHeight: '15px', minHeight: 28 }];
const LIST_ROW_SX = { display: 'flex', alignItems: 'center', gap: 1, minHeight: 36, fontSize: 14, lineHeight: '20px', borderRadius: '4px' };

// A day where five named columns don't fit: each counter on its own lines, the names under the sprites, or on a phone when
// the day opens. A sprite stands alone there, so its alt names it.
const NarrowDay = ({ day, pets, isHit }) => {
  const [open, setOpen] = useState(false);
  return <Box sx={{ px: '12px', py: '10px' }}>
    <Stack direction={'row'} alignItems={'baseline'} justifyContent={'space-between'} gap={1}>
      <Box sx={{ fontSize: 14, lineHeight: '20px', fontWeight: 500 }}>{format(parseISO(day.date), 'MMM d')}</Box>
      {day.shopDay != null ? <Box sx={{ fontSize: 12, lineHeight: '20px', color: 'text.secondary' }}>Shop day {day.shopDay}</Box> : null}
    </Stack>
    {COUNTERS.filter(([counter]) => day[counter]?.length).map(([counter, label, mark]) => <Fragment key={counter}>
      <Box sx={{ mt: '6px', fontSize: 12, lineHeight: '20px', color: 'text.secondary' }}>{label}</Box>
      <Box sx={[FIVE_SX, open && { display: 'none', [ROW_FITS]: { display: 'grid' } }]}>
        {day[counter].map((offer) => {
          const pet = pets[offer.index];
          return pet ? <Box key={offer.index} sx={[FIVE_CELL_SX, isHit(offer) && HIT_SX]}>
            <GameIcon src={pet.src} size={32} alt={`${pet.name}${mark}`} loading={'lazy'}/>
            <Box component={'span'} aria-hidden sx={FIVE_NAME_SX}>{pet.name}{mark}</Box>
            <Price offer={offer} sx={FIVE_PRICE_SX}/>
          </Box> : <span key={offer.index}/>;
        })}
      </Box>
      {open ? <Box sx={{ [ROW_FITS]: { display: 'none' } }}>
        {day[counter].map((offer) => {
          const pet = pets[offer.index];
          return pet ? <Box key={offer.index} sx={[LIST_ROW_SX, isHit(offer) && HIT_SX]}>
            <GameIcon src={pet.src} size={24} alt={''} loading={'lazy'}/>
            <Box component={'span'} sx={{ flex: 1, minWidth: 0 }}>{pet.name}{mark}</Box>
            <Price offer={offer}/>
          </Box> : null;
        })}
      </Box> : null}
    </Fragment>)}
    <ButtonBase disableRipple aria-expanded={open} onClick={() => setOpen(!open)} sx={{
      display: 'flex', [ROW_FITS]: { display: 'none' }, width: '100%', minHeight: 44, mt: open ? 0 : '2px', mb: '-8px', gap: 0.5,
      color: 'primary.main', fontSize: 13, fontWeight: 500
    }}>
      {open ? 'Hide names' : 'Names'}
      <IconChevronDown size={16} aria-hidden style={{ transform: open ? 'rotate(180deg)' : 'none' }}/>
    </ButtonBase>
  </Box>;
};

// Both layouts stay in the page and CSS picks one, by the panel's width rather than the window's.
const RotationsTable = ({ days, pets, isHit }) => {
  const pageTop = usePageTop();
  const { boxRef, tableRef, sticky } = useStickyHeader(pageTop);
  return <Box ref={boxRef}>
    <Box component={'table'} ref={tableRef} sx={[TABLE_SX, sticky && pinnedHeadSx(pageTop)]}>
      <colgroup>
        <col style={{ width: 108 }}/>
        <col style={{ width: 64 }}/>
        {SLOTS.map((slot) => <col key={slot}/>)}
      </colgroup>
      <thead>
        <tr>
          <td/>
          <td/>
          {SLOTS.map((slot) => <th key={slot} scope={'col'}>Slot {slot}</th>)}
        </tr>
      </thead>
      {days.map((day) => <WideDay key={`${day.date}-${day.shopDay}`} day={day} pets={pets} isHit={isHit}/>)}
    </Box>
    <Box sx={[LINES_SX, { [NAMES_FIT]: { display: 'none' } }]}>
      {days.map((day) => <NarrowDay key={`${day.date}-${day.shopDay}`} day={day} pets={pets} isHit={isHit}/>)}
    </Box>
  </Box>;
};

const shortDate = (date) => format(parseISO(date), 'MMM d');
// One grid: a phone's title sits beside the sprite with the lines under both, a wider panel's table under the title.
const ANSWER_SX = {
  display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr)', columnGap: 1.5, alignItems: 'center', p: '12px',
  [ANSWER_TABLE_FITS]: { px: 2, alignItems: 'start' }
};
const ANSWER_SPRITE_SX = { display: 'flex', [ANSWER_TABLE_FITS]: { gridRow: 'span 2' } };
const ANSWER_BODY_SX = { gridColumn: '1 / -1', mt: 1, [ANSWER_TABLE_FITS]: { gridColumn: 2, mt: '6px' } };
const ANSWER_TABLE_SX = {
  display: 'none',
  [ANSWER_TABLE_FITS]: { display: 'table' },
  borderCollapse: 'collapse',
  fontSize: 14,
  lineHeight: '20px',
  '& th, & td': { py: '3px', pl: 0, pr: 3, textAlign: 'left', fontWeight: 400, whiteSpace: 'nowrap' },
  '& thead th': { pb: '2px', fontSize: 12, lineHeight: '16px', color: 'text.muted' },
  '& tbody th': { color: 'text.secondary' }
};

// What the search answers: when the pet last appeared and at what price, on each counter, today included.
const PetAnswer = ({ pet, history, todayDate, loggingSince }) => {
  const notLogged = `Not in the log, which starts ${shortDate(loggingSince)}`;
  const rows = COUNTERS.map(([counter, label]) => ({ label, seen: getPetMartSightings(history, pet.index, counter) }));
  const lastWords = ({ date }) => (date === todayDate ? 'Today' : format(parseISO(date), 'MMM d, yyyy'));
  return <Box sx={ANSWER_SX}>
    <Box sx={ANSWER_SPRITE_SX}><GameIcon src={pet.src} size={40} alt={''}/></Box>
    <Typography variant={'cardTitle'} component={'h3'}>{pet.name}</Typography>
    <Box sx={ANSWER_BODY_SX}>
      <Box component={'table'} sx={ANSWER_TABLE_SX}>
        <thead>
          <tr>
            <td/>
            <th scope={'col'}>Last seen</th>
            <th scope={'col'}>At</th>
            <th scope={'col'}>Lowest seen</th>
            <th scope={'col'}>Seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, seen }) => <tr key={label}>
            <th scope={'row'}>{label}</th>
            {seen ? <>
              <td>{lastWords(seen.last)}</td>
              <td><Price offer={seen.last}/></td>
              <td><Price offer={seen.lowest}/> <Box component={'span'} sx={{ color: 'text.secondary' }}>on {shortDate(seen.lowest.date)}</Box></td>
              <Box component={'td'} sx={{ color: 'text.secondary' }}>{seen.days} of {history.length} days</Box>
            </> : <Box component={'td'} colSpan={4} sx={{ color: 'text.secondary' }}>{notLogged}</Box>}
          </tr>)}
        </tbody>
      </Box>
      <Box sx={[LINES_SX, { [ANSWER_TABLE_FITS]: { display: 'none' }, borderTop: 1, borderColor: 'divider' }]}>
        {rows.map(({ label, seen }) => <Box key={label} sx={{ py: '6px', fontSize: 14, lineHeight: '20px' }}>
          <Typography variant={'groupLabel'} color={'text.secondary'}>{label}</Typography>
          {seen ? <>
            <Stack direction={'row'} justifyContent={'space-between'} gap={1}>
              <span>Last: {lastWords(seen.last)}</span>
              <Price offer={seen.last}/>
            </Stack>
            <Stack direction={'row'} justifyContent={'space-between'} gap={1} sx={{ color: 'text.secondary' }}>
              <span>Lowest: {lastWords(seen.lowest)}</span>
              <Price offer={seen.lowest}/>
            </Stack>
            <Box sx={{ color: 'text.secondary' }}>Seen {seen.days} of {history.length} days</Box>
          </> : <Box sx={{ color: 'text.secondary' }}>{notLogged}</Box>}
        </Box>)}
      </Box>
    </Box>
  </Box>;
};

const FIELD_SX = {
  width: { xs: '100%', lg: 300 },
  flex: { sm: '1 1 0', lg: '0 0 auto' },
  minWidth: 0,
  '& .MuiOutlinedInput-root.MuiInputBase-root': { pl: '12px' },
  '& .MuiOutlinedInput-root .MuiAutocomplete-input.MuiInputBase-input': { pl: 0 },
  '& .MuiAutocomplete-clearIndicator': { visibility: 'visible' }
};

// A search over the pets the log holds: 49 of 179 had appeared when this was written, so an unlogged name would be the
// common answer to a free text search.
const PetSearch = ({ options, value, onChange }) => <Autocomplete
  options={options}
  value={value}
  onChange={(event, next) => onChange(next?.index ?? null)}
  getOptionLabel={({ name }) => name}
  isOptionEqualToValue={(option, picked) => option.index === picked.index}
  autoHighlight
  forcePopupIcon={false}
  clearIcon={<IconX size={16}/>}
  clearText={'Clear the search'}
  noOptionsText={'No logged pet by that name'}
  sx={FIELD_SX}
  renderOption={({ key, ...props }, option) => <li {...props} key={option.index}>
    <Box component={'span'} sx={{ display: 'inline-flex', mr: 1 }}><GameIcon src={option.src} size={24} alt={''} loading={'lazy'}/></Box>
    {option.name}
  </li>}
  renderInput={(params) => <TextField {...params} placeholder={'Find a pet: when it last showed up'}
                                      slotProps={{
                                        htmlInput: { ...params.inputProps, 'aria-label': 'Find a pet: when it last showed up', spellCheck: false },
                                        input: {
                                          ...params.InputProps,
                                          startAdornment: <InputAdornment position={'start'} sx={{ color: 'text.secondary' }}><IconSearch size={16}/></InputAdornment>
                                        }
                                      }}/>}
/>;

const noteRow = (text) => <Panel.Row name={<Typography variant={'body2'} component={'span'} color={'text.secondary'}>{text}</Typography>}/>;

// The log of past rotations (Pet Mart tab): one row per counter per day, or the days of the pet the search picked.
const PastRotations = ({ history, pastDays, todayDate, loggingSince, companions, isPending }) => {
  const [showAll, setShowAll] = useState(false);
  const [petIndex, setPetIndex] = useState(null);
  const pets = {};
  for (const index of getPetMartLoggedPets(history)) {
    const name = companions?.[index]?.name;
    if (name) pets[index] = { index, name: titleCaseName(cleanUnderscore(name)), src: monsterSprite(name) };
  }
  const options = Object.values(pets).sort((a, b) => a.name.localeCompare(b.name));
  const pet = options.find(({ index }) => index === petIndex) ?? null;
  const onCounter = ({ index }) => index === pet?.index;
  const hitDays = pet ? pastDays.filter((day) => COUNTERS.some(([counter]) => day[counter]?.some(onCounter))) : [];
  const shownDays = showAll ? pastDays : pastDays.slice(0, RECENT_DAYS);
  const pastDaysWord = `${hitDays.length || 'No'} past ${hitDays.length === 1 ? 'day' : 'days'} with this pet`;

  return <Box>
    <Panel title={'Past rotations'} sx={{ containerType: 'inline-size' }}
           meta={loggingSince ? `Logged daily since ${shortDate(loggingSince)}` : undefined}
           asideOwnRow={'lg'}
           aside={options.length ? <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} columnGap={2} rowGap={1}
                                          sx={{ ml: { xs: -0.5, sm: 0 } }}>
             <PetSearch options={options} value={pet} onChange={setPetIndex}/>
             <Stack direction={'row'} gap={0.5} alignItems={'center'} sx={{ whiteSpace: 'nowrap' }}>
               {petCrystalIcon(16)}
               <Typography variant={'body2'} component={'span'} color={'text.secondary'}>Prices in Pet Crystals</Typography>
             </Stack>
           </Stack> : undefined}>
      {isPending ? noteRow('Loading past rotations') : null}
      {!isPending && pet ? <PetAnswer pet={pet} history={history} todayDate={todayDate} loggingSince={loggingSince}/> : null}
      {!isPending && pet ? <Box sx={{ px: 2, pt: '10px', pb: hitDays.length ? 0 : '10px', fontSize: 14, lineHeight: '20px', fontWeight: 500 }}>{pastDaysWord}</Box> : null}
      {!isPending && pet && hitDays.length ? <RotationsTable days={hitDays} pets={pets} isHit={onCounter}/> : null}
      {!isPending && !pet && !pastDays.length ? noteRow('Past rotations show up here after the next restock.') : null}
      {!isPending && !pet && pastDays.length ? <RotationsTable days={shownDays} pets={pets} isHit={onCounter}/> : null}
    </Panel>
    {!pet && pastDays.length > RECENT_DAYS ? <Button size={'small'} sx={{ mt: 1 }} onClick={() => setShowAll(!showAll)}>
      {showAll ? 'Show fewer days' : `Show ${pastDays.length - RECENT_DAYS} older ${pastDays.length - RECENT_DAYS === 1 ? 'day' : 'days'}`}
    </Button> : null}
  </Box>;
};

export default PastRotations;
