import React from 'react';
import { cleanUnderscore, formatStarSignBonus } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';

const StarSigns = ({ starSigns, account, character }) => <Panel title={'Star signs'}>
  {starSigns?.map((starSign, index) => {
    const { starSign: { starName }, bonusIndex, starSignIndex } = starSign || {};
    const realStarSign = account?.starSigns?.[starSignIndex]?.bonuses?.[bonusIndex];
    const isEquipped = character?.starSigns?.filter(({ starName: sName }) => sName === starName)?.length > 0;
    return <Panel.Row key={`${starName}-${index}`} name={cleanUnderscore(starName)}
                      sub={realStarSign ? cleanUnderscore(formatStarSignBonus(realStarSign?.rawName, realStarSign?.bonus)) : undefined}
                      value={isEquipped ? <StatusText status={'active'}>Equipped</StatusText> : undefined}/>;
  })}
</Panel>;

export default StarSigns;
