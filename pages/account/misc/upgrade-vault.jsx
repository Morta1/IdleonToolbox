import { Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import { cleanUnderscore, commaNotation, getCoinsArray, prefix } from '@utility/helpers';
import InfoIcon from '@mui/icons-material/Info';
import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import CoinDisplay from '@components/common/CoinDisplay';
import useCheckbox from '@components/common/useCheckbox';
import { NextSeo } from 'next-seo';

const UpgradeVault = () => {
  const { state } = useContext(AppContext);
  const [CheckboxEl, hideMaxed] = useCheckbox('Hide maxed upgrades');
  const { upgrades, totalUpgradeLevels, nextUnlock } = state?.account?.upgradeVault;
  const [searchText, setSearchText] = useState('');

  const isUpgradeVisible = (upgrade) => {
    if (searchText === '') return true;
    return upgrade.description &&
      cleanUnderscore(upgrade.description).toLowerCase().includes(searchText.toLowerCase()) || (upgrade.name &&
        cleanUnderscore(upgrade.name).toLowerCase().includes(searchText.toLowerCase()));
  };

  return <>
    <NextSeo
      title="Upgrade Vault | Idleon Toolbox"
      description="Keep track of your upgrade vault progress, upgrade, levels, cost to upgrade and more"
    />
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
      <CardTitleAndValue>
        <TextField
          size="small"
          label="Search by description or name"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: 250 }}
        />
      </CardTitleAndValue>
    </Stack>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {upgrades?.map((upgrade, index) => {
        const {
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
        } = upgrade;
        const maxed = level >= maxLevel;
        if (maxed && hideMaxed) return null;
        if (!isUpgradeVisible(upgrade)) return null;
        return (
          (<Card key={name + index}>
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              width: 370,
              minHeight: 330,
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
              <Typography>{cleanUnderscore(description?.replace('$', ` ${cleanUnderscore(monsterProgress)}`).replace('.00', ''))}</Typography>
              {maxed ? null : <>
                <Divider sx={{ my: 1 }}/>
                <Typography variant={'caption'}>Cost</Typography>
                <CoinDisplay title={''}
                             noShadow
                             variant={'no'}
                             money={getCoinsArray(cost)}
                             maxCoins={5}
                />
                <Typography variant={'caption'}>Cost to max</Typography>
                <CoinDisplay title={''}
                             noShadow
                             variant={'no'}
                             money={getCoinsArray(costToMax)}
                             maxCoins={3}
                />
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
