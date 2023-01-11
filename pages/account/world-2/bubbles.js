import {
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "components/common/context/AppProvider";
import styled from "@emotion/styled";
import { cleanUnderscore, growth, notateNumber, pascalCase, prefix } from "utility/helpers";
import Tooltip from "components/Tooltip";
import debounce from "lodash.debounce";
import { isArtifactAcquired } from "../../../parsers/sailing";

const Bubbles = () => {
  const { state } = useContext(AppContext);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const [classDiscount, setClassDiscount] = useState(false);
  const [bargainTag, setBargainTag] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [bubbles, setBubbles] = useState();
  const [bubblesGoals, setBubblesGoals] = useState();
  const myFirstChemSet = useMemo(() => state?.account?.lab?.labBonuses?.find(bonus => bonus.name === "My_1st_Chemistry_Set")?.active, [state?.account?.lab.vials]);

  useEffect(() => {
    const bubblesPage = Object.keys(state?.account?.alchemy?.bubbles)?.[selectedTab];
    setBubbles(state?.account?.alchemy?.bubbles?.[bubblesPage]);
  }, []);


  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
    const bubblesPage = Object.keys(state?.account?.alchemy?.bubbles)?.[selected];
    setBubbles(state?.account?.alchemy?.bubbles?.[bubblesPage]);
    if (selected === 3) {
      setClassDiscount(false);
    }
  }

  const handleBargainChange = (e) => {
    setBargainTag(e?.target?.value)
  }

  const handleGoalChange = debounce((e, index) => {
    const { value } = e.target;
    setBubblesGoals({ ...bubblesGoals, [index]: !value ? 0 : parseInt(value) });
  }, 100);

  const calcBubbleMatCost = (bubbleIndex, vialMultiplier = 1, bubbleLvl, baseCost, isLiquid, cauldronCostLvl,
                             undevelopedBubbleLv, barleyBrewLvl, lastBubbleLvl, classMultiplierLvl,
                             shopBargainBought, smrtAchievement, multiBubble) => {
    if (isLiquid) {
      return baseCost + Math.floor(bubbleLvl / 20);
    } else {
      const first = bubbleIndex < 14 ?
        baseCost * Math.pow(1.35 - (0.3 * bubbleLvl) / (50 + bubbleLvl), bubbleLvl) :
        baseCost * Math.pow(1.37 - (0.28 * bubbleLvl) / (60 + bubbleLvl), bubbleLvl);
      const cauldronCostReduxBoost = Math.max(0.1, 1 - ((Math.round(10 * growth("decay", cauldronCostLvl, 90, 100, false)) / 10)) / 100);
      const bubbleCostBubbleBoost = Math.max(0.05, 1 - (growth("decay", undevelopedBubbleLv, 40, 70, false) + (growth("add", barleyBrewLvl, 1, 0, false) * vialMultiplier)) / 100);
      const bubbleBargainBoost = Math.max(0.05, 1 - (growth("decay", lastBubbleLvl, 40, 12, false) / 100) *
        growth("decayMulti", classMultiplierLvl, 2, 50, false) *
        growth("decayMulti", multiBubble, 1.4, 30, false));
      const shopBargainBoost = Math.max(0.1, Math.pow(0.75, shopBargainBought));
      const smrtBoost = smrtAchievement ? 0.9 : 1;
      return Math.round(first * cauldronCostReduxBoost * bubbleBargainBoost * bubbleCostBubbleBoost * shopBargainBoost * smrtBoost);
    }
  };

  const calculateMaterialCost = (bubbleLv, baseCost, isLiquid, cauldronName, bubbleIndex) => {
    const cauldronCostLvl = state?.account?.alchemy?.cauldrons?.[cauldronName]?.boosts?.cost?.level || 0;
    const undevelopedBubbleLv = state?.account?.alchemy?.bubbles?.kazam?.[6].level || 0;
    const barleyBrewLvl = state?.account?.alchemy?.vials?.[9]?.level || 0;
    const multiBubble = cauldronName !== 'kazam' ? state?.account?.alchemy?.bubbles?.[cauldronName]?.[16]?.level || 0 : 0;
    const lastBubbleLvl = state?.account?.alchemy?.bubbles?.[cauldronName]?.[14]?.level || 0;
    const classMultiplierLvl = classDiscount ? (state?.account?.alchemy?.bubbles?.[cauldronName]?.[1]?.level || 0) : 0;
    const shopBargainBought = bargainTag || 0;
    const smrtAchievement = state?.account?.achievements[108].completed;
    return calcBubbleMatCost(bubbleIndex, myFirstChemSet ? 2 : 1, bubbleLv, baseCost, isLiquid, cauldronCostLvl,
      undevelopedBubbleLv, barleyBrewLvl, lastBubbleLvl, classMultiplierLvl,
      shopBargainBought, smrtAchievement, multiBubble);
  }

  const getAccumulatedBubbleCost = (index, level, baseCost, isLiquid, cauldronName) => {
    const levelDiff = bubblesGoals?.[index] - level;
    if (levelDiff <= 0) {
      return calculateMaterialCost(level, baseCost, isLiquid, cauldronName, index);
    }
    const array = new Array(levelDiff || 0).fill(1);
    return array.reduce((res, _, levelInd) => {
        const cost = calculateMaterialCost(level + (levelInd === 0 ? 1 : levelInd), baseCost, isLiquid, cauldronName, index);
        return res + cost;
      },
      calculateMaterialCost(level, baseCost, isLiquid, cauldronName, index)
    );
  }

  const accumulatedCost = useCallback((index, level, baseCost, isLiquid, cauldronName) => getAccumulatedBubbleCost(index, level, baseCost, isLiquid, cauldronName), [bubblesGoals,
    bargainTag, classDiscount]);

  const getUpgradeableBubbles = (acc) => {
    let upgradeableBubblesAmount = 3;
    const noBubbleLeftBehind = acc?.lab?.labBonuses?.find((bonus) => bonus.name === 'No_Bubble_Left_Behind')?.active;
    if (!noBubbleLeftBehind) return null;
    const allBubbles = Object.values(acc?.alchemy?.bubbles).flatMap((bubbles, index) => {
      return bubbles.map((bubble, bubbleIndex) => {
        return { ...bubble, tab: index, flatIndex: 1e3 * index + bubbleIndex }
      });
    });
    const found = allBubbles.filter(({ level, index }) => level >= 5 && index < 15).sort((a, b) => a.level - b.level);
    const sorted = found.sort((a, b) => b.flatIndex - a.flatIndex).sort((a, b) => a.level - b.level);
    if (acc?.lab?.jewels?.find(jewel => jewel.name === "Pyrite_Rhinestone")?.active) {
      upgradeableBubblesAmount++;
    }
    const amberiteArtifact = isArtifactAcquired(acc?.sailing?.artifacts, 'Amberite');
    if (amberiteArtifact) {
      upgradeableBubblesAmount += amberiteArtifact?.acquired === 2 ? amberiteArtifact?.baseBonus * 2 : amberiteArtifact?.baseBonus;
    }
    return sorted.slice(0, upgradeableBubblesAmount);
  }
  const upgradeableBubbles = useMemo(() => getUpgradeableBubbles(state?.account), [state?.account]);

  const calculateBargainTag = () => {
    return parseFloat((25 * (Math.pow(0.75, bargainTag) - 1) / (0.75 - 1)).toFixed(1));
  }
  return (
    <>
      <Typography variant={'h2'} textAlign={'center'} mb={3}>Bubbles</Typography>
      <Stack justifyContent={'center'} alignItems={'center'}>
        <Typography>Next Bubble Upgrades:</Typography>
        <Stack direction={'row'}>
          {upgradeableBubbles?.map(({ rawName, bubbleName, level }, index) => {
            return <Stack alignItems={'center'} key={`${rawName}-${index}`}>
              <Tooltip title={pascalCase(cleanUnderscore(bubbleName))}>
                <img src={`${prefix}data/${rawName}.png`} alt=""/>
              </Tooltip>
              <Typography variant={'body1'}>{level}</Typography>
            </Stack>
          })}
        </Stack>
      </Stack>
      <Stack direction={'row'} justifyContent={'center'} mt={2}>
        {Object.keys(state?.account?.alchemy?.bubbles)?.[selectedTab] !== 'kazam' ?
          <FormControlLabel
            control={<Checkbox checked={classDiscount} onChange={() => setClassDiscount(!classDiscount)}/>}
            name={'classDiscount'}
            label="Class Discount (II)"/> : null}
        <TextField value={bargainTag}
                   type={'number'}
                   inputProps={{ min: 0, max: 8 }}
                   onChange={(e) => handleBargainChange(e)}
                   helperText={`${calculateBargainTag()}%`}
                   InputProps={{
                     startAdornment: <InputAdornment position="start">
                       <img width={36} height={36}
                            src={`${prefix}data/aShopItems10.png`} alt=""/>
                     </InputAdornment>
                   }}/>
      </Stack>
      <Tabs centered
            sx={{ marginBottom: 3, marginTop: 1 }}
            variant={isMd ? 'fullWidth' : 'standard'}
            value={selectedTab} onChange={handleOnClick}>
        {Object.keys(state?.account?.alchemy?.bubbles)?.map((tab, index) => {
          return <Tab label={tab} key={`${tab}-${index}`}/>;
        })}
      </Tabs>
      <Stack direction={'row'} flexWrap={'wrap'} gap={3} justifyContent={'center'}>
        {bubbles?.map((bubble, index) => {
          if (index > 24) return null;
          const { level, itemReq, rawName, bubbleName, func, x1, x2 } = bubble;
          const goalLevel = bubblesGoals?.[index] ? bubblesGoals?.[index] < level ? level : bubblesGoals?.[index] : level;
          const goalBonus = growth(func, goalLevel, x1, x2, true);
          return <React.Fragment key={rawName + '' + bubbleName + '' + index}>
            <Card sx={{ width: 330 }}>
              <CardContent>
                <Stack direction={'row'} alignItems={'center'} justifyContent={'space-around'} gap={2}>
                  <Stack alignItems={'center'}>
                    <Tooltip title={<BubbleTooltip {...{ ...bubble, goalLevel }}/>}>
                      <BubbleIcon width={48} height={48}
                                  level={level}
                                  src={`${prefix}data/${rawName}.png`}
                                  alt=""/>
                    </Tooltip>
                    <Typography variant={'body1'}>Lv. {level}</Typography>
                  </Stack>
                  <TextField type={'number'}
                             sx={{ width: 90 }}
                             defaultValue={goalLevel}
                             onChange={(e) => handleGoalChange(e, index)}
                             label={'Goal'} variant={'outlined'} inputProps={{ min: level || 0 }}/>
                </Stack>
                <Stack mt={1.5} direction={'row'} justifyContent={'center'} gap={3} flexWrap={'wrap'}>
                  <Stack gap={2} justifyContent={'center'}
                         alignItems={'center'}>
                    <Tooltip title={"Bubble's effect"}>
                      <BonusIcon src={`${prefix}data/SignStar3b.png`} alt=""/>
                    </Tooltip>
                    <Typography>{goalBonus}</Typography>

                  </Stack>
                  {itemReq?.map(({ rawName, name, baseCost }, itemIndex) => {
                    if (rawName === 'Blank' || rawName === 'ERROR') return null;
                    const cauldronName = Object.keys(state?.account?.alchemy?.bubbles)?.[selectedTab];
                    const cost = accumulatedCost(index, level, baseCost, name?.includes('Liquid'), cauldronName);
                    const x1Extension = ['sail', 'bits'];
                    const itemName = x1Extension.find((str) => rawName.toLowerCase().includes(str)) ? `${rawName}_x1` : rawName;
                    return <Stack direction={'row'} key={`${rawName}-${name}-${itemIndex}`}>
                      <Stack gap={2} justifyContent={'center'}
                             alignItems={'center'}>
                        <Tooltip title={cleanUnderscore(name)}>
                          <ItemIcon src={`${prefix}data/${itemName}.png`}
                                    alt=""/>
                        </Tooltip>
                        <Tooltip title={cost}>
                          <Typography>{notateNumber(cost, 'Big')}</Typography>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  })}
                </Stack>
              </CardContent>
            </Card>
          </React.Fragment>
        })}
      </Stack>
    </>
  );
};

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
    <Typography fontWeight={'bold'} variant={'h6'}>{cleanUnderscore(bubbleName)}</Typography>
    <Typography variant={'body1'}>{cleanUnderscore(desc.replace(/{/, bonus))}</Typography>
    {level !== goalLevel ? <Typography sx={{ color: level > 0 ? 'multi' : '' }}
                                       variant={'body1'}>Goal:
      +{goalBonus}</Typography> : null}
  </>
}


export default Bubbles;
