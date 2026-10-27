import React, { useContext, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { IconCards, IconMinus, IconPlus } from '@tabler/icons-react';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { cards, cardSets, stats } from '@website-data';
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/material/styles';
import { AppContext } from 'components/common/context/AppProvider';
import { CardAndBorder } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import { useLocalStorage } from '@mantine/hooks';
import { isMasteryBonusUnlocked } from '@parsers/misc';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import NoticeSnackbar, { NoticeStack } from '@components/common/NoticeSnackbar';
import UndoSnackbar from '@components/dashboard/settings/UndoSnackbar';
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

export default function CardSearch() {
  const { state } = useContext(AppContext);
  const [value, setValue] = useState('');
  const [hidePassives, setHidePassives] = useLocalStorage({
    key: 'card-search:hidePassives',
    defaultValue: false
  });
  const [storedPresets, setPresets] = useLocalStorage({ key: 'card-search:presets', defaultValue: [] });
  const [selectedPreset, setSelectedPreset] = useLocalStorage({ key: 'card-search:selectedPreset', defaultValue: 0 });
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [notice, setNotice] = useState(null);
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
  const notify = (next) => setNotice({ ...next, id: (notice?.id ?? 0) + 1 });
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
        return notify({ message: `Removed ${name} from ${preset.name}`, undo });
      }
      updatePreset({ ...preset, cardSet: card.name });
      setTargetSlot(null);
      if (preset.cardSet) notify({ message: `Replaced ${cleanUnderscore(preset.cardSet)} with ${name}`, undo });
      return;
    }
    const currentSlot = preset.cards.indexOf(card.displayName);
    if (currentSlot !== -1) {
      removeSlot(currentSlot);
      return notify({ message: `Removed ${name} from ${preset.name}`, undo });
    }
    const slot = Number.isInteger(targetSlot) ? targetSlot : preset.cards.findIndex((current) => !current);
    if (slot === -1) return notify({ message: `${preset.name} is full: click a slot to replace it` });
    const replaced = preset.cards[slot];
    updatePreset({ ...preset, cards: preset.cards.map((current, index) => index === slot ? card.displayName : current) });
    setTargetSlot(null);
    if (replaced) notify({ message: `Replaced ${cleanUnderscore(replaced)} with ${name}`, undo });
  };
  const picking = presetsOpen && Boolean(preset);
  const presetCards = preset?.cards || [];
  const presetCardSet = preset?.cardSet;
  const localCardObject = Object.keys(cardsObject).reduce((res, cardSet) => {
    const cardsArr = cardsObject[cardSet];
    const sortedCardArr = cardsArr.filter(({ effect }) => {
      const isSkillMasteryPassive = isSkillMasteryPassiveCards({ effect, account: state?.account });
      if (hidePassives && (effect?.includes('(Passive)') || effect?.includes('(P)') || isSkillMasteryPassive)) {
        return false;
      }
      const cleanEffect = effect.replace(/[+%{]+_/, '').replace(/_/g, ' ');
      const isEffect = cleanEffect?.toLowerCase()?.includes(value.toLowerCase())
      const additionalEffect = additionalEffects[value.toLowerCase()]?.includes(cleanUnderscore(cleanEffect));
      return isEffect || additionalEffect;
    });
    return { ...res, [cardSet]: sortedCardArr };
  }, {});

  const preConfiguredStats = [
    'Show All',
    'Afk',
    'Choppin',
    'Mining',
    'Fishing',
    'Catching',
    'Trapping',
    'Cooking',
    'Worship',
    'Spelunking',
    'Lab',
    'Crystal Mob',
    'Accuracy',
    'Money',
    'Card Drop',
    'Drop Rate',
    'Monster Exp',
    'Skill Exp',
    'Defence',
    'Damage',
    'Dungeon',
    'Stats',
    'STR',
    'AGI',
    'WIS',
    'LUK'
  ];

  return (
    <>
      <NextSeo
        title="Card Search | Idleon Toolbox"
        description="Card search and filter by various tags e.g. Choppin, Catching, Worship, Attack etc"
      />
      <Main>
        <Stack direction="row" alignItems="center" gap={2} mb={2} flexWrap={'wrap'}>
          <StyledTextField
            InputProps={{
              endAdornment: (
                <StyledInputAdornment onClick={() => setValue('')} position="end">
                  <ClearIcon/>
                </StyledInputAdornment>
              )
            }}
            label="Enter Card stat.."
            type="text"
            value={value}
            onChange={({ target }) => setValue(target?.value)}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={hidePassives}
                onChange={(e) => setHidePassives(e.target.checked)}
              />
            }
            label="Hide Passive Cards"
          />
          <Button variant={presetsOpen ? 'contained' : 'outlined'} size={'small'} startIcon={<IconCards size={18}/>}
                  aria-pressed={presetsOpen}
                  onClick={() => presetsOpen ? setPresetsOpen(false) : openPresets()}>
            Card presets{presets.length ? ` (${presets.length})` : ''}
          </Button>
        </Stack>

        <Stack direction={'row'} my={2} gap={1} flexWrap={'wrap'}>
          {preConfiguredStats.map((stat, index) => (
            <Chip
              sx={{
                borderRadius: '8px',
                height: 24,
                minWidth: 60,
                maxWidth: 150,
                border: '1px solid gray'
              }}
              key={stat + '' + index}
              size="small"
              variant="outlined"
              label={stat}
              onClick={() => {
                setValue(stat === 'Show All' ? '' : stat);
              }}
            />
          ))}
        </Stack>

        <Stack direction={'row'} gap={4}>
        <div className={`cards${picking ? ' picking' : ''}`}>
          {picking ? <PickingStrip direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
            <Typography variant={'body2'}>
              {Number.isInteger(targetSlot) || targetSlot === 'set'
                ? <>Next card goes into {targetSlot === 'set' ? 'the card set slot' : `slot ${targetSlot + 1}`} of <b>{preset.name}</b></>
                : <>Adding to <b>{preset.name}</b>: {presetCards.filter(Boolean).length}/{presetCards.length} cards.
                  Click a card to add or remove it</>}
            </Typography>
            <Box sx={{ flex: 1 }}/>
            <Button size={'small'} onClick={() => setPresetsOpen(false)}>Done</Button>
          </PickingStrip> : null}
          {Object.keys(localCardObject)?.length > 0 ? (
            categoriesOrder.map((cardSet, cardSetIndex) => {
              const cardsArr = localCardObject[cardSet];
              if (!cardsArr || cardsArr?.length === 0) return null;
              const isCardSets = cardSet === 'Card Sets';
              return (
                <React.Fragment key={cardSet + '' + cardSetIndex}>
                  {isCardSets ? <Typography my={1} variant={'h5'}>Card Sets</Typography> :
                    <img src={`${prefix}etc/${cardSet}_Card_Header.png`}
                         style={{ margin: '20px 0 10px 0' }}
                         alt={cardSet}
                    />}
                  <Stack direction={'row'} flexWrap={'wrap'} gap={2} sx={{ maxWidth: 600 }}>
                    {cardsArr.map((card, index) => {
                      const { displayName, name, effect } = card;
                      let {
                        stars,
                        amount,
                        nextLevelReq
                      } = state?.account?.cards?.[displayName] || {};
                      const isSkillMasteryPassive = isSkillMasteryPassiveCards({
                        effect,
                        account: state?.account
                      });
                      if (isCardSets) {
                        ({ stars, amount } = cardSetsData?.[name] || {});
                        nextLevelReq = cardsObject[name].length * (Math.min(6, stars + 1) + 1);
                      }
                      const slotIndex = isCardSets ? (presetCardSet === name ? 'set' : -1) : presetCards.indexOf(displayName);
                      const inPreset = slotIndex !== -1;
                      const label = cleanUnderscore(isCardSets ? name : displayName);

                      return (
                        <div key={displayName + '' + index}
                             className={`card-cell${picking && inPreset ? ' in-preset' : ''}`}
                             style={{ position: 'relative' }}
                             {...(picking ? {
                               role: 'button',
                               tabIndex: 0,
                               'aria-label': `${inPreset ? 'Remove' : 'Add'} ${label} ${inPreset ? 'from' : 'to'} ${preset.name}`,
                               'aria-pressed': inPreset,
                               onClick: () => pickCard(card, isCardSets),
                               onKeyDown: (e) => {
                                 if (e.key !== 'Enter' && e.key !== ' ') return;
                                 e.preventDefault();
                                 pickCard(card, isCardSets);
                               }
                             } : {})}>
                          {picking && inPreset ? <span className={'slot-chip'}>
                            {slotIndex === 'set' ? 'S' : slotIndex + 1}
                          </span> : null}
                          {picking ? <span className={`pick-badge${inPreset ? ' remove' : ''}`}>
                            {inPreset ? <IconMinus size={14} stroke={3}/> : <IconPlus size={14} stroke={3}/>}
                          </span> : null}
                          <CardAndBorder nextLevelReq={nextLevelReq} amount={amount}
                                         tooltipProps={picking ? PICKING_TOOLTIP : undefined}
                                         variant={isCardSets ? 'cardSet' : ''} showInfo
                                         {...{
                                           ...card,
                                           stars,
                                           displayName: isSkillMasteryPassive ? `${displayName} (P)` : displayName
                                         }}
                          />
                        </div>
                      );
                    })}
                  </Stack>
                </React.Fragment>
              );
            })
          ) : (
            <div className="not-found">Please try another phrase</div>
          )}
        </div>
          {presetsOpen ? <CardPresets
            presets={presets}
            selected={selected}
            characters={state?.characters}
            hasAccount={Boolean(state?.account)}
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
            onNotify={notify}
            onClose={() => setPresetsOpen(false)}
            getCard={getCard}
            getCardSet={getCardSet}
            catalogCards={catalogCards}
            cardSetsData={cardSetsData}
          /> : null}
        </Stack>
        {/* Room for the fixed bottom bar on small screens */}
        {presetsOpen ? <Box sx={{ height: { xs: 160, md: 0 } }}/> : null}
        <NoticeStack>
          {notice?.undo ? <UndoSnackbar key={notice.id} label={notice.message} stacked
                                        onUndo={() => {
                                          notice.undo();
                                          setNotice(null);
                                        }}
                                        onClose={() => setNotice(null)}/>
            : notice ? <NoticeSnackbar key={notice.id} label={notice.message} stacked autoHideDuration={4000}
                                       onClose={() => setNotice(null)}/> : null}
        </NoticeStack>
      </Main>
    </>
  );
}

