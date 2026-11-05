import React, { useContext, useState } from 'react';
import { Box, Button, ButtonBase, Stack, Typography } from '@mui/material';
import { IconCards, IconMinus, IconPlus } from '@tabler/icons-react';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { cards, cardSets, stats } from '@website-data';
import { AppContext } from 'components/common/context/AppProvider';
import { CardAndBorder, isSectionFailed, MissingSections } from '@components/common/styles';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { NextSeo } from 'next-seo';
import { useLocalStorage } from '@mantine/hooks';
import { isMasteryBonusUnlocked } from '@parsers/misc';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { notify } from '@components/common/Overlays/notify';
import CardPresets from '@components/tools/card-search/CardPresets';
import { emptyPreset, normalizePresets } from '@components/tools/card-search/presetUtils';
import { getCardSets } from '@parsers/cards';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';

const categoriesOrder = ['Card Sets', 'Blunder_Hills', 'Yum_Yum_Desert', 'Easy_Resources',
  'Medium_Resources', 'Frostbite_Tundra', 'Hard_Resources', 'Hyperion_Nebula', 'Smolderin\'_Plateau',
  'Spirited_Valley', 'Shimmerfin_Deep', 'Dungeons',
  'Bosses', 'Events'];

const additionalEffects = {
  choppin: [stats.BaseWIS, stats.SkillAFKgainrate],
  catching: [stats.BaseAGI, stats.SkillAFKgainrate],
  mining: [stats.BaseSTR, stats.SkillAFKgainrate, stats.BaseHP, stats.BoostFoodEffect],
  fishing: [stats.BaseSTR, stats.SkillAFKgainrate, stats.BaseHP, stats.BoostFoodEffect],
  trapping: [stats.BaseAGI, stats.SkillAFKgainrate, stats.ShinyCritterChance],
  damage: [stats.WeaponPower, stats.CriticalChance, stats['Dmg,Drop,andEXP']],
  'drop rate': [stats['Dmg,Drop,andEXP']],
  'card drop': [stats.TotalDropRate],
  'monster exp': [stats.EXPfrommonsters, stats['Dmg,Drop,andEXP'], stats.ClassEXPMulti, stats['ClassExp(Multi)']],
  dungeon: [stats.BlockChance, stats.RNGitemrarity, stats['tostartwithRNGorb(Passive)']],
  worship: [stats.StartingPtsinWorship, stats.ChargeRate, stats.MaxCharge, stats.SkillEXP],
  money: [stats.FightingAFKgainrate, stats.TotalDropRate],
  stats: [stats.BaseWIS, stats.BaseSTR, stats.BaseAGI, stats.AllStat],
  stat: [stats.BaseWIS, stats.BaseSTR, stats.BaseAGI, stats.AllStat],
  wis: [stats.AllStat],
  str: [stats.AllStat],
  agi: [stats.AllStat],
  luk: [stats.AllStat]
}

// The game decides passive cards from the card's effect text, not its name (TalentCalc.js)
const worshipPassiveEffects = ['+{%_Charge_Rate', '+{_Starting_Pts_in_Worship', '+{%_Max_Charge'];
const skillMasteryPassiveEffects = {
  mining: (effect) => effect?.includes('Mining'),
  chopping: (effect) => effect?.includes('Choppin'),
  fishing: (effect) => effect?.includes('Fishing'),
  catching: (effect) => effect?.includes('Catching'),
  trapping: (effect) => effect?.includes('Trapping') || effect === '+{%_Shiny_Critter_Chance',
  worship: (effect) => worshipPassiveEffects.includes(effect),
  spelunking: (effect) => effect?.includes('Spelunking')
};

const isSkillMasteryPassiveCards = ({ effect, account }) => {
  const skillMasteryPassive = Object.entries(skillMasteryPassiveEffects)
    .some(([skillName, matchesEffect]) => matchesEffect(effect)
      && isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.[skillName]?.rank, 2));
  const dropRateCardsArePassives = effect === '+{%_Card_Drop_Chance' && getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 44);
  return skillMasteryPassive || Boolean(dropRateCardsArePassives);
}

