import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import StatusText from '@components/common/StatusText';
import { cardState } from '@components/common/cards/tokens';

// A trait's sentence is the point, so it shows; the game data's "~" is its font's "&" ("armor ~ jewelry")
const traitText = (bonus) => cleanUnderscore(`${bonus ?? ''}`).replace(/~/g, '&');

// One pick per section, and a second click on it un-picks (DungUpg[2] back to -1): a reached section with no pick is
// a free bonus left unused. sectionFailed: the traits by name, none active
const Traits = ({ statBoosts, rank, sectionFailed }) => <CardGrid size={'l'} sx={{ alignItems: 'start' }}>
  {(statBoosts ?? []).map(({ section, levelReq, bonuses }, sectionIndex) => {
    const reached = (rank ?? 0) >= (levelReq ?? 0);
    const picked = (bonuses ?? []).some(({ isActive }) => isActive);
    return <Panel key={`${section}-${sectionIndex}`}
                  title={section}
                  meta={!sectionFailed && !reached ? `Needs Rank ${formatNum(levelReq ?? 0)}` : `Rank ${formatNum(levelReq ?? 0)}+`}
                  aside={!sectionFailed && reached && !picked ? <StatusText status={'needs'}>None picked</StatusText> : null}
                  sx={!sectionFailed && !reached ? (theme) => cardState(theme, 'locked') : undefined}>
      {(bonuses ?? []).map(({ bonus, isActive, bonusIndex }) => {
        const active = !sectionFailed && isActive;
        return <Panel.Row key={bonusIndex} icon={`data/DungTrait${active ? 'A' : 'B'}${bonusIndex}.png`} name={traitText(bonus)}
                          value={active ? <StatusText status={'active'}/> : undefined}/>;
      })}
    </Panel>;
  })}
</CardGrid>;

export default Traits;
