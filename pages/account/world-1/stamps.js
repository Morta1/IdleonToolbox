import { Card, CardContent, Stack, Tab, Tabs, TextField, Typography, useMediaQuery } from "@mui/material";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { cleanUnderscore, getCoinsArray, growth, notateNumber, prefix } from "../../../utility/helpers";
import styled from "@emotion/styled";
import { getSigilBonus, getVialsBonusByEffect } from "../../../parsers/alchemy";
import CoinDisplay from "components/common/CoinDisplay";
import HtmlTooltip from "components/Tooltip";
import debounce from 'lodash.debounce';

const Stamps = () => {
  const { state } = useContext(AppContext);
  const [selectedTab, setSelectedTab] = useState(0);
  const [stamps, setStamps] = useState();
  const [stampsGoals, setStampsGoals] = useState();
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });

  useEffect(() => {
    const stampCategory = Object.keys(state?.account?.stamps)?.[selectedTab];
    setStamps(state?.account?.stamps?.[stampCategory]);
  }, [])

  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
    const stampCategory = Object.keys(state?.account?.stamps)?.[selected];
    setStamps(state?.account?.stamps?.[stampCategory]);
  }

  const getAccumulatedCost = (index, level, type, stamp) => {
    const levelDiff = stampsGoals?.[index] - level;
    const costFunc = type === 'gold' ? calculateGoldCost : calculateMaterialCost;
    if (levelDiff <= 0) {
      const cost = costFunc(level, stamp);
      return type === 'material' ? Math.floor(cost) : cost;
    }
    const array = Array(levelDiff || 0).fill(1).map((_, ind) => ind + 1);
    const totalCost = array.reduce((res, levelInd) => {
        if ((type === 'material' && (level + (levelInd)) % stamp?.reqItemMultiplicationLevel === 0) || type === 'gold') {
          const cost = costFunc(level + (levelInd), stamp);
          return res + cost;
        }
        return res;
      },
      costFunc(level, stamp)
    );
    return type === 'material' ? Math.floor(totalCost) : totalCost;
  };

  const accumulatedCost = useCallback((index, level, type, stamp) => getAccumulatedCost(index, level, type, stamp), [stampsGoals]);

  const calculateMaterialCost = (level, { reqItemMultiplicationLevel, baseMatCost, powMatBase }) => {
    const reductionVal = getVialsBonusByEffect(state?.account?.alchemy?.vials, 'material_cost_for_stamps');
    const sigilBonus = getSigilBonus(state?.account?.alchemy?.p2w?.sigils, 'ENVELOPE_PILE');
    const sigilReduction = (1 / (1 + sigilBonus / 100)) ?? 1;
    return (baseMatCost * sigilReduction * Math.pow(powMatBase, Math.pow(Math.round(level / reqItemMultiplicationLevel) - 1, 0.8))) * Math.max(0.1, 1 - (reductionVal / 100)) || 0;
  }

  const calculateGoldCost = (level, { reqItemMultiplicationLevel, baseCoinCost, powCoinBase }) => {
    const reductionVal = getVialsBonusByEffect(state?.account?.alchemy?.vials, 'material_cost_for_stamps');
    const reductionBribe = state?.account?.bribes?.[0];
    const realBaseCost = reductionBribe?.done ? baseCoinCost * (1 - (reductionBribe?.value / 100)) : baseCoinCost;
    const cost = (realBaseCost * Math.pow(powCoinBase - (level / (level + 5 * reqItemMultiplicationLevel)) * 0.25, level * (10 / reqItemMultiplicationLevel))) * Math.max(0.1, 1 - (reductionVal / 100));
    return Math.floor(cost);
  }

  const handleGoalChange = debounce((e, index) => {
    const { value } = e.target;
    setStampsGoals({ ...stampsGoals, [index]: !value ? 0 : parseInt(value) });
  }, 100);

  return (
    <div>
      <Typography variant={'h2'} textAlign={'center'} mb={3}>Stamps</Typography>
      <Tabs centered
            sx={{ marginBottom: 3 }}
            variant={isMd ? 'fullWidth' : 'standard'}
            value={selectedTab} onChange={handleOnClick}>
        {Object.keys(state?.account?.stamps)?.map((tab, index) => {
          return <Tab label={tab} key={`${tab}-${index}`}/>;
        })}
      </Tabs>
      <Stack direction={'row'} flexWrap={'wrap'} justifyContent={'center'} gap={3}>
        {stamps?.map((stamp, index) => {
          const {
            displayName, rawName, level, itemReq, multiplier = 1, func, x1, x2,
            reqItemMultiplicationLevel
          } = stamp;
          const goalLevel = stampsGoals?.[index] ? stampsGoals?.[index] < level ? level : stampsGoals?.[index] : level;
          const goalBonus = growth(func, goalLevel, x1, x2, true) * multiplier;
          // if (index !== 36) return;
          return <React.Fragment key={rawName + '' + displayName + '' + index}>
            <Card sx={{ width: 230 }}>
              <CardContent sx={{ '&:last-child': { paddingBottom: 4 } }}>
                <Stack direction={'row'} alignItems={'center'} justifyContent={'space-around'} gap={2}>
                  <Stack alignItems={'center'}>
                    <HtmlTooltip title={<StampTooltip {...{ ...stamp, goalLevel, goalBonus }}/>}>
                      <StampIcon width={48} height={48}
                                 level={level}
                                 src={`${prefix}data/${rawName}.png`}
                                 alt=""/>
                    </HtmlTooltip>
                    <Typography variant={'body1'}>Lv. {level}</Typography>
                  </Stack>
                  <TextField type={'number'}
                             sx={{ width: 90 }}
                             defaultValue={goalLevel}
                             onChange={(e) => handleGoalChange(e, index)}
                             label={'Goal'} variant={'outlined'} inputProps={{ min: level || 0 }}/>
                </Stack>
                {itemReq?.map(({ rawName, name }, itemIndex) => {
                  const materialCost = accumulatedCost(index, level, 'material', stamp);
                  const goldCost = accumulatedCost(index, level, 'gold', stamp);
                  const isMaterialCost = goalLevel % reqItemMultiplicationLevel === 0;
                  return <Stack gap={1} mt={2} key={`${rawName}-${name}-${itemIndex}`}>
                    <Stack gap={2} justifyContent={'center'}
                           direction={'row'} alignItems={'center'}>
                      <BonusIcon src={`${prefix}data/SignStar3b.png`} alt=""/>
                      <Typography>{isNaN(goalBonus) ? 0 : goalBonus}</Typography>
                      <ItemIcon hide={!materialCost || !isMaterialCost} src={`${prefix}data/${rawName}.png`}
                                alt=""/>
                      {materialCost ? notateNumber(materialCost, 'Big') : null}
                    </Stack>
                    <CoinDisplay title={''}
                                 money={getCoinsArray(goldCost)}/>
                  </Stack>
                })}
              </CardContent>
            </Card>
          </React.Fragment>
        })}
      </Stack>
    </div>
  );
};
const BonusIcon = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
`
const StampTooltip = ({ func, level, goalLevel, x1, x2, displayName, effect, multiplier = 1, goalBonus }) => {
  const bonus = growth(func, level, x1, x2, true) * multiplier;
  return <>
    <Typography variant={'h5'}>{cleanUnderscore(displayName)}</Typography>
    <Typography sx={{ color: level > 0 && multiplier > 1 ? 'multi' : '' }}
                variant={'body1'}>+{cleanUnderscore(effect.replace(/{}/, bonus))}</Typography>
    {level !== goalLevel ? <Typography sx={{ color: level > 0 && multiplier > 1 ? 'multi' : '' }}
                                       variant={'body1'}>Goal:
      +{cleanUnderscore(effect.replace(/{}/, goalBonus))}</Typography> : null}
  </>
}

const StampIcon = styled.img`
  opacity: ${({ level }) => level === 0 ? .5 : 1};
`;

const ItemIcon = styled.img`
  width: 32px;
  height: 32px;
  opacity: ${({hide}) => hide ? 0.5 : 1};
`;

export default Stamps;
