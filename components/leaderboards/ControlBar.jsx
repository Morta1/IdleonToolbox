import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, FormControlLabel, IconButton, InputAdornment, Popover, Stack, Switch, TextField, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { IconDotsVertical, IconListSearch, IconSearch } from '@tabler/icons-react';
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
const FIELD_OUTLINE = 'rgba(255,255,255,0.23)';
const fieldHeight = { xs: 44, sm: 40 };

const optionLabel = (option) => (typeof option === 'string' ? option : option.mainChar);

// Matched prefix in bold, rank on the right when the names API sends one.
const PlayerOption = ({ name, rank, query }) => {
  const matched = name.toLowerCase().startsWith(query.toLowerCase()) ? query.length : 0;
  return (
    <Stack direction="row" alignItems="center" gap={1.25} sx={{ width: '100%' }}>
      <Box component="span" sx={{ flexGrow: 1, minWidth: 0 }}>
        <b>{name.slice(0, matched)}</b>{name.slice(matched)}
      </Box>
      {rank != null ? <Typography component="span" sx={{ fontSize: 12, color: 'text.disabled', flexShrink: 0 }}>{`#${rank}`}</Typography> : null}
    </Stack>
  );
};

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
      options={ready ? players : []}
      getOptionLabel={optionLabel}
      filterOptions={(options) => options}
      value={null}
      inputValue={input}
      onInputChange={(event, value, reason) => { if (reason !== 'reset') setInput(value); }}
      // freeSolo: Enter on free text arrives as 'createOption', which is how Anon# ids get searched
      // (the name search leaves them out by design).
      onChange={(event, value, reason) => {
        const name = value == null ? '' : optionLabel(value).trim();
        if (!name) return;
        onPlayer(name, reason === 'selectOption' ? 'typeahead' : 'enter');
        setInput('');
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps} aria-label={option.rank != null ? `${option.mainChar}, rank ${option.rank}` : option.mainChar}>
            <PlayerOption name={option.mainChar} rank={option.rank} query={debounced}/>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Find a player"
          helperText="Anonymous players can be found by their Anon# id"
          slotProps={{
            htmlInput: { ...params.inputProps, 'aria-label': 'Find a player' },
            input: {
              ...params.InputProps,
              startAdornment: <InputAdornment position="start" sx={{ color: 'text.secondary' }}><IconSearch size={16}/></InputAdornment>
            }
          }}
        />
      )}
      sx={{
        flex: '1 1 240px', minWidth: 200, maxWidth: { xs: 'none', sm: 360 },
        '& .MuiOutlinedInput-root': { height: fieldHeight, py: 0 }
      }}
    />
  );
};

const CATEGORY_LABEL = (category) => category.charAt(0).toUpperCase() + category.slice(1);

const KeyHint = () => (
  <InputAdornment position="end">
    <Box aria-hidden component="span" sx={{ fontSize: 11, color: 'text.disabled', border: `1px solid ${FIELD_OUTLINE}`, borderRadius: '4px', px: 0.75, lineHeight: '16px' }}>/</Box>
  </InputAdornment>
);

const MetricJump = ({ index, onMetric, inputRef = null, showKeyHint = false }) => {
  const options = Object.values(index.byKey).filter((meta) => meta.category && meta.key !== GLOBAL_METRIC);
  return (
    <Autocomplete
      size="small"
      options={options}
      groupBy={(option) => CATEGORY_LABEL(option.category)}
      getOptionLabel={(option) => option.label}
      value={null}
      blurOnSelect
      forcePopupIcon={false}
      disableClearable
      onChange={(event, option) => option && onMetric(option.key)}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          placeholder={`Jump to a board (${options.length})`}
          slotProps={{
            htmlInput: { ...params.inputProps, 'aria-label': 'Jump to board' },
            input: {
              ...params.InputProps,
              startAdornment: <InputAdornment position="start" sx={{ color: 'text.secondary' }}><IconListSearch size={16}/></InputAdornment>,
              endAdornment: showKeyHint ? <KeyHint/> : null
            }
          }}
        />
      )}
      sx={{
        flex: '1 1 220px', minWidth: 200, maxWidth: { xs: 'none', sm: 320 },
        '& .MuiOutlinedInput-root': { height: fieldHeight, py: 0, pr: 1.5 }
      }}
    />
  );
};

// Sits at the right end of the tab strip on desktop and in the phone menu. Times are the visitor's
// clock, so nothing renders until hydration.
export const LeaderboardStatus = ({ totalPlayers, createdAt }) => {
  const hydrated = useHydrated();
  const formatDate = useFormatDate();
  if (!hydrated || !createdAt) return null;
  return (
    <Typography variant="caption" sx={{ fontSize: 12, color: 'text.disabled', whiteSpace: 'nowrap' }}>
      {`${totalPlayers ? `${numberWithCommas(totalPlayers)} accounts · ` : ''}updated ${formatDate(createdAt, { timeOnly: true, showSeconds: false })} · next ~${formatDate(createdAt + AGGREGATION_INTERVAL, { timeOnly: true, showSeconds: false })}`}
    </Typography>
  );
};

const ControlBar = ({ index, totalPlayers, createdAt, showAnonymous, onToggleAnonymous, onPlayer, onMetric, children }) => {
  const { isVisible: showProfileBanner } = useProfileBannerState();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const jumpRef = useRef(null);

  // "/" focuses the board jump, registered on this page only and ignored while typing.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      const jump = jumpRef.current;
      if (!jump) return;
      jump.focus();
      // On a phone the desktop jump is display:none and cannot take focus; leave the key alone then.
      if (document.activeElement === jump) event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const anonSwitch = (
    <FormControlLabel
      control={<Switch checked={showAnonymous} onChange={onToggleAnonymous}/>}
      label="Show anonymous"
      slotProps={{ typography: { sx: { fontSize: 13, color: 'text.secondary' } } }}
      sx={{ minHeight: fieldHeight, my: 0 }}
    />
  );

  return (
    <Box sx={{
      position: 'sticky', top: navBarHeight + (showProfileBanner ? profileBannerHeight : 0), zIndex: (theme) => theme.zIndex.appBar - 1,
      bgcolor: 'background.default', py: 1.5, mb: 2, borderBottom: 1, borderColor: 'divider'
    }}>
      <Stack direction="row" gap={{ xs: 1, sm: 2 }} alignItems="flex-start" flexWrap={{ xs: 'nowrap', sm: 'wrap' }}>
        <PlayerSearch onPlayer={onPlayer}/>
        {/* Both layouts are in the markup and CSS picks one, so a phone does not reflow after hydration. */}
        <Box sx={{ display: { xs: 'none', sm: 'contents' } }}>
          <MetricJump index={index} onMetric={onMetric} inputRef={jumpRef} showKeyHint/>
          {anonSwitch}
          {children}
          <Box sx={{ flexGrow: 1 }}/>
        </Box>
        <IconButton
          aria-label="More options"
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          sx={{ display: { xs: 'inline-flex', sm: 'none' }, width: 44, height: 44, flexShrink: 0, bgcolor: 'rgba(255,255,255,0.08)', color: 'common.white' }}>
          <IconDotsVertical size={18}/>
        </IconButton>
      </Stack>
      <Popover
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Stack gap={1.5} sx={{ p: 2, width: 300 }}>
          <MetricJump index={index} onMetric={(key) => { setMenuAnchor(null); onMetric(key); }}/>
          {anonSwitch}
          {children}
          <LeaderboardStatus totalPlayers={totalPlayers} createdAt={createdAt}/>
        </Stack>
      </Popover>
    </Box>
  );
};

export default ControlBar;
