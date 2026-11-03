import React from 'react';
import { hasMasterclassDailyDiscount } from '@parsers/misc';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import { MAX_LEVELS_AHEAD } from '@components/common/LevelsAhead';

export { formatLevelsAheadCost, LevelsAheadCaption } from '@components/common/LevelsAhead';

// Edits only: an unset Levels ahead is 1 (the card's own cost row), an unset Spree follows the live allowance.
const COST_SETTINGS = { levelsAhead: null, spree: null };

// "Levels ahead" and the Daily Shopping Spree price a masterclass page's upgrades, so they live in its Page settings
// under the tab they price (the owner's rule), remembered per page. The Spree starts on the live state (discounts left
// today) and, once switched, prices every level shown with or without the discount. The page renders gear; the tab
// reads the rest.
const useMasterclassCostControls = (account, page, tab = 'Upgrades') => {
  const [settings, setSettings, resetSettings] = usePageSettings(page, COST_SETTINGS);
  const liveDiscount = hasMasterclassDailyDiscount(account);
  const discount = settings?.spree ?? liveDiscount;
  // The gear shows the Spree as it prices, and counts it as changed only while it differs from today's allowance; a
  // switch back to the live state stores nothing, so the next day follows the game again.
  const onChange = (patch) => setSettings(Object.hasOwn(patch, 'spree')
    ? { ...patch, spree: patch.spree === liveDiscount ? null : patch.spree }
    : patch);
  const gear = <PageSettings state={{ levelsAhead: settings?.levelsAhead ?? null, spree: discount }}
                             defaults={{ levelsAhead: null, spree: liveDiscount }} onChange={onChange} onReset={resetSettings}>
    <PageSettings.Group title={tab}>
      <PageSettings.Number name={'levelsAhead'} label={'Levels ahead'} defaultValue={1} min={1} max={MAX_LEVELS_AHEAD} integer
                           help={'Each upgrade also shows the total cost of this many levels.'}/>
      <PageSettings.Toggle name={'spree'} label={'Daily Shopping Spree'}
                           help={`Prices every cost with the legend talent's 80% discount. ${liveDiscount
                             ? 'You still have discounted purchases left today.'
                             : 'You have no discounted purchases left today.'}`}/>
    </PageSettings.Group>
  </PageSettings>;

  // Only force the parser when the switch disagrees with the save, so the default view stays the
  // exact live price.
  const forceLegendTalent = discount === liveDiscount ? undefined : discount;

  return {
    gear,
    levelsAhead: Math.max(1, settings?.levelsAhead ?? 1),
    forceLegendTalent,
    isOverridden: forceLegendTalent !== undefined
  };
};

export default useMasterclassCostControls;
