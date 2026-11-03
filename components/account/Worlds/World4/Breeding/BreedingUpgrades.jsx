import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getTotalKitchenLevels } from '@parsers/world-4/cooking';
import { calcUpgradeBonus } from '@parsers/world-4/breeding';
import { petUpgrades as PET_UPGRADES } from '@website-data';
import MealIcon from 'components/common/MealIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

// The cost of every level left, named by the level it reaches, after the next level's cost: green once the owned
// amount covers it all. On a short cost it takes its own row under the numbers (64 px: the meal's column and its gap).
const ToMax = ({ total, maxLevel, covered, short }) => <Typography variant={'body2'} component={'span'}
                                                                 color={covered ? 'text.success' : 'text.secondary'}
                                                                 sx={short ? { flexBasis: '100%', pl: '64px' } : undefined}>
  {formatGame(total, 'Breeding.PetUpgCostREAL')} to Lv {maxLevel}
</Typography>;

// The game names upgrade 1 "Gene_Splicing_}_Helps_unlock_next_Mob_type": the words after its } are a second line
const nameParts = (name) => {
  const [title, ...rest] = String(name ?? '').split('}');
  return { title: cleanUnderscore(title).trim(), meta: cleanUnderscore(rest.join(' ')).trim() || undefined };
};

const BreedingUpgrades = ({ account, petUpgrades, deadCells, meals }) => {
  // An empty save has no upgrade list (the parser maps the save): the catalog at Lv 0
  const upgrades = petUpgrades?.length ? petUpgrades : PET_UPGRADES.map((upgrade) => ({ ...upgrade, level: 0 }));
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
      {upgrades?.map((upgrade, index) => {
        if (upgrade?.name === 'Filler') return null;
        const foodAmount = meals?.[upgrade?.foodIndex]?.amount;
        const foodUpgradeCost = calcFoodCost(upgrade);
        const foodCostToMax = calcCostToMax(upgrade, true);
        const cellCostToMax = calcCostToMax(upgrade);
        const bonus = calcUpgradeBonus(upgrade, index, account);
        const totalBonus = getTotalBonus(bonus, index);
        const { title, meta } = nameParts(upgrade?.name);
        return <ItemCard key={upgrade?.name + '' + index}
                         status={upgrade?.level >= upgrade?.maxLevel ? 'maxed' : undefined}
                         dimmed={upgrade?.level === 0}
                         icon={index > 0 ? `data/PetUpg${index - 1}.png` : <GameIcon size={56} alt={''}/>}
                         iconSize={56}
                         title={title}
                         meta={meta}
                         level={{ value: upgrade?.level ?? 0, max: upgrade?.maxLevel }}
                         footer={<>
                           <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
                             <ItemCard.Cost icon={'data/PetDeadCell.png'} iconAlt={'Dead cells'}
                                            need={calcCellCost(upgrade)} have={deadCells ?? 0}
                                            game={'Breeding.PetUpgCostREAL'}/>
                             <ToMax total={cellCostToMax} maxLevel={upgrade?.maxLevel}
                                    covered={(deadCells ?? 0) >= cellCostToMax}/>
                           </Stack>
                           {index > 0 ? <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
                             <ItemCard.Cost icon={<MealIcon rawName={`CookingMB${upgrade?.foodIndex}`} small/>}
                                            need={foodUpgradeCost} have={foodAmount} game={'Breeding.PetUpgCostREAL'}/>
                             <ToMax total={foodCostToMax} maxLevel={upgrade?.maxLevel} covered={foodAmount >= foodCostToMax}
                                    short={foodAmount < foodUpgradeCost}/>
                           </Stack> : null}
                         </>}>
          <ItemCard.Desc text={upgrade?.description}/>
          <ItemCard.Facts rows={[
            ['Effect', upgrade?.boostEffect === '_'
              ? 'No bonus'
              // Precise keeps 1.14 and 24, never the raw 1.1400000000000001
              : cleanUnderscore(upgrade?.boostEffect?.replace('}', formatNum(bonus, 'amount', { precise: true })))],
            totalBonus > 0 ? ['Total bonus', formatNum(totalBonus, 'mult')] : null
          ]}/>
        </ItemCard>
      })}
    </CardGrid>
  );
};

export default BreedingUpgrades;
