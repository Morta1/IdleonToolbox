import React, { useContext, useState } from 'react';
import { AppContext } from '../../components/common/context/AppProvider';
import { gemShop } from '../../data/website-data';
import {
  Badge,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { cleanUnderscore, prefix } from '../../utility/helpers';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '../../components/common/styles';

// const priorities = {
//   S: [103, 106, 111, 63],
//   A: [56, 58, 55, 104, 84, 59, 115, 120, 119, 129, 131, 133, 130],
//   B: [72, 71, 105, 112, 117, 122],
//   C: [57, 114, 118, 113, 125]
// }

const priorities = {
  103: 'S',
  106: 'S',
  111: 'S',
  63: 'S',
  56: 'A',
  58: 'A',
  55: 'A',
  104: 'A',
  84: 'A',
  59: 'A',
  115: 'A',
  120: 'A',
  119: 'A',
  129: 'A',
  131: 'A',
  133: 'A',
  130: 'A',
  72: 'B',
  71: 'B',
  105: 'B',
  112: 'B',
  117: 'B',
  122: 'B',
  57: 'C',
  114: 'C',
  118: 'C',
  113: 'C',
  125: 'C',
};

const GemShop = () => {
  const { state } = useContext(AppContext);
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = React.useState(['All']);

  const handlePriorities = (event, newSelectedPriorities) => {
    if (newSelectedPriorities?.length === 0) return;
    const hasAllOld = selectedPriorities.includes('All');
    const hasAllNew = newSelectedPriorities.includes('All');
    let finalArray = newSelectedPriorities
    if (hasAllOld && hasAllNew) {
      finalArray = finalArray.filter((item) => item !== 'All');
    } else if (hasAllNew && !hasAllOld) {
      finalArray = ['All'];
    }
    setSelectedPriorities(finalArray);
  };

  return <>
    <NextSeo
      title="Idleon Toolbox | Gem Shop"
      description="View all gem shop upgrades, bonuses and more"
    />
    <Typography mt={2} mb={2} variant={'h2'}>Gem Shop</Typography>
    <Stack direction={'row'} flexWrap={'wrap'} gap={3}>
      <CardTitleAndValue title={'Gems'} value={state?.account?.currencies?.gems}/>
      <CardTitleAndValue title={'Control'}>
        <FormControlLabel
          control={<Checkbox name={'mini'} checked={showMissingOnly}
                             size={'small'}
                             onChange={() => setShowMissingOnly(!showMissingOnly)}/>}
          label={'Show missing only'}/>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Priorities'}>
        <ToggleButtonGroup
          value={selectedPriorities}
          onChange={handlePriorities}
        >
          <ToggleButton value="All">
            All
          </ToggleButton>
          <ToggleButton value="S">
            S
          </ToggleButton>
          <ToggleButton value="A">
            A
          </ToggleButton>
          <ToggleButton value="B">
            B
          </ToggleButton>
          <ToggleButton value="C">
            C
          </ToggleButton>
        </ToggleButtonGroup>
      </CardTitleAndValue>
    </Stack>
    {gemShop?.map(({ name, sections }) => {
      return <Stack key={name} gap={2}>
        <Typography sx={{ mt: 5 }} variant={'h4'}>{name.capitalize()}</Typography>
        {Object.entries(sections).map(([sectionName, sectionItems]) => {
          const isAllBlanks = sectionItems?.every(({ rawName }) => rawName === 'Blank');
          if (isAllBlanks) return null;
          return <Card key={sectionName}>
            <CardContent>
              <Typography sx={{ mb: 1 }} variant={'h5'}>{cleanUnderscore(sectionName.capitalize())}</Typography>
              <Stack direction={'row'} flexWrap={'wrap'} gap={3}>
                {sectionItems?.map(({ globalIndex, rawName, displayName, desc, cost, maxPurchases }, index) => {
                  const purchased = state?.account?.gemShopPurchases?.[globalIndex];
                  const priority = priorities?.[globalIndex];
                  if (rawName === 'Blank' || displayName === 'NAME_OF_ITEM' || (showMissingOnly && purchased >= maxPurchases) || (!selectedPriorities.includes('All') && !selectedPriorities?.includes(priority))) return null;
                  return <Badge badgeContent={priorities?.[globalIndex] || 0} color={'warning'} key={rawName + index}>
                    <Card variant={'outlined'}
                          sx={{
                            width: 300,
                            border: purchased === maxPurchases ? '1px solid' : '',
                            borderColor: purchased === maxPurchases ? 'success.main' : ''
                          }}>
                      <CardContent sx={{ height: '100%', display: 'flex', position: 'relative' }}>
                        <Stack>
                          <Stack gap={1} direction={'row'} alignItems={'center'}>
                            {!rawName.includes(';') ? <img width={32} src={`${prefix}data/${rawName}.png`}
                                                           alt={rawName}/> : null}
                            <Typography variant={'body1'}>{cleanUnderscore(displayName)}</Typography>
                          </Stack>
                          <Typography fontSize={14}>{cleanUnderscore(desc)}</Typography>
                          <Stack sx={{ mt: 'auto' }} direction={'row'} alignItems={'center'}
                                 justifyContent={'space-between'}>
                            <Stack direction={'row'} alignItems={'center'} gap={1}>
                              <img width={32} height={32} src={`${prefix}data/PremiumGem.png`} alt={'gem'}/>
                              <Typography variant={'body1'}>{cost}</Typography>
                            </Stack>
                            <Typography variant={'body1'}>{purchased} / {maxPurchases}</Typography>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Badge>
                })}
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    })}
  </>
};
export default GemShop;
