import { useContext } from 'react';
import { NextSeo } from 'next-seo';
import { Box } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { items } from '@website-data';
import ItemDisplay from '@components/common/ItemDisplay';
import { addEquippedItems, getAllItems, mergeItemsByOwner } from '@parsers/items';
import { getGoldenFoodBonus } from '@parsers/misc';
import { getArmorSmithy, getSetPartsReq } from '@parsers/world-3/armorSmithy';
import Notice from '@components/common/Notice';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// The bonuses view is the old "Show bonus only", on by default
const SMITHY_TOOLBAR = { hideUnlocked: false, view: 'bonus' };

const itemName = (rawName) => cleanUnderscore(items?.[rawName]?.displayName ?? rawName);
const setTitle = (setName) => cleanUnderscore(setName?.toLowerCase?.()?.camelToTitleCase?.() ?? setName ?? '');

// The parts of a set you own anywhere, counted as the game counts a worn set (GetSetBonus "PartsOn"): every armour
// piece, tools up to the number it needs, and one weapon when it needs one
const ownedParts = (set, owned) => set.armors.filter((rawName) => owned.has(rawName)).length
  + Math.min(set.requiredTools, set.tools.filter((rawName) => owned.has(rawName)).length)
  + (set.requiredWeapon && set.weapons.some((rawName) => owned.has(rawName)) ? 1 : 0);

const ArmorSmithy = () => {
  const { state } = useContext(AppContext);
  const sectionFailed = isSectionFailed(state?.account, 'armorSmithy');
  const parsed = state?.account?.armorSmithy ?? {};
  // A failed section lists the sets at zero (the parser's catalog with no save), with no states
  const { days = 0, sets = [], isSmithyUnlocked, smithyUnlocked } = sectionFailed && !parsed?.sets?.length
    ? { ...getArmorSmithy({}, undefined, {}, []), isSmithyUnlocked: true }
    : parsed;
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('armor-smithy', SMITHY_TOOLBAR);
  const equippedItems = addEquippedItems(state?.characters, true);
  const totalItems = getAllItems(state?.characters, state?.account);
  const allItems = mergeItemsByOwner(equippedItems, totalItems);
  const owned = new Set(allItems.map(({ rawName }) => rawName));
  // game: a set unlocks for good when the logged-in character wears all of it, only once the smithy is started
  // (OptionsListAccount[380], GetSetBonus "PermaUnlock")
  const smithyActive = Number(smithyUnlocked) === 1;
  const completed = sets.filter(({ unlocked, equipped }) => unlocked || equipped).length;
  const shown = toolbar?.hideUnlocked ? sets.filter(({ unlocked }) => !unlocked) : sets;

  // A part's tile opens the item and who holds it on a tap; on a set still to unlock, a part you own none of is greyed. Small tiles, as the design
  // system's sprites in a card: at 72 px a set with tools and weapons ran four rows tall
  const partsSection = (label, parts, count, markMissing) => <ItemCard.Section key={label} label={`${label} (${formatNum(count)})`}>
    <CardGrid size={'icon'} fill={40}>
      {(parts ?? []).map((rawName, index) => {
        const owners = allItems.filter(({ rawName: ownedName }) => ownedName === rawName).map(({ owner }) => owner);
        return <IconTile key={`${rawName}-${index}`} icon={`data/${rawName}.png`} alt={itemName(rawName)}
                         height={40} iconSize={32} status={markMissing && !owners.length ? 'missing' : undefined}
                         details={<ItemDisplay {...items?.[rawName]} owners={owners} account={state?.account}
                                               getGoldenFoodBonus={getGoldenFoodBonus}/>}/>;
      })}
    </CardGrid>
  </ItemCard.Section>;

  return <>
    <NextSeo
      title="Armor Smithy | Idleon Toolbox"
      description="Track your armor smithy set completion progress, set bonuses, and required items in Legends of Idleon"
    />
    {sectionFailed ? <MissingData name={'Armor Smithy'} failed atZero={!isParseFailed(state?.account)}/> : null}
    {!sectionFailed && isSmithyUnlocked && !smithyActive ? <Notice tone={'info'} sx={{ mb: 2 }}>
      Open the Armor Smithy in game to start it: until then, wearing a full set does not unlock it for good.
    </Notice> : null}
    <PageSummary>
      <StatTile label={'Completed sets'} value={sectionFailed ? '-' : `${formatNum(completed)} / ${formatNum(sets.length)}`}/>
      {!isSmithyUnlocked && !sectionFailed
        ? <StatTile label={'Unlock smithy in'} value={`${formatNum(Math.max(0, 30 - Number(days)))} days`}/>
        : null}
    </PageSummary>
    <Box>
      <Toolbar state={toolbar} defaults={SMITHY_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
               total={sets.length} shown={shown.length} noun={'sets'}>
        <Toolbar.Filter name={'hideUnlocked'} label={'Hide unlocked'}/>
        <Toolbar.View options={[['bonus', 'Bonuses'], ['parts', 'Parts']]}/>
      </Toolbar>
      <CardGrid size={'m'}>
        {shown.map((set) => {
          const { setName, armors, weapons, tools, requiredWeapon, requiredTools, description, unlocked, equipped } = set;
          const partsOwned = ownedParts(set, owned);
          const partsReq = getSetPartsReq(set);
          const markMissing = !sectionFailed && !unlocked && !equipped;
          const ready = smithyActive && !unlocked && !equipped && partsOwned >= partsReq;
          const look = sectionFailed ? {} : unlocked
            ? { status: 'done', statusLabel: 'Unlocked' }
            : equipped ? { status: 'active', statusLabel: 'Equipped' }
              : ready ? { status: 'ready', statusLabel: 'Ready to unlock' } : {};
          return <ItemCard key={setName} icon={`data/${armors?.[0]}.png`} title={setTitle(setName)} {...look}>
            <ItemCard.Desc text={cleanUnderscore(description ?? '')}/>
            {!sectionFailed && !unlocked ? <ItemCard.Facts rows={[
              ['Parts owned', `${formatNum(partsOwned)} / ${formatNum(partsReq)}`],
              ready ? ['To unlock', 'Wear the full set once'] : null
            ]}/> : null}
            {toolbar?.view === 'parts' ? <>
              {partsSection('Armor', armors, armors?.length ?? 0, markMissing)}
              {tools?.length && requiredTools ? partsSection('Tools', tools, requiredTools, markMissing) : null}
              {weapons?.length && requiredWeapon ? partsSection('Weapon', weapons, requiredWeapon, markMissing) : null}
            </> : null}
          </ItemCard>;
        })}
      </CardGrid>
    </Box>
  </>
};

export default ArmorSmithy;
