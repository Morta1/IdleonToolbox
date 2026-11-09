import { Autocomplete, Box, Divider, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, gameLines, titleCaseName } from '@utility/helpers';
import { isValid } from 'date-fns';
import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { EXOTIC_MARKET_RETURN_LOOKAHEAD, getExoticMarketReturnWeeks, getExoticMarketRotations } from '@parsers/world-6/farming';
import ExoticReturnsIn from './ExoticReturnsIn';
import useFormatDate from '@hooks/useFormatDate';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import Notice from '@components/common/Notice';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import { isSectionFailed } from '@components/common/styles';

const ROTATION_TOOLBAR = { weeks: 10, view: 'table' };
const WEEKS = [10, 20, 30, 40, 50];
const VIEWS = [['table', 'Table'], ['cards', 'Cards']];

const upgradeName = (upgrade) => (upgrade ? titleCaseName(cleanUnderscore(upgrade?.name)) : '');

const ExoticMarketRotation = () => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  // A pick for this visit, not remembered; the weeks are the bar's, remembered per page
  const [filter, setFilter] = useState([]);
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('farming-exotic-rotation', ROTATION_TOOLBAR);
  const weeks = toolbar?.weeks ?? 10;
  // The forecast comes from the date, so a failed section keeps each week's names; their levels and effects are gone
  const sectionFailed = isSectionFailed(state?.account, 'farming');

  // Get all valid exotic market upgrades for the filter dropdown (use processed data for actual values)
  const processedMarket = state?.account?.farming?.exoticMarket || [];
  const allUpgrades = processedMarket
    ?.map((upgrade, index) => ({ ...upgrade, index }))
    ?.filter(({ name }) => name !== 'NAME_MAGNI') || [];

  const rotations = getExoticMarketRotations(state?.account, weeks);
  const returnsIn = getExoticMarketReturnWeeks(state?.account);

  // The weeks holding a picked upgrade, which the cards mark and the table leaves bright
  const isMatch = filter.length ? (upgrade) => filter.some((f) => f.name === upgrade.name) : null;
  const filteredRotations = isMatch ? rotations?.filter((rotation) => rotation.upgrades?.some(isMatch)) : rotations;
  const weekDate = (rotation) => (isValid(rotation.date) ? formatDate(rotation.date, { showSeconds: false }) : null);

  // A guest has no save clock to count weeks from
  if (!rotations?.length) {
    return <Notice>The rotations show once a save is loaded: they follow its weekly clock.</Notice>;
  }

  return (
    <Box>
      <Toolbar state={toolbar} defaults={ROTATION_TOOLBAR} onChange={setToolbar}
               onReset={() => {
                 resetToolbar();
                 setFilter([]);
               }}
               total={rotations?.length ?? 0} shown={filteredRotations?.length ?? 0} noun={'weeks'}>
        {sectionFailed ? null : <Toolbar.Lead ownRow>
          <Autocomplete
            multiple
            limitTags={2}
            value={filter}
            onChange={(event, next) => setFilter(next)}
            disablePortal
            options={allUpgrades}
            filterSelectedOptions
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' }, width: { sm: 500 }, minWidth: 0 }}
            getOptionLabel={upgradeName}
            renderOption={(props, option) => (
              <li {...props} key={'option-' + option?.index}>
                <Stack alignItems="flex-start">
                  <Typography variant="body2">{upgradeName(option)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cleanUnderscore(option?.displayText)}
                  </Typography>
                </Stack>
              </li>
            )}
            // The label sits inside, as the bar's own fields put theirs ("Show 10 weeks"): "Upgrade: Any", Any read as
            // the value it is
            renderInput={(params) => <TextField {...params} placeholder={filter.length ? undefined : 'Any'}
                                                sx={{ '& input::placeholder': { color: 'text.primary', opacity: 1 } }}
                                                slotProps={{
                                                  htmlInput: { ...params.inputProps, 'aria-label': 'Filter by upgrade' },
                                                  input: {
                                                    ...params.InputProps,
                                                    startAdornment: <>
                                                      <Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75, whiteSpace: 'nowrap' }}>
                                                        Upgrade:
                                                      </Box>
                                                      {params.InputProps.startAdornment}
                                                    </>
                                                  }
                                                }}/>}
          />
        </Toolbar.Lead>}
        <Toolbar.Show name={'weeks'} options={WEEKS.map((count) => [count, `${count} weeks`])}/>
        <Toolbar.View options={VIEWS}/>
      </Toolbar>

      {toolbar?.view === 'cards'
        ? <WeekCards rotations={filteredRotations} returnsIn={returnsIn} isMatch={isMatch} sectionFailed={sectionFailed}
                     weekDate={weekDate}/>
        : <WeekTables rotations={filteredRotations} returnsIn={returnsIn} isMatch={isMatch} sectionFailed={sectionFailed}
                      weekDate={weekDate}/>}
    </Box>
  );
};

