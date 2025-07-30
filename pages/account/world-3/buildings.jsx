import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Divider, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { getBuildCost, getExtraMaxLevels } from '../../../parsers/construction';
import { NextSeo } from 'next-seo';
import Timer from '../../../components/common/Timer';
import { getAtomBonus } from '../../../parsers/atomCollider';
import Tooltip from '../../../components/Tooltip';
import Box from '@mui/material/Box';
import { TitleAndValue } from '@components/common/styles';
import InfoIcon from '@mui/icons-material/Info';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getEventShopBonus } from '@parsers/misc';

const Buildings = () => {
  const { state } = useContext(AppContext);
  const [sortBy, setSortBy] = useState('order')
  const buildSpeed = state?.account?.construction?.totalBuildRate;
  const atomBonus = getAtomBonus(state?.account, 'Nitrogen_-_Construction_Trimmer');
  const costCruncher = useMemo(() => state?.account?.towers?.data?.find((tower) => tower.index === 5), [state]);

  const getMaterialCosts = (itemReq, level, maxLevel, bonusInc, costCruncher) => {
    return itemReq.map(({ rawName, name, amount }) => {
      const math1 = Math.min(0.1, 0.1 * Math.floor((costCruncher.level + 999) / 1000));
      const math2 = Math.max(0, costCruncher.level - 1);
      const costReduction = Math.max(0.2, 1 - (math1 + (math2 * costCruncher.costInc[0]) / 100))
      if (rawName.includes('Refinery')) {
        return {
          rawName, name,
          amount: Math.floor(costReduction * amount * (level + 1))
        }
      } else {
        return {
          rawName, name,
          amount: Math.floor(costReduction * amount * Math.pow(bonusInc + 0.03 - ((bonusInc + 0.03 - 1.05) * level) / (maxLevel / 2 + level), level))
        };
      }
    });
  }

  const getMaterialCostsToMax = (itemReq, iterations, level, maxLevel, bonusInc, costCruncher) => {
    let costs = [];
    for (let i = 0; i < iterations; i++) {
      const [firstCost, secondCost] = getMaterialCosts(itemReq, level + i, maxLevel, bonusInc, costCruncher);
      costs[0] = { ...(costs?.[0] ?? firstCost), amount: (costs?.[0]?.amount || 0) + firstCost?.amount }
      if (secondCost) {
        costs[1] = { ...(costs?.[1] ?? secondCost), amount: (costs?.[1]?.amount || 0) + secondCost?.amount }
      }
    }
    return costs;
  }

  const b = useMemo(() => {
    return state?.account?.towers?.data?.map((tower) => {
      let { progress, level, maxLevel, bonusInc, itemReq, slot } = tower;
      const fakeMaxLevel = maxLevel;
      const items = getMaterialCosts(itemReq, level, maxLevel, bonusInc, costCruncher);
      const buildCost = getBuildCost(state?.account?.towers, level, bonusInc, tower?.index);
      const atom = state?.account?.atoms?.atoms?.find(({ name }) => name === 'Carbon_-_Wizard_Maximizer');
      let extraLevels = getExtraMaxLevels(state?.account, maxLevel, atom?.level);
      maxLevel += extraLevels;
      const allBlueActive = state?.account?.lab.jewels?.slice(3, 7)?.every(({ active }) => active) ? 1 : 0;
      const jewelTrimmedSlot = state?.account?.lab.jewels?.[3]?.active ? 1 + allBlueActive : 0;
      const eventBonus = getEventShopBonus(state?.account, 14);
      const gambitSlot = getGambitBonus(state?.account, 9);
      const trimmedSlots = jewelTrimmedSlot + (atomBonus ? 1 : 0) + gambitSlot + eventBonus;
      const isSlotTrimmed = slot !== -1 && slot < trimmedSlots;
      if (isSlotTrimmed) {
        const timePassed = (new Date().getTime() - (state?.lastUpdated ?? 0)) / 1000;
        progress += (3 + atomBonus / 100) * (timePassed / 3600) * buildSpeed;
      }
      const trimmedSlotSpeed = (3 + atomBonus / 100) * buildSpeed;
      const trimmedTimeLeft = (buildCost - progress) / (trimmedSlotSpeed) * 1000 * 3600;
      const timeLeft = (buildCost - progress) / buildSpeed * 1000 * 3600;
      const iterations = maxLevel - level;
      const itemsMax = getMaterialCostsToMax(itemReq, iterations, level, fakeMaxLevel, bonusInc, costCruncher);


      return {
        ...tower,
        maxLevel,
        isMaxed: level === maxLevel,
        isSlotTrimmed,
        timeLeft,
        progress,
        buildCost,
        items,
        itemsMax,
        trimmedSlotSpeed,
        trimmedTimeLeft
      }
    })
  }, [state?.account]);

  const sortedBuildings = useMemo(() => {
    if (sortBy === 'order') return b;
    else if (sortBy === 'time') {
      const towers = structuredClone((b));
      return towers?.sort((a, b) => {
        const timeLeftA = a?.isSlotTrimmed ? a?.trimmedTimeLeft : a?.timeLeft;
        const timeLeftB = b?.isSlotTrimmed ? b?.trimmedTimeLeft : b?.timeLeft;
        if (a?.isMaxed) {
          return 1;
        } else if (b?.isMaxed) {
          return -1;
        }
        return timeLeftA - timeLeftB;
      })
    } else if (sortBy === 'requirement') {
      const towers = structuredClone((b));
      return towers?.sort((a, b) => {
        if (a?.isMaxed) {
          return 1;
        } else if (b?.isMaxed) {
          return -1;
        }
        const buildCostComparison = a?.buildCost - b?.buildCost;

        // If build cost is different, return the comparison result
        if (buildCostComparison !== 0) {
          return buildCostComparison;
        } else {
          // If build cost is the same, compare progress
          const progressA = a?.buildCost - a?.progress;
          const progressB = b?.buildCost - b?.progress;
          return progressA - progressB;
        }
      })
    }
  }, [sortBy, state]);

  const getBorderColor = ({ isSlotTrimmed, inProgress }) => {
    if (isSlotTrimmed) {
      return 'warning.light';
    } else if (inProgress) {
      return 'success.light'
    }
    return '';
  }

  return <>
    <NextSeo
      title="Buildings | Idleon Toolbox"
      description="Keep track of your towers levels, bonuses and required materials for upgrades"
    />
    <Stack direction={'row'} alignItems="center" gap={3} flexWrap={'wrap'} mb={2}>
      <Box>
        <Typography>Sort by</Typography>
        <ToggleButtonGroup value={sortBy} sx={{ mb: 2 }} exclusive
                           onChange={(e, newSort) => newSort?.length > 0 && setSortBy(newSort)}>
          <ToggleButton value={'order'}>Order</ToggleButton>
          <ToggleButton value={'time'}>Time left</ToggleButton>
          <ToggleButton value={'requirement'}>Build cost</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <CardTitleAndValue title={'Build Speed'} value={notateNumber(buildSpeed, 'Big')}/>
      <CardTitleAndValue title={'Trimmed Build Speed'}
                         value={notateNumber((3 + atomBonus / 100) * buildSpeed, 'Big')}
                         breakdown={[{
                           name: 'Base (jewel)',
                           value: state?.account?.lab.jewels?.[3]
                             ? Math.ceil(state?.account?.lab.jewels?.[3]?.bonus * state?.account?.lab.jewels?.[3]?.multiplier)
                             : 3
                         }, { name: 'Atom', value: atomBonus / 100 }]}
      />
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'} gap={3}>
      {sortedBuildings?.map((tower, index) => {
        let {
          name,
          progress,
          level,
          maxLevel,
          inProgress,
          isSlotTrimmed,
          isMaxed,
          items,
          itemsMax,
          buildCost,
          timeLeft,
          trimmedTimeLeft
        } = tower;
        return <Card key={`${name}-${index}`} sx={{
          border: inProgress || isSlotTrimmed ? '1px solid' : '',
          borderColor: getBorderColor(tower),
          width: { xs: '100%', md: 450 },
          height: { md: 165 }
        }}>
          <CardContent>
            <Stack direction={'row'} justifyContent={'space-around'} flexWrap={'wrap'}>
              <Stack alignItems={'center'} sx={{ textAlign: 'center' }}>
                <Typography>{cleanUnderscore(name)}</Typography>
                <TowerIcon src={`${prefix}data/ConTower${tower?.index}.png`} alt="tower-icon"/>
                <Typography>Lv. {level} / {maxLevel}</Typography>
                {isMaxed ? <Typography color={'success.light'}>Maxed</Typography> :
                  <Tooltip title={<>
                    <Typography>Progress: {numberWithCommas(Math.floor(progress))}</Typography>
                    <Typography>Requirement: {numberWithCommas(Math.floor(buildCost))}</Typography>
                  </>}>
                    <Typography>{notateNumber(progress, 'Big')} / {notateNumber(buildCost, 'Big')}</Typography>
                  </Tooltip>}

              </Stack>
              {!isMaxed ? <Stack gap={1} divider={<Divider flexItem/>}>
                <Stack>
                  {!isMaxed
                    ? <TitleAndValue title={'Non-trimmed'}
                                     value={<Timer type={'countdown'} staticTime={true}
                                                   placeholder={'Ready!'}
                                                   date={new Date().getTime() + timeLeft}
                                                   lastUpdated={state?.lastUpdated}/>}/>
                    : null}
                  {!isMaxed
                    ? <TitleAndValue title={'Trimmed'}
                                     value={<Timer type={'countdown'}
                                                   placeholder={'Ready!'}
                                                   staticTime={true}
                                                   date={new Date().getTime() + trimmedTimeLeft}
                                                   lastUpdated={state?.lastUpdated}/>}/>
                    : null}

                </Stack>
                <Stack direction={'row'} divider={<Divider orientation={'vertical'} flexItem/>} gap={2}>
                  <ReqItemsDisplay title={'Next'} isMaxed={isMaxed} items={items}/>
                  <ReqItemsDisplay title={'Max'} isMaxed={isMaxed} items={itemsMax}/>
                </Stack>
              </Stack> : null}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};

const ReqItemsDisplay = ({ title, isMaxed, items }) => {
  if (isMaxed) return null;
  return <Stack>
    <Typography variant={'body2'} color={'text.secondary'}>{title}</Typography>
    <Stack direction={'row'} gap={1}>
      {items?.map(({ rawName, amount }, itemIndex) => {
        return <Stack alignItems={'center'} key={`${name}-${rawName}-${itemIndex}`}>
          <ItemIcon src={`${prefix}data/${rawName}.png`} alt="item-icon"/>
          <Typography>{notateNumber(amount, 'Big')}</Typography>
        </Stack>
      })}
    </Stack>
  </Stack>
}

const TowerIcon = styled.img`
  width: 50px;
  height: 50px;
  object-fit: contain;
`
const ItemIcon = styled.img`
  width: 35px;
  height: 35px;
  object-fit: contain;
`

const CardTitleAndValue = ({ cardSx, title, value, children, breakdown }) => {
  return <Card sx={{ my: { xs: 0, md: 3 }, width: 'fit-content', ...cardSx }}>
    <CardContent>
      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>{title}</Typography>
      <Stack direction={'row'} gap={2}>
        {value ? <Typography>{value}</Typography> : children}
        {breakdown ? <Tooltip title={<Stack>
          {breakdown?.map(({ name, value }, index) => <TitleAndValue key={`${name}-${index}`}
                                                                     title={name}
                                                                     value={!isNaN(value)
                                                                       ? `${notateNumber(value, 'MultiplierInfo').replace('.00', '')}x`
                                                                       : value}/>)}

        </Stack>}>
          <InfoIcon></InfoIcon>
        </Tooltip> : null}
      </Stack>
    </CardContent>
  </Card>
}


export default Buildings;
