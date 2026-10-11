import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { getTotalKitchenLevels } from '@parsers/world-4/cooking';
import { calcUpgradeBonus } from '@parsers/world-4/breeding';

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
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Stack direction={'row'} alignItems={'center'} gap={1.5}>
              <IconBox>
                {index > 0 ? <img src={`${prefix}data/PetUpg${index - 1}.png`} alt=""/> : null}
              </IconBox>
              <Stack>
                <Typography variant={'subtitle1'} sx={{ fontWeight: 'bold', lineHeight: 1.3 }}>
                  {cleanUnderscore(upgrade?.name)}
                </Typography>
                <Typography variant={'body2'} color={'text.secondary'}>
                  Lv. {upgrade?.level} / {upgrade?.maxLevel}
                </Typography>
              </Stack>
            </Stack>
            <Typography variant={'body2'}>{cleanUnderscore(upgrade?.description)}</Typography>
            <Typography variant={'body2'}>
              <b>Effect:</b> {upgrade?.boostEffect === '_'
              ? 'NOTHING'
              : cleanUnderscore(upgrade?.boostEffect.replace('}', bonus))}
            </Typography>
            {totalBonus > 0 ?
              <Typography variant={'body2'}><b>Total Bonus:</b> {notateNumber(totalBonus, 'MultiplierInfo')}x</Typography> : null}
            <Stack mt={'auto'} gap={1}>
              <Divider sx={{ mb: .5 }}/>
              <CostRow>
                <CostIcon>
                  <img src={`${prefix}data/${upgrade?.material}.png`} alt={upgrade?.material}/>
                </CostIcon>
                <Typography variant={'body2'}>
                  {notateNumber(calcCellCost(upgrade))} <Muted>({cellCostToMax})</Muted>
                </Typography>
              </CostRow>
              {index > 0 ? <CostRow>
                <MealIcon>
                  <img src={`${prefix}data/CookingMB${upgrade?.foodIndex}.png`} alt=""/>
                </MealIcon>
                <Typography variant={'body2'}>
                  {notateNumber(foodAmount)} / {notateNumber(foodUpgradeCost)} <Muted>({foodCostToMax})</Muted>
                </Typography>
              </CostRow> : null}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  );
};

// PetUpg sprites sit in a padded 133x96 canvas: scale the canvas, let the padding overflow the box
const IconBox = styled.div`
  flex-shrink: 0;
  position: relative;
  width: 72px;
  height: 56px;

  & img {
    position: absolute;
    left: 50%;
    top: 50%;
    height: 58px;
    transform: translate(-50%, -50%);
  }
`;

const CostRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CostIcon = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  & img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

// CookingMB sprites draw the meal in the bottom-center of an 82x56 canvas: crop to it at 1:1
const MealIcon = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 32px;
  overflow: hidden;
  display: flex;
  justify-content: center;

  & img {
    flex-shrink: 0;
    width: 82px;
    height: 56px;
    margin-top: -26px;
  }
`;

const Muted = styled.span`
  opacity: .7;
`;

export default BreedingUpgrades;
