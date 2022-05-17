import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, kFormatter, prefix } from "utility/helpers";
import styled from "@emotion/styled";

const BreedingUpgrades = ({ petUpgrades, meals }) => {
  const calcFoodCost = (upgrade) => {
    return upgrade?.baseCost * (1 + upgrade?.level) * Math.pow(upgrade?.costScale, upgrade?.level);
  }
  const calcCellCost = (upgrade) => {
    return upgrade?.baseMatCost * (1 + upgrade?.level) * Math.pow(upgrade?.costMatScale, upgrade?.level);
  }
  const calcCostToMax = (upgrade, food) => {
    let costToMax = 0;
    for (let i = upgrade?.level; i < upgrade?.maxLevel; i++) {
      costToMax += food ? calcFoodCost({ ...upgrade, level: i }) : calcCellCost({ ...upgrade, level: i });
    }
    return costToMax ?? 0;
  }

  const calcBonus = (upgrade, upgradeIndex) => {
    if (0 === upgradeIndex || 2 === upgradeIndex || 4 === upgradeIndex) {
      return upgrade?.level;
    }
    if (1 === upgradeIndex) {
      return 4 * upgrade?.level;
    }
    if (3 === upgradeIndex) {
      return 25 * upgrade?.level;
    }
    if (5 === upgradeIndex) {
      return 1 + 0.25 * upgrade?.level;
    }
    if (6 === upgradeIndex) {
      return 6 * upgrade?.level;
    }
    if (7 === upgradeIndex) {
      return 1 + 0.3 * upgrade?.level;
    }
    if (8 === upgradeIndex) {
      return 1 + 2 * upgrade?.level;
    }
    if (9 === upgradeIndex) {
      return 1 + 0.05 * upgrade?.level;
    }
    if (10 === upgradeIndex) {
      return 10 * upgrade?.level;
    }
    if (11 === upgradeIndex) {
      return Math.ceil(12 * Math.pow(upgrade?.level, 0.698));
    }
    return 0;
  }

  return (
    <Stack direction={'row'} flexWrap={'wrap'} justifyContent={'center'} gap={2}>
      {petUpgrades?.map((upgrade, index) => {
        if (upgrade?.name === 'Filler') return null;
        const foodAmount = meals?.[upgrade?.foodIndex]?.amount;
        const foodUpgradeCost = calcFoodCost(upgrade);
        const foodCostToMax = kFormatter(calcCostToMax(upgrade, true));
        const cellCostToMax = kFormatter(calcCostToMax(upgrade));
        return <Card key={upgrade?.name + '' + index} sx={{ width: 300, opacity: upgrade?.level === 0 ? .5 : 1 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} mb={2}>
              <Stack alignItems={'center'}>
                <UpgradeIcon style={{ opacity: index === 0 ? 0 : 1 }}
                             src={`${prefix}data/PetUpg${index === 0 ? 0 : index - 1}.png`} alt=""/>
                <Typography>Lv.{upgrade?.level} / {upgrade?.maxLevel}</Typography>
              </Stack>
              <Typography variant={'h6'} sx={{ fontWeight: 'bold' }}>{cleanUnderscore(upgrade?.name)}</Typography>
            </Stack>
            <Stack>
              <Typography>{cleanUnderscore(upgrade?.description)}</Typography>
            </Stack>
            <div className={'info'}>
              <Stack direction={'row'} my={1}>
                <Typography sx={{ fontWeight: 'bold' }}>Effect:&nbsp;</Typography>
                <Typography>{upgrade?.boostEffect === '_' ? 'NOTHING' : cleanUnderscore(upgrade?.boostEffect.replace('}', calcBonus(upgrade, index)))}</Typography>
              </Stack>
              <Stack mt={2} gap={2}>
                <Stack direction={'row'} alignItems={'center'} gap={2}>
                  <img src={`${prefix}data/${upgrade?.material}.png`} alt=""/>
                  {kFormatter(calcCellCost(upgrade))}
                  <div>({cellCostToMax})</div>
                </Stack>
                {index > 0 ? <Stack direction={'row'} alignItems={'center'}>
                  <MealAndPlate>
                    <img src={`${prefix}data/CookingMB${upgrade?.foodIndex}.png`} alt=""/>
                    <img src={`${prefix}data/CookingPlate0.png`} alt=""/>
                  </MealAndPlate>
                  <div style={{ textAlign: 'center' }}>
                    <Typography>{kFormatter(foodAmount, 2)} / {kFormatter(foodUpgradeCost, 2)} ({foodCostToMax})</Typography>
                  </div>
                </Stack> : null}
              </Stack>
            </div>
          </CardContent>
        </Card>
      })}
    </Stack>
  );
};

const UpgradeIcon = styled.img`
  object-fit: contain;
  width: 72px;
`;

const MealAndPlate = styled.div`
  width: 82px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: -20px;

  & img:nth-of-type(1) {
    margin-top: -30px;
  }

  & img {
    margin-left: -30px;
  }
`

export default BreedingUpgrades;