const weekLabel = (rotation) => (rotation.weekOffset === 0 ? 'Current rotation' : `Week ${rotation.weekOffset + 1}`);

// A table a week, one line an upgrade: about twice the weeks to a screen as the cards
const WeekTables = ({ rotations, returnsIn, isMatch, sectionFailed, weekDate }) => (
  <Box sx={{ containerType: 'inline-size', mt: 2 }}>
    <Box sx={WEEKS_GRID_SX}>
      {rotations.map((rotation) => <Box key={rotation.weekOffset} sx={{ containerType: 'inline-size' }}>
        <DataTable columns={sectionFailed ? COLUMNS.filter(({ key }) => key !== 'level' && key !== 'bonus') : COLUMNS}
                   bands={[{
                     key: rotation.weekOffset,
                     label: weekLabel(rotation),
                     meta: weekDate(rotation),
                     rows: rotation.upgrades.map((upgrade) => ({
                       ...upgrade,
                       weekOffset: rotation.weekOffset,
                       returnsIn: returnsIn(upgrade.index, rotation.weekOffset)
                     }))
                   }]}
                   bandNoun={'upgrades'}
                   rowKey={(row) => `${row.weekOffset}-${row.index}`}
                   rowLabel={upgradeName}
                   muted={isMatch ? (row) => !isMatch(row) : undefined}
                   surface={'card'} sx={WEEK_TABLE_SX}/>
      </Box>)}
    </Box>
  </Box>
);

const WeekCards = ({ rotations, returnsIn, isMatch, sectionFailed, weekDate }) => (
  <Stack gap={4} sx={{ mt: 2 }}>
    {rotations.map((rotation, rotationIndex) => (
      <Stack key={'rotation-' + rotation.weekOffset}>
        <Stack direction="row" alignItems="baseline" gap={2} mb={2} flexWrap={'wrap'}>
          <Typography variant={'sectionTitle'} component={'h2'}>{weekLabel(rotation)}</Typography>
          <Typography variant="caption" color="text.secondary">{weekDate(rotation)}</Typography>
        </Stack>
        <CardGrid size={'m'}>
          {rotation.upgrades.map((upgrade, upgradeIndex) => (
            <ItemCard key={'upgrade-' + rotation.weekOffset + '-' + upgradeIndex}
                      icon={`data/FarmCrop${upgrade.x2}.png`} title={upgradeName(upgrade)}
                      level={sectionFailed ? undefined : { value: upgrade.level || 0 }}
                      status={isMatch?.(upgrade) ? 'selected' : undefined} statusLabel={'Matches filter'}
                      footer={<ExoticReturnsIn weeks={returnsIn(upgrade.index, rotation.weekOffset)}/>}>
              {sectionFailed ? null : <ItemCard.Desc text={upgrade.displayText}/>}
            </ItemCard>
          ))}
        </CardGrid>
        {rotationIndex < rotations.length - 1 && <Divider sx={{ mt: 4 }}/>}
      </Stack>
    ))}
  </Stack>
);

// As many weeks to a row as keep their bonus column (about 600 px each): two from 1200 px of page, three at 2560's.
// No table past 720 px, or its bonus runs away from the name
const WEEKS_GRID_SX = {
  display: 'grid', gap: 2, alignItems: 'start',
  gridTemplateColumns: 'minmax(0, 720px)',
  '@container (min-width: 1200px)': { gridTemplateColumns: 'repeat(2, minmax(0, 720px))' },
  '@container (min-width: 1880px)': { gridTemplateColumns: 'repeat(3, minmax(0, 720px))' }
};

// Fixed name, level and return widths keep the columns in line from week to week, the bonus taking the rest
const WEEK_TABLE_SX = {
  '& tbody td.name, & thead th.name': { whiteSpace: 'nowrap', width: 176 },
  '& td.col-0, & th.col-0': { width: 48 },
  '& td.col-2, & th.col-2': { width: 96 }
};

const COLUMNS = [
  { key: 'name', label: 'Upgrade', value: upgradeName,
    icon: (row) => <GameIcon src={`data/FarmCrop${row.x2}.png`} alt={''} size={24}/> },
  { key: 'level', label: 'Lv', numeric: true, from: { room: 400 }, value: (row) => row.level || 0 },
  { key: 'bonus', label: 'Bonus', from: { room: 520 }, value: (row) => gameLines(row.displayText ?? '').join(' ') },
  { key: 'returnsIn', label: 'Returns in', numeric: true, phone: true, value: (row) => row.returnsIn,
    render: (row) => (row.returnsIn === null ? `${EXOTIC_MARKET_RETURN_LOOKAHEAD}w+` : `${row.returnsIn}w`) }
];

export default ExoticMarketRotation;
