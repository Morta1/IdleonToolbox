import React, { useContext } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, kFormatter, prefix, round } from "utility/helpers";
import styled from "@emotion/styled";

const Prayers = () => {
  const { state } = useContext(AppContext);
  const { prayers } = state?.account;
  const calcCost = (prayer) => {
    const { level, costMulti, prayerIndex } = prayer
    if (level < 6) {
      return Math.round(costMulti * (1 + (4 + prayerIndex / 25) * level));
    }
    return Math.round(Math.min(2e9, costMulti * (1 + (1 + prayerIndex / 20) * level) * Math.pow(prayerIndex === 9 ? 1.3 : 1.12, level - 5)))
  }

  const calcCostToMax = (prayer) => {
    let costToMax = 0;
    for (let i = prayer?.level; i < prayer?.maxLevel; i++) {
      costToMax += calcCost({ ...prayer, level: i });
    }
    return costToMax ?? 0;
  }

  return (
    <div>
      <Typography variant={'h2'} mb={3}>Prayers</Typography>
      <Stack direction={'row'} flexWrap={'wrap'} gap={3}>
        {prayers?.map((prayer, index) => {
          const {
            name,
            x1,
            x2,
            level,
            prayerIndex,
            effect,
            curse,
            soul,
            maxLevel,
            totalAmount,
            unlockWave,
            unlockZone
          } = prayer
          const calculatedBonus = x1 + (x1 * (level - 1)) / 10;
          const calculatedCurse = x2 + (x2 * (level - 1)) / 10;
          const cost = calcCost(prayer);
          return <Card key={name + index} sx={{ width: 300, display: 'flex', }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              <Stack direction={'row'} alignItems={'center'} gap={2} mb={2}>
                <Stack alignItems={'center'}>
                  <PrayerIcon src={`${prefix}data/Prayer${prayerIndex}.png`} alt=""/>
                  <Typography fontWeight={'bold'}>Lv.{level}</Typography>
                </Stack>
                <Typography variant={'h6'}>{cleanUnderscore(name)}</Typography>
              </Stack>
              <Stack>
                <div><Typography
                  sx={{ color: 'success.light' }}>Bonus:</Typography> {cleanUnderscore(effect).replace('{', calculatedBonus)}
                </div>
                <div><Typography
                  sx={{ color: 'error.light' }}>Curse:</Typography> {cleanUnderscore(curse).replace('{', calculatedCurse)}
                </div>
              </Stack>
              <Typography mt={1}>Unlock: lv. {unlockWave} at {unlockZone}</Typography>
              <Stack mt={3} direction={'row'} alignItems={'center'} gap={2}>
                <ItemIcon src={`${prefix}data/${soul}.png`} alt=""/>
                {maxLevel === level ? <Typography sx={{ color: 'success.main' }}>MAXED</Typography> : <div>
                  <div>Cost: <Typography component={'span'}
                                         sx={{ color: level === 0 ? '' : cost <= totalAmount ? 'success.light' : 'error.light' }}>
                    {kFormatter(round(cost), 2)}</Typography> ({kFormatter(totalAmount, 2)})
                  </div>
                  <div>Cost To Max: {kFormatter(round(calcCostToMax(prayer)))}</div>
                </div>}
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </div>
  );
};

const PrayerIcon = styled.img`
  width: 36px;
  height: 36px;
`

const ItemIcon = styled.img`
  width: 36px;
  height: 36px;
`

export default Prayers;
