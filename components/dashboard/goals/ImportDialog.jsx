import React, { useContext, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { getDescriptor } from '@utility/goals/registry';
import { defaultCharMap, parseImport, planImport, summarizeImport } from '@utility/goals/importExport';
import { trackEvent } from '@utility/analytics';

export const READ_ERROR = Symbol('read-error');

const ERRORS = {
  json: 'This file is not a goals export',
  format: 'This file is not a goals export',
  schema: 'This file is from a newer version of the site',
  read: 'This file could not be read'
};

const greenstackKeysOf = (ctx) => {
  const greenstack = getDescriptor('greenstack');
  return new Set(greenstack.list(ctx).map((row) => greenstack.key(row)));
};

const resultText = ({ added, duplicates, skipped, overCap }) => [
  `Imported ${added}.`,
  duplicates ? `${duplicates} already there.` : null,
  skipped ? `${skipped} skipped.` : null,
  overCap ? `${overCap} left out (goal limit).` : null
].filter(Boolean).join(' ');

const ImportBody = ({ file, mode, setMode, charMap, setCharMap, characters, plan, currentCount }) => {
  const summary = summarizeImport(file);
  return (
    <Stack gap={2} sx={{ pt: 1 }}>
      <Typography>{`${summary.total} ${summary.total === 1 ? 'goal' : 'goals'}: ${summary.account} account, ${summary.character} character`}</Typography>
      <FormControl>
        <RadioGroup value={mode} onChange={(e) => setMode(e.target.value)}>
          <FormControlLabel value="merge" control={<Radio size="small"/>} label="Merge with my goals"/>
          <FormControlLabel value="replace" control={<Radio size="small"/>} label="Replace my goals"/>
        </RadioGroup>
      </FormControl>
      {mode === 'replace' && currentCount > 0 ? (
        <Typography variant="body2" color="warning.main">
          {`This removes your ${currentCount} current goal${currentCount === 1 ? '' : 's'}`}
        </Typography>
      ) : null}
      {summary.characters.map(({ name, count }) => (
        <Stack key={name} direction="row" gap={2} alignItems="center">
          <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
            {`${name}: ${count} ${count === 1 ? 'goal' : 'goals'}`}
          </Typography>
          <TextField select size="small" label="Import as" sx={{ flex: 1, minWidth: 0 }}
                     value={Object.hasOwn(charMap, name) && typeof charMap[name] === 'string' ? charMap[name] : ''}
                     onChange={(e) => setCharMap({ ...charMap, [name]: e.target.value || null })}
                     slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="">Skip</MenuItem>
            {characters.map((c) => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
          </TextField>
        </Stack>
      ))}
      <Typography variant="body2" color="text.secondary">
        {[
          `${plan.added} will be added`,
          plan.duplicates ? `${plan.duplicates} already there` : null,
          plan.skipped ? `${plan.skipped} skipped` : null,
          plan.overCap ? `${plan.overCap} over the goal limit` : null,
          plan.missing ? `${plan.missing} not found on your account` : null
        ].filter(Boolean).join(', ')}
      </Typography>
    </Stack>
  );
};

// Mounted per picked file, so the parse and the character defaults are computed once
const ImportDialog = ({ text, onClose }) => {
  const { state } = useContext(AppContext);
  const { goals, loaded, saveMany, removeMany } = useGoals();
  const { account, characters = [] } = state ?? {};
  const [parsed] = useState(() => {
    if (text === READ_ERROR) return { ok: false, error: 'read' };
    const result = parseImport(text, { greenstackKeys: greenstackKeysOf({ account, characters }) });
    return result.ok ? { ...result, charMap: defaultCharMap(result.file, characters) } : result;
  });
  const [mode, setMode] = useState('merge');
  const [charMap, setCharMap] = useState(parsed.charMap ?? {});
  const [result, setResult] = useState(null);

  const plan = parsed.ok ? planImport(parsed.file, { account, current: goals, characters, mode, charMap }) : null;

  const doImport = () => {
    // The plan already applied the caps, so the add below cannot fail after the removal
    if (mode === 'replace') removeMany(goals.map(({ id }) => id));
    saveMany(plan.goals);
    if (plan.added > 0) trackEvent('goal_added', { source: 'import', count: plan.added });
    setResult(plan);
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Import goals</DialogTitle>
      <DialogContent>
        {!parsed.ok ? <Typography color="error">{ERRORS[parsed.error]}</Typography>
          : result ? <Typography>{resultText(result)}</Typography>
            : <ImportBody file={parsed.file} mode={mode} setMode={setMode} charMap={charMap} setCharMap={setCharMap}
                          characters={characters} plan={plan} currentCount={goals.length}/>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>{result || !parsed.ok ? 'Close' : 'Cancel'}</Button>
        {parsed.ok && !result ? (
          <Button variant="contained" onClick={doImport} disabled={!loaded || plan.goals.length === 0}
                  sx={{ textTransform: 'none' }}>
            Import
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default ImportDialog;
