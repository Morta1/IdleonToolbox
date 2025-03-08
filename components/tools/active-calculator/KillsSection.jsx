import { Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { checkCharClass } from '@parsers/talents';
import { notateNumber, numberWithCommas } from '@utility/helpers';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const KillsSection = ({ selectedChar }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });

  const characterClass = state?.characters?.[selectedChar]?.class;
  const isDivineKnight = checkCharClass(characterClass, 'Divine_Knight');
  const isElementalSorcerer = checkCharClass(characterClass, 'Elemental_Sorcerer');
  const isSiegeBreaker = checkCharClass(characterClass, 'Siege_Breaker');

  const getKills = (source) => Math.floor(source?.kills?.[snapshottedChar?.mapIndex] || 0);
  const getAccountOption = (key) => state?.account?.accountOptions?.[key] || 0;
  const getSnapshotOption = (key) => snapshottedAcc?.accountOptions?.[key] || 0;

  return (
    <Section title="Kills">
      <Stack>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
        <Typography variant="body2">Kills: {numberWithCommas(getKills(snapshottedChar))}</Typography>
        {isDivineKnight && <Typography variant="body2">DK Orbs: {numberWithCommas(getSnapshotOption(138))}</Typography>}
        {isElementalSorcerer && <Typography variant="body2">ES Wormhole: {numberWithCommas(getSnapshotOption(152))}</Typography>}
        {isSiegeBreaker && <Typography variant="body2">SB Plunderous: {numberWithCommas(getSnapshotOption(139))}</Typography>}
      </Stack>

      <Stack>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Current</Typography>
        <Typography variant="body2">Kills: {numberWithCommas(getKills(state?.characters?.[selectedChar]))}</Typography>
        {isDivineKnight && <Typography variant="body2">DK Orbs: {numberWithCommas(getAccountOption(138))}</Typography>}
        {isElementalSorcerer && <Typography variant="body2">ES Wormhole: {numberWithCommas(getAccountOption(152))}</Typography>}
        {isSiegeBreaker && <Typography variant="body2">SB Plunderous: {numberWithCommas(getAccountOption(139))}</Typography>}
      </Stack>

      <Stack>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Result</Typography>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Typography variant="body2">
            Kills: {notateNumber(getKills(state?.characters?.[selectedChar]) - getKills(snapshottedChar))}
          </Typography>
          <Tooltip title="Includes kill per kill">
            <IconInfoCircleFilled size={18} />
          </Tooltip>
        </Stack>
        {isDivineKnight && <Typography variant="body2">DK Orbs: {numberWithCommas(getAccountOption(138) - getSnapshotOption(138))}</Typography>}
        {isElementalSorcerer && <Typography variant="body2">ES Wormhole: {numberWithCommas(getAccountOption(152) - getSnapshotOption(152))}</Typography>}
        {isSiegeBreaker && <Typography variant="body2">SB Plunderous: {numberWithCommas(getAccountOption(139) - getSnapshotOption(139))}</Typography>}
      </Stack>
    </Section>
  );
};

export default KillsSection;