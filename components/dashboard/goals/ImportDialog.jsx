import React, { useContext, useState } from 'react';
import {
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
import { ALL_GOALS, defaultCharMap, parseImport, planImport, summarizeImport } from '@utility/goals/importExport';
import { trackEvent } from '@utility/analytics';
import AppDialog from '@components/common/Overlays/AppDialog';
import { notify } from '@components/common/Overlays/notify';

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

const ImportBody = ({ file, mode, setMode, charMap, setCharMap, characters, plan, currentCount, noun, leftOut }) => {
  const summary = summarizeImport(file);
  return (
    <Stack gap={2} sx={{ pt: 1 }}>
      <Typography>{`${summary.total} ${summary.total === 1 ? 'goal' : 'goals'}: ${summary.account} account, ${summary.character} character`}</Typography>
      <FormControl>
        <RadioGroup value={mode} onChange={(e) => setMode(e.target.value)}>
          <FormControlLabel value="merge" control={<Radio size="small"/>} label="Merge with my goals"/>
          <FormControlLabel value="replace" control={<Radio size="small"/>} label={`Replace my ${noun}s`}/>
        </RadioGroup>
      </FormControl>
      {mode === 'replace' && currentCount > 0 ? (
        <Typography variant="body2" color="text.warning">
          {`This removes your ${currentCount} current ${noun}${currentCount === 1 ? '' : 's'}`}
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
          plan.missing ? `${plan.missing} not found on your account` : null,
          plan.invalid ? `${plan.invalid} with a target that no longer applies` : null,
          leftOut ? `${leftOut} other ${leftOut === 1 ? 'goal' : 'goals'} left out` : null
        ].filter(Boolean).join(', ')}
      </Typography>
    </Stack>
  );
};

// Mounted per picked file, so the parse and the character defaults are computed once.
// `only` narrows the import to some goals (the material tracker's): the file's other goals are left out, and replace
// removes only the current goals it matches.
const ImportDialog = ({ text, onClose, only = ALL_GOALS, noun = 'goal' }) => {
  const { state } = useContext(AppContext);
  const { goals, loaded, saveMany, removeMany } = useGoals();
  const { account, characters = [] } = state ?? {};
  const [parsed] = useState(() => {
    if (text === READ_ERROR) return { ok: false, error: 'read' };
    const result = parseImport(text, { greenstackKeys: greenstackKeysOf({ account, characters }) });
    if (!result.ok) return result;
    const file = { ...result.file, goals: result.file.goals.filter(only) };
    return { ...result, file, leftOut: result.file.goals.length - file.goals.length, charMap: defaultCharMap(file, characters) };
  });
  const [mode, setMode] = useState('merge');
  // Mounted per file: it closes itself and tells the caller once it has slid out. The import lands then too,
  // so the counts on screen hold while it leaves.
  const [open, setOpen] = useState(true);
  const [importing, setImporting] = useState(false);
  const [charMap, setCharMap] = useState(parsed.charMap ?? {});

  const replaced = goals.filter(only);
  const plan = parsed.ok ? planImport(parsed.file, { account, current: goals, characters, mode, charMap, only }) : null;

  const doImport = () => {
    setImporting(true);
    setOpen(false);
  };

  const finish = () => {
    if (importing) {
      // The plan already applied the caps, so the add below cannot fail after the removal
      if (mode === 'replace') removeMany(replaced.map(({ id }) => id));
      saveMany(plan.goals);
      if (plan.added > 0) trackEvent('goal_added', { source: 'import', count: plan.added });
      // A result is a confirmation (Overlays board): the dialog closes and the snackbar says it.
      notify(resultText(plan));
    }
    onClose();
  };

  const importLabel = `Import ${plan?.added ?? 0} ${plan?.added === 1 ? noun : `${noun}s`}`;
  return (
    <AppDialog open={open} onClose={() => setOpen(false)} onExited={finish} size="m" title="Import goals"
               actions={parsed.ok ? [
                 { label: 'Cancel' },
                 { label: importLabel, main: true, disabled: !loaded || plan.goals.length === 0, onClick: doImport }
               ] : undefined}>
      {parsed.ok
        ? <ImportBody file={parsed.file} mode={mode} setMode={setMode} charMap={charMap} setCharMap={setCharMap}
                      characters={characters} plan={plan} currentCount={replaced.length} noun={noun}
                      leftOut={parsed.leftOut}/>
        : <Typography color="text.error">{ERRORS[parsed.error]}</Typography>}
    </AppDialog>
  );
};

export default ImportDialog;
