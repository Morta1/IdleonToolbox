import React from 'react';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';

// Each knowledge category is a titled list of the sushi that feed it. A save with no sushi discovered (a guest) lists
// every category's sushi from the catalog at zero, rather than empty panels.
const SushiBonuses = ({ knowledgeSummary, knowledge }) => {
  const anyDiscovered = knowledge?.some(({ discovered }) => discovered);
  const catalogOf = (category) => knowledge?.flatMap(({ name, category: of }, index) => (of === category
    ? [{ index, name, bonus: 0, level: 0, perfecto: false }] : []));
  return <CardGrid size={'m'}>
    {knowledgeSummary?.map(({ label, category, sources }) => <Panel key={category} title={label}>
      {(anyDiscovered ? sources : catalogOf(category))?.map(({ index, name, bonus, level, perfecto }) => <Panel.Row
        key={index} icon={`data/Sushi${index}.png`} name={name}
        sub={perfecto ? `Lv ${formatNum(level ?? 0)} · Perfecto` : `Lv ${formatNum(level ?? 0)}`}
        value={`+${formatGame(bonus ?? 0, 'SushiStuff.KnowledgeBonusSpecific')}`}/>)}
    </Panel>)}
  </CardGrid>;
};

export default SushiBonuses;
