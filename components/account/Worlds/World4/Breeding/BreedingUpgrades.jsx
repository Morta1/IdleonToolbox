import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber } from 'utility/helpers';
import { getTotalKitchenLevels } from '@parsers/world-4/cooking';
import { calcUpgradeBonus } from '@parsers/world-4/breeding';
import MealIcon from 'components/common/MealIcon';
import UpgradeCard, { CardIcon, IconValueRow, LabelValue, Muted } from '@components/common/UpgradeCard';

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
        return <UpgradeCard key={upgrade?.name + '' + index}
                            dimmed={upgrade?.level === 0}
                            icon={index > 0
                              ? <CardIcon src={`data/PetUpg${index - 1}.png`} alt={''} width={72} height={56} imgWidth={'auto'}
                                          imgHeight={58}/>
                              : <CardIcon width={72} height={56}/>}
                            title={cleanUnderscore(upgrade?.name)}
                            subtitle={`Lv. ${upgrade?.level} / ${upgrade?.maxLevel}`}
                            footer={<>
                              <IconValueRow src={`data/${upgrade?.material}.png`} alt={upgrade?.material}
                                            iconWidth={56}>
                                {notateNumber(calcCellCost(upgrade))} <Muted>({cellCostToMax})</Muted>
                              </IconValueRow>
                              {index > 0 ? <IconValueRow icon={<MealIcon rawName={`CookingMB${upgrade?.foodIndex}`} small/>}
                                                         iconWidth={56}>
                                {notateNumber(foodAmount)} / {notateNumber(foodUpgradeCost)} <Muted>({foodCostToMax})</Muted>
                              </IconValueRow> : null}
                            </>}>
          <Typography variant={'body2'}>{cleanUnderscore(upgrade?.description)}</Typography>
          <Stack gap={.5}>
            <LabelValue label={'Effect'}>{upgrade?.boostEffect === '_'
              ? 'NOTHING'
              : cleanUnderscore(upgrade?.boostEffect.replace('}', bonus))}</LabelValue>
            {totalBonus > 0
              ? <LabelValue label={'Total Bonus'}>{notateNumber(totalBonus, 'MultiplierInfo')}x</LabelValue>
              : null}
          </Stack>
        </UpgradeCard>
      })}
    </Stack>
  );
};

export default BreedingUpgrades;
