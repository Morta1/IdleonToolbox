import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import Tabber from '@components/common/Tabber';
import WinnerBonuses from '@components/account/Worlds/World6/Summoning/WinnerBonuses';
import { AppContext } from '@components/common/context/AppProvider';
import Upgrades from '@components/account/Worlds/World6/Summoning/Upgrades';
import { getTabs, notateNumber, numberWithCommas } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import { Divider, Stack, Typography } from '@mui/material';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import Battles from '@components/account/Worlds/World6/Summoning/Battles';
import { PAGES } from '@components/constants';
import Stones from '@components/account/Worlds/World6/Summoning/Stones';
import { summonEssenceColor } from '@parsers/world-6/summoning';

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
    summoningStones
  } = state?.account?.summoning || {};
  return <>
    <NextSeo
      title="Summoning | Idleon Toolbox"
      description="View your summoning upgrades, winner bonuses, and battle rewards in Legends of Idleon"
    />
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3} alignItems={'center'}>
      <CardTitleAndValue value={highestEndlessLevel}
                         icon={'etc/Endless_Summoning.png'} iconAlt={'Highest endless summoning level'}
                         imgStyle={{ width: 25 }} cardSx={{ my: 0, mb: 0 }}/>
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
