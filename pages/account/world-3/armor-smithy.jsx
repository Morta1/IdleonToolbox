import { useContext, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import { items } from '../../../data/website-data';
import ItemDisplay from '@components/common/ItemDisplay';
import { addEquippedItems, getAllItems, mergeItemsByOwner } from '@parsers/items';
import useCheckbox from '@components/common/useCheckbox';

const ArmorSmithy = () => {
  const { state } = useContext(AppContext);
  const { days, sets, unlockedSets, isSmithyUnlocked } = state?.account?.armorSmithy || {};
  const equippedItems = useMemo(() => addEquippedItems(state?.characters, true), []);
  const totalItems = useMemo(() => getAllItems(state?.characters, state?.account), [state?.characters, state?.account])
  const allItems = useMemo(() => mergeItemsByOwner(equippedItems, totalItems), [equippedItems, totalItems]);
  const [CheckboxEl, hideUnlocked] = useCheckbox('Hide unlocked');
  const [BonusCheckboxEl, showBonusOnly] = useCheckbox('Show bonus only', true);

  return <>
    <Stack direction={'row'} gap={2} alignItems={'center'}>
      <CardTitleAndValue title={'Completed sets'} value={`${unlockedSets.length} / 18`}/>
      {!isSmithyUnlocked ? <CardTitleAndValue title={'Unlock smithy in'} value={`${30 - days} days`}/> : null}
    </Stack>
    <BonusCheckboxEl/>
    <CheckboxEl/>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {sets?.map(({
                    setName,
                    armors,
                    weapons,
                    tools,
                    requiredWeapon,
                    requiredTools,
                    description,
                    unlocked
                  }, index) => {
        if (hideUnlocked && unlocked) return null;
        return <Card key={'upgrade-' + index} sx={{ width: 350 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ width: '100%' }}>
              <img src={`${prefix}data/${armors?.[0]}.png`} style={{ width: 32, height: 32 }}/>
              <Stack sx={{ width: '100%' }}>
                <Stack direction={'row'} alignItems={'center'}>
                  <Typography
                    component={'span'}>{cleanUnderscore(setName.toLowerCase().camelToTitleCase())} {!showBonusOnly
                    ? <Typography
                      variant={'caption'}
                      component={'span'}>({armors.length + requiredWeapon + requiredTools})</Typography>
                    : null}</Typography>
                  {unlockedSets.includes(setName) ? <Typography variant={'caption'} sx={{
                    color: 'success.light',
                    ml: 'auto'
                  }}>UNLOCKED</Typography> : null}
                </Stack>
                <Typography variant={'caption'}>{cleanUnderscore(description.replace('|', '_'))}</Typography>
              </Stack>

            </Stack>
            {!showBonusOnly ? <>
              <RequiredItems allItems={allItems} title={`Armor (${armors.length})`} requiredItems={armors}
                             account={state?.account}/>
              {tools.length > 0 && requiredTools ? <RequiredItems allItems={allItems} title={`Tools (${requiredTools})`}
                                                                  requiredItems={tools}
                                                                  account={state?.account}/> : null}
              {weapons.length > 0 && requiredWeapon ? <RequiredItems allItems={allItems}
                                                                     title={`Weapon (${requiredWeapon})`}
                                                                     requiredItems={weapons}
                                                                     account={state?.account}/> : null}
            </> : null}
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const RequiredItems = ({ title, requiredItems, account, allItems }) => {
  return <Stack>
    <Divider sx={{ my: 1 }}/>
    <Typography variant={'body2'}>{title}</Typography>
    <Stack mt={.5} direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
      {requiredItems?.map((rawName, index) => {
        const owners = allItems.filter(({ rawName: rName }) => rName === rawName).map(({ owner }) => owner);
        return <Tooltip key={rawName + index}
                        title={<ItemDisplay {...items[rawName]} owners={owners} account={account}/>}>
          <img src={`${prefix}data/${rawName}.png`} style={{ width: 32, height: 32 }}/>
        </Tooltip>
      })}
    </Stack>
  </Stack>
}

export default ArmorSmithy;
