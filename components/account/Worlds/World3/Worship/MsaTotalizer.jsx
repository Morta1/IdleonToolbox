import { Box } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { formatNum } from '@utility/helpers';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import Panel from '@components/common/cards/Panel';

// MSA_0..8 cover the first nine stats. The game draws no icon of its own for the later two, so
// they borrow their skill's.
const SKILL_ICONS = { spelunkingPow: 'etc/Spelunking.png', researchExp: 'data/ClassIcons61.png' };

const MsaTotalizer = () => {
  const { state } = useContext(AppContext);
  const bonuses = Object.entries(state?.account?.msaTotalizer ?? {});
  // A failed section has no rows: no heading over nothing
  if (!bonuses.length) return null;
  const unlocked = isSuperbitUnlocked(state?.account, 'MSA_Totalizer');
  return <Panel title={'MSA Totalizer'} meta={unlocked ? undefined : 'Unlocks with the MSA Totalizer superbit in Gaming.'}
                sx={{ mb: 3 }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
      {bonuses.map(([stat, { name, value }], index) => <Panel.Row key={stat} icon={SKILL_ICONS[stat] ?? `etc/MSA_${index}.png`}
                                                                  name={name} value={formatNum(value ?? 0, 'pct')}/>)}
    </Box>
  </Panel>;
};

export default MsaTotalizer;
