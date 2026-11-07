import { Box } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import Panel from '@components/common/cards/Panel';
import { fedBy } from '@components/common/styles';

// MSA_0..8 cover the first nine stats. The game draws no icon of its own for the later two, so
// they borrow their skill's.
const SKILL_ICONS = { spelunkingPow: 'etc/Spelunking.png', researchExp: 'data/ClassIcons61.png' };
// The panel rounds every bonus but the Bit one, which it draws in Big (N.js:93627)
const bonusRule = (stat) => ({ game: stat === 'bit' ? 'Big' : 'GamingStatType.MSA_Bonus', unit: '%' });

const MsaTotalizer = () => {
  const { state } = useContext(AppContext);
  const bonuses = Object.entries(state?.account?.msaTotalizer ?? {});
  // A failed section has no rows: no heading over nothing
  if (!bonuses.length) return null;
  const unlocked = isSuperbitUnlocked(state?.account, 'MSA_Totalizer');
  const failed = fedBy(state?.account, 'msaTotalizer', 'towers', 'gaming', 'sneaking');
  return <Panel title={'MSA Totalizer'} meta={unlocked ? undefined : 'Unlocks with the MSA Totalizer superbit in Gaming.'}
                sx={{ mb: 3 }}>
    {/* The Panel's width, not the window's: at 900 px a side ad leaves it 540 px, and three columns ran past its edge */}
    <Box sx={{ containerType: 'inline-size' }}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        '@container (min-width: 480px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
        '@container (min-width: 760px)': { gridTemplateColumns: 'repeat(3, 1fr)' }
      }}>
        {bonuses.map(([stat, { name, value }], index) => <Panel.Row key={stat} icon={SKILL_ICONS[stat] ?? `etc/MSA_${index}.png`}
                                                                    name={name} value={failed ? '-' : value ?? 0} kind={bonusRule(stat)}/>)}
      </Box>
    </Box>
  </Panel>;
};

export default MsaTotalizer;
