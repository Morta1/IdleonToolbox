import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The first coral is paid from the reef's own coral (Spelunk[4][5], the game's own check), the others from their coral
// item in storage, which the toolbox does not count: their cost shows alone.
const DancingCoral = ({ dancingCoral, ownedCorals }) => <CardGrid size={'m'}>
  {dancingCoral?.map((coral, index) => {
    const towerName = coral?.tower?.name ? cleanUnderscore(coral.tower.name) : null;
    return <ItemCard key={index} icon={`data/Coral${index}.png`} title={cleanUnderscore(coral?.coralName)}
                     meta={towerName ? `+100 max LV for ${towerName}` : undefined} dimmed={!coral?.unlocked}
                     footer={coral?.cost !== undefined
                       ? <ItemCard.Cost icon={`data/Coral${index}.png`} iconAlt={cleanUnderscore(coral?.coralName)}
                                        need={coral.cost} have={index === 0 ? ownedCorals : undefined}
                                        game={'Thingies.DancingCoralCOST'}/>
                       : null}>
      {coral?.towerEffect ? <ItemCard.Desc text={coral.towerEffect}/> : null}
      {coral?.description
        ? <ItemCard.Desc text={`${coral.description}${towerName ? ` per ${towerName} LV above Lv.200` : ''}`}/>
        : null}
      <ItemCard.Facts rows={[
        [towerName ? `${towerName} LV` : 'Shrine LV', formatNum(coral?.level ?? 0)],
        coral?.dropResource ? ['Source', cleanUnderscore(coral.dropResource)] : null,
        coral?.bonus > 0 ? ['Current bonus', formatGame(coral.bonus, 'Thingies.DancingCoralBonus')] : null
      ]}/>
    </ItemCard>;
  })}
</CardGrid>;

export default DancingCoral;
