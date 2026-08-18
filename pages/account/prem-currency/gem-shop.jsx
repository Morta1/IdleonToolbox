import React, { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { gemShop } from '@website-data';
import {
  Badge,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';


// Keyed by `${categoryName}_${globalIndex}` - globalIndex is reused across categories
// (e.g. usables>Limited_Specials and past_limited_specials both use 87-94), so a flat
// globalIndex-only key would mistag items across categories.
const priorities = {
  bonuses_103: 'S',
  bonuses_106: 'S',
  bonuses_111: 'S',
  usables_63: 'S',
  usables_56: 'A',
  usables_58: 'A',
  usables_55: 'A',
  bonuses_104: 'A',
  usables_84: 'A',
  usables_59: 'A',
  bonuses_115: 'A',
  bonuses_120: 'A',
  bonuses_119: 'A',
  bonuses_129: 'A',
  bonuses_131: 'A',
  bonuses_133: 'A',
  bonuses_130: 'A',
  usables_72: 'B',
  usables_71: 'B',
  bonuses_105: 'B',
  bonuses_112: 'B',
  bonuses_117: 'B',
  bonuses_122: 'B',
  bonuses_57: 'C',
  bonuses_114: 'C',
  bonuses_118: 'C',
  bonuses_113: 'C',
  bonuses_125: 'C'
};

const PRIORITY_TIERS = ['S', 'A', 'B', 'C'];

// Items without a curated tier fall into 'Unranked' instead of no tier at all, so they
// stay reachable when a tier filter is selected instead of silently disappearing.
const getPriority = (categoryName, globalIndex) => priorities[`${categoryName}_${globalIndex}`] || 'Unranked';

const calculateTotalCostToMax = (baseCost, costIncrement, currentPurchases, maxPurchases) => {
  let totalCost = 0;
  for (let i = currentPurchases; i < maxPurchases; i++) {
    totalCost += baseCost + (i * costIncrement);
  }
  return totalCost;
};

const GemShop = () => {
  const { state } = useContext(AppContext);
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = React.useState(['All']);
  const [searchQuery, setSearchQuery] = useState('');

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

  const isItemVisible = (item, sectionName, categoryName) => {
    const { globalIndex, rawName, displayName, desc, maxPurchases } = item;
    const purchased = state?.account?.gemShopPurchases?.[globalIndex] || 0;
    const priority = getPriority(categoryName, globalIndex);

    if (rawName === 'Blank' || displayName === 'NAME_OF_ITEM') return false;
    if (showMissingOnly && purchased >= maxPurchases) return false;
    if (!selectedPriorities.includes('All') && !selectedPriorities?.includes(priority)) return false;
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const displayNameText = cleanUnderscore(displayName.toLowerCase().camelToTitleCase()).toLowerCase();
      const descText = cleanUnderscore(desc).toLowerCase();
      const sectionText = cleanUnderscore(sectionName.capitalize()).toLowerCase();
      if (!displayNameText.includes(searchLower) && !descText.includes(searchLower) && !sectionText.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  };

  return <>
    <NextSeo
      title="Gem Shop | Idleon Toolbox"
      description="Browse all gem shop purchases, upgrade bonuses, and premium currency spending in Legends of Idleon"
    />
    <Stack direction={'row'} flexWrap={'wrap'} gap={3} mb={2}>
      <CardTitleAndValue title={'Gems'} value={numberWithCommas(state?.account?.currencies?.gems)} icon={'data/PremiumGem.png'}
        imgStyle={{ width: 24, height: 24 }} />
      <CardTitleAndValue title={'Control'} value={<FormControlLabel
        control={<Checkbox name={'mini'} checked={showMissingOnly}
          size={'small'}
          onChange={() => setShowMissingOnly(!showMissingOnly)} />}
        label={'Show missing only'} />} />
      <CardTitleAndValue title={'Priorities'} value={<ToggleButtonGroup
        sx={{ mt: .5 }}
        value={selectedPriorities}
        onChange={handlePriorities}
      >
        <ToggleButton value="All">All</ToggleButton>
        <ToggleButton value="S">S</ToggleButton>
        <ToggleButton value="A">A</ToggleButton>
        <ToggleButton value="B">B</ToggleButton>
        <ToggleButton value="C">C</ToggleButton>
        <ToggleButton value="Unranked">Unranked</ToggleButton>
      </ToggleButtonGroup>} />
      <CardTitleAndValue title={'Search'} value={<TextField
        label="Enter search term"
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ minWidth: 200, mt:1 }}
      />} />
      
    </Stack>
    {gemShop?.map(({ name, sections }) => {
      const isPastCategory = name === 'past_limited_specials';
      // Filter sections to only those with visible items
      const visibleSections = Object.entries(sections).filter(([sectionName, sectionItems]) => {
        const isAllBlanks = sectionItems?.every(({ rawName }) => rawName === 'Blank');
        if (isAllBlanks) return false;
        return sectionItems?.some(item => isItemVisible(item, sectionName, name));
      });

      // Only show category if it has visible sections
      if (visibleSections.length === 0) return null;

      return <Stack key={name} gap={2}>
        <Typography sx={{ mt: 5 }} variant={'h5'}>{cleanUnderscore(name).capitalize()}</Typography>
        {visibleSections.map(([sectionName, sectionItems]) => {
          // Filter items to only visible ones
          const visibleItems = sectionItems?.filter(item => isItemVisible(item, sectionName, name));
          
          // Only show section if it has visible items
          if (!visibleItems || visibleItems.length === 0) return null;

          return <Card key={sectionName}>
            <CardContent>
              <Typography sx={{ mb: 1 }} variant={'h5'}>{cleanUnderscore(sectionName.capitalize())}</Typography>
              <Stack direction={'row'} flexWrap={'wrap'} gap={3}>
                {visibleItems.map(({
                  globalIndex,
                  rawName,
                  displayName,
                  desc,
                  cost,
                  maxPurchases,
                  costIncrement
                }, index) => {
                  const purchased = state?.account?.gemShopPurchases?.[globalIndex] ?? 0;
                  const addedCost = purchased * costIncrement;
                  const priority = getPriority(name, globalIndex);
                  return <Badge
                    badgeContent={PRIORITY_TIERS.includes(priority) ? priority : 0}
                    color={'warning'} key={rawName + index}>
                    <Card variant={'outlined'}
                      sx={{
                        width: 300,
                        border: purchased === maxPurchases ? '1px solid' : '',
                        borderColor: purchased === maxPurchases ? 'success.main' : ''
                      }}>
                      <CardContent sx={{ height: '100%', display: 'flex', position: 'relative' }}>
                        <Stack sx={{ width: '100%' }}>
                          <Stack gap={1} direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                            <Stack gap={1} direction={'row'} alignItems={'center'}>
                              {!rawName.includes(';') ? <img width={32} src={`${prefix}data/${rawName}.png`}
                                alt={rawName} /> : null}
                              <Typography variant={'body1'}>{cleanUnderscore(displayName.toLowerCase().camelToTitleCase())}</Typography>
                            </Stack>
                            {purchased < maxPurchases && (
                              <Tooltip title={
                                <Stack>
                                  <Typography variant="body2">
                                    Cost to max: {numberWithCommas(calculateTotalCostToMax(cost, costIncrement, purchased, maxPurchases))}
                                  </Typography>
                                </Stack>
                              }>
                                <IconInfoCircleFilled size={18} />
                              </Tooltip>
                            )}
                          </Stack>
                          <Typography fontSize={14}>{cleanUnderscore(desc)}</Typography>
                          <Stack sx={{ mt: 'auto' }} direction={'row'} alignItems={'center'}
                            justifyContent={'space-between'}>
                            <Stack direction={'row'} alignItems={'center'} gap={1}>
                              <img width={32} height={32} src={`${prefix}data/PremiumGem.png`} alt={'gem'} />
                              <Typography variant={'body1'}>{cost + (isNaN(addedCost) ? 0 : addedCost)}</Typography>
                            </Stack>
                            <Typography variant={'body1'}>{isPastCategory ? `?? / ${maxPurchases}` : `${purchased} / ${maxPurchases}`}</Typography>
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
