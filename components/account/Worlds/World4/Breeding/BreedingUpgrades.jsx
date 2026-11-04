import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getTotalKitchenLevels } from '@parsers/world-4/cooking';
import { calcUpgradeBonus } from '@parsers/world-4/breeding';
import { petUpgrades as PET_UPGRADES } from '@website-data';
import MealIcon from 'components/common/MealIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { isSectionFailed } from '@components/common/styles';

// The cost of every level left, named by the level it reaches, after the next level's cost: green once the owned
// amount covers it all. Its amount and "to Lv N" never part.
const ToMax = ({ total, maxLevel, covered }) => <Typography variant={'body2'} component={'span'}
                                                          color={covered ? 'text.success' : 'text.secondary'}
                                                          sx={{ whiteSpace: 'nowrap' }}>
  {formatGame(total, 'Breeding.PetUpgCostREAL', { whole: true })} to Lv {maxLevel}
</Typography>;

// A cost line: its currency in a fixed slot as wide as the small meal (56 px), so both lines' numbers start at one x,
// and the numbers wrap in their own column, never back under the currency. The column's padding puts its first line
// (body2, 20 px) on the slot's middle, so the currency sits beside the owned / cost pair however far the rest wraps.
const TEXT_LINE = 20;
const CostLine = ({ icon, height, children }) => <Stack direction={'row'} alignItems={'flex-start'} gap={1}>
  <Box sx={{ flexShrink: 0, width: 56, height, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    {icon}
  </Box>
  <Stack direction={'row'} alignItems={'center'} columnGap={1} rowGap={0.5} flexWrap={'wrap'}
         sx={{ minWidth: 0, py: `${(height - TEXT_LINE) / 2}px` }}>
    {children}
  </Stack>
</Stack>;

// game: "BreedingEXPmulti" adds 2 * Breeding[2][0] percent, upgrade 0's level (its own text says 1% per level)
const UPGRADE_0_EXP_PER_LEVEL = 2;

// The game names upgrade 1 "Gene_Splicing_}_Helps_unlock_next_Mob_type": the words after its } are a second line
const nameParts = (name) => {
  const [title, ...rest] = String(name ?? '').split('}');
  return { title: cleanUnderscore(title).trim(), meta: cleanUnderscore(rest.join(' ')).trim() || undefined };
};

const BreedingUpgrades = ({ account, petUpgrades, deadCells, meals, sectionFailed }) => {
  // An empty save has no upgrade list (the parser maps the save): the catalog at Lv 0. So has a failed section, whose
  // catalog shows no cost, state or total: none of it is the player's
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

  // Upgrade 9's total counts the kitchen levels: with the kitchens failed the count is unknown, so there is no total
  const kitchensFailed = isSectionFailed(account, 'cooking') || isSectionFailed(account, 'cooking.kitchens');
  const getTotalBonus = (bonus, upgradeIndex) => {
    if (upgradeIndex === 9 && !kitchensFailed && !sectionFailed) {
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
                         status={!sectionFailed && upgrade?.level >= upgrade?.maxLevel ? 'maxed' : undefined}
                         dimmed={!sectionFailed && upgrade?.level === 0}
                         icon={index > 0 ? `data/PetUpg${index - 1}.png` : <GameIcon size={56} alt={''}/>}
                         iconSize={56}
                         title={title}
                         meta={meta}
                         level={{ value: upgrade?.level ?? 0, max: upgrade?.maxLevel }}
                         footer={sectionFailed ? null : <>
                           <CostLine height={24} icon={<GameIcon src={'data/PetDeadCell.png'} size={24} alt={'Dead cells'}/>}>
                             <ItemCard.Cost need={calcCellCost(upgrade)} have={deadCells ?? 0} game={'Breeding.PetUpgCostREAL'}/>
                             <ToMax total={cellCostToMax} maxLevel={upgrade?.maxLevel}
                                    covered={(deadCells ?? 0) >= cellCostToMax}/>
                           </CostLine>
                           {index > 0 ? <CostLine height={40}
                                                  icon={<MealIcon rawName={`CookingMB${upgrade?.foodIndex}`} small centered/>}>
                             <ItemCard.Cost need={foodUpgradeCost} have={foodAmount} game={'Breeding.PetUpgCostREAL'}/>
                             <ToMax total={foodCostToMax} maxLevel={upgrade?.maxLevel} covered={foodAmount >= foodCostToMax}/>
                           </CostLine> : null}
                         </>}>
          <ItemCard.Desc text={upgrade?.description}/>
          <ItemCard.Facts rows={[
            upgrade?.boostEffect === '_'
              // Upgrade 0's data has no effect text: the line is what the game applies, never a line it cannot read
              ? (index === 0 ? ['Effect', `+${formatNum(UPGRADE_0_EXP_PER_LEVEL * (upgrade?.level ?? 0), 'pct')} Breeding EXP`] : null)
              // Precise keeps 1.14 and 24, never the raw 1.1400000000000001
              : ['Effect', cleanUnderscore(upgrade?.boostEffect?.replace('}', formatNum(bonus, 'amount', { precise: true })))],
            totalBonus > 0 ? ['Total bonus', formatNum(totalBonus, 'mult')] : null
          ]}/>
        </ItemCard>
      })}
    </CardGrid>
  );
};

export default BreedingUpgrades;
