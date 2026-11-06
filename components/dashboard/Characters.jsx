import React, { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, pascalCase, prefix } from '@utility/helpers';
import { getActivityIcon } from '@utility/spriteImages';
import { alertMeta } from '@utility/dashboard/alertMeta';
import ErrorBoundary from '@components/common/ErrorBoundary';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { characterStatFacts } from '@components/characters/statFacts';
import AlertIcon, { counted } from './AlertIcon';
import {
  alchemyAlerts,
  anvilAlerts,
  bagsAlerts,
  cardsAlert,
  classSpecificAlerts,
  crystalCountdownAlerts,
  getDivinityAlert,
  getEquipmentAlert,
  getInventoryLocation,
  obolsAlerts,
  postOfficeAlerts,
  questsAlerts,
  starSignsAlerts,
  talentsAlerts,
  toolsAlerts,
  trapsAlerts,
  worshipAlerts
} from '@utility/dashboard/characters';
import Timer from '../common/Timer';
import { differenceInMinutes } from 'date-fns';
import { getTalentBonusIfActive } from '@parsers/talents';
import { CLASSES, getBaseClass } from '@parsers/classDefinitions';

const FORMS = [
  { talent: 'WRAITH_FORM', name: 'Wraith Form' },
  { talent: 'ARCANIST_FORM', name: 'Arcanist Form' },
  { talent: 'TEMPEST_FORM', name: 'Tempest Form' }
];
// Talent book per class line, named after the books in items.json: Beginner, Warrior, Archer and
// Wizard. TalentBook1 is the Special (ALL classes) book, used when the class isn't recognized.
const TALENT_BOOKS = {
  [CLASSES.Beginner]: 'TalentBook2',
  [CLASSES.Warrior]: 'TalentBook3',
  [CLASSES.Archer]: 'TalentBook4',
  [CLASSES.Mage]: 'TalentBook5'
};
const getTalentBookIcon = (className) => TALENT_BOOKS?.[getBaseClass(className)] || 'TalentBook1';

// An inventory alert names the item, which still leaves it to be found among a few hundred slots.
const itemLocationSuffix = (item) => {
  const location = getInventoryLocation(item?.slot);
  return location ? `: ${location}` : '';
};

const alertsMap = {
  anvil: anvilAlerts,
  worship: worshipAlerts,
  traps: trapsAlerts,
  quests: questsAlerts,
  alchemy: alchemyAlerts,
  obols: obolsAlerts,
  postOffice: postOfficeAlerts,
  starSigns: starSignsAlerts,
  crystalCountdown: crystalCountdownAlerts,
  tools: toolsAlerts,
  talents: talentsAlerts,
  cards: cardsAlert,
  divinityStyle: getDivinityAlert,
  equipment: getEquipmentAlert,
  bags: bagsAlerts,
  classSpecific: classSpecificAlerts
}

