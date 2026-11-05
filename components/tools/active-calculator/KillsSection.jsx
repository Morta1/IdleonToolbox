import { Box } from '@mui/material';
import { counter, CounterTable, elapsedHours, Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { checkCharClass, CLASSES, getTalentBonusIfActive } from '@parsers/talents';
import { formatDuration, formatNum } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';
import { isSectionFailed } from '@components/common/styles';

const BONES = [['Femur', 330], ['Ribcage', 331], ['Cranium', 332], ['Bovinae', 333]];
const TACHYONS = [['Purple', 388], ['Brown', 389], ['Green', 390], ['Red', 391], ['Silver', 392], ['Gold', 393]];
const ARCANE_KILLS = [['Drop rate', 0], ['EXP', 1], ['AFK', 2]];
const DUSTS = [['Stardust', 357], ['Moondust', 358], ['Solardust', 359], ['Cooldust', 360], ['Novadust', 361]];

const KillsSection = ({ selectedChar, lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });

  const character = state?.characters?.[selectedChar];
  const characterClass = character?.class;
  const hours = elapsedHours(lastUpdated, snapshottedAcc?.snapshotTime);
  const isDivineKnight = checkCharClass(characterClass, CLASSES.Divine_Knight);
  const isElementalSorcerer = checkCharClass(characterClass, CLASSES.Elemental_Sorcerer);
  const isSiegeBreaker = checkCharClass(characterClass, CLASSES.Siege_Breaker);
  const isDeathBringer = checkCharClass(characterClass, CLASSES.Death_Bringer) && getTalentBonusIfActive(character?.activeBuffs, 'WRAITH_FORM');
  const isArcaneCultist = checkCharClass(characterClass, CLASSES.Arcane_Cultist) && getTalentBonusIfActive(character?.activeBuffs, 'ARCANIST_FORM');
  const isWindWalker = checkCharClass(characterClass, CLASSES.Wind_Walker) && getTalentBonusIfActive(character?.activeBuffs, 'TEMPEST_FORM');
  const isRoyalGuardian = checkCharClass(characterClass, CLASSES.Royal_Guardian);

  const getKills = (source) => Math.floor(source?.kills?.[snapshottedChar?.mapIndex] || 0);
  const optionRow = (label, key) => counter(label, Math.floor(snapshottedAcc?.accountOptions?.[key] || 0), Math.floor(state?.account?.accountOptions?.[key] || 0));
  const getArcaneKills = (source, bonusIndex) => parseInt(source?.tesseract?.mapBonusRaw?.[snapshottedChar?.mapIndex]?.[bonusIndex], 10) || 0;
  // A failed tesseract section can't say: its kills read "-", not 0
  const nowArcaneKills = (bonusIndex) => (isSectionFailed(state?.account, 'tesseract') ? null : getArcaneKills(state?.account, bonusIndex));

  const bands = [
    { key: 'kills', label: null, rows: [counter('Kills', getKills(snapshottedChar), getKills(character))] },
    isDivineKnight ? { key: 'divine-knight', label: 'Divine Knight', rows: [optionRow('Orbs', 138)] } : null,
    isElementalSorcerer ? { key: 'elemental-sorcerer', label: 'Elemental Sorcerer', rows: [optionRow('Wormholes', 152)] } : null,
    isSiegeBreaker ? { key: 'siege-breaker', label: 'Siege Breaker', rows: [optionRow('Plunderous', 139)] } : null,
    isDeathBringer ? { key: 'death-bringer', label: 'Death Bringer', rows: BONES.map(([label, key]) => optionRow(label, key)) } : null,
    isArcaneCultist ? {
      key: 'arcane-cultist', label: 'Arcane Cultist', rows: [
        ...TACHYONS.map(([label, key]) => optionRow(`${label} tachyons`, key)),
        ...ARCANE_KILLS.map(([label, index]) => counter(`${label} arcane kills`, getArcaneKills(snapshottedAcc, index), nowArcaneKills(index)))
      ]
    } : null,
    isWindWalker ? { key: 'wind-walker', label: 'Wind Walker', rows: DUSTS.map(([label, key]) => optionRow(label, key)) } : null
  ].filter(Boolean);

  const findClearing = (source) => source?.royalGuardian?.clearingMaps?.find(({ mapIndex }) => mapIndex === snapshottedChar?.mapIndex);
  const currentClearing = isRoyalGuardian ? findClearing(state?.account) : null;
  const snapshotClearing = isRoyalGuardian ? findClearing(snapshottedAcc) : null;

  return <>
    <Section title={'Kills'} info={'Kills gained include kill per kill.'}>
      <CounterTable bands={bands} hours={hours} resultsOnly={resultsOnly}/>
    </Section>
    {currentClearing && snapshotClearing ? territoryClear({
      current: currentClearing,
      snapshot: snapshotClearing,
      saveSeconds: state?.account?.timeAway?.Player - snapshottedAcc?.timeAway?.Player,
      hours
    }) : null}
  </>;
};

