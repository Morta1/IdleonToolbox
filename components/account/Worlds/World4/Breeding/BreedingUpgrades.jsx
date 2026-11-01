import { Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cleanUnderscore, notateNumber } from 'utility/helpers';
import { getTotalKitchenLevels } from '@parsers/world-4/cooking';
import { calcUpgradeBonus } from '@parsers/world-4/breeding';
import MealIcon from 'components/common/MealIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

// The cost to max, muted and named after the next level's cost; a maxed upgrade has none
const ToMax = ({ children }) => <Typography variant={'body2'} component={'span'} color={'text.secondary'}>
  to max {children}
</Typography>;

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
    <CardGrid size={'m'}>
      {petUpgrades?.map((upgrade, index) => {
        if (upgrade?.name === 'Filler') return null;
        const foodAmount = meals?.[upgrade?.foodIndex]?.amount;
        const foodUpgradeCost = calcFoodCost(upgrade);
        const foodCostToMax = calcCostToMax(upgrade, true);
        const cellCostToMax = calcCostToMax(upgrade);
        const bonus = calcUpgradeBonus(upgrade, index, account);
        const totalBonus = getTotalBonus(bonus, index);
        return <ItemCard key={upgrade?.name + '' + index}
                         dimmed={upgrade?.level === 0}
                         icon={index > 0 ? `data/PetUpg${index - 1}.png` : <GameIcon size={56} alt={''}/>}
                         iconSize={56}
                         title={cleanUnderscore(upgrade?.name)}
                         level={{ value: upgrade?.level, max: upgrade?.maxLevel }}
                         footer={<>
                           <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
                             <ItemCard.Cost icon={<CostIconSlot>
                               <GameIcon src={`data/${upgrade?.material}.png`} size={24} alt={upgrade?.material}/>
                             </CostIconSlot>} need={calcCellCost(upgrade)}/>
                             {cellCostToMax > 0 ? <ToMax>{notateNumber(cellCostToMax)}</ToMax> : null}
                           </Stack>
                           {index > 0 ? <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
                             <ItemCard.Cost icon={<MealIcon rawName={`CookingMB${upgrade?.foodIndex}`} small/>}
                                            need={foodUpgradeCost} have={foodAmount}/>
                             {foodCostToMax > 0 ? <ToMax>{notateNumber(foodCostToMax)}</ToMax> : null}
                           </Stack> : null}
                         </>}>
          <ItemCard.Desc text={upgrade?.description}/>
          <ItemCard.Facts rows={[
            ['Effect', upgrade?.boostEffect === '_'
              ? 'NOTHING'
              : cleanUnderscore(upgrade?.boostEffect.replace('}', bonus))],
            totalBonus > 0 ? ['Total Bonus', `${notateNumber(totalBonus, 'MultiplierInfo')}x`] : null
          ]}/>
        </ItemCard>
      })}
    </CardGrid>
  );
};

// The material's 24 px sprite in the meal row's 56 px column, so both costs start at the same x
const CostIconSlot = styled('span')`
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  width: 56px;
`;

export default BreedingUpgrades;