const Characters = ({ characters = [], account, lastUpdated, trackers, hideAlertless, onHideAlertless }) => {
  const cards = characters?.map((character, characterIndex) => {
    const {
      name,
      classIndex,
      afkTarget,
      afkTime,
      postOffice
    } = character;
    const options = Object.entries(trackers || {})?.reduce((result, [trackerName, data]) => {
      const { options, ...rest } = data;
      const optionObject = data?.options?.reduce((result, option) => ({
        ...result,
        [option?.name]: option
      }), {});
      return { ...result, [trackerName]: { ...rest, ...optionObject } }
    }, {});
    // An alert switched off computes nothing: since the switch stopped unticking every option, the
    // trackers?.x checks below would otherwise still show it.
    const failedTrackers = [];
    const alerts = Object.keys(options)?.reduce((result, trackerName) => {
      result[trackerName] = {};
      if (!options[trackerName]?.checked) return result;
      // One tracker that throws (a failed section's default it can't read) takes only its own icons
      try {
        result[trackerName] = alertsMap?.[trackerName]?.(account, characters, character, lastUpdated, options) || {};
      } catch (error) {
        failedTrackers.push(trackerName);
        console.error('[alerts]', name, trackerName, error);
      }
      return result;
    }, {});
    const { showMaxed, showNonMaxed } = options?.crystalCountdown || {};

    const alertIcons = <Stack direction={'row'} gap={1} flexWrap={'wrap'} alignItems={'center'}>
      {trackers?.worship && alerts?.worship?.unendingEnergy ?
        <Alert target={'worship.unendingEnergy'} title={`${name} has unending energy prayer and is afk for more than 10 hours`}
               iconPath={'data/Prayer2'}/> : null}
      {trackers?.worship && alerts?.worship?.ruckSack ?
        <Alert target={'worship.ruckSack'} title={`${name} has the Ruck Sack prayer equipped while afk (lowers AFK gains)`}
               iconPath={'data/Prayer12'}/> : null}
      {trackers?.divinityStyle && Object.keys(alerts?.divinityStyle).length ?
        <Alert target={'divinityStyle'} title={`${name} ${alerts?.divinityStyle?.text}`}
               iconPath={`etc/${alerts?.divinityStyle?.icon}`}/> : null}
      {trackers?.worship && alerts?.worship?.chargeOverdue ?
        <Alert target={'worship.chargeOverdue'} title={`${name} worship is full`} iconPath={'data/ClassIcons50'}/> : null}
      {trackers?.traps && alerts?.traps?.trapsOverdue ?
        <Alert target={'traps.trapsOverdue'} title={`${name} traps are overdue`} iconPath={'data/TrapBoxSet1'}/> : null}
      {trackers?.traps && alerts?.traps?.missingTraps ?
        <Alert target={'traps.missingTraps'} title={`${name} is missing a trap`} iconPath={'data/ClassIcons48'}/> : null}
      {trackers?.quests && alerts?.quests?.picnicDaily ?
        <Alert target={'quests.picnicDaily'} title={`${name} hasn't done the Picnic Stowaway daily quest today`}
               iconPath={'etc/Picnic_Stowaway'}/> : null}
      {trackers?.alchemy && alerts?.alchemy?.missingBubbles ?
        <Alert target={'alchemy.missingBubbles'} title={`${name} is missing an active bubble`} iconPath={'data/aJarB0'}/> : null}
      {trackers?.alchemy && alerts?.alchemy?.noActivity ?
        <Alert target={'alchemy.noActivity'} title={`${name} is not doing any alchemy activity`} iconPath={'etc/NoAlcActivity'}/> : null}
      {trackers?.cards && alerts?.cards?.cardSet ?
        <Alert target={'cards.cardSet'} title={alerts?.cards?.cardSet?.text}
               iconPath={`data/${character?.cards?.cardSet?.rawName || 'CardSet0'}`}/> : null}
      {trackers?.cards && alerts?.cards?.passiveCards ?
        <Alert target={'cards.passiveCards'} title={`${name} has a passive card equipped`}
               iconPath={`etc/PassiveCard`}/> : null}
      {trackers?.obols && alerts?.obols?.missingObols?.length > 0 ?
        <Alert target={'obols.missingObols'} title={`${name} has ${counted(alerts?.obols?.missingObols?.length, 'empty obol slot')}`}
               iconPath={'data/ObolLocked1'}/> : null}
      {trackers?.postOffice && alerts?.postOffice?.unspentPoints ?
        <Alert target={'postOffice.unspentPoints'} title={`${name} has ${counted(Math.floor(postOffice?.unspentPoints), 'unspent post office point')}`}
               iconPath={'data/UIboxUpg0'}/> : null}
      {trackers?.anvil && alerts?.anvil?.missingHammers > 0 ?
        <Alert target={'anvil.missingHammers'} title={`${name} is missing ${counted(alerts?.anvil?.missingHammers, 'hammer')}`}
               iconPath={'data/GemP1'}/> : null}
      {trackers?.anvil && alerts?.anvil?.unspentPoints > 0 ?
        <Alert target={'anvil.unspentPoints'} title={`${name} has ${counted(alerts?.anvil?.unspentPoints, 'unspent anvil point')}`}
               iconPath={'data/ClassIcons43'}/> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.wrongItems?.acWeapon ?
        <Alert target={'classSpecific.wrongItems'} title={`${name} is not in Arcanist form but is using an Arcanist-form weapon`}
               iconPath={'data/EquipmentWandsArc0'}/> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.wrongItems?.acRings ?
        <Alert target={'classSpecific.wrongItems'} title={`${name} is not in Arcanist form but is using an Arcanist-form ring`}
               iconPath={`data/${alerts?.classSpecific?.wrongItems?.acRings}`}/> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.wrongItems?.wwWeapon ?
        <Alert target={'classSpecific.wrongItems'} title={`${name} is not in Tempest form but is using a Tempest-form weapon`}
               iconPath={`data/${alerts?.classSpecific?.wrongItems?.wwWeapon}`}
        /> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.wrongItems?.wwRings ?
        <Alert target={'classSpecific.wrongItems'} title={`${name} is not in Tempest form but is using a Tempest-form ring`}
               iconPath={`data/${alerts?.classSpecific?.wrongItems?.wwRings}`}
        /> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.betterWeapon ?
        <Alert target={'classSpecific.betterWeapon'} title={`${name} has a better class-specific weapon in their inventory: ${cleanUnderscore(alerts?.classSpecific?.betterWeapon?.displayName || alerts?.classSpecific?.betterWeapon?.rawName)}${alerts?.classSpecific?.betterWeapon?.Weapon_Power ? ` (WP ${alerts?.classSpecific?.betterWeapon?.Weapon_Power}${alerts?.classSpecific?.betterWeapon?.UQ1txt ? `, +${alerts?.classSpecific?.betterWeapon?.UQ1val}% ${cleanUnderscore(alerts?.classSpecific?.betterWeapon?.UQ1txt)}` : ''})` : ''}${itemLocationSuffix(alerts?.classSpecific?.betterWeapon)}`}
               iconPath={`data/${alerts?.classSpecific?.betterWeapon?.rawName}`}
               extra={<UpgradeArrow/>}
        /> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.betterRing ?
        <Alert target={'classSpecific.betterRing'} title={`${name} has a better class-specific ring in their inventory: ${cleanUnderscore(alerts?.classSpecific?.betterRing?.displayName || alerts?.classSpecific?.betterRing?.rawName)}${alerts?.classSpecific?.betterRing?.UQ1txt ? ` (+${alerts?.classSpecific?.betterRing?.UQ1val}${cleanUnderscore(alerts?.classSpecific?.betterRing?.UQ1txt)}${alerts?.classSpecific?.betterRing?.UQ2txt ? `, +${alerts?.classSpecific?.betterRing?.UQ2val}${cleanUnderscore(alerts?.classSpecific?.betterRing?.UQ2txt)}` : ''})` : ''}${itemLocationSuffix(alerts?.classSpecific?.betterRing)}`}
               iconPath={`data/${alerts?.classSpecific?.betterRing?.rawName}`}
               extra={<UpgradeArrow/>}
        /> : null}
      {trackers?.equipment && alerts?.equipment?.availableUpgradesSlots?.length > 0 ?
        alerts?.equipment?.availableUpgradesSlots?.map(({
                                                          displayName,
                                                          rawName,
                                                          Upgrade_Slots_Left
                                                        }, index) => {
          return <Alert target={'equipment.availableUpgradesSlots'} key={`slots-${name}-${characterIndex}-${rawName}-${index}`}
                        title={`${cleanUnderscore(displayName)} has ${formatNum(Upgrade_Slots_Left)} available upgrade slot${Upgrade_Slots_Left === 1 ? '' : 's'}`}
                        iconPath={`data/${rawName}`}/>;
        }) : null}
      {trackers?.equipment && alerts?.equipment?.emptyGearSlots?.length > 0 ?
        <Alert target={'equipment.emptyGearSlots'} title={`${name} has empty equipment slots: ${alerts?.equipment?.emptyGearSlots?.join(', ')}`}
               iconPath={'data/EquipmentTransparent1'}/> : null}
      {trackers?.bags && alerts?.bags?.unmaxedBags?.length > 0 ?
        <Alert target={'bags.unmaxedBags'} title={<BagList name={name} bags={alerts?.bags?.unmaxedBags}/>}
               iconPath={'data/MaxCapBagM13'}/> : null}
      {trackers?.anvil && alerts?.anvil?.anvilOverdue?.length > 0 ?
        alerts?.anvil?.anvilOverdue?.map(({ diff, name, rawName }) => {
          const isFull = diff <= 0;
          return <Alert target={'anvil.anvilOverdue'} key={`${name}-${characterIndex}`}
                        title={`${cleanUnderscore(name)} ${isFull
                          ? 'production is full'
                          : `is ${counted(diff, 'minute')} away from being full`}`}
                        iconPath={`data/${rawName}`}/>;
        }) : null}
      {trackers?.starSigns && alerts?.starSigns?.missingStarSigns > 0 ?
        <Alert target={'starSigns.missingStarSigns'} title={`${name} is missing ${counted(alerts?.starSigns?.missingStarSigns, 'star sign')}`}
               iconPath={'data/SignStar1b'}/> : null}
      {trackers?.talents && alerts?.talents?.talents?.length > 0 ? alerts?.talents?.talents?.map(({
                                                                                                    name,
                                                                                                    skillIndex,
                                                                                                    cooldown
                                                                                                  }, index) => (
        <Alert target={'talents.talents'} key={skillIndex + '-' + index}
               items={[{ key: name, label: cleanUnderscore(pascalCase(name)) }]}
               look={{ opacity: cooldown > 0 ? .5 : 1 }}
               label={`${cleanUnderscore(pascalCase(name))} ${cooldown > 0 ? 'is on cooldown' : 'is ready'}`}
               title={cooldown > 0
                 ? <>{cleanUnderscore(pascalCase(name))} cooldown: <Timer type={'countdown'} component={'span'}
                                                                             date={cooldown} lastUpdated={lastUpdated}/></>
                 : `${cleanUnderscore(pascalCase(name))} is ready`}
               iconPath={`data/UISkillIcon${skillIndex}`}/>
      )) : null}
      {trackers?.talents && alerts?.talents?.superTalentLeftToSpend > 0 ?
        <Alert target={'talents.superTalentLeftToSpend'}
          title={`${name} has ${alerts?.talents?.superTalentLeftToSpend} unspent super talent point${alerts?.talents?.superTalentLeftToSpend === 1
            ? ''
            : 's'}`}
          iconPath={'data/LegendTalentIcon0'}/> : null}
      {trackers?.talents && alerts?.talents?.unmaxedTalents?.length > 0 ?
        <Alert target={'talents.unmaxedTalents'}
          title={<TalentList name={name} noun={'talent'} verb={'below max level'}
                             talents={alerts?.talents?.unmaxedTalents}/>}
          iconPath={`data/${getTalentBookIcon(character?.class)}`}/> : null}
      {trackers?.talents && alerts?.talents?.libraryUpgradableTalents?.length > 0 ?
        <Alert target={'talents.libraryUpgradableTalents'}
          title={<TalentList name={name} noun={'talent'} verb={'the Library can raise'}
                             talents={alerts?.talents?.libraryUpgradableTalents}/>}
          iconPath={`data/${getTalentBookIcon(character?.class)}`}/> : null}
      {trackers?.tools?.checked && alerts?.tools?.length > 0 ? alerts?.tools?.map(({
                                                                                     rawName,
                                                                                     displayName
                                                                                   }, index) => (
        <Alert target={'tools'} key={`${character?.name}-${rawName}-${index}`}
               title={`${character?.name} can equip ${cleanUnderscore(pascalCase(displayName))}`}
               iconPath={`data/${rawName}`}/>
      )) : null}
      {trackers?.crystalCountdown && alerts?.crystalCountdown?.length > 0 ? alerts?.crystalCountdown?.map(({
                                                                                                             name,
                                                                                                             icon,
                                                                                                             reduction,
                                                                                                             crystalCountdown
                                                                                                           }, index) => {
          const ready = crystalCountdown > 0 && Math.floor(reduction) >= Math.floor(crystalCountdown);
          if (!showMaxed?.checked && ready || !showNonMaxed?.checked && (showMaxed?.checked && !ready) || (!showNonMaxed?.checked && !showMaxed?.checked)) return null;
          return <Alert target={'crystalCountdown'} key={icon + '-' + index + '-' + characterIndex}
                        items={[{ key: icon, label: cleanUnderscore(pascalCase(name)) }]}
                        look={{ opacity: ready || reduction > 0 ? 1 : .5 }}
                        title={`Crystal cooldown for ${cleanUnderscore(pascalCase(name))} is ${ready
                          ? `maxed (${formatNum(reduction, 'pct')})`
                          : `${formatNum(reduction, 'pct')} of ${formatNum(crystalCountdown, 'pct')}`}`}
                        iconPath={`data/${icon}`}/>
        }
      ) : null}
    </Stack>;
    // toArray() mirrors what actually renders: it flattens the nested maps and drops the nulls of
    // every unmet condition, so none of the alert conditions above have to be repeated here.
    const hasAlerts = React.Children.toArray(alertIcons.props.children).length > 0;
    if (hideAlertless && !hasAlerts && !failedTrackers.length) return null;

    return <CharacterCard key={name} character={character} characters={characters} account={account}
                          lastUpdated={lastUpdated} failedTrackers={failedTrackers}>
      {hasAlerts ? alertIcons : null}
    </CharacterCard>;
  })?.filter(Boolean);

  return <Box>
    {/* Only this section's cards: the bar counts what it hides. With every card hidden its own empty note says so. */}
    <Toolbar state={{ hideAlertless: Boolean(hideAlertless) }} defaults={{ hideAlertless: false }}
             onChange={(patch) => onHideAlertless?.(Boolean(patch.hideAlertless))} onReset={() => onHideAlertless?.(false)}
             total={characters?.length ?? 0} shown={cards?.length ?? 0} noun={'characters'}
             emptyNote={'All caught up: no character has an alert.'}>
      <Toolbar.Filter name={'hideAlertless'} label={'Hide characters without alerts'}/>
    </Toolbar>
    <CardGrid size={'s'}>{cards}</CardGrid>
  </Box>;
};

