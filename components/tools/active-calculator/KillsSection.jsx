import { Divider, Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { checkCharClass } from '@parsers/talents';
import { notateNumber, numberWithCommas } from '@utility/helpers';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const KillsSection = ({ selectedChar, lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });

  const characterClass = state?.characters?.[selectedChar]?.class;
  const isDivineKnight = checkCharClass(characterClass, 'Divine_Knight');
  const isElementalSorcerer = checkCharClass(characterClass, 'Elemental_Sorcerer');
  const isSiegeBreaker = checkCharClass(characterClass, 'Siege_Breaker');
  const isDeathBringer = checkCharClass(characterClass, 'Death_Bringer');

  const getPerHour = (difference) => Math.floor((difference / ((lastUpdated - snapshottedAcc?.snapshotTime) / 1000 / 60)) * 60);
  const getKills = (source) => Math.floor(source?.kills?.[snapshottedChar?.mapIndex] || 0);
  const getAccountOption = (key) => state?.account?.accountOptions?.[key] || 0;
  const getSnapshotOption = (key) => snapshottedAcc?.accountOptions?.[key] || 0;
  const dkOrbsDiff = getAccountOption(138) - getSnapshotOption(138);
  const esWormholeDiff = getAccountOption(152) - getSnapshotOption(152);
  const sbPlunderousDiff = getAccountOption(139) - getSnapshotOption(139);
  const dkBonesDiff = {
    'Femur': getAccountOption(330) - getSnapshotOption(330),
    'Ribcage': getAccountOption(331) - getSnapshotOption(331),
    'Cranium': getAccountOption(332) - getSnapshotOption(332),
    'Bovinae': getAccountOption(333) - getSnapshotOption(333)
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
          {isDeathBringer &&
            <>
              <Typography variant="body1">DK Bones</Typography>
              <Typography variant="body2">Femur: {numberWithCommas(Math.floor(getSnapshotOption(330)))}</Typography>
              <Typography variant="body2">Ribcage: {numberWithCommas(Math.floor(getSnapshotOption(331)))}</Typography>
              <Typography variant="body2">Cranium: {numberWithCommas(Math.floor(getSnapshotOption(332)))}</Typography>
              <Typography variant="body2">Bovinae: {numberWithCommas(Math.floor(getSnapshotOption(333)))}</Typography>
            </>}
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
          {isDeathBringer &&
            <>
              <Typography variant="body1">DK Bones</Typography>
              <Typography variant="body2">Femur: {numberWithCommas(Math.floor(getAccountOption(330)))}</Typography>
              <Typography variant="body2">Ribcage: {numberWithCommas(Math.floor(getAccountOption(331)))}</Typography>
              <Typography variant="body2">Cranium: {numberWithCommas(Math.floor(getAccountOption(332)))}</Typography>
              <Typography variant="body2">Bovinae: {numberWithCommas(Math.floor(getAccountOption(333)))}</Typography>
            </>}
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
        {isDivineKnight ? <>
          <Divider sx={{ my: 1 }}/>
          <Typography variant="body1">DK Orbs</Typography>
          <Typography variant="body2">Diff: {numberWithCommas(dkOrbsDiff)}</Typography>
          <Typography variant="body2">Per hour: {numberWithCommas(getPerHour(dkOrbsDiff))} / hr</Typography>
          <Typography variant="body2">Per day: {numberWithCommas(getPerHour(dkOrbsDiff) * 24)} / hr</Typography>
        </> : null}
        {isElementalSorcerer ? <>
          <Divider sx={{ my: 1 }}/>
          <Typography variant="body1">ES Wormhole</Typography>
          <Typography variant="body2">Diff: {numberWithCommas(esWormholeDiff)}</Typography>
          <Typography variant="body2">Per hour: {numberWithCommas(getPerHour(esWormholeDiff))} / hr</Typography>
          <Typography variant="body2">Per day: {numberWithCommas(getPerHour(esWormholeDiff) * 24)} / hr</Typography>
        </> : null}
        {isSiegeBreaker ? <>
          <Divider sx={{ my: 1 }}/>
          <Typography variant="body1">SB Plunderous</Typography>
          <Typography variant="body2">Diff: {numberWithCommas(sbPlunderousDiff)}</Typography>
          <Typography variant="body2">Per hour: {numberWithCommas(getPerHour(sbPlunderousDiff))} / hr</Typography>
          <Typography variant="body2">Per day: {numberWithCommas(getPerHour(sbPlunderousDiff) * 24)} / hr</Typography>
        </> : null}
        {isDeathBringer ? <>
          <Divider sx={{ my: 1 }}/>
          <Typography variant="body1">DK Bones</Typography>
          <Divider sx={{ my: 1 }}/>
          <Typography variant="body2">Femur</Typography>
          <Typography variant="body2">{numberWithCommas(Math.floor(dkBonesDiff.Femur))}</Typography>
          <Typography variant="body2">{numberWithCommas(getPerHour(Math.floor(dkBonesDiff.Femur)))} / hr</Typography>
          <Divider sx={{ my: 1 }}/>
          <Typography variant="body2">Ribcage</Typography>
          <Typography variant="body2">{numberWithCommas(Math.floor(dkBonesDiff.Ribcage))}</Typography>
          <Typography variant="body2">{numberWithCommas(getPerHour(Math.floor(dkBonesDiff.Ribcage)))} / hr</Typography>
          <Divider sx={{ my: 1 }}/>
          <Typography variant="body2">Cranium</Typography>
          <Typography variant="body2">{numberWithCommas(Math.floor(dkBonesDiff.Cranium))}</Typography>
          <Typography variant="body2">{numberWithCommas(getPerHour(Math.floor(dkBonesDiff.Cranium)))} / hr</Typography>
          <Divider sx={{ my: 1 }}/>
          <Typography variant="body2">Bovinae</Typography>
          <Typography variant="body2">{numberWithCommas(Math.floor(dkBonesDiff.Bovinae))}</Typography>
          <Typography variant="body2">{numberWithCommas(getPerHour(Math.floor(dkBonesDiff.Bovinae)))} / hr</Typography>
        </> : null}
      </Stack>
    </Section>
  );
};

export default KillsSection;