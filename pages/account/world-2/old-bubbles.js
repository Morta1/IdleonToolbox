import {
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import styled from '@emotion/styled';
import { cleanUnderscore, growth, notateNumber, pascalCase, prefix } from 'utility/helpers';
import HtmlTooltip from 'components/Tooltip';
import debounce from 'lodash.debounce';
import { NextSeo } from 'next-seo';
import {
  getBubbleAtomCost,
  getBubbleBonus,
  getMaxCauldron,
  getUpgradeableBubbles,
  getVialsBonusByStat,
  isPrismaBubble
} from '@parsers/alchemy';
import Box from '@mui/material/Box';
import Tabber from '../../../components/common/Tabber';
import { CardTitleAndValue } from '@components/common/styles';
import InfoIcon from '@mui/icons-material/Info';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import Link from '@mui/material/Link';
import { useRouter } from 'next/router';
import MenuItem from '@mui/material/MenuItem';
import { getArcadeBonus } from '@parsers/arcade';
import { getTesseractBonus } from '@parsers/tesseract';

const bargainOptions = [0, 25, 43.75, 57.81, 68.36, 76.27, 82.20, 86.65, 90];
const Bubbles = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const [classDiscount, setClassDiscount] = useState(false);
  const [condenseView, setCondenseView] = useState(false);
  const [bargainTag, setBargainTag] = useState('0');
  const [effThreshold, setEffThreshold] = useState(75);
  const [selectedTab, setSelectedTab] = useState(0);
  const [hidePastThreshold, setHidePastThreshold] = useState(false);
  const [bubbles, setBubbles] = useState();
  const [bubblesGoals, setBubblesGoals] = useState();
  const myFirstChemSet = useMemo(() => state?.account?.lab?.labBonuses?.find(bonus => bonus.name === 'My_1st_Chemistry_Set')?.active, [state?.account?.lab.vials]);

  useEffect(() => {
    const fromStorage = localStorage.getItem('effThreshold');
    if (fromStorage) {
      setEffThreshold(parseInt(fromStorage));
    }
    const bubblesPage = Object.keys(state?.account?.alchemy?.bubbles)?.[selectedTab];
    setBubbles(state?.account?.alchemy?.bubbles?.[bubblesPage]);
  }, []);

  const handleOnClick = (selected) => {
    setSelectedTab(selected);
    const bubblesPage = Object.keys(state?.account?.alchemy?.bubbles)?.[selected];
    setBubbles(state?.account?.alchemy?.bubbles?.[bubblesPage]);
    if (selected === 3) {
      setClassDiscount(false);
    }
  }

  const handleGoalChange = debounce((e, cauldronName, index) => {
    const { value } = e.target;
    setBubblesGoals({
      ...bubblesGoals,
      [cauldronName]: {
        ...(bubblesGoals?.[cauldronName] || {}),
        [index]: !value ? 0 : parseInt(value)
      }
    });
  }, 100);

  const calcBubbleMatCost = (bubbleIndex, vialMultiplier = 1, bubbleLvl, baseCost, isLiquid, cauldronCostLvl,
                             undevelopedBubbleLv, barleyBrewLvl, lastBubbleLvl, classMultiplierLvl,
                             shopBargainBought, smrtAchievement, multiBubble) => {
    if (isLiquid) {
      return baseCost + Math.floor(bubbleLvl / 20);
    } else {
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

  return (
    <>
      <NextSeo
        title="Bubbles | Idleon Toolbox"
        description="Keep track of your bubbles level and requirements with a handy calculator"
      />
      <Box sx={{ width: 'fit-content', margin: '24px auto' }}>
        <Nblb title={'Next bubble upgrades'} bubbles={upgradeableBubbles?.normal} accumulatedCost={accumulatedCost}
              account={state?.account}/>
        <Divider sx={{ my: 2 }}/>
        <Nblb lithium bubbles={upgradeableBubbles?.atomBubbles} accumulatedCost={accumulatedCost}
              account={state?.account}/>
      </Box>
      <Stack direction={'row'} justifyContent={'center'} mt={2} gap={2} flexWrap={'wrap'}>
        <CardTitleAndValue cardSx={{ height: 'fit-content' }} title={'Efficiency Threshold'} stackProps>
          <FormControlLabel
            control={<Checkbox sx={{ my: 0 }} size={'small'} checked={hidePastThreshold}
                               onChange={() => setHidePastThreshold(!hidePastThreshold)}/>}
            name={'classDiscount'}
            label="Hide past threshold"/>
          <TextField sx={{ width: 150 }}
                     label={''}
                     value={effThreshold}
                     type={'number'}
                     inputProps={{ min: 0, max: 100 }}
                     onChange={({ target }) => {
                       localStorage.setItem('effThreshold', target.value);
                       setEffThreshold(target.value)
                     }}
          />
        </CardTitleAndValue>
        <CardTitleAndValue cardSx={{ height: 'fit-content' }} title={''} stackProps>
          <FormControl>
            <InputLabel id="bargain-tag-select-input">Bargain Tag</InputLabel>
            <Select
              labelId="bargain-tag-select"
              id="bargain-tag-select"
              value={bargainTag}
              label="Bargain Tag"
              onChange={(e) => setBargainTag(e.target.value)}
            >
              {bargainOptions.map((value, index) => <MenuItem key={'option' + value} value={index}>{value}%</MenuItem>)}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox checked={condenseView} onChange={() => setCondenseView(!condenseView)}/>}
            name={'Condense view'}
            label="Condense view"/>
          {Object.keys(state?.account?.alchemy?.bubbles)?.[selectedTab] !== 'kazam' ?
            <FormControlLabel
              control={<Checkbox checked={classDiscount} onChange={() => setClassDiscount(!classDiscount)}/>}
              name={'classDiscount'}
              label="Class Discount"/> : null}
        </CardTitleAndValue>
        <CardTitleAndValue cardSx={{ height: 'fit-content' }} title={'Misc'} stackProps={{ gap: 1 }}>
          <Link underline={'hover'}
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push({ pathname: 'bubbles' })}>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <ArrowRightAltIcon/>
              <Typography>New Bubbles Page</Typography>
            </Stack>
          </Link>
          <Typography>Particle Upgrades: {state?.account?.accountOptions?.[135] || '0'}</Typography>
          <Stack direction={'row'} gap={1}>
            <Typography>Future Bubbles</Typography>
            {bubbles?.length}
            <HtmlTooltip title={<FutureBubblesTooltip/>}>
              <InfoIcon/>
            </HtmlTooltip>
          </Stack>
        </CardTitleAndValue>
      </Stack>
      <Tabber tabs={Object.keys(state?.account?.alchemy?.bubbles)} onTabChange={handleOnClick}>
        <Stack direction={'row'} flexWrap={'wrap'} gap={3} justifyContent={'center'}>
          {bubbles?.map((bubble, index) => {
            if (index > 29) return null;
            const { level, itemReq, rawName, bubbleName, func, x1, x2, cauldron, bubbleIndex } = bubble;
            const isPrisma = isPrismaBubble(state?.account, bubbleIndex);
            const goalLevel = bubblesGoals?.[cauldron]?.[index] ? bubblesGoals?.[cauldron]?.[index] < level
              ? level
              : bubblesGoals?.[cauldron]?.[index] : level;
            const arcadeBonus = getArcadeBonus(state?.account?.arcade?.shop, 'Prisma_Bonuses')?.bonus;
            const tesseractBonus = getTesseractBonus(state?.account, 45)
            const prismaMulti = isPrisma
              ? Math.min(3, 2 + (tesseractBonus + arcadeBonus) / 100)
              : 1;
            const goalBonus = Math.floor(growth(func, goalLevel, x1, x2, true) * (isPrisma ? prismaMulti : 1));
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
            if ((!bubbleMaxBonus || thresholdObj?.thresholdMissingLevels <= 0) && hidePastThreshold) return null;
            return <React.Fragment key={rawName + '' + bubbleName + '' + index}>
              <Card sx={{
                width: condenseView ? 100 : 330,
                border: bubbleMaxBonus && ((effectHardCapPercent >= effThreshold) || (thresholdObj?.thresholdMissingLevels > 0))
                  ? '1px solid'
                  : '',
                borderColor: effectHardCapPercent >= effThreshold ? 'info.light' : 'error.main'
              }}>
                <CardContent>
                  <Stack direction={'row'} alignItems={'center'} justifyContent={'space-around'} gap={2}>
                    <Stack alignItems={'center'}>
                      <HtmlTooltip
                        dark={condenseView}
                        title={condenseView ? <AdditionalInfo tooltip bubbleMaxBonus={bubbleMaxBonus}
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
                                                              goalLevel={goalLevel}/> :
                          <BubbleTooltip {...{ ...bubble, goalLevel }}/>}>
                        {isPrisma ? <img style={{ position: 'absolute', width: 48, height: 48 }}
                                         src={`${prefix}data/aUpgradesGlow${selectedTab}.png`}/> : null}
                        <BubbleIcon width={48} height={48}
                                    level={level}
                                    src={`${prefix}data/${rawName}.png`}
                                    alt=""/>
                      </HtmlTooltip>
                      <Stack alignItems={'center'} justifyContent={'center'}>
                        <Typography
                          variant={'caption'}>Lv. {level}</Typography>
                        {!condenseView
                          ? <Typography variant={'caption'}>{cleanUnderscore(bubbleName)}</Typography>
                          : null}
                      </Stack>
                    </Stack>
                    {!condenseView
                      ? <TextField type={'number'}
                                   sx={{ width: 90 }}
                                   defaultValue={goalLevel}
                                   onChange={(e) => handleGoalChange(e, cauldron, index)}
                                   label={'Goal'} variant={'outlined'} inputProps={{ min: level || 0 }}/>
                      : null}
                  </Stack>
                  {!condenseView ? <AdditionalInfo bubbleMaxBonus={bubbleMaxBonus}
                                                   goalBonus={goalBonus}
                                                   cauldron={cauldron}
                                                   thresholdObj={thresholdObj}
                                                   effectHardCapPercent={effectHardCapPercent}
                                                   itemReq={itemReq}
                                                   accumulatedCost={accumulatedCost}
                                                   account={state?.account}
                                                   level={level}
                                                   index={index}
                  /> : null}
                </CardContent>
              </Card>
            </React.Fragment>
          })}
        </Stack>
      </Tabber>
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
                          goalLevel
                        }) => {
  return <Stack mt={1.5} direction={'row'} justifyContent={'center'} gap={3}
                flexWrap={'wrap'}>
    {tooltip ? <BubbleTooltip {...{
      ...bubble,
      goalLevel
    }}/> : null}
    <Stack gap={bubbleMaxBonus && thresholdObj?.thresholdMissingLevels > 0 ? 0 : 2} justifyContent={'center'}
           alignItems={'center'}>
      <HtmlTooltip title={'Bubble\'s effect'}>
        <BonusIcon src={`${prefix}data/SignStar3b.png`} alt=""/>
      </HtmlTooltip>
      <HtmlTooltip
        title={bubbleMaxBonus
          ? `${goalBonus} is ${notateNumber(effectHardCapPercent)}% of possible hard cap effect of ${bubbleMaxBonus}`
          : ''}>
        <Typography variant={bubbleMaxBonus && thresholdObj?.thresholdMissingLevels > 0
          ? 'caption'
          : ''}>{goalBonus} {bubbleMaxBonus
          ? `(${notateNumber(effectHardCapPercent)}%)`
          : ''}</Typography>
      </HtmlTooltip>
      {bubbleMaxBonus && thresholdObj?.thresholdMissingLevels > 0 ? <HtmlTooltip
        title={bubbleMaxBonus
          ? `You need ${thresholdObj?.thresholdMissingLevels} levels to reach your threshold`
          : ''}>
        <Typography variant={'caption'}>Missing {thresholdObj?.thresholdMissingLevels} levels</Typography>
      </HtmlTooltip> : null}
    </Stack>
    {
      itemReq?.map(({ rawName, name, baseCost }, itemIndex) => {
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
        } else if (rawName.includes('Bits')) {
          amount = account?.gaming?.bits;
        } else if (rawName.includes('Sail')) {
          amount = account?.sailing?.lootPile?.find(({ rawName: lootPileName }) => lootPileName === rawName.replace('SailTr', 'SailT'))?.amount;
        } else if (rawName.includes('W6item')) {
          const crops = { 'W6item1': 4, 'W6item2': 30, 'W6item3': 46, 'W6item4': 72, 'W6item5': 99 };
          const essences = { 'W6item6': 0, 'W6item7': 1, 'W6item8': 2, 'W6item9': 3, 'W6item10': 4 };
          if (crops?.[rawName]) {
            amount = account?.farming?.crop?.[crops?.[rawName]];
          } else if (essences?.hasOwnProperty(rawName)) {
            amount = account?.summoning?.essences?.[essences?.[rawName]];
          }
        } else {
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
            <HtmlTooltip title={cleanUnderscore(name)}>
              <ItemIcon src={`${prefix}data/${itemName}.png`}
                        alt=""/>
            </HtmlTooltip>
            <Tooltip
              title={<Typography color={amount >= total
                ? 'success.light'
                : ''}>{notateNumber(amount, 'Big')} / {notateNumber(total, 'Big')}</Typography>}>
              <Typography>{notateNumber(total, 'Big')}</Typography>
            </Tooltip>
          </Stack>
        </Stack>
      })
    }
  </Stack>
}

