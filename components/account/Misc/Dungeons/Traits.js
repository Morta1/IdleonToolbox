import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import StatusText from '@components/common/StatusText';

// A trait's sentence is the point, so it shows; the game data's "~" is its font's "&" ("armor ~ jewelry")
const traitText = (bonus) => cleanUnderscore(`${bonus ?? ''}`).replace(/~/g, '&');

// sectionFailed: the traits by name, none active
const Traits = ({ statBoosts, sectionFailed }) => <CardGrid size={'l'} sx={{ alignItems: 'start' }}>
  {(statBoosts ?? []).map(({ section, levelReq, bonuses }, sectionIndex) => <Panel key={`${section}-${sectionIndex}`}
                                                                                   title={section}
                                                                                   meta={`Rank ${formatNum(levelReq ?? 0)}+`}>
    {(bonuses ?? []).map(({ bonus, isActive, bonusIndex }) => {
      const active = !sectionFailed && isActive;
      return <Panel.Row key={bonusIndex} icon={`data/DungTrait${active ? 'A' : 'B'}${bonusIndex}.png`} name={traitText(bonus)}
                        value={active ? <StatusText status={'active'}/> : undefined}/>;
    })}
  </Panel>)}
</CardGrid>;

export default Traits;
