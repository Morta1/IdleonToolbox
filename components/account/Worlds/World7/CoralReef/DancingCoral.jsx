import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The first coral is paid from the reef's own coral (Spelunk[4][5]), the others from their coral item in the chest and
// inventories (the game's _ItemsAndStorageOWNED check): balances[index]. The game rounds the cost up (Math.ceil) before
// it compares and prints it. Both sides print in Big: the game's own line is that bare number, no commas at any size.
// Only shrine levels past 200 count. The game reads a "1.04x" coral as one multiplier, 1 + bonus / 100 (Char Coral's
// Class EXP), and the rest as a percent
const SHRINE_LEVEL_FLOOR = 200;
const bonusText = (coral) => (/^\s*[\d.]+x/.test(cleanUnderscore(coral?.description ?? ''))
  ? formatNum(1 + coral.bonus / 100, 'mult')
  : `+${formatGame(coral.bonus, 'Thingies.DancingCoralBonus')}%`);

const DancingCoral = ({ dancingCoral, balances }) => <CardGrid size={'m'}>
  {dancingCoral?.map((coral, index) => {
    const towerName = coral?.tower?.name ? cleanUnderscore(coral.tower.name) : null;
    return <ItemCard key={index} icon={`data/Coral${index}.png`} title={cleanUnderscore(coral?.coralName)}
                     meta={towerName ? `+100 max LV for ${towerName}` : undefined} dimmed={!coral?.unlocked}
                     footer={coral?.cost !== undefined
                       ? <ItemCard.Cost icon={`data/Coral${index}.png`} iconAlt={cleanUnderscore(coral?.coralName)}
                                        need={Math.ceil(coral.cost)} have={balances?.[index] ?? 0}/>
                       : null}>
      {coral?.towerEffect ? <ItemCard.Desc text={coral.towerEffect}/> : null}
      {coral?.description
        ? <ItemCard.Desc text={`${coral.description}${towerName ? ` per ${towerName} LV above Lv.200` : ''}`}/>
        : null}
      <ItemCard.Facts rows={[
        [towerName ? `${towerName} LV` : 'Shrine LV', formatNum(coral?.level ?? 0)],
        coral?.dropResource ? ['Source', cleanUnderscore(coral.dropResource)] : null,
        coral?.bonus > 0 ? ['Current bonus', bonusText(coral)] : null,
        coral?.unlocked && (coral?.level ?? 0) <= SHRINE_LEVEL_FLOOR
          ? ['Bonus starts', `Lv ${SHRINE_LEVEL_FLOOR + 1} (${formatNum(SHRINE_LEVEL_FLOOR + 1 - (coral?.level ?? 0))} to go)`] : null
      ]}/>
    </ItemCard>;
  })}
</CardGrid>;

export default DancingCoral;