const Nblb = ({ title, bubbles, lithium, accumulatedCost, account }) => {
  return <Stack justifyContent={'center'} alignItems={'center'}>
    <Typography>{title}</Typography>
    {lithium ? <Typography variant={'caption'}>* 15% chance to be upgraded by lithium (atom
      collider)</Typography> : null}
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {bubbles?.map(({ rawName, bubbleName, level, itemReq, index, cauldron }, tIndex) => {
        const {
          singleLevelCost,
          total
        } = accumulatedCost(index, level, itemReq?.[0]?.baseCost, itemReq?.[0]?.name?.includes('Liquid'), cauldron);
        const atomCost = singleLevelCost > 1e8 && !itemReq?.[0]?.name?.includes('Liquid') && !itemReq?.[0]?.name?.includes('Bits') && getBubbleAtomCost(index, singleLevelCost);
        return <Stack alignItems={'center'} key={`${rawName}-${tIndex}-${lithium}-nblb`}>
          <HtmlTooltip title={<>
            <Typography sx={{ fontWeight: 'bold' }}>{pascalCase(cleanUnderscore(bubbleName))}</Typography>
            <Stack direction={'row'} justifyContent={'center'} gap={1}>
              {itemReq?.map(({ rawName }, index) => {
                if (rawName === 'Blank' || rawName === 'ERROR' || rawName.includes('Liquid')) return null;
                const x1Extension = ['sail', 'bits'];
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
              style={{ opacity: lithium ? 0.8 : 1 }}
              width={42}
              height={42}
              src={`${prefix}data/${rawName}.png`} alt=""/>
          </HtmlTooltip>
          <Stack direction={'row'} alignItems={'center'} gap={.5}>
            {atomCost > 0 ?
              <Tooltip title={<Typography
                color={account?.atoms?.particles > atomCost
                  ? 'success.light'
                  : ''}>{Math.floor(account?.atoms?.particles)} / {atomCost}</Typography>}>
                <img width={18} height={18}
                     src={`${prefix}etc/Particle.png`} alt=""/>
              </Tooltip> : null}
            <Typography variant={'body1'}>{level}</Typography>
          </Stack>
        </Stack>
      })}
    </Stack>
  </Stack>
}

const BonusIcon = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
`
const ItemIcon = styled.img`
  width: 32px;
  height: 32px;
`;

const BubbleIcon = styled.img`
  opacity: ${({ level }) => level === 0 ? .5 : 1};
`;

const BubbleTooltip = ({ goalLevel, bubbleName, desc, func, x1, x2, level }) => {
  const bonus = growth(func, level, x1, x2, true);
  const goalBonus = growth(func, goalLevel, x1, x2, true);
  return <>
    <Typography fontWeight={'bold'}
                variant={'h6'}>{cleanUnderscore(bubbleName.toLowerCase().capitalizeAll())}</Typography>
    <Divider sx={{ my: 1 }}/>
    <Typography variant={'body1'}>{cleanUnderscore(desc.replace(/{/, bonus))}</Typography>
    {level !== goalLevel ? <Typography sx={{ color: level > 0 ? 'multi' : '' }}
                                       variant={'body1'}>Goal:
      +{goalBonus}</Typography> : null}
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

export default Bubbles;