// A character's card: who it is, what it's doing, its alerts, and its stats on a button (not remembered).
const CharacterCard = ({ character, characters, account, lastUpdated, failedTrackers, children }) => {
  const [statsOpen, setStatsOpen] = useState(false);
  const { name, classIndex, afkTarget, afkTime, stats } = character;
  // Both ends of the save: no clock read, and a character that was active when the save was taken stays "Active"
  const isActive = differenceInMinutes(lastUpdated, afkTime) <= 5;
  const activity = afkTarget && afkTarget !== '_' ? cleanUnderscore(afkTarget) : 'Nothing';
  const classIcon = classIndex !== undefined ? `data/ClassIcons${classIndex}.png` : 'afk_targets/Nothing.png';
  const form = FORMS.find(({ talent }) => getTalentBonusIfActive(character?.activeBuffs, talent));
  return <Box data-cy={`character-${name}`} sx={{ height: '100%' }}>
    <ItemCard icon={<GameIcon src={classIcon} size={40} alt={''}/>} title={name} level={{ value: stats?.level ?? 0 }}
              meta={isActive ? 'Active' : <>AFK <Timer type={'up'} date={afkTime} lastUpdated={lastUpdated} component={'span'}/></>}
              footer={<Button size={'small'} aria-expanded={statsOpen} onClick={() => setStatsOpen(!statsOpen)} sx={{ alignSelf: 'flex-start' }}>
                {statsOpen ? 'Hide stats' : 'Show stats'}
              </Button>}>
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        <GameIcon src={getActivityIcon(character).slice(prefix.length)} size={24} alt={''}/>
        <Typography variant={'body2'} color={'text.secondary'}>{[activity, form?.name].filter(Boolean).join(' · ')}</Typography>
      </Stack>
      {children}
      {failedTrackers.map((tracker) => <StatusText key={tracker} status={'problem'} wrap>
        {`Couldn't check ${alertMeta[`characters.${tracker}`]?.label ?? tracker} alerts.`}
      </StatusText>)}
      {statsOpen ? <ErrorBoundary title={'These stats didn\'t load'}>
        <CharacterStats character={character} characters={characters} account={account}/>
      </ErrorBoundary> : null}
    </ItemCard>
  </Box>;
};