// While picking, the card tooltip must not catch the pointer over the card it belongs to
const PICKING_TOOLTIP = { disableInteractive: true, enterDelay: 600, enterNextDelay: 600 };

const PickingStrip = styled(Stack)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1, 1.5),
  maxWidth: 600,
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: 8
}));

const StyledTextField = styled(TextField)`
  && label.Mui-focused {
    color: rgba(255, 255, 255, 0.7);
  }

  & .MuiInput-underline:after {
    border-bottom-color: green;
  }
`;

const StyledInputAdornment = styled(InputAdornment)`
  cursor: pointer;
`;

const Main = styled('main')`
  color: white;

  .chips {
    margin: 20px 0;

    .chip {
      margin-right: 10px;
      margin-top: 8px;
    }
  }

  .cards {
    min-height: 600px;
    min-width: 0;

    .pick-badge, .slot-chip {
      position: absolute;
      z-index: 1;
      pointer-events: none;
    }

    &.picking .card-cell {
      cursor: pointer;
      border-radius: 6px;
      outline-offset: 2px;

      // Inside the card's top-right corner: the slot chip holds top-left, and the tooltip opens below
      .pick-badge {
        top: 2px;
        right: 2px;
        width: 20px;
        height: 20px;
        display: none;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: ${({ theme }) => theme.palette.primary.main};
        color: ${({ theme }) => theme.palette.primary.contrastText};

        &.remove {
          background: ${({ theme }) => theme.palette.error.main};
          color: ${({ theme }) => theme.palette.error.contrastText};
        }
      }

      &:hover, &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.palette.primary.main};

        .pick-badge {
          display: flex;
        }
      }

      &.in-preset {
        outline: 2px solid ${({ theme }) => theme.palette.primary.main};

        &:hover, &:focus-visible {
          outline-width: 3px;
        }
      }

      .slot-chip {
        top: 2px;
        left: 2px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: 9px;
        background: ${({ theme }) => theme.palette.primary.main};
        color: ${({ theme }) => theme.palette.primary.contrastText};
        font-size: 12px;
        font-weight: 700;
        line-height: 18px;
        text-align: center;
      }
    }

    .category-wrapper {


    }

    .card-banner {
      margin: 10px;
      display: block;
    }

    .not-found {
      margin: 20px;
      font-size: 30px;
    }

    .image-wrapper {
      display: inline-block;
    }
  }
`;
