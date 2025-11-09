import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Link,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import React, { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import styled from '@emotion/styled';
import { cleanUnderscore, growth, notateNumber, pascalCase, prefix } from 'utility/helpers';
import HtmlTooltip from 'components/Tooltip';
import { NextSeo } from 'next-seo';
import {
  getBubbleAtomCost,
  getBubbleBonus,
  getMaxCauldron,
  getUpgradeableBubbles,
  getVialsBonusByStat,
  isPrismaBubble,
  liquidsIndex
} from '@parsers/alchemy';
import { Breakdown } from '@components/common/styles';
import MenuItem from '@mui/material/MenuItem';
import { useRouter } from 'next/router';
import { useLocalStorage } from '@mantine/hooks';
import { getArcadeBonus } from '@parsers/arcade';
import { getTesseractBonus } from '@parsers/tesseract';
import { IconChartCohort, IconChevronRight, IconInfoCircleFilled, IconList } from '@tabler/icons-react';

const bargainOptions = [0, 25, 43.75, 57.81, 68.36, 76.27, 82.20, 86.65, 90];
const Bubbles = () => {
  const router = useRouter();
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const { state } = useContext(AppContext);
  const [viewMode, setViewMode] = useLocalStorage({
    key: `bubbles:viewMode`,
    defaultValue: 'list'
  });
  const batchLayout = viewMode === 'batch';
  const [classDiscount, setClassDiscount] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [bargainTag, setBargainTag] = useState('0');
  const [effThreshold, setEffThreshold] = useLocalStorage({
    key: `bubbles:effThreshold`,
    defaultValue: 75
  });
  const [levelThreshold, setLevelThreshold] = useState(100);
  const [showMissingLevels, setShowMissingLevels] = useState(true);
  const [hidePastThreshold, setHidePastThreshold] = useState(false);
  const [hidePastLevelThreshold, setHidePastLevelThreshold] = useState(false);
  const [bubblesGoals, setBubblesGoals] = useState();
  const myFirstChemSet = state?.account?.lab?.labBonuses?.find(bonus => bonus.name === 'My_1st_Chemistry_Set')?.active;

  const calcBubbleMatCost = (bubbleIndex, vialMultiplier = 1, bubbleLvl, baseCost, isLiquid, cauldronCostLvl,
                             undevelopedBubbleLv, barleyBrewLvl, lastBubbleLvl, classMultiplierLvl,
                             shopBargainBought, smrtAchievement, multiBubble) => {
    if (isLiquid) {
      return baseCost + Math.floor(bubbleLvl / 20);
    }
    else {
      const first = bubbleIndex < 15 ?
        baseCost * Math.pow(1.35 - (0.3 * bubbleLvl) / (50 + bubbleLvl), bubbleLvl) :
        baseCost * Math.pow(1.37 - (0.28 * bubbleLvl) / (60 + bubbleLvl), bubbleLvl);
      const cauldronCostReduxBoost = Math.max(0.1, 1 - ((Math.round(10 * growth('decay', cauldronCostLvl, 90, 100, false)) / 10)) / 100);
      const barleyBrewVialBonus = getVialsBonusByStat(state?.account?.alchemy?.vials, 'AlchBubbleCost');
      const undevelopedBubbleBonus = getBubbleBonus(state?.account, 'UNDEVELOPED_COSTS', false);
      const bubbleBargainBoost = Math.max(0.05, 1 - (growth('decay', lastBubbleLvl, 40, 12, false) / 100) *
        growth('decayMulti', classMultiplierLvl, 2, 50, false) *
        growth('decayMulti', multiBubble, 1.4, 30, false));
      const secondMath = Math.max(.05, 1 - (barleyBrewVialBonus + undevelopedBubbleBonus) / 100);
      const shopBargainBoost = Math.max(0.1, Math.pow(0.75, shopBargainBought));
      const smrtBoost = Math.max(.9, 1 - .1 * smrtAchievement)
      const endResult = first * bubbleBargainBoost * cauldronCostReduxBoost * secondMath * shopBargainBoost * smrtBoost;
      return Math.min(endResult, 1e9);
    }
  };

  const calculateMaterialCost = (bubbleLv, baseCost, isLiquid, cauldronName, bubbleIndex) => {
    const cauldronCostLvl = state?.account?.alchemy?.cauldrons?.[cauldronName]?.boosts?.cost?.level || 0;
    const undevelopedBubbleLv = state?.account?.alchemy?.bubbles?.kazam?.[6].level || 0;
    const barleyBrewLvl = state?.account?.alchemy?.vials?.[9]?.level || 0;
    const multiBubble = cauldronName !== 'kazam'
      ? state?.account?.alchemy?.bubbles?.[cauldronName]?.[16]?.level || 0
      : 0;
    const lastBubbleLvl = state?.account?.alchemy?.bubbles?.[cauldronName]?.[14]?.level || 0;
    const classMultiplierLvl = classDiscount && cauldronName !== 'kazam'
      ? (state?.account?.alchemy?.bubbles?.[cauldronName]?.[1]?.level || 0)
      : 0;
    const shopBargainBought = bargainTag || 0;
    const smrtAchievement = state?.account?.achievements[108]?.completed;
    return calcBubbleMatCost(bubbleIndex, myFirstChemSet ? 2 : 1, bubbleLv, baseCost, isLiquid, cauldronCostLvl,
      undevelopedBubbleLv, barleyBrewLvl, lastBubbleLvl, classMultiplierLvl,
      shopBargainBought, smrtAchievement, multiBubble);
  }

  const getAccumulatedBubbleCost = (index, level, baseCost, isLiquid, cauldronName) => {
    const levelDiff = (bubblesGoals?.[cauldronName]?.[index] ?? 0) - level;
    if (isNaN(levelDiff)) return { singleLevelCost: 0, total: 0 };
    if (levelDiff <= 0) {
      const cost = calculateMaterialCost(level, baseCost, isLiquid, cauldronName, index);
      return { singleLevelCost: cost, total: cost };
    }
    const array = new Array(levelDiff || 0).fill(1);
    let singleLevelCost = 0;
    const total = array.reduce((res, _, levelInd) => {
        const cost = calculateMaterialCost(level + (levelInd === 0
          ? 1
          : levelInd), baseCost, isLiquid, cauldronName, index);
        if (!isLiquid) {
          singleLevelCost = cost;
        }
        return res + cost;
      },
      calculateMaterialCost(level, baseCost, isLiquid, cauldronName, index)
    );
    return { total, singleLevelCost };
  }

  const accumulatedCost = useCallback((index, level, baseCost, isLiquid, cauldronName) => getAccumulatedBubbleCost(index, level, baseCost, isLiquid, cauldronName), [bubblesGoals,
    bargainTag, classDiscount]);

  const upgradeableBubbles = useMemo(() => getUpgradeableBubbles(state?.account, state?.characters), [state?.account]);

  const getMaxBonus = (func, x1) => {
    if (!func?.includes('decay')) return null;
    let maxBonus = x1;
    if (func === 'decayMulti') maxBonus += 1
    return maxBonus;
  }

  const findBubble = (bubble) => {
    const lowerQuery = searchText.toLowerCase();
    if (cleanUnderscore(bubble.bubbleName)?.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    if (cleanUnderscore(bubble.desc)?.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    if (Array.isArray(bubble.itemReq)) {
      for (const item of bubble.itemReq) {
        const index = parseInt(item?.name?.replace(/[^0-9]/g, ''), 10) - 1;
        const mappedName = liquidsIndex[index];
        if (cleanUnderscore(mappedName)?.toLowerCase().includes(lowerQuery)) {
          return true;
        }
      }
    }

    return false;
  }

  return (
    <>
      <NextSeo
        title="Bubbles | Idleon Toolbox"
        description="Keep track of your bubbles level and requirements with a handy calculator"
      />
      <Container>
        <Card>
          <CardContent>
            <Card variant={'outlined'} sx={{ width: '100%', mb: 1 }}>
              <CardContent>
                <Stack direction="row" gap={2}>
                  <Typography variant={'body2'} color={'primary'}>No bubble left behind</Typography>
                  <Dot/>
                  <Stack direction="row" divider={<Dot/>} gap={2} flexWrap={'wrap'}>
                    <Typography variant="body2">
                      {upgradeableBubbles?.normal?.length + upgradeableBubbles?.atomBubbles?.length} eligible bubbles
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {upgradeableBubbles.upgradeableBubblesAmount} bubbles will upgrade
                      </Typography>
                      <HtmlTooltip title={<Breakdown breakdown={upgradeableBubbles?.breakdown}/>}>
                        <IconInfoCircleFilled style={{ flexShrink: 0 }} size={16}/>
                      </HtmlTooltip>
                    </Stack>
                    <Typography variant="body2">
                      {upgradeableBubbles.minLevel} - {upgradeableBubbles.maxLevel} LVs
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <UpgradeableBubblesList bubbles={[...upgradeableBubbles?.normal, ...upgradeableBubbles?.atomBubbles]}
                                    accumulatedCost={accumulatedCost}
                                    account={state?.account}/>
          </CardContent>
        </Card>
      </Container>
      <Container sx={{ mt: 2, mb: 3 }}>
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Section title={'Discount'}>
              <FormControlLabel
                slotProps={{ typography: { variant: 'caption' } }}
                control={<Checkbox size={'small'} checked={classDiscount}
                                   onChange={() => setClassDiscount(!classDiscount)}/>}
                name={'classDiscount'}
                label="Class Discount"/>
              <Select
                size={'small'}
                id="bargain-tag-select"
                value={bargainTag}
                slotProps={{
                  root: { style: { height: 27 } }
                }}
                onChange={(e) => setBargainTag(e.target.value)}
              >
                <MenuItem key={'bargainTag'} value={-1} disabled>Bargain Tag</MenuItem>
                {bargainOptions.map((value, index) => <MenuItem key={'option' + value}
                                                                value={index}>{value}%</MenuItem>)}
              </Select>
            </Section>
            <Section title={'Efficiency'}>
              <FormControlLabel
                slotProps={{ typography: { variant: 'caption' } }}
                control={<Checkbox size={'small'} checked={showMissingLevels}
                                   onChange={() => setShowMissingLevels(!showMissingLevels)}/>}
                name={'classDiscount'}
                label="Show Total Levels"/>
              <Stack direction={'row'}>
                <FormControlLabel
                  slotProps={{ typography: { variant: 'caption' } }}
                  control={<Checkbox size={'small'} checked={hidePastThreshold}
                                     onChange={() => setHidePastThreshold(!hidePastThreshold)}/>}
                  name={'classDiscount'}
                  label="Enable threshold"/>
                <TextField
                  size={'small'}
                  value={effThreshold}
                  type={'number'}
                  sx={{ width: '90px' }}
                  slotProps={{
                    htmlInput: { min: 0, max: 100, step: 0.01, style: { height: 10, fontSize: 14 } }
                  }}
                  onChange={({ target }) => {
                    localStorage.setItem('effThreshold', target.value);
                    setEffThreshold(target.value)
                  }}
                />
              </Stack>
            </Section>
            <Section title={'Level'}>
              <Stack direction={'row'}>
                <FormControlLabel
                  slotProps={{ typography: { variant: 'caption' } }}
                  control={<Checkbox sx={{ my: 0 }} size={'small'} checked={hidePastLevelThreshold}
                                     onChange={() => setHidePastLevelThreshold(!hidePastLevelThreshold)}/>}
                  label="Enable threshold"/>
                <TextField
                  value={levelThreshold}
                  type={'number'}
                  size={'small'}
                  sx={{ width: '90px' }}
                  slotProps={{
                    htmlInput: { min: 0, style: { height: 10, fontSize: 14 } }
                  }}
                  onChange={({ target }) => {
                    localStorage.setItem('levelThreshold', target.value);
                    setLevelThreshold(target.value);
                  }}
                />
              </Stack>
            </Section>
            <Section title={'Misc'}>
              <Typography variant={'caption'}>Particle
                Upgrades: {state?.account?.accountOptions?.[135] || '0'}</Typography>
              <Typography variant={'caption'}>Prisma
                Fragments: {Math.floor(state?.account?.alchemy?.prismaFragments) || '0'}</Typography>
              <Stack direction={'row'} gap={1}>
                <Typography variant={'caption'}>Future Bubbles</Typography>
                <HtmlTooltip title={<FutureBubblesTooltip/>}><IconInfoCircleFilled size={16}/></HtmlTooltip>
              </Stack>
            </Section>
            <Stack sx={{ ml: 'auto' }} gap={1} justifyContent={'center'}>
              <TextField
                value={searchText}
                size={'small'}
                placeholder={'Search bubbles'}
                onChange={({ target }) => { setSearchText(target.value); }}
              />
              <Stack direction={'row'} gap={1} alignItems={'center'}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  sx={{ ml: 'auto', alignItems: 'center' }}
                  onChange={(_, val) => val && setViewMode(val)}
                >
                  <Tooltip title={'Batch view'}><ToggleButton sx={{ height: 35 }}
                                                              value="batch"><IconChartCohort/></ToggleButton></Tooltip>
                  <Tooltip title={'List view'}><ToggleButton sx={{ height: 35 }}
                                                             value="list"><IconList/></ToggleButton></Tooltip>
                </ToggleButtonGroup>
                <Link underline={'hover'}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => router.push({ pathname: 'old-bubbles' })}>
                  <Stack direction={'row'} alignItems={'center'}>
                    <IconChevronRight size={16}/>
                    <Typography>Old Page</Typography>
                  </Stack>
                </Link>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
      <Container>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${batchLayout ? `calc(50% - ${5 * 8}px)` : '25%'}, 1fr))`,
          gap: batchLayout ? 5 : 0,
          mt: batchLayout ? 3 : 0
        }}>
          {Object.entries(state?.account?.alchemy?.bubbles || {})?.map(([cauldron, bubbles], cauldronIndex) => {
            return <Stack direction={batchLayout ? 'row' : 'column'} alignItems={'center'} flexWrap={'wrap'}
                          key={cauldron + '' + cauldronIndex}>
              {bubbles?.map((bubble, index) => {
                // if (index > 29) return null;
                const { level, itemReq, rawName, bubbleName, func, x1, x2, cauldron, bubbleIndex } = bubble;
                if (!func) return null;
                const isPrisma = isPrismaBubble(state?.account, bubbleIndex);
                const goalLevel = bubblesGoals?.[cauldron]?.[index] ? bubblesGoals?.[cauldron]?.[index] < level
                  ? level
                  : bubblesGoals?.[cauldron]?.[index] : level;
                const arcadeBonus = getArcadeBonus(state?.account?.arcade?.shop, 'Prisma_Bonuses')?.bonus;
                const tesseractBonus = getTesseractBonus(state?.account, 45)
                const prismaMulti = isPrisma
                  ? Math.min(3, 2 + (tesseractBonus + arcadeBonus) / 100)
                  : 1;
                const goalBonus = growth(func, goalLevel, x1, x2, true) * (isPrisma ? prismaMulti : 1);
                const bubbleMaxBonus = isPrisma ? getMaxBonus(func, x1) * prismaMulti : getMaxBonus(func, x1);
                const effectHardCapPercent = goalLevel / (goalLevel + x2) * 100;
                let thresholdObj;
                if (bubbleMaxBonus) {
                  const thresholdLevelNeeded = effThreshold / (100 - effThreshold) * x2;
                  thresholdObj = {
                    thresholdMissingLevels: thresholdLevelNeeded - goalLevel,
                    thresholdBonus: growth(func, thresholdLevelNeeded, x1, x2, true) * prismaMulti,
                    effectHardCapPercent: thresholdLevelNeeded / (thresholdLevelNeeded + x2) * 100
                  }
                }
                const isBeyondEffThreshold = func.startsWith('decay') && (!bubbleMaxBonus || thresholdObj?.thresholdMissingLevels <= 0);
                const isBeyondLevelThreshold = levelThreshold && level > levelThreshold;
                const matchSearch = searchText ? findBubble(bubble) : true;
                const isHidden = hidePastThreshold && isBeyondEffThreshold || hidePastLevelThreshold && isBeyondLevelThreshold || !matchSearch;
                return <Fragment key={rawName + '' + bubbleName + '' + index}>
                  <Stack direction={'row'} alignItems={'center'} justifyContent={'space-around'} gap={2}>
                    <Stack direction={isSm || batchLayout ? 'column' : 'row'}
                           alignItems={'center'}
                           gap={batchLayout ? 0 : 1}
                           sx={{
                             opacity: isHidden ? .2 : 1,
                             width: isSm ? 'inherit' : batchLayout ? 55 : showMissingLevels ? 150 : 100,
                             height: showMissingLevels && batchLayout ? 110 : isSm || batchLayout ? showMissingLevels
                               ? 120
                               : 100 : 'inherit'
                           }}
                    >
                      <HtmlTooltip
                        title={<AdditionalInfo tooltip bubbleMaxBonus={bubbleMaxBonus}
                                               goalBonus={goalBonus}
                                               cauldron={cauldron}
                                               effectHardCapPercent={effectHardCapPercent}
                                               itemReq={itemReq}
                                               thresholdObj={thresholdObj}
                                               accumulatedCost={accumulatedCost}
                                               account={state?.account}
                                               level={level}
                                               index={index}
                                               bubble={bubble}
                                               goalLevel={goalLevel}
                                               isPrisma={isPrisma}
                        />}>
                        <Stack sx={{ position: 'relative' }}>
                          {isPrisma ? <img style={{ position: 'absolute', width: 48, height: 48 }}
                                           src={`${prefix}data/aUpgradesGlow${cauldronIndex}.png`}/> : null}
                          <BubbleIcon width={48} height={48}
                                      level={level}
                                      src={`${prefix}data/${rawName}.png`}
                                      alt=""/>
                        </Stack>

                      </HtmlTooltip>
                      <Stack alignItems={batchLayout || isSm ? 'center' : 'flex-start'}>
                        <Stack direction={batchLayout || isSm ? 'column' : 'row'} alignItems={'center'}>
                          <Typography color={thresholdObj?.thresholdMissingLevels > 0 ? 'error.light' : ''}
                                      sx={{ mr: !batchLayout ? .5 : 0 }}
                                      variant={'caption'}>{level}</Typography>
                          {showMissingLevels && thresholdObj?.thresholdMissingLevels > 0 ? <>
                            {batchLayout
                              ? <Typography
                                color={'error.light'}
                                variant={'caption'}> / {level + Math.ceil(thresholdObj?.thresholdMissingLevels)}</Typography>
                              : isSm
                                ? <Typography component={'div'} color={'error.light'}
                                              variant={'caption'}> / {level + Math.ceil(thresholdObj?.thresholdMissingLevels)}</Typography>
                                : <Typography
                                  color={'error.light'}
                                  variant={'caption'}> / {level + Math.ceil(thresholdObj?.thresholdMissingLevels)}</Typography>}
                          </> : null}
                        </Stack>
                        {bubbleMaxBonus ? <Typography
                            fontSize={'0.70rem'}
                            variant={'caption'}>({effectHardCapPercent.toFixed(1).replace('.0', '')}%)</Typography> :
                          isSm ? <Typography>&nbsp;</Typography> : null}
                      </Stack>
                    </Stack>
                  </Stack>
                  {
                    !isSm && (index + 1 < bubbles.length - 1) && (index + 1) % 5 === 0
                      ?
                      <Divider sx={{ my: 1 }} flexItem/>
                      : null
                  }
                </Fragment>
              })}
            </Stack>
          })}
        </Box>
      </Container>
    </>
  );
};

const AdditionalInfo = ({
                          tooltip,
                          bubbleMaxBonus,
                          goalBonus,
                          effectHardCapPercent,
                          itemReq,
                          thresholdObj,
                          accumulatedCost,
                          index,
                          level,
                          cauldron,
                          account,
                          bubble,
                          goalLevel,
                          isPrisma
                        }) => {
  return <Box>
    {tooltip ? <BubbleTooltip {...{ ...bubble, goalBonus, isPrisma }} /> : null}
    <Stack gap={2} direction={'row'}>
      <Stack gap={bubbleMaxBonus && thresholdObj?.thresholdMissingLevels > 0 ? 0 : 2} justifyContent={'center'}
             alignItems={'center'}>
        <BonusIcon src={`${prefix}data/SignStar1b.png`} alt=""/>
        <Typography variant={bubbleMaxBonus && thresholdObj?.thresholdMissingLevels > 0
          ? 'caption'
          : ''}>{goalBonus.toFixed(3).replace('.000', '')} {bubbleMaxBonus
          ? `(${notateNumber(effectHardCapPercent)}%)`
          : ''}</Typography>
      </Stack>
      {
        itemReq?.map(({ rawName, name, baseCost }, itemIndex) => {
          let updatedName = name;
          if (rawName === 'Blank' || rawName === 'ERROR') return null;
          const {
            singleLevelCost,
            total
          } = accumulatedCost(index, level, baseCost, name?.includes('Liquid'), cauldron);
          const x1Extension = ['sail', 'bits', 'w6item'];
          const itemName = x1Extension.find((str) => rawName.toLowerCase().includes(str))
            ? `${rawName}_x1`
            : rawName;
          const atomCost = singleLevelCost > 1e8 && !name?.includes('Liquid') && !name?.includes('Bits') && getBubbleAtomCost(index, singleLevelCost);
          let amount;
          if (rawName.includes('Liquid')) {
            const liquids = { 'Liquid1': 0, 'Liquid2': 1, 'Liquid3': 2, 'Liquid4': 3 };
            amount = account?.alchemy?.liquids?.[liquids?.[rawName]];
            const index = parseInt(name?.replace(/[^0-9]/g, ''), 10) - 1;
            updatedName = liquidsIndex[index];
          }
          else if (rawName.includes('Bits')) {
            amount = account?.gaming?.bits;
          }
          else if (rawName.includes('Sail')) {
            amount = account?.sailing?.lootPile?.find(({ rawName: lootPileName }) => lootPileName === rawName.replace('SailTr', 'SailT'))?.amount;
          }
          else if (rawName.includes('W6item')) {
            const crops = { 'W6item1': 4, 'W6item2': 30, 'W6item3': 46, 'W6item4': 72, 'W6item5': 99 };
            const essences = { 'W6item6': 0, 'W6item7': 1, 'W6item8': 2, 'W6item9': 3, 'W6item10': 4 };
            if (crops?.[rawName]) {
              amount = account?.farming?.crop?.[crops?.[rawName]];
            }
            else if (essences.hasOwnProperty(rawName)) {
              amount = account?.summoning?.essences?.[essences?.[rawName]];
            }
          }
          else {
            amount = account?.storage?.list?.find(({ rawName: storageRawName }) => (storageRawName === rawName))?.amount;
          }
          return <Stack direction={'row'} key={`${rawName}-${name}-${itemIndex}`} gap={3}>
            {atomCost ? <Stack gap={2} alignItems={'center'}>
                <Tooltip title={<Typography
                  color={account?.atoms?.particles > atomCost
                    ? 'success.light'
                    : ''}>{Math.floor(account?.atoms?.particles)} / {atomCost}</Typography>}>
                  <ItemIcon src={`${prefix}etc/Particle.png`} alt=""/>
                </Tooltip>
                <HtmlTooltip title={atomCost}>
                  <Typography>{notateNumber(atomCost, 'Big')}</Typography>
                </HtmlTooltip></Stack>
              : null}
            <Stack gap={2} justifyContent={'center'}
                   alignItems={'center'}>
              <HtmlTooltip title={cleanUnderscore(updatedName)}>
                <ItemIcon src={`${prefix}data/${itemName}.png`}
                          alt=""/>
              </HtmlTooltip>
              <Typography color={amount >= total
                ? 'success.dark'
                : ''}>{notateNumber(total, 'Big')}</Typography>
            </Stack>
          </Stack>
        })
      }
    </Stack>
    {bubbleMaxBonus ? <>
      <Divider sx={{ my: 1 }}/>
      <Typography
        variant={'body2'}>{`${goalBonus.toFixed(3).replace('.000', '')} is ${notateNumber(effectHardCapPercent)}% of possible hard cap effect of ${bubbleMaxBonus.toFixed(2).replace('.00', '')}`}</Typography>
    </> : null}
  </Box>
}

const BonusIcon = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
`
const ItemIcon = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
`;

const BubbleIcon = styled.img`
  opacity: ${({ level }) => level === 0 ? .5 : 1};
  border-radius: 50%;
`;

const BubbleTooltip = ({ goalBonus, bubbleName, desc }) => {
  return <>
    <Typography fontWeight={'bold'}
                variant={'h6'}>{cleanUnderscore(bubbleName.toLowerCase().capitalizeAll())}</Typography>
    <Divider sx={{ my: 1 }}/>
    <Typography variant={'body1'}>{cleanUnderscore(desc.replace(/{/g, Math.ceil(goalBonus)))}</Typography>
    <Divider sx={{ my: 1 }}/>
  </>;
}

const FutureBubblesTooltip = () => {
  const arr = new Array(15).fill(30).map((bubbleIndex, index) => getMaxCauldron(bubbleIndex + index)).toChunks(5);
  return <Stack gap={2}>
    {arr.map((chunk, index) => {
      return <Stack key={index}>
        <Typography sx={{ fontWeight: 'bold' }}>World {6 + index}</Typography>
        <Stack>
          {chunk.map((i, bIndex) => {
            const currentIndex = 31 + (index * 5) + bIndex;
            return <Typography key={i}>{currentIndex} - {notateNumber(i)}</Typography>
          })}
        </Stack>
      </Stack>
    })}
  </Stack>
}

const Section = ({ title, children }) => {
  return <Stack>
    <Typography color={'text.secondary'} sx={{ mb: 1 }}>{title}</Typography>
    <Stack>
      {children}
    </Stack>
  </Stack>
}

const Dot = () => <Divider
  orientation="vertical"
  flexItem
  sx={{
    border: 'none',              // remove line
    '&::before, &::after': {
      display: 'none'           // remove pseudo-elements
    },
    '&': {
      width: 4,
      height: 4,
      borderRadius: '50%',
      bgcolor: 'text.secondary',
      alignSelf: 'center'
    }
  }}
/>

const UpgradeableBubblesList = ({ bubbles, accumulatedCost, account }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
    {bubbles?.map(({ rawName, bubbleName, level, itemReq, index, cauldron, lithium }, tIndex) => {
      const {
        singleLevelCost,
        total
      } = accumulatedCost(index, level, itemReq?.[0]?.baseCost, itemReq?.[0]?.name?.includes('Liquid'), cauldron);
      const atomCost = singleLevelCost > 1e8 && !itemReq?.[0]?.name?.includes('Liquid') && !itemReq?.[0]?.name?.includes('Bits') && getBubbleAtomCost(index, singleLevelCost);
      return <Card variant={'outlined'} key={`${rawName}-${tIndex}-nblb`}
                   sx={{ overflow: 'visible', width: 75, height: 75, p: 0 }}>
        <CardContent sx={{ position: 'relative' }}>
          {lithium
            ? <HtmlTooltip title={'15% chance to be upgraded by lithium (atom collider)'}>
              <img style={{ position: 'absolute', top: -10, right: -15, width: 30, height: 30 }}
                   src={`${prefix}data/Atom2.png`} alt=""/></HtmlTooltip>
            : null}
          <Stack alignItems={'center'}>
            <HtmlTooltip title={<>
              <Typography sx={{ fontWeight: 'bold' }}>{pascalCase(cleanUnderscore(bubbleName))}</Typography>
              <Stack direction={'row'} justifyContent={'center'} gap={1}>
                {itemReq?.map(({ rawName }, index) => {
                  if (rawName === 'Blank' || rawName === 'ERROR' || rawName.includes('Liquid')) return null;
                  const x1Extension = ['sail', 'bits', 'w6item'];
                  const itemName = x1Extension.find((str) => rawName.toLowerCase().includes(str))
                    ? `${rawName}_x1`
                    : rawName;
                  return <Stack alignItems={'center'} direction={'row'} gap={1} key={'req' + rawName + index}>
                    <Stack alignItems={'center'} justifyContent={'space-between'}>
                      <ItemIcon src={`${prefix}data/${itemName}.png`} alt=""/>
                      <Typography>{notateNumber(total, 'Big')}</Typography>
                    </Stack>
                    {atomCost > 0 ? <Stack alignItems={'center'} justifyContent={'space-between'}>
                      <Stack sx={{ width: 32, height: 32 }} alignItems={'center'} justifyContent={'center'}>
                        <img width={18} height={18}
                             src={`${prefix}etc/Particle.png`} alt=""/>
                      </Stack>
                      <Typography>{atomCost}</Typography>
                    </Stack> : null}
                  </Stack>
                })}
              </Stack>
            </>}>
              <img
                width={32}
                height={32}
                src={`${prefix}data/${rawName}.png`} alt=""/>
            </HtmlTooltip>
            <Stack direction={'row'} alignItems={'center'} gap={.5}>
              {atomCost > 0 ?
                <Tooltip title={<Typography
                  color={account?.atoms?.particles > atomCost
                    ? 'success.light'
                    : ''}>{Math.floor(account?.atoms?.particles)} / {atomCost}</Typography>}>
                  <img width={14} height={14}
                       src={`${prefix}etc/Particle.png`} alt=""/>
                </Tooltip> : null}
              <Typography variant={'body1'}>{level}</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    })}
  </Stack>
}

export default Bubbles;
