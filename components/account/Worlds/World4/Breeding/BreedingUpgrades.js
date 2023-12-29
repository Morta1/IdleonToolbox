import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { getAchievementStatus } from '../../../../../parsers/achievements';
import { getTotalKitchenLevels } from '../../../../../parsers/cooking';
import { calcUpgradeBonus } from '../../../../../parsers/breeding';

const BreedingUpgrades = ({ account, petUpgrades, meals }) => {
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

  const getTotalBonus = (bonus, upgradeIndex) => {
    if (upgradeIndex === 9) {
      const totalKitchenLevels = getTotalKitchenLevels(account?.cooking?.kitchens)
      return Math.pow(Math.max(1, bonus), totalKitchenLevels / 100);
    }
    return 0;
  }
  return (
    <Stack direction={'row'} flexWrap={'wrap'} justifyContent={'center'} gap={2}>
      {petUpgrades?.map((upgrade, index) => {
        if (upgrade?.name === 'Filler') return null;
        const foodAmount = meals?.[upgrade?.foodIndex]?.amount;
        const foodUpgradeCost = calcFoodCost(upgrade);
        const foodCostToMax = notateNumber(calcCostToMax(upgrade, true));
        const cellCostToMax = notateNumber(calcCostToMax(upgrade));
        const bonus = calcUpgradeBonus(upgrade, index, account);
        const totalBonus = getTotalBonus(bonus, index);
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
                <Typography>{upgrade?.boostEffect === '_'
                  ? 'NOTHING'
                  : cleanUnderscore(upgrade?.boostEffect.replace('}', bonus))}</Typography>
              </Stack>
              <Stack mt={2} gap={2}>
                <Stack direction={'row'} alignItems={'center'} gap={2}>
                  <img src={`${prefix}data/${upgrade?.material}.png`} alt=""/>
                  {notateNumber(calcCellCost(upgrade))}
                  <div>({cellCostToMax})</div>
                </Stack>
                {index > 0 ? <Stack direction={'row'} alignItems={'center'}>
                  <MealAndPlate>
                    <img src={`${prefix}data/CookingMB${upgrade?.foodIndex}.png`} alt=""/>
                    <img src={`${prefix}data/CookingPlate0.png`} alt=""/>
                  </MealAndPlate>
                  <div style={{ textAlign: 'center' }}>
                    <Typography>{notateNumber(foodAmount)} / {notateNumber(foodUpgradeCost)} ({foodCostToMax})</Typography>
                  </div>
                </Stack> : null}
                {totalBonus > 0 ?
                  <Typography>Total Bonus: {notateNumber(totalBonus, 'MultiplierInfo')}x</Typography> : null}
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
