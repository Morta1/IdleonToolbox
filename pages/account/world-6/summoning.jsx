import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import Tabber from '@components/common/Tabber';
import WinnerBonuses from '@components/account/Worlds/World6/Summoning/WinnerBonuses';
import { AppContext } from '@components/common/context/AppProvider';
import Upgrades from '@components/account/Worlds/World6/Summoning/Upgrades';
import { getTabs, notateNumber, numberWithCommas, secondsToShortDuration } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import { Divider, Stack, Typography } from '@mui/material';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import Battles from '@components/account/Worlds/World6/Summoning/Battles';
import { PAGES } from '@components/constants';
import Stones from '@components/account/Worlds/World6/Summoning/Stones';
import {
  FAMILIAR_EXP_MIN_CLAIM_SECONDS,
  getFamiliarLevelGains,
  getPendingFamiliarExp,
  summonEssenceColor
} from '@parsers/world-6/summoning';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import useHydrated from '@hooks/useHydrated';

const Summoning = () => {
  const { state } = useContext(AppContext);
  const {
    winnerBonuses,
    upgrades,
    essences,
    essenceGain,
    allBattles,
    armyHealth,
    armyDamage,
    highestEndlessLevel,
    totalUpgradesLevels,
    summoningStones,
    familiarExp
  } = state?.account?.summoning || {};
  // Date.now() differs between the build and the client, so the elapsed time waits for hydration
  const hydrated = useHydrated();
  const pendingExp = getPendingFamiliarExp(familiarExp, hydrated ? state?.lastUpdated : undefined);
  const levelGains = getFamiliarLevelGains(state?.characters, pendingExp.exp);
  const gains = levelGains.map(({ level, newLevel }) => newLevel - level);
  const minGain = gains.length ? Math.min(...gains) : 0;
  const maxGain = gains.length ? Math.max(...gains) : 0;
  return <>
    <NextSeo
      title="Summoning | Idleon Toolbox"
      description="View your summoning upgrades, winner bonuses, and battle rewards in Legends of Idleon"
    />
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3} alignItems={'center'}>
      <CardTitleAndValue value={highestEndlessLevel}
                         icon={'etc/Endless_Summoning.png'} iconAlt={'Highest endless summoning level'}
                         imgStyle={{ width: 25 }} cardSx={{ my: 0, mb: 0 }}/>
      <CardTitleAndValue icon={'data/SumExp.png'} iconAlt={'Unclaimed familiar EXP'} cardSx={{ my: 0, mb: 0 }}
                         imgStyle={{ width: 25 }}
                         value={<Stack>
                           <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                             <Typography>{notateNumber(pendingExp.exp)} EXP</Typography>
                             {familiarExp?.expMultiBreakdown ? <Breakdown data={familiarExp.expMultiBreakdown}>
                               <Stack justifyContent={'center'}>
                                 <IconInfoCircleFilled size={14}/>
                               </Stack>
                             </Breakdown> : null}
                           </Stack>
                           <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                             <Typography variant={'caption'} color={'text.secondary'}>
                               {pendingExp.claimable
                                 ? `${secondsToShortDuration(pendingExp.seconds, { minUnit: 'minute' })} unclaimed`
                                 : `Claimable in ${secondsToShortDuration(FAMILIAR_EXP_MIN_CLAIM_SECONDS - pendingExp.seconds, { minUnit: 'minute' })}`}
                               {maxGain > 0
                                 ? `, +${minGain === maxGain ? maxGain : `${minGain}-${maxGain}`} Lv`
                                 : ''}
                             </Typography>
                             {maxGain > 0 ? <Tooltip title={<Stack>
                               {levelGains.map(({ name, level, newLevel }) => <Typography key={name} variant={'body2'}>
                                 {name}: {level} {newLevel > level ? `→ ${newLevel}` : ''}
                               </Typography>)}
                             </Stack>}>
                               <InfoIcon sx={{ fontSize: 14, opacity: 0.7 }}/>
                             </Tooltip> : null}
                           </Stack>
                         </Stack>}/>
      <Divider flexItem orientation={'vertical'}/>
      {Object.keys(summonEssenceColor).map((key) => {
        const index = Number(key);
        const gain = essenceGain?.[index];
        return <CardTitleAndValue key={index} icon={`data/SummC${index + 1}.png`}
                                  iconAlt={`${summonEssenceColor[index]} essence`}
                                  cardSx={{ my: 0, mb: 0 }}
                                  value={<Stack>
                                    <Typography>{notateNumber(essences?.[index] ?? 0)}</Typography>
                                    {gain?.unlocked ? <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                                      <Typography variant={'caption'} color={'text.secondary'}>
                                        +{notateNumber(gain.value)}/hr
                                      </Typography>
                                      <Breakdown data={gain.breakdown}>
                                        <Stack justifyContent={'center'}>
                                          <IconInfoCircleFilled size={14}/>
                                        </Stack>
                                      </Breakdown>
                                    </Stack> : null}
                                  </Stack>}/>
      })}
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 6'].categories, 'summoning')}>
      <Upgrades upgrades={upgrades} totalUpgradesLevels={numberWithCommas(totalUpgradesLevels)}/>
      <WinnerBonuses winnerBonuses={winnerBonuses}/>
      <Battles battles={allBattles} armyHealth={armyHealth} armyDamage={armyDamage}
               highestEndlessLevel={highestEndlessLevel} winnerBonuses={winnerBonuses}/>
      <Stones stones={summoningStones}/>
    </Tabber>
  </>
};

export default Summoning;
