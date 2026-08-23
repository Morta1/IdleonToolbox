import { NextSeo } from 'next-seo';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography
} from '@mui/material';
import React, { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { cleanUnderscore, getNextCompanionClaim, numberWithCommas, prefix } from '@utility/helpers';
import Timer from '@components/common/Timer';
import { CardTitleAndValue } from '../../../components/common/styles';
import { companionGroups } from '@website-data';
import { useLocalStorage } from '@mantine/hooks';
import { simulatedCompanionsKey } from '@components/constants';

// Its own component so ticking a pet re-renders that one card instead of all ~170 of them: every
// prop here is a primitive or a stable callback, which is what lets the compiler skip the rest.
const CompanionCard = ({ companion, index, editable, checked, onToggle }) => {
  const { name, effect, acquired = '', copies = 0, tradableCount = 0, viaToken = false, simulated = false } = companion;

  return <Card
    onClick={editable ? () => onToggle(index) : undefined}
    sx={{
      width: 300,
      border: acquired ? '1px solid' : '',
      borderColor: simulated ? 'info.dark' : acquired ? 'success.dark' : '',
      opacity: acquired || editable ? 1 : 0.4,
      cursor: editable ? 'pointer' : 'default'
    }}>
    <CardContent sx={{ '&:last-child': { padding: 1.5 }, height: '100%' }}>
      <Stack gap={2}>
        <Stack direction='row' gap={2}>
          {editable && <Checkbox size='small' checked={checked} sx={{ p: 0, alignSelf: 'flex-start' }}/>}
          <img width={42} height={42}
            style={{ objectFit: 'contain' }}
            src={`${prefix}afk_targets/${name}.png`} alt={name} />
          <Stack gap={1}>
            <Stack direction='row' gap={1} alignItems='center'>
              <Typography variant='body1'>{cleanUnderscore(name)}</Typography>
              {viaToken && <Chip label={'Token'} size={'small'} color={'primary'} sx={{ height: 18, fontSize: 10 }} />}
              {simulated && <Chip label={'Simulated'} size={'small'} color={'info'} sx={{ height: 18, fontSize: 10 }} />}
            </Stack>
            <Typography variant='body2' color='text.secondary'>{cleanUnderscore(effect?.replace('{', '+'))}</Typography>
            {acquired && !viaToken && !simulated && (
              <Typography variant="body2">
                Tradable: {numberWithCommas(tradableCount)}/{numberWithCommas(copies)}
              </Typography>
            )}
            {viaToken && (
              <Typography variant="body2" color='text.secondary'>
                Bonus active via Pet Bonus Token
              </Typography>
            )}
            {simulated && (
              <Typography variant="body2" color='text.secondary'>
                Bonus simulated, you don&apos;t own this pet
              </Typography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </CardContent>
  </Card>;
};

const CompanionList = ({ title, companions, editing, draft, onToggle }) => {
  if (!companions?.length) return null;

  return (
    <Stack gap={2}>
      <Typography variant="h5">{title}</Typography>
      <Divider />
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        {companions.map((companion) => (
          <CompanionCard
            key={companion.name}
            companion={companion}
            index={companion.index}
            editable={editing && companion.copies === 0 && !companion.viaToken}
            checked={draft?.has(companion.index) ?? false}
            onToggle={onToggle}
          />
        ))}
      </Stack>
    </Stack>
  );
};

const Pets = () => {
  const { state, reparseOwnAccount } = useContext(AppContext);
  const [filter, setFilter] = useState('all');
  const [simulated, setSimulated] = useLocalStorage({ key: simulatedCompanionsKey, defaultValue: [] });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const nextCompanionClaim = getNextCompanionClaim(state?.account);

  const allCompanions = state?.account?.companions?.list || [];
  // Built once per account, not per keystroke - a fresh object per card would re-render all of them
  // on every tick.
  const indexedCompanions = allCompanions.map((companion, index) => ({ ...companion, index }));
  const tokens = state?.account?.companions?.tokens;
  // Simulating on someone else's profile or on the demo account would misrepresent their save.
  const ownAccount = !state?.profile && !state?.demo && !state?.emptyAccount;
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

  const handleClear = async () => {
    setSaving(true);
    setSimulated([]);
    setDraft(null);
    await reparseOwnAccount();
    setSaving(false);
  };

  const filterCompanions = (indices) => {
    let result = indices.map(i => indexedCompanions[i]).filter(Boolean);
    if (editing) return result;
    if (filter === 'tradable') result = result.filter(comp => (comp?.tradableCount || 0) > 0);
    if (filter === 'missing') result = result.filter(comp => !comp?.acquired);
    return result;
  };

  return <>
    <NextSeo
      title="Premium Pets | Idleon Toolbox"
      description="View your companion collection, abilities, trade offers, and pet crystal upgrades in Legends of Idleon"
    />
    <Stack mb={3} direction={'row'} gap={3} flexWrap={'wrap'} alignItems="center">
      <CardTitleAndValue title={'Pet Crystals'} value={numberWithCommas(state?.account?.companions?.petCrystals ?? 0)} icon='data/PremiumGem.png' imgStyle={{ filter: 'hue-rotate(280deg)', width: 24, height: 24 }} />
      <CardTitleAndValue title={'Total Box Opened'} value={numberWithCommas(state?.account?.companions?.totalBoxesOpened ?? 0)} />
      <CardTitleAndValue title={'Tokens Available'} value={numberWithCommas(tokens?.remaining ?? 0)} icon='data/Quest119.png' imgStyle={{ width: 24, height: 24 }} />
      <CardTitleAndValue title={'Token Bonuses Active'} value={numberWithCommas(tokens?.used ?? 0)} icon='data/Quest119.png' imgStyle={{ width: 24, height: 24 }} />
      <CardTitleAndValue title={'Next free companion'} value={<Timer
        type={'countdown'} date={nextCompanionClaim}
        placeholder={'Go claim!'}
        lastUpdated={state?.lastUpdated} />} />
      <RadioGroup row value={filter} onChange={(e) => setFilter(e.target.value)}>
        <FormControlLabel value="all" control={<Radio size="small"/>} label="All"/>
        <FormControlLabel value="tradable" control={<Radio size="small"/>} label="Tradable"/>
        <FormControlLabel value="missing" control={<Radio size="small"/>} label="Missing"/>
      </RadioGroup>
    </Stack>
    {ownAccount && <Stack mb={3} gap={1.5}>
      <Stack direction={'row'} gap={1.5} flexWrap={'wrap'} alignItems={'center'}>
        {editing ? <>
          <Button variant={'contained'} disabled={saving} onClick={handleSave}>Save edits</Button>
          <Button variant={'outlined'} disabled={saving} onClick={() => setDraft(null)}>Cancel</Button>
        </> : <>
          <Button variant={'outlined'} disabled={saving}
            onClick={() => setDraft(new Set(simulated ?? []))}>Edit pets</Button>
          {simulatedCount > 0 &&
            <Button variant={'text'} color={'error'} disabled={saving} onClick={handleClear}>Turn off simulation</Button>}
        </>}
      </Stack>
      {editing && <Alert severity={'info'}>
        Tick the pets you don&apos;t own yet and hit save. The site will count them as owned, so you can
        see what their bonuses would be worth.
      </Alert>}
      {!editing && simulatedCount > 0 && <Alert severity={'warning'}>
        Pet simulation is on. {simulatedCount} unowned {simulatedCount === 1 ? 'pet is' : 'pets are'} counted as owned,
        so every bonus on the site includes {simulatedCount === 1 ? 'it' : 'them'}.
      </Alert>}
    </Stack>}
    <Stack gap={4}>
      {(companionGroups || []).map((group) => (
        <CompanionList
          key={group.name}
          title={group.name}
          companions={filterCompanions(group.indices)}
          editing={editing}
          draft={draft}
          onToggle={toggleDraft}
        />
      ))}
      {(companionGroups || []).every((group) => filterCompanions(group.indices).length === 0) && (
        <Typography variant="body2" color="text.secondary">No pets match the selected filter</Typography>
      )}
    </Stack>
  </>
};

export default Pets;
