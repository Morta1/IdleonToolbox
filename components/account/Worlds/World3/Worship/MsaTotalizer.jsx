import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import BonusStrip from '@components/common/cards/BonusStrip';
import StatTile from '@components/common/cards/StatTile';
import { fedBy } from '@components/common/styles';

// MSA_0..8 cover the first nine stats. The game draws no icon of its own for the later two, so
// they borrow their skill's.
const SKILL_ICONS = { spelunkingPow: 'etc/Spelunking.png', researchExp: 'data/ClassIcons61.png' };
// The panel rounds every bonus but the Bit one, which it draws in Big (N.js:93627)
const bonusRule = (stat) => ({ game: stat === 'bit' ? 'Big' : 'GamingStatType.MSA_Bonus', unit: '%' });

// Its bonuses as tiles in rows, as Tome's and Slab's: a panel of three wide columns put each name about 380 px from its
// value and took twice the height (#12)
const MsaTotalizer = () => {
  const { state } = useContext(AppContext);
  const bonuses = Object.entries(state?.account?.msaTotalizer ?? {});
  // A failed section has no rows: no heading over nothing
  if (!bonuses.length) return null;
  const unlocked = isSuperbitUnlocked(state?.account, 'MSA_Totalizer');
  const failed = fedBy(state?.account, 'msaTotalizer', 'towers', 'gaming', 'sneaking');
  return <BonusStrip title={'MSA Totalizer'} meta={unlocked ? undefined : 'Unlocks with the MSA Totalizer superbit in Gaming.'}
                     sx={{ mb: 3 }}>
    {bonuses.map(([stat, { name, value }], index) => <StatTile key={stat} icon={SKILL_ICONS[stat] ?? `etc/MSA_${index}.png`}
                                                               label={name} value={failed ? '-' : value ?? 0}
                                                               kind={bonusRule(stat)}/>)}
  </BonusStrip>;
};

export default MsaTotalizer;
