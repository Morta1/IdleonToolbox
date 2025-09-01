import { Divider, Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { Fragment, useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { checkCharClass, CLASSES, getTalentBonusIfActive } from '@parsers/talents';
import { notateNumber, numberWithCommas } from '@utility/helpers';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const KillsSection = ({ selectedChar, lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });

  const character = state?.characters?.[selectedChar];
  const characterClass = character?.class;
  const isDivineKnight = checkCharClass(characterClass, CLASSES.Divine_Knight);
  const isElementalSorcerer = checkCharClass(characterClass, CLASSES.Elemental_Sorcerer);
  const isSiegeBreaker = checkCharClass(characterClass, CLASSES.Siege_Breaker);
  const dbFormActive = getTalentBonusIfActive(character?.activeBuffs, 'WRAITH_FORM');
  const isDeathBringer = checkCharClass(characterClass, CLASSES.Death_Bringer) && dbFormActive;
  const acFormActive = getTalentBonusIfActive(character?.activeBuffs, 'ARCANIST_FORM');
  const isArcaneCultist = checkCharClass(characterClass, CLASSES.Arcane_Cultist) && acFormActive;
  const wwFormActive = getTalentBonusIfActive(character?.activeBuffs, 'TEMPEST_FORM');
  const isWindWalker = checkCharClass(characterClass, CLASSES.Wind_Walker) && wwFormActive;

  const getPerHour = (difference) => Math.floor((difference / ((lastUpdated - snapshottedAcc?.snapshotTime) / 1000 / 60)) * 60);
  const getKills = (source) => Math.floor(source?.kills?.[snapshottedChar?.mapIndex] || 0);
  const getAccountOption = (key) => state?.account?.accountOptions?.[key] || 0;
  const getSnapshotOption = (key) => snapshottedAcc?.accountOptions?.[key] || 0;
  const getDiff = (key) => getAccountOption(key) - getSnapshotOption(key);
  const dkOrbsDiff = getDiff(138);
  const esWormholeDiff = getDiff(152);
  const sbPlunderousDiff = getDiff(139);
  const dkBonesDiff = {
    'Femur': getDiff(330),
    'Ribcage': getDiff(331),
    'Cranium': getDiff(332),
    'Bovinae': getDiff(333)
  }
  const acTachyonDiff = {
    'Purple': getDiff(388),
    'Brown': getDiff(389),
    'Green': getDiff(390),
    'Red': getDiff(391),
    'Silver': getDiff(392),
    'Gold': getDiff(393)
  }
  const wwDustDiff = {
    'Stardust': getDiff(357),
    'Moondust': getDiff(358),
    'Solardust': getDiff(359),
    'Cooldust': getDiff(360),
    'Novadust': getDiff(361)
  }

  return (
    <Section title="Kills">
      {!resultsOnly ? <>
        <Stack>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
          <Typography variant="body2">Kills: {numberWithCommas(getKills(snapshottedChar))}</Typography>
          <Divider sx={{ my: 1 }}/>
          {isDivineKnight &&
            <Typography variant="body2">DK Orbs: {numberWithCommas(getSnapshotOption(138))}</Typography>}
          {isElementalSorcerer &&
            <Typography variant="body2">ES Wormhole: {numberWithCommas(getSnapshotOption(152))}</Typography>}
          {isSiegeBreaker &&
            <Typography variant="body2">SB Plunderous: {numberWithCommas(getSnapshotOption(139))}</Typography>}
          {isDeathBringer ?
            <>
              <Typography variant="body1">DK Bones</Typography>
              <Typography variant="body2">Femur: {numberWithCommas(Math.floor(getSnapshotOption(330)))}</Typography>
              <Typography variant="body2">Ribcage: {numberWithCommas(Math.floor(getSnapshotOption(331)))}</Typography>
              <Typography variant="body2">Cranium: {numberWithCommas(Math.floor(getSnapshotOption(332)))}</Typography>
              <Typography variant="body2">Bovinae: {numberWithCommas(Math.floor(getSnapshotOption(333)))}</Typography>
            </> : null}
          {isArcaneCultist ? <>
            <Typography variant="body1">AC Tachyons</Typography>
            <Typography variant="body2">Purple: {numberWithCommas(Math.floor(getSnapshotOption(388)))}</Typography>
            <Typography variant="body2">Brown: {numberWithCommas(Math.floor(getSnapshotOption(389)))}</Typography>
            <Typography variant="body2">Green: {numberWithCommas(Math.floor(getSnapshotOption(390)))}</Typography>
            <Typography variant="body2">Red: {numberWithCommas(Math.floor(getSnapshotOption(391)))}</Typography>
            <Typography variant="body2">Silver: {numberWithCommas(Math.floor(getSnapshotOption(392)))}</Typography>
            <Typography variant="body2">Gold: {numberWithCommas(Math.floor(getSnapshotOption(393)))}</Typography>
          </> : null}
          {isWindWalker ? <>
            <Typography variant="body1">WW Dust</Typography>
            <Typography variant="body2">Stardust: {numberWithCommas(Math.floor(getSnapshotOption(357)))}</Typography>
            <Typography variant="body2">Moondust: {numberWithCommas(Math.floor(getSnapshotOption(358)))}</Typography>
            <Typography variant="body2">Solardust: {numberWithCommas(Math.floor(getSnapshotOption(359)))}</Typography>
            <Typography variant="body2">Cooldust: {numberWithCommas(Math.floor(getSnapshotOption(360)))}</Typography>
            <Typography variant="body2">Novadust: {numberWithCommas(Math.floor(getSnapshotOption(361)))}</Typography>
          </> : null}
        </Stack>
        <Divider flexItem orientation={'vertical'} sx={{ mx: 2 }}/>
        <Stack>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Current</Typography>
          <Typography
            variant="body2">Kills: {numberWithCommas(getKills(state?.characters?.[selectedChar]))}</Typography>
          <Divider sx={{ my: 1 }}/>
          {isDivineKnight &&
            <Typography variant="body2">DK Orbs: {numberWithCommas(getAccountOption(138))}</Typography>}
          {isElementalSorcerer &&
            <Typography variant="body2">ES Wormhole: {numberWithCommas(getAccountOption(152))}</Typography>}
          {isSiegeBreaker &&
            <Typography variant="body2">SB Plunderous: {numberWithCommas(getAccountOption(139))}</Typography>}
          {isDeathBringer ?
            <>
              <Typography variant="body1">DK Bones</Typography>
              <Typography variant="body2">Femur: {numberWithCommas(Math.floor(getAccountOption(330)))}</Typography>
              <Typography variant="body2">Ribcage: {numberWithCommas(Math.floor(getAccountOption(331)))}</Typography>
              <Typography variant="body2">Cranium: {numberWithCommas(Math.floor(getAccountOption(332)))}</Typography>
              <Typography variant="body2">Bovinae: {numberWithCommas(Math.floor(getAccountOption(333)))}</Typography>
            </> : null}
          {isArcaneCultist ? <>
            <Typography variant="body1">AC Tachyons</Typography>
            <Typography variant="body2">Purple: {numberWithCommas(Math.floor(getAccountOption(388)))}</Typography>
            <Typography variant="body2">Brown: {numberWithCommas(Math.floor(getAccountOption(389)))}</Typography>
            <Typography variant="body2">Green: {numberWithCommas(Math.floor(getAccountOption(390)))}</Typography>
            <Typography variant="body2">Red: {numberWithCommas(Math.floor(getAccountOption(391)))}</Typography>
            <Typography variant="body2">Silver: {numberWithCommas(Math.floor(getAccountOption(392)))}</Typography>
            <Typography variant="body2">Gold: {numberWithCommas(Math.floor(getAccountOption(393)))}</Typography>
          </> : null}
          {isWindWalker ? <>
            <Typography variant="body1">WW Dust</Typography>
            <Typography variant="body2">Stardust: {numberWithCommas(Math.floor(getAccountOption(357)))}</Typography>
            <Typography variant="body2">Moondust: {numberWithCommas(Math.floor(getAccountOption(358)))}</Typography>
            <Typography variant="body2">Solardust: {numberWithCommas(Math.floor(getAccountOption(359)))}</Typography>
            <Typography variant="body2">Cooldust: {numberWithCommas(Math.floor(getAccountOption(360)))}</Typography>
            <Typography variant="body2">Novadust: {numberWithCommas(Math.floor(getAccountOption(361)))}</Typography>
          </>:null}
        </Stack>
      </> : null}
      <Stack>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Result</Typography>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Typography variant="body2">
            Kills: {notateNumber(getKills(state?.characters?.[selectedChar]) - getKills(snapshottedChar))}
          </Typography>
          <Tooltip title="Includes kill per kill">
            <IconInfoCircleFilled size={18}/>
          </Tooltip>
        </Stack>
        <Typography variant="body2">Per
          hour: {numberWithCommas(getPerHour(getKills(snapshottedChar) - getKills(state?.characters?.[selectedChar])))}</Typography>
        <Typography variant="body2">Per
          day: {numberWithCommas(getPerHour(getKills(snapshottedChar) - getKills(state?.characters?.[selectedChar])) * 24)}</Typography>
        {isDivineKnight ? <>
          <Divider sx={{ my: 1 }}/>
          <Typography variant="body1">DK Orbs</Typography>
          <Typography variant="body2">Diff: {numberWithCommas(dkOrbsDiff)}</Typography>
          <Typography variant="body2">Per hour: {numberWithCommas(getPerHour(dkOrbsDiff))}</Typography>
          <Typography variant="body2">Per day: {numberWithCommas(getPerHour(dkOrbsDiff) * 24)}</Typography>
        </> : null}
        {isElementalSorcerer ? <>
          <Divider sx={{ my: 1 }}/>
          <Typography variant="body1">ES Wormhole</Typography>
          <Typography variant="body2">Diff: {numberWithCommas(esWormholeDiff)}</Typography>
          <Typography variant="body2">Per hour: {numberWithCommas(getPerHour(esWormholeDiff))}</Typography>
          <Typography variant="body2">Per day: {numberWithCommas(getPerHour(esWormholeDiff) * 24)}</Typography>
        </> : null}
        {isSiegeBreaker ? <>
          <AdvancedSection title="SB Plunderous" getPerHour={getPerHour}
                           items={[{ label: 'Plunderous', value: sbPlunderousDiff }]}/>
        </> : null}
        {isDeathBringer ? <>
          <AdvancedSection title="DK Bones"
                           items={Object.entries(dkBonesDiff).map(([key, value]) => ({ label: key, value }))}
                           getPerHour={getPerHour}/>
        </> : null}
        {isArcaneCultist ? <>
          <AdvancedSection title="AC Tachyons"
                           items={Object.entries(acTachyonDiff).map(([key, value]) => ({ label: key, value }))}
                           getPerHour={getPerHour}/>
        </> : null}
        {isWindWalker ? <>
          <AdvancedSection title="WW Dust"
                           items={Object.entries(wwDustDiff).map(([key, value]) => ({ label: key, value }))}
                           getPerHour={getPerHour}/>
        </> : null}
      </Stack>
    </Section>
  );
};

const AdvancedSection = ({ title, items, getPerHour }) => {
  return <>
    <Divider sx={{ my: 1 }}/>
    <Typography variant="body1">{title}</Typography>
    {items.map(({ label, value }, index) => {
      return <Fragment key={`${title}-${index}`}>
        <Divider sx={{ my: 1 }}/>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2">{numberWithCommas(Math.floor(value))}</Typography>
        <Typography variant="body2">{numberWithCommas(getPerHour(Math.floor(value)))} / hr</Typography>
        <Typography variant="body2">{numberWithCommas(getPerHour(Math.floor(value * 24)))} /
          day</Typography>
      </Fragment>
    })}
  </>
}
export default KillsSection;