// Computed only once opened: a character's full stats read most of the save.
const CharacterStats = ({ character, characters, account }) => <ItemCard.Facts
  rows={characterStatFacts(character, characters, account).map(({ label, value, rowText }) => [label, account?.failedSections?.length ? '-' : rowText ?? value])}/>;

const UpgradeArrow = () => <Box component={'span'} sx={{ position: 'absolute', top: -4, right: -4, display: 'inline-flex' }}>
  <GameIcon src={'data/UpgArrowG.png'} size={16} alt={'Better than equipped'}/>
</Box>;

const TALENT_LIST_LIMIT = 15;
const TalentList = ({ name, noun, verb, talents }) => {
  const shown = talents?.slice(0, TALENT_LIST_LIMIT);
  const rest = talents?.length - shown?.length;
  return <Stack gap={.5}>
    <Typography variant={'body2'}>{name} has {counted(talents?.length, noun)} {verb}</Typography>
    {shown?.map(({ name: talentName, skillIndex, level, target }, index) => (
      <Stack key={`${skillIndex}-${index}`} direction={'row'} alignItems={'center'} gap={1}>
        <GameIcon src={`data/UISkillIcon${skillIndex}.png`} size={24} alt={''}/>
        <Typography variant={'body2'}>
          {cleanUnderscore(pascalCase(talentName))} {formatNum(level)} → {formatNum(target)}
        </Typography>
      </Stack>
    ))}
    {rest > 0 ? <Typography variant={'body2'} color={'text.secondary'}>and {rest} more</Typography> : null}
  </Stack>
}

const BAG_TYPE_NAMES = { bCraft: 'Materials', Foods: 'Food' };
const BagList = ({ name, bags }) => {
  return <Stack gap={.5}>
    <Typography variant={'body2'}>{name} has {counted(bags?.length, 'unmaxed carry bag')}</Typography>
    {bags?.map(({ bagType, capacity, maxCapacity, rawName }, index) => (
      <Stack key={`${bagType}-${index}`} direction={'row'} alignItems={'center'} gap={1}>
        <GameIcon src={`data/${rawName}.png`} size={24} alt={''}/>
        <Typography variant={'body2'}>
          {BAG_TYPE_NAMES[bagType] || bagType}: {formatNum(capacity)} → {formatNum(maxCapacity)}
        </Typography>
      </Stack>
    ))}
  </Stack>
}

// `target` is the dot path of the alert's own setting (see utility/dashboard/settingsTarget): a tap opens its quick
// edit, which leads with the title.
const Alert = ({ title, label, iconPath, look, extra, target, items, worlds }) => <AlertIcon
  configType={'characters'} target={target} extra={items || worlds ? { items, worlds } : undefined}
  message={title} label={label} icon={`${iconPath}.png`} look={look}>
  {extra}
</AlertIcon>;

export default Characters;
