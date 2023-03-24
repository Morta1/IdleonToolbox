import React, { useContext, useMemo } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import { getBuildCost } from "../../../parsers/construction";
import { NextSeo } from "next-seo";

const Towers = () => {
  const { state } = useContext(AppContext);

  const costCruncher = useMemo(() => state?.account?.towers?.data?.find((tower) => tower.index === 5), [state]);


  const getMaterialCosts = (itemReq, level, maxLevel, bonusInc, costCruncher) => {
    return itemReq.map(({ rawName, name, amount }) => {
      const math1 = Math.min(0.1, 0.1 * Math.floor((costCruncher.level + 999) / 1000));
      const math2 = Math.max(0, costCruncher.level - 1);
      const costReduction = Math.max(0.2, 1 - (math1 + (math2 * costCruncher.costInc[0]) / 100))
      if (rawName.includes("Refinery")) {
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

  return <>
    <NextSeo
      title="Idleon Toolbox | Towers"
      description="Keep track of your towers levels, bonuses and required materials for upgrades"
    />
    <Typography variant={'h2'} mb={3}>Towers</Typography>
    <Stack direction={'row'} flexWrap={'wrap'} gap={3}>
      {state?.account?.towers?.data?.map((tower, index) => {
        let { name, progress, level, maxLevel, bonusInc, itemReq, inProgress } = tower;
        const items = getMaterialCosts(itemReq, level, maxLevel, bonusInc, costCruncher);
        const buildCost = getBuildCost(state?.account?.towers, level, bonusInc, tower?.index);
        if (tower?.index >= 9 && tower?.index <= 17) {
          const atom = state?.account?.atoms?.atoms?.find(({ name }) => name === 'Carbon_-_Wizard_Maximizer');
          const atomBonus = (atom?.level * atom?.baseBonus) ?? 0;
          maxLevel += atomBonus;
        }
        return <Card key={`${name}-${index}`} sx={{
          border: inProgress ? '1px solid' : '',
          borderColor: inProgress ? progress < buildCost ? 'success.light' : 'warning.light' : '',
          width: { xs: '100%', md: 450 },
          height: { md: 160 }
        }}>
          <CardContent>
            <Stack direction={'row'} sx={{ gap: { xs: 2, sm: 3 } }} flexWrap={'wrap'}>
              <Stack alignItems={'center'} sx={{ width: 105, textAlign: 'center' }}>
                <Typography>{cleanUnderscore(name)}</Typography>
                <TowerIcon src={`${prefix}data/ConTower${tower?.index}.png`} alt=""/>
                <Typography>Lv. {level} / {maxLevel}</Typography>
              </Stack>
              <Stack sx={{ width: 100 }}>
                <Typography mb={2}>Progress</Typography>
                {level === maxLevel ? <Typography color={'success.light'}>MAXED</Typography> :
                  <Typography>{notateNumber(progress, 'Big')} / {notateNumber(buildCost, 'Big')}</Typography>}
              </Stack>
              {level === maxLevel ? null : <Stack>
                <Typography mb={2}>Cost</Typography>
                <Stack direction={'row'} gap={1}>
                  {items?.map(({ rawName, amount }, itemIndex) => {
                    return <Stack alignItems={'center'} key={`${name}-${rawName}-${itemIndex}`}>
                      <ItemIcon src={`${prefix}data/${rawName}.png`} alt=""/>
                      <Typography>{amount}</Typography>
                    </Stack>
                  })}
                </Stack>
              </Stack>}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};

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

export default Towers;