const clearState = ({ remaining, cleared, totalPerHour, ownPerHour }) => {
  if (remaining <= 0) return <StatusText status={'ready'} wrap>{cleared ? 'Ready to claim' : 'Ready once you open the map'}</StatusText>;
  if (totalPerHour > 0) return `Clears in ${formatDuration((remaining / totalPerHour) * 3600)}${ownPerHour > 0 ? '' : ' (militia only)'}`;
  return <Box component={'span'} sx={{ color: 'text.secondary' }}>No clear progress yet</Box>;
};

// The clear counter moves from two sources: the Royal Guardian's own kills on the map and the
// Clearing units sent at it. Militia kills are banked (RoyalG[3][0] seconds) and only land when the
// map screen is opened, so the share of the measured diff that is militia comes from how much of the
// save-to-save time was paid out, not from the formula rate alone.
const territoryClear = ({ current, snapshot, saveSeconds, hours }) => {
  const perHour = (kills) => (hours ? kills / hours : 0);
  const measuredKills = current.kills - snapshot.kills;
  const measuredPerHour = Math.max(0, perHour(measuredKills));
  const militiaPerHour = current.militiaRate ?? 0;
  const canTrackBank = Number.isFinite(current.bankedSeconds) && Number.isFinite(snapshot.bankedSeconds)
    && Number.isFinite(saveSeconds) && saveSeconds >= 0;
  // A snapshot taken before the bank was parsed falls back to assuming the militia landed in full.
  const militiaLanded = canTrackBank
    ? Math.max(0, militiaPerHour * (saveSeconds + snapshot.bankedSeconds - current.bankedSeconds) / 3600)
    : null;
  const ownPerHour = Math.max(0, militiaLanded != null
    ? perHour(measuredKills - militiaLanded)
    : measuredPerHour - militiaPerHour);
  const bankedKills = current.bankedKills ?? 0;
  const remaining = Math.max(0, current.killsRequired - current.kills - bankedKills);
  const units = current.militiaUnits ?? 0;
  return <Section key={'territory'} title={'Territory clear'}
                  info={'Measured is how far the clear counter of the map moved since the snapshot. Militia kills are banked and only land when you open the map, so the calculator subtracts just the militia kills that actually landed between the two saves. Map open or closed, Yours stays your own rate.'}>
    <Panel.KV label={'Map'} value={current.name}/>
    <Panel.KV label={'Progress'} value={<Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>
      {formatNum(current.kills, 'whole')} / {formatNum(current.killsRequired, 'whole')}
    </Box>}/>
    <Panel.KV label={'Measured'} value={formatNum(measuredPerHour, 'rate')}/>
    <Panel.KV label={'Militia'} value={`${formatNum(militiaPerHour, 'rate')} (${units} unit${units === 1 ? '' : 's'})`}/>
    {militiaLanded != null ? <Panel.KV label={'Militia landed'} value={formatNum(militiaLanded, 'whole')}/> : null}
    {bankedKills > 0 ? <Panel.KV label={'Militia banked'} value={`${formatNum(bankedKills, 'whole')} (lands when you open the map)`}/> : null}
    <Panel.KV label={'Yours'} value={formatNum(ownPerHour, 'rate')}/>
    <Panel.KV label={'State'} value={clearState({
      remaining,
      cleared: current.kills >= current.killsRequired,
      totalPerHour: ownPerHour + militiaPerHour,
      ownPerHour
    })}/>
  </Section>;
};

export default KillsSection;
