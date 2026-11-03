import React from 'react';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { getMineheadOpponentSpriteId } from '@parsers/world-7/minehead';

const Opponents = ({ opponents }) => <CardGrid size={'m'}>
  {opponents?.map((opponent, position) => {
    const { index, name, ordinal, title, maxHP, minesCount, bonusDescription, beaten } = opponent ?? {};
    return <ItemCard key={index ?? position} icon={`data/MineH${getMineheadOpponentSpriteId(index)}.png`}
                     title={cleanUnderscore(name)} meta={`${title}, ${ordinal} opponent`}
                     status={beaten ? 'done' : undefined} statusLabel={'Beaten'} dimmed={!beaten}>
      <ItemCard.Facts rows={[
        ['Max HP', formatGame(maxHP ?? 0, 'Minehead.MaxHP_Opp')],
        ['Depth charges', formatGame(minesCount ?? 0, 'Minehead.Mines_Opp')]
      ]}/>
      {bonusDescription
        ? <ItemCard.Section label={'Reward'}><ItemCard.Desc text={bonusDescription}/></ItemCard.Section>
        : null}
    </ItemCard>;
  })}
</CardGrid>;

export default Opponents;