const STAT_PRESETS = ['AFK', 'Choppin', 'Mining', 'Fishing', 'Catching', 'Trapping', 'Cooking', 'Worship', 'Spelunking', 'Lab',
  'Crystal Mob', 'Accuracy', 'Money', 'Card Drop', 'Drop Rate', 'Monster Exp', 'Skill Exp', 'Defence', 'Damage', 'Dungeon',
  'Stats', 'STR', 'AGI', 'WIS', 'LUK'];

const CARD_TOOLBAR = { search: '', stat: 'all', hidePassives: false };
const SECTION_NAMES = { cards: 'Cards', rift: 'Rift', upgradeVault: 'Upgrade Vault', legendTalents: 'Legend Talents' };

// A term finds a card by the words of its effect, and by the effects the game counts towards that stat (additionalEffects)
const matchesTerm = (effect, term) => {
  const cleanEffect = (effect ?? '').replace(/[+%{]+_/, '').replace(/_/g, ' ');
  const lowerTerm = term.toLowerCase();
  return cleanEffect.toLowerCase().includes(lowerTerm) || Boolean(additionalEffects[lowerTerm]?.includes(cleanUnderscore(cleanEffect)));
};

// The add or remove button is 24 px, on the card's corner, with a 44 px tap area on a touch screen
const PICK_SX = {
  position: 'absolute', top: -6, right: -6, zIndex: 1, width: 24, height: 24, borderRadius: '50%',
  bgcolor: 'primary.main', color: 'primary.contrastText',
  '@media (pointer: coarse)': { '&::after': { content: '""', position: 'absolute', inset: -10, borderRadius: '50%' } }
};
const PICK_REMOVE_SX = { bgcolor: 'error.main', color: 'error.contrastText' };
const SLOT_LABEL_SX = {
  position: 'absolute', top: -6, left: -6, zIndex: 1, minWidth: 18, height: 18, px: 0.5, borderRadius: '9px', textAlign: 'center',
  bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: 12, fontWeight: 700, lineHeight: '18px', pointerEvents: 'none'
};
const IN_PRESET_SX = { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2, borderRadius: '6px' };

export default function CardSearch() {
  const { state } = useContext(AppContext);
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('card-search', CARD_TOOLBAR);
  const [storedPresets, setPresets] = useLocalStorage({ key: 'card-search:presets', defaultValue: [] });
  const [selectedPreset, setSelectedPreset] = useLocalStorage({ key: 'card-search:selectedPreset', defaultValue: 0 });
  const [presetsOpen, setPresetsOpen] = useState(false);
  // The slot the next picked card goes into: a card slot index, 'set', or null for the first empty slot
  const [targetSlot, setTargetSlot] = useState(null);

  const cardsObject = Object.values(cards).reduce((res, cardDetails) => ({
    ...res,
    [cardDetails.category]: [...(res?.[cardDetails.category] || []), cardDetails]
  }), { ['Card Sets']: Object.values(cardSets) });
  const cardSetsData = getCardSets(state?.account);
  const catalogCards = Object.values(cards).reduce((res, card) => ({ ...res, [card?.displayName]: card }), {});
  // Cards on the page are never equipped on a character, so only the account-wide legend bonus applies
  const legendBonus = 1 + (getLegendTalentBonus(state?.account, 21) ?? 0) / 100;
  const getCard = (displayName) => ({
    ...(state?.account?.cards?.[displayName] ?? catalogCards[displayName]),
    legendBonus
  });
  const getCardSet = (name) => cardSetsData?.[name];
  const presets = normalizePresets(storedPresets, catalogCards, cardSetsData);
  const selected = Math.min(Math.max(Number(selectedPreset) || 0, 0), Math.max(presets.length - 1, 0));
  const preset = presets?.[selected];
  const undo = () => setPresets(presets);
  const updatePreset = (next) => setPresets(presets.map((current, index) => index === selected ? next : current));
  const addPreset = (next) => {
    setPresets([...presets, next]);
    setSelectedPreset(presets.length);
    setTargetSlot(null);
  };
  const openPresets = () => {
    if (!presets.length) addPreset(emptyPreset('Preset 1'));
    setPresetsOpen(true);
  };
  const removeSlot = (slot) => {
    if (slot === 'set') {
      updatePreset({ ...preset, cardSet: null });
    } else {
      updatePreset({ ...preset, cards: preset.cards.map((current, index) => index === slot ? null : current) });
    }
    setTargetSlot(null);
  };
  // Clicking a card that is in the preset takes it out; any other card fills the chosen slot or the first empty one
  const pickCard = (card, isCardSet) => {
    if (!preset) return;
    const name = cleanUnderscore(isCardSet ? card.name : card.displayName);
    if (isCardSet) {
      if (preset.cardSet === card.name) {
        removeSlot('set');
        return notify(`Removed ${name} from ${preset.name}`, { undo });
      }
      updatePreset({ ...preset, cardSet: card.name });
      setTargetSlot(null);
      if (preset.cardSet) notify(`Replaced ${cleanUnderscore(preset.cardSet)} with ${name}`, { undo });
      return;
    }
    const currentSlot = preset.cards.indexOf(card.displayName);
    if (currentSlot !== -1) {
      removeSlot(currentSlot);
      return notify(`Removed ${name} from ${preset.name}`, { undo });
    }
    const slot = Number.isInteger(targetSlot) ? targetSlot : preset.cards.findIndex((current) => !current);
    if (slot === -1) return notify(`${preset.name} is full: click a slot to replace it`);
    const replaced = preset.cards[slot];
    updatePreset({ ...preset, cards: preset.cards.map((current, index) => index === slot ? card.displayName : current) });
    setTargetSlot(null);
    if (replaced) notify(`Replaced ${cleanUnderscore(replaced)} with ${name}`, { undo });
  };
  const picking = presetsOpen && Boolean(preset);
  const presetCards = preset?.cards || [];
  const presetCardSet = preset?.cardSet;
  // A failed cards section is unknown, not unowned: its cards draw undimmed, with no stars and no passive mark
  const cardsFailed = isSectionFailed(state?.account, 'cards');
  // Every card once, with what its filters read
  const catalog = Object.entries(cardsObject).flatMap(([category, cardsArr]) => cardsArr.map((card) => {
    const isSkillMasteryPassive = !cardsFailed && isSkillMasteryPassiveCards({ effect: card?.effect, account: state?.account });
    const isPassive = Boolean(card?.effect?.includes('(Passive)') || card?.effect?.includes('(P)')) || isSkillMasteryPassive;
    return { card, category, isSkillMasteryPassive, isPassive };
  }));
  const passesOthers = ({ card, isPassive }) => (!toolbar.hidePassives || !isPassive) && matchesTerm(card?.effect, toolbar.search);
  const countFor = (stat) => catalog.filter((entry) => passesOthers(entry) && matchesTerm(entry.card?.effect, stat)).length;
  const shown = catalog.filter((entry) => passesOthers(entry) && (toolbar.stat === 'all' || matchesTerm(entry.card?.effect, toolbar.stat)));
  const cardCount = presetCards.filter(Boolean).length;

  return (
    <>
      <NextSeo
        title="Card Search | Idleon Toolbox"
        description="Card search and filter by various tags e.g. Choppin, Catching, Worship, Attack etc"
      />
      <MissingSections account={state?.account} names={SECTION_NAMES}/>
      <Stack direction={'row'} gap={4}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Toolbar state={toolbar} defaults={CARD_TOOLBAR} onChange={setToolbar} onReset={resetToolbar} searchAlone
                   total={catalog.length} shown={shown.length} noun={'cards'}>
            <Toolbar.Search placeholder={'Search card effects'}/>
            <Toolbar.Lead>
              <Button variant={presetsOpen ? 'contained' : 'outlined'} startIcon={<IconCards size={18}/>} aria-pressed={presetsOpen}
                      sx={{ whiteSpace: 'nowrap' }} onClick={() => presetsOpen ? setPresetsOpen(false) : openPresets()}>
                {presets.length ? `Card presets (${presets.length})` : 'Card presets'}
              </Button>
            </Toolbar.Lead>
            <Toolbar.Show name={'stat'} label={'Stat'} options={[['all', 'Any stat'], ...STAT_PRESETS.map((stat) => [stat, stat, countFor(stat)])]}/>
            <Toolbar.Filter name={'hidePassives'} label={'Hide passive cards'}/>
          </Toolbar>
          {picking ? <Notice action={{ label: 'Done', onClick: () => setPresetsOpen(false) }} sx={{ mb: 2 }}>
            {targetSlot === 'set' ? `Next card goes into the card set slot of ${preset.name}.`
              : Number.isInteger(targetSlot) ? `Next card goes into slot ${targetSlot + 1} of ${preset.name}.`
                : `Adding to ${preset.name}: ${cardCount} / ${presetCards.length} cards. Tap a card's + to add it.`}
          </Notice> : null}
          {categoriesOrder.map((cardSet) => {
            const entries = shown.filter(({ category }) => category === cardSet);
            if (!entries.length) return null;
            const isCardSets = cardSet === 'Card Sets';
            return <Box key={cardSet} sx={{ mb: 2.5 }}>
              {isCardSets ? <Typography variant={'sectionTitle'} component={'h2'} sx={{ mb: 1.25 }}>Card sets</Typography>
                : <Box component={'img'} src={`${prefix}etc/${cardSet}_Card_Header.png`} alt={cleanUnderscore(cardSet)}
                       sx={{ display: 'block', maxWidth: '100%', mb: 1.25 }}/>}
              {/* A star's frame hangs 6 px past its card: inside the column, it stays under a pinned Toolbar when it scrolls */}
              <Stack direction={'row'} flexWrap={'wrap'} gap={2} sx={{ maxWidth: { md: 600 }, pl: '6px' }}>
                {entries.map(({ card, isSkillMasteryPassive }) => {
                  const { displayName, name } = card;
                  const owned = (isCardSets ? cardSetsData?.[name] : state?.account?.cards?.[displayName]) ?? {};
                  const nextLevelReq = isCardSets ? cardsObject[name]?.length * (Math.min(6, owned.stars + 1) + 1) : owned.nextLevelReq;
                  const slotIndex = isCardSets ? (presetCardSet === name ? 'set' : -1) : presetCards.indexOf(displayName);
                  const inPreset = slotIndex !== -1;
                  const label = cleanUnderscore(isCardSets ? name : displayName);
                  return <Box key={displayName ?? name} sx={[{ position: 'relative' }, picking && inPreset && IN_PRESET_SX]}>
                    <CardAndBorder nextLevelReq={nextLevelReq} amount={owned.amount} variant={isCardSets ? 'cardSet' : ''} showInfo
                                   {...{
                                     ...card,
                                     stars: owned.stars,
                                     displayName: isSkillMasteryPassive && displayName ? `${displayName} (P)` : displayName
                                   }}/>
                    {picking ? <>
                      {/* The button names the card; the number only says which slot it sits in */}
                      {inPreset ? <Box component={'span'} aria-hidden sx={SLOT_LABEL_SX}>{slotIndex === 'set' ? 'S' : slotIndex + 1}</Box> : null}
                      <ButtonBase disableRipple aria-pressed={inPreset} sx={[PICK_SX, inPreset && PICK_REMOVE_SX]}
                                  aria-label={`${inPreset ? 'Remove' : 'Add'} ${label} ${inPreset ? 'from' : 'to'} ${preset.name}`}
                                  onClick={() => pickCard(card, isCardSets)}>
                        {inPreset ? <IconMinus size={14} stroke={3}/> : <IconPlus size={14} stroke={3}/>}
                      </ButtonBase>
                    </> : null}
                  </Box>;
                })}
              </Stack>
            </Box>;
          })}
        </Box>
        {presetsOpen ? <CardPresets
          presets={presets}
          selected={selected}
          characters={state?.characters}
          hasAccount={Boolean(state?.account) && !state?.emptyAccount}
          targetSlot={targetSlot}
          onTargetSlot={setTargetSlot}
          onRemoveSlot={removeSlot}
          onSelect={(index) => {
            setSelectedPreset(index);
            setTargetSlot(null);
          }}
          onChange={updatePreset}
          onAdd={addPreset}
          onCreate={() => addPreset(emptyPreset(`Preset ${presets.length + 1}`))}
          onDelete={(index) => {
            setPresets(presets.filter((_, presetIndex) => presetIndex !== index));
            setSelectedPreset(Math.max(index - 1, 0));
            setTargetSlot(null);
          }}
          onNotify={({ message }) => notify(message)}
          onClose={() => setPresetsOpen(false)}
          getCard={getCard}
          getCardSet={getCardSet}
          catalogCards={catalogCards}
          cardSetsData={cardSetsData}
        /> : null}
      </Stack>
      {/* Room for the fixed bottom bar on small screens */}
      {presetsOpen ? <Box sx={{ height: { xs: 160, md: 0 } }}/> : null}
    </>
  );
}
