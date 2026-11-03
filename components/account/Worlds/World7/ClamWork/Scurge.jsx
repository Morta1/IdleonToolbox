import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import Notice from '@components/common/Notice';
import ProgressBar from '@components/common/ProgressBar';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const SCURGE_POINT_ICON = 'etc/ScurgePoint0.png';

// Clam Work page 2: the Scurge upgrades, unlocked by Luminous Menagerie unlock 4. Its numbers have no game rule, so
// the amount kind, floored as the panel floors them (Decision 13).
const Scurge = ({ scurge }) => {
  const { unlocked, level, exp, expReq, expGain, pointsLeft, upgrades } = scurge ?? {};
  const points = Math.max(0, pointsLeft ?? 0);

  return <>
    {unlocked ? null : <Notice tone={'locked'} sx={{ mb: 2 }}>Scurge unlocks from the Luminous Menagerie.</Notice>}
    {/* Decision 6: the tab's own numbers sit at its top */}
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Scurge LV'} value={level ?? 0} kind={'amount'}/>
      <StatTile label={'Scurge EXP'}>
        <Typography component={'div'} variant={'value'}>
          {`${formatNum(Math.floor(exp ?? 0))} / ${formatNum(Math.floor(expReq ?? 0))}`}
        </Typography>
        {/* The panel draws an EXP bar under the level */}
        <ProgressBar percent={expReq > 0 ? Math.min(100, ((exp ?? 0) / expReq) * 100) : 0} boxSx={{ mt: 0.5, minWidth: 140 }}/>
      </StatTile>
      <StatTile label={'Scurge EXP per kill'} value={Math.floor(expGain ?? 0)} kind={'amount'}/>
      <StatTile label={'Points left'} icon={SCURGE_POINT_ICON} value={points} kind={'amount'}/>
    </Stack>
    <CardGrid size={'m'}>
      {upgrades?.map((upgrade) => <ItemCard key={upgrade?.name || upgrade?.index} title={cleanUnderscore(upgrade?.name)}
                                            level={{ value: upgrade?.level ?? 0 }}
                                            dimmed={!(unlocked && upgrade?.unlocked)}
                                            footer={<>
                                              <ItemCard.Cost icon={SCURGE_POINT_ICON} iconAlt={'Scurge points'}
                                                             need={upgrade?.cost ?? 0} have={points}
                                                             format={(value) => formatNum(value)}/>
                                              {upgrade?.levelReq > 0 && !upgrade?.unlocked
                                                ? <Typography variant={'body2'} color={'text.secondary'}>
                                                  {`Needs Scurge LV ${formatNum(upgrade.levelReq)}`}
                                                </Typography>
                                                : null}
                                            </>}>
        {upgrade?.description ? <ItemCard.Desc text={upgrade.description}/> : null}
      </ItemCard>)}
    </CardGrid>
  </>;
};

export default Scurge;
