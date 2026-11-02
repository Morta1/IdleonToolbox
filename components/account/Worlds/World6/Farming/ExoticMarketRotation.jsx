import { Autocomplete, Box, Divider, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { isValid } from 'date-fns';
import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { getExoticMarketReturnWeeks, getExoticMarketRotations } from '@parsers/world-6/farming';
import ExoticReturnsIn from './ExoticReturnsIn';
import useFormatDate from '@hooks/useFormatDate';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import Notice from '@components/common/Notice';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const ROTATION_TOOLBAR = { weeks: 10 };
const WEEKS = [10, 20, 30, 40, 50];

const upgradeName = (upgrade) => (upgrade ? cleanUnderscore(upgrade?.name?.toLowerCase()?.capitalizeAll()) : '');

const ExoticMarketRotation = () => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  // A pick for this visit, not remembered; the weeks are the bar's, remembered per page
  const [filter, setFilter] = useState([]);
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('farming-exotic-rotation', ROTATION_TOOLBAR);
  const weeks = toolbar?.weeks ?? 10;

  // Get all valid exotic market upgrades for the filter dropdown (use processed data for actual values)
  const processedMarket = state?.account?.farming?.exoticMarket || [];
  const allUpgrades = processedMarket
    ?.map((upgrade, index) => ({ ...upgrade, index }))
    ?.filter(({ name }) => name !== 'NAME_MAGNI') || [];

  const rotations = getExoticMarketRotations(state?.account, weeks);
  const returnsIn = getExoticMarketReturnWeeks(state?.account);

  // Filter rotations based on selected upgrades
  const filteredRotations = filter.length === 0
    ? rotations
    : rotations?.filter((rotation) => {
      return rotation.upgrades?.some(({ name }) => filter.map(f => f.name).includes(name));
    });

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
        <Toolbar.Lead>
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
            renderInput={(params) => <TextField {...params} label="Filter by upgrade"/>}
          />
        </Toolbar.Lead>
        <Toolbar.Show name={'weeks'} options={WEEKS.map((count) => [count, `${count} weeks`])}/>
      </Toolbar>

      <Stack gap={4} sx={{ mt: 2 }}>
        {filteredRotations.map((rotation, rotationIndex) => {
          const isCurrentWeek = rotation.weekOffset === 0;
          return (
            <Stack key={'rotation-' + rotationIndex}>
              <Stack direction="row" alignItems="baseline" gap={2} mb={2} flexWrap={'wrap'}>
                <Typography variant={'sectionTitle'} component={'h2'}>
                  {isCurrentWeek ? 'Current rotation' : `Week ${rotation.weekOffset + 1}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isValid(rotation.date) ? formatDate(rotation.date, { showSeconds: false }) : null}
                </Typography>
              </Stack>

              <CardGrid size={'m'}>
                {rotation.upgrades.map((upgrade, upgradeIndex) => {
                  const isHighlighted = filter.length > 0 && filter.some(f => f.name === upgrade.name);
                  return <ItemCard key={'upgrade-' + rotationIndex + '-' + upgradeIndex}
                                   icon={`data/FarmCrop${upgrade.x2}.png`} title={upgradeName(upgrade)}
                                   level={{ value: upgrade.level || 0 }}
                                   status={isHighlighted ? 'selected' : undefined} statusLabel={'Matches filter'}
                                   footer={<ExoticReturnsIn weeks={returnsIn(upgrade.index, rotation.weekOffset)}/>}>
                    <ItemCard.Desc text={upgrade.displayText}/>
                  </ItemCard>;
                })}
              </CardGrid>

              {rotationIndex < filteredRotations.length - 1 && <Divider sx={{ mt: 4 }}/>}
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
};

export default ExoticMarketRotation;
