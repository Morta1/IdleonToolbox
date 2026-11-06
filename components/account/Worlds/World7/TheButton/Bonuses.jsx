import React, { useContext } from 'react';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import InfoButton from '@components/common/InfoButton';
import { SummaryFailed } from '@components/common/cards/PageSummary';

// The game boosts the next bonus in the rotation every 5 presses
export const PRESSES_PER_BONUS = 5;

// The game's lines: a percent bonus prints its { in Comma (Minehead.Button_Bonuses), a multi its } as 1 + x / 100
const bonusText = ({ value, displayFormat }) => (displayFormat === 'multi'
  ? formatNum(1 + (value ?? 0) / 100, 'mult')
  : `+${formatGame(value ?? 0, 'Minehead.Button_Bonuses')}%`);

const Bonuses = ({ bonuses, activeBonusIndex, pressesIntoCurrentBonus }) => {
  const failed = useContext(SummaryFailed);
  const nextIndex = bonuses?.length && !failed ? ((activeBonusIndex ?? 0) + 1) % bonuses.length : -1;
  return <CardGrid size={'s'}>
    {bonuses?.map((bonus, index) => {
      const isActive = index === activeBonusIndex;
      return <ItemCard key={bonus?.name ?? index} title={bonus?.name} status={isActive ? 'active' : undefined}
                       meta={index === nextIndex ? 'Up next' : undefined}
                       aside={bonus?.name === 'Xtra'
                         ? <InfoButton label={'Xtra'}>Raises the drop rate of masterclass resources.</InfoButton>
                         : null}>
        <ItemCard.Facts rows={[
          ['Bonus', bonusText(bonus ?? {})],
          ['Per press', `+${formatNum(bonus?.bonusPerPress ?? 0, 'amount', { precise: true })}`]
        ]}/>
        {isActive
          ? <ItemCard.Progress label={'Presses'} value={pressesIntoCurrentBonus ?? 0} max={PRESSES_PER_BONUS}/>
          : null}
      </ItemCard>;
    })}
  </CardGrid>;
};

export default Bonuses;
