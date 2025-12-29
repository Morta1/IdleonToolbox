import {
  Autocomplete,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { cleanUnderscore } from '@utility/helpers';
import { format, isValid } from 'date-fns';
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { getExoticMarketRotations } from '@parsers/world-6/farming';

const ExoticMarketRotation = () => {
  const { state } = useContext(AppContext);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const [filter, setFilter] = useState([]);
  const [weeks, setWeeks] = useState(10);

  // Get all valid exotic market upgrades for the filter dropdown (use processed data for actual values)
  const allUpgrades = useMemo(() => {
    const processedMarket = state?.account?.farming?.exoticMarket || [];
    return processedMarket
      ?.map((upgrade, index) => ({ ...upgrade, index }))
      ?.filter(({ name }) => name !== 'NAME_MAGNI') || [];
  }, [state?.account?.farming?.exoticMarket]);

  const rotations = useMemo(() => getExoticMarketRotations(state?.account, weeks), [state?.account, weeks]);

  // Filter rotations based on selected upgrades
  const filteredRotations = useMemo(() => {
    if (filter.length === 0) return rotations;
    return rotations?.filter((rotation) => {
      return rotation.upgrades?.some(({ name }) => filter.map(f => f.name).includes(name));
    });
  }, [rotations, filter]);

  if (!rotations?.length) {
    return <Typography>No rotation data available</Typography>;
  }

  return (
    <Stack gap={3}>
      <Stack direction="row" gap={2} alignItems="flex-start" flexWrap="wrap" sx={{ mb: 1 }}>
        <Autocomplete
          size="small"
          multiple
          limitTags={isSm ? 2 : 3}
          value={filter}
          onChange={(event, newValue) => setFilter(newValue)}
          disablePortal
          options={allUpgrades}
          sx={{ width: { xs: 300, sm: 500 } }}
          filterSelectedOptions
          getOptionLabel={(option) => option ? cleanUnderscore(option?.name?.toLowerCase()?.capitalizeAll()) : ''}
          renderOption={(props, option) => (
            <li {...props} key={'option-' + option?.index}>
              <Stack alignItems="flex-start">
                <Typography variant="body2" fontWeight="bold">
                  {cleanUnderscore(option?.name?.toLowerCase()?.capitalizeAll())}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {cleanUnderscore(option?.displayText)}
                </Typography>
              </Stack>
            </li>
          )}
          renderInput={(params) => <TextField {...params} label="Filter by upgrade" />}
        />
        <FormControl size="small">
          <InputLabel>Weeks</InputLabel>
          <Select 
            label="Weeks" 
            sx={{ width: 100 }} 
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={30}>30</MenuItem>
            <MenuItem value={40}>40</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Stack gap={4}>
        {filteredRotations.map((rotation, rotationIndex) => {
          const isCurrentWeek = rotation.weekOffset === 0;
          return (
            <Stack key={'rotation-' + rotationIndex}>
              <Stack direction="row" alignItems="baseline" gap={2} mb={2}>
                <Typography 
                  variant="h6" 
                  color={isCurrentWeek ? 'success.light' : 'text.primary'}
                >
                  {isCurrentWeek ? 'Current Rotation' : `Week ${rotation.weekOffset + 1}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isValid(rotation.date) 
                    ? `${format(rotation.date, 'dd/MM/yyyy HH:mm:ss')} (${format(rotation.date, 'MMM do, yyyy')})`
                    : null}
                </Typography>
              </Stack>

              <Stack direction="row" flexWrap="wrap" gap={2}>
                {rotation.upgrades.map((upgrade, upgradeIndex) => {
                  const isHighlighted = filter.length > 0 && filter.some(f => f.name === upgrade.name);
                  return (
                    <Card 
                      key={'upgrade-' + rotationIndex + '-' + upgradeIndex} 
                      sx={{ 
                        width: 250,
                        borderColor: isHighlighted ? 'success.light' : undefined,
                        borderWidth: isHighlighted ? 2 : undefined,
                        borderStyle: isHighlighted ? 'solid' : undefined
                      }}
                    >
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Stack direction="row" gap={2} alignItems="center">
                          <Typography fontWeight="bold">
                            {cleanUnderscore(upgrade.name.toLowerCase().capitalizeAll())}
                          </Typography>
                          <Typography variant="caption">Lv. {upgrade.level || 0}</Typography>
                        </Stack>
                        <Typography variant="body2" mt={1}>
                          {cleanUnderscore(upgrade.displayText)}
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>

              {rotationIndex < filteredRotations.length - 1 && <Divider sx={{ mt: 4 }} />}
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default ExoticMarketRotation;
