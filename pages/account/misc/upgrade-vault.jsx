import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import { cleanUnderscore, commaNotation, getCoinsArray, notateNumber, prefix } from '@utility/helpers';
import InfoIcon from '@mui/icons-material/Info';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import CoinDisplay from '@components/common/CoinDisplay';
import useCheckbox from '@components/common/useCheckbox';

const UpgradeVault = () => {
  const { state } = useContext(AppContext);
  const [CheckboxEl, hideMaxed] = useCheckbox('Hide maxed upgrades');
  const { upgrades, totalUpgradeLevels, nextUnlock } = state?.account?.upgradeVault;

  return <>
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Total Levels'} value={totalUpgradeLevels}/>
      {nextUnlock?.unlockLevel ? <CardTitleAndValue title={'Next upgrade'} value={<Tooltip title={<Stack gap={1}>
        <Typography sx={{ fontWeight: 'bold' }}>{cleanUnderscore(nextUnlock?.name)}</Typography>
        <Typography>{cleanUnderscore(nextUnlock?.description)}</Typography>
      </Stack>}>
        <Stack direction={'row'} gap={1}>
          {nextUnlock?.unlockLevel}
          <InfoIcon/>
        </Stack>
      </Tooltip>}/> : null}
      <CardTitleAndValue>
        <CheckboxEl/>
      </CardTitleAndValue>
    </Stack>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {upgrades?.map(({
                        name,
                        cost,
                        description,
                        bonus,
                        monsterProgress,
                        boneType,
                        unlockLevel,
                        maxLevel,
                        level,
                        costToMax,
                        unlocked
                      }, index) => {
        const maxed = level >= maxLevel;
        if (maxed && hideMaxed) return null;
        const desc = description?.replace('{', commaNotation(bonus)).replace('}', notateNumber(1 + bonus / 100, 'MultiplierInfo'));
        return (
          (<Card key={name + index}>
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              width: 370,
              minHeight: 300,
              height: '100%',
              opacity: unlocked ? 1 : .5,
              border: maxed ? '1px solid' : 'none',
              borderColor: maxed ? 'success.light' : 'none'
            }}>
              <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
                <img style={{ width: 32, height: 32 }} src={`${prefix}data/VaultUpg${index}.png`}/>
                <Typography>{cleanUnderscore(name.replace(/[船般航舞製]/, '').replace('(Tap_for_more_info)', '').replace('(Tap_for_Info)', '').replace('(#)', ''))} ({maxed
                  ? 'Maxed'
                  : `${level} / ${maxLevel}`})</Typography>
              </Stack>
              <Divider sx={{ my: 1 }}/>
              <Typography>{cleanUnderscore(desc?.replace('$', ` ${cleanUnderscore(monsterProgress)}`).replace('.00', ''))}</Typography>
              {maxed ? null : <>
                <Divider sx={{ my: 1 }}/>
                <Typography variant={'caption'}>Cost</Typography>
                <CoinDisplay title={''}
                             noShadow
                             variant={'no'}
                             money={getCoinsArray(cost)}/>
                <Typography variant={'caption'}>Cost to max</Typography>
                <CoinDisplay title={''}
                             noShadow
                             variant={'no'}
                             money={getCoinsArray(costToMax)}/>
              </>}
              <Divider sx={{ my: 1 }}/>
              <Typography>Unlocks at: {commaNotation(unlockLevel)} levels</Typography>
            </CardContent>
          </Card>)
        );
      })}
    </Stack>
  </>

};

export default UpgradeVault;
