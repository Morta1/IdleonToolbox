import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, FormControlLabel, IconButton, Menu, Stack, Switch, TextField, Typography, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import { IconDots } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import useHydrated from '@hooks/useHydrated';
import useFormatDate from '@hooks/useFormatDate';
import useProfileBannerState from '@hooks/useProfileBannerState';
import { navBarHeight, profileBannerHeight } from '@components/constants';
import { numberWithCommas } from '@utility/helpers';
import { searchNames } from '../../services/leaderboards';
import { AGGREGATION_INTERVAL, GLOBAL_METRIC } from './format';

const MIN_QUERY = 2;

const PlayerSearch = ({ onPlayer }) => {
  const [input, setInput] = useState('');
  const [debounced] = useDebouncedValue(input.trim(), 250);
  const ready = debounced.length >= MIN_QUERY;
  const { data: players = [] } = useQuery({
    queryKey: ['lb-names', debounced.toLowerCase()],
    queryFn: () => searchNames(debounced),
    enabled: ready,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData
  });
  return (
    <Autocomplete
      freeSolo
      size="small"
      options={ready ? players.map((player) => player.mainChar) : []}
      filterOptions={(options) => options}
      value={null}
      inputValue={input}
      onInputChange={(event, value, reason) => { if (reason !== 'reset') setInput(value); }}
      // freeSolo: Enter on free text arrives as 'createOption', which is how Anon# ids get searched
      // (the name search leaves them out by design).
      onChange={(event, value, reason) => {
        if (typeof value !== 'string' || !value.trim()) return;
        onPlayer(value.trim(), reason === 'selectOption' ? 'typeahead' : 'enter');
        setInput('');
      }}
      renderInput={(params) => <TextField {...params} label="Find a player" helperText="Anonymous players can be found by their Anon# id"/>}
      sx={{ flex: '1 1 240px', minWidth: 200, maxWidth: 360 }}
    />
  );
};

const CATEGORY_LABEL = (category) => category.charAt(0).toUpperCase() + category.slice(1);

const MetricJump = ({ index, onMetric, inputRef }) => {
  const options = Object.values(index.byKey).filter((meta) => meta.category && meta.key !== GLOBAL_METRIC);
  return (
    <Autocomplete
      size="small"
      options={options}
      groupBy={(option) => CATEGORY_LABEL(option.category)}
      getOptionLabel={(option) => option.label}
      value={null}
      blurOnSelect
      onChange={(event, option) => option && onMetric(option.key)}
      renderInput={(params) => <TextField {...params} inputRef={inputRef} label="Jump to board" placeholder="Press / to search"/>}
      sx={{ flex: '1 1 220px', minWidth: 200, maxWidth: 320 }}
    />
  );
};

const ControlBar = ({ index, totalPlayers, createdAt, showAnonymous, onToggleAnonymous, onPlayer, onMetric, children }) => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const { isVisible: showProfileBanner } = useProfileBannerState();
  const hydrated = useHydrated();
  const formatDate = useFormatDate();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const jumpRef = useRef(null);

  // "/" focuses the board jump, registered on this page only and ignored while typing.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (!jumpRef.current) return;
      event.preventDefault();
      jumpRef.current.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const anonSwitch = <FormControlLabel control={<Switch checked={showAnonymous} onChange={onToggleAnonymous}/>} label="Show anonymous"/>;
  // Times are the visitor's clock: never in the exported HTML.
  const status = hydrated && createdAt ? (
    <Typography variant="caption" color="text.secondary">
      {`${totalPlayers ? `${numberWithCommas(totalPlayers)} accounts · ` : ''}updated ${formatDate(createdAt, { timeOnly: true, showSeconds: false })} · next ~${formatDate(createdAt + AGGREGATION_INTERVAL, { timeOnly: true, showSeconds: false })}`}
    </Typography>
  ) : null;

  return (
    <Box sx={{
      position: 'sticky', top: navBarHeight + (showProfileBanner ? profileBannerHeight : 0), zIndex: (theme) => theme.zIndex.appBar - 1,
      bgcolor: 'background.default', py: 1.5, mb: 2, borderBottom: 1, borderColor: 'divider'
    }}>
      {isPhone ? (
        <Stack direction="row" gap={1} alignItems="flex-start">
          <PlayerSearch onPlayer={onPlayer}/>
          <IconButton aria-label="More options" onClick={(event) => setMenuAnchor(event.currentTarget)}><IconDots size={20}/></IconButton>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <Stack gap={1.5} sx={{ p: 2, width: 300 }}>
              <MetricJump index={index} inputRef={jumpRef} onMetric={(key) => { setMenuAnchor(null); onMetric(key); }}/>
              {anonSwitch}
              {children}
              {status}
            </Stack>
          </Menu>
        </Stack>
      ) : (
        <Stack direction="row" gap={2} alignItems="flex-start" flexWrap="wrap">
          <PlayerSearch onPlayer={onPlayer}/>
          <MetricJump index={index} onMetric={onMetric} inputRef={jumpRef}/>
          {anonSwitch}
          {children}
          <Box sx={{ flexGrow: 1 }}/>
          <Box sx={{ alignSelf: 'center' }}>{status}</Box>
        </Stack>
      )}
    </Box>
  );
};

export default ControlBar;
