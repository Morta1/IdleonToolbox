import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { IconCircleCheckFilled, IconInfoCircleFilled } from '@tabler/icons-react';
import { cleanUnderscore, kFormatter, notateNumber, pascalCase, prefix } from '@utility/helpers';
import styled from '@emotion/styled';
import { getActivityIcon } from '@utility/spriteImages';
import HtmlTooltip from '../Tooltip';
import { useOpenDashboardSettings } from '@components/common/context/DashboardSettingsProvider';
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
import { TitleAndValue } from '../common/styles';
import { getAfkGain, getCashMulti, getDropRate, getRespawnRate } from '@parsers/character';
import { getMaxDamage, notateDamage } from '@parsers/damage';
import { differenceInMinutes } from 'date-fns';
import { getTalentBonusIfActive } from '@parsers/talents';
import { CLASSES, getBaseClass } from '@parsers/classDefinitions';

const formMap = {
  'data/UISkillIcon195': 'Wraith Form',
  'data/UISkillIcon585': 'Arcanist Form',
  'data/UISkillIcon420': 'Tempest Form'
}
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
  return location ? ` - ${location}` : '';
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

const Characters = ({ characters = [], account, lastUpdated, trackers, hideAlertless }) => {
  const cards = characters?.map((character, characterIndex) => {
    const {
      name,
      classIndex,
      afkTarget,
      afkTime,
      postOffice,
      targetMonster,
      monsterFace
    } = character;
    const options = Object.entries(trackers || {})?.reduce((result, [trackerName, data]) => {
      const { options, ...rest } = data;
      const optionObject = data?.options?.reduce((result, option) => ({
        ...result,
        [option?.name]: option
      }), {});
      return { ...result, [trackerName]: { ...rest, ...optionObject } }
    }, {});
    const alerts = Object.keys(options)?.reduce((result, trackerName) => {
      result[trackerName] = alertsMap?.[trackerName]?.(account, characters, character, lastUpdated, options) || {};
      return result;
    }, {});
    const isActive = () => {
      const timePassed = new Date().getTime() + (afkTime - lastUpdated);
      const minutes = differenceInMinutes(new Date(), new Date(timePassed));
      return minutes <= 5;
    };
    const activity = afkTarget && afkTarget !== '_' ? afkTarget : 'Nothing';
    const classIcon = classIndex !== undefined ? `data/ClassIcons${classIndex}.png` : 'afk_targets/Nothing.png'
    const dbFormActive = getTalentBonusIfActive(character?.activeBuffs, 'WRAITH_FORM') && 'data/UISkillIcon195';
    const acFormActive = getTalentBonusIfActive(character?.activeBuffs, 'ARCANIST_FORM') && 'data/UISkillIcon585';
    const wwFormActive = getTalentBonusIfActive(character?.activeBuffs, 'TEMPEST_FORM') && 'data/UISkillIcon420';
    const charForm = dbFormActive || acFormActive || wwFormActive;


    const alertIcons = <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {trackers?.worship && alerts?.worship?.unendingEnergy ?
        <Alert target={'worship.unendingEnergy'} title={`${name} has unending energy prayer and is afk for more than 10 hours`}
               iconPath={'data/Prayer2'}/> : null}
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
        <Alert target={'obols.missingObols'} title={`${name} has ${alerts?.obols?.missingObols?.length} empty obol slots`}
               iconPath={'data/ObolLocked1'}/> : null}
      {trackers?.postOffice && alerts?.postOffice?.unspentPoints ?
        <Alert target={'postOffice.unspentPoints'} title={`${name} has ${Math.floor(postOffice?.unspentPoints)} unspent post office points`}
               iconPath={'data/UIboxUpg0'}/> : null}
      {trackers?.anvil && alerts?.anvil?.missingHammers > 0 ?
        <Alert target={'anvil.missingHammers'} title={`${name} is missing ${alerts?.anvil?.missingHammers} hammers`}
               iconPath={'data/GemP1'}/> : null}
      {trackers?.anvil && alerts?.anvil?.unspentPoints > 0 ?
        <Alert target={'anvil.unspentPoints'} title={`${name} has ${alerts?.anvil?.unspentPoints} unspent anvil points`}
               iconPath={'data/ClassIcons43'}/> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.wrongItems?.acWeapon ?
        <Alert target={'classSpecific.wrongItems'} title={`${name} is not in Arcanist form but is using an Arcanist-form weapon`}
               iconPath={'data/EquipmentWandsArc0'}/> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.wrongItems?.acRings ?
        <Alert target={'classSpecific.wrongItems'} title={`${name} is not in Arcanist form but is using an Arcanist-form ring`}
               iconPath={`data/${alerts?.classSpecific?.wrongItems?.acRings}`}/> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.wrongItems?.wwWeapon ?
        <Alert target={'classSpecific.wrongItems'} title={`${name} is not in Temptest form but is using a Tempest-form weapon`}
               style={{ zIndex: 1 }}
               iconPath={`data/${alerts?.classSpecific?.wrongItems?.wwWeapon}`}
        /> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.wrongItems?.wwRings ?
        <Alert target={'classSpecific.wrongItems'} title={`${name} is not in Temptest form but is using a Tempest-form ring`}
               style={{ zIndex: 1 }}
               iconPath={`data/${alerts?.classSpecific?.wrongItems?.wwRings}`}
        /> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.betterWeapon ?
        <Alert target={'classSpecific.betterWeapon'} title={`${name} has a better class-specific weapon in their inventory: ${cleanUnderscore(alerts?.classSpecific?.betterWeapon?.displayName || alerts?.classSpecific?.betterWeapon?.rawName)}${alerts?.classSpecific?.betterWeapon?.Weapon_Power ? ` (WP ${alerts?.classSpecific?.betterWeapon?.Weapon_Power}${alerts?.classSpecific?.betterWeapon?.UQ1txt ? `, +${alerts?.classSpecific?.betterWeapon?.UQ1val}% ${cleanUnderscore(alerts?.classSpecific?.betterWeapon?.UQ1txt)}` : ''})` : ''}${itemLocationSuffix(alerts?.classSpecific?.betterWeapon)}`}
               iconPath={`data/${alerts?.classSpecific?.betterWeapon?.rawName}`}
               extra={<img
                 src={`${prefix}data/UpgArrowG.png`}
                 alt={"up-arrow"}
                 style={{
                   position: 'absolute',
                   width: 12,
                   height: 12,
                   top: -2,
                   right: -2
                 }}/>}
        /> : null}
      {trackers?.classSpecific && alerts?.classSpecific?.betterRing ?
        <Alert target={'classSpecific.betterRing'} title={`${name} has a better class-specific ring in their inventory: ${cleanUnderscore(alerts?.classSpecific?.betterRing?.displayName || alerts?.classSpecific?.betterRing?.rawName)}${alerts?.classSpecific?.betterRing?.UQ1txt ? ` (+${alerts?.classSpecific?.betterRing?.UQ1val}${cleanUnderscore(alerts?.classSpecific?.betterRing?.UQ1txt)}${alerts?.classSpecific?.betterRing?.UQ2txt ? `, +${alerts?.classSpecific?.betterRing?.UQ2val}${cleanUnderscore(alerts?.classSpecific?.betterRing?.UQ2txt)}` : ''})` : ''}${itemLocationSuffix(alerts?.classSpecific?.betterRing)}`}
               iconPath={`data/${alerts?.classSpecific?.betterRing?.rawName}`}
               extra={<img
                 src={`${prefix}data/UpgArrowG.png`}
                 alt={"up-arrow"}
                 style={{
                   position: 'absolute',
                   width: 12,
                   height: 12,
                   top: -2,
                   right: -2
                 }}/>}
        /> : null}
      {trackers?.equipment && alerts?.equipment?.availableUpgradesSlots?.length > 0 ?
        alerts?.equipment?.availableUpgradesSlots?.map(({
                                                          displayName,
                                                          rawName,
                                                          Upgrade_Slots_Left
                                                        }, index) => {
          return <Alert target={'equipment.availableUpgradesSlots'} key={`slots-${name}-${characterIndex}-${rawName}-${index}`}
                        title={`${cleanUnderscore(displayName)} has ${Upgrade_Slots_Left} available upgrade slots`}
                        extra={<Box style={{
                          position: 'absolute',
                          width: 5,
                          height: 5,
                          top: -2,
                          right: -2,
                          borderRadius: '50%',
                          backgroundColor: '#d62727'
                        }}/>}
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
                          : `is ${diff} minutes away from being full`}`}
                        iconPath={`data/${rawName}`}/>;
        }) : null}
      {trackers?.starSigns && alerts?.starSigns?.missingStarSigns > 0 ?
        <Alert target={'starSigns.missingStarSigns'} title={`${name} is missing ${alerts?.starSigns?.missingStarSigns} star signs`}
               iconPath={'data/SignStar1b'}/> : null}
      {trackers?.talents && alerts?.talents?.talents?.length > 0 ? alerts?.talents?.talents?.map(({
                                                                                                    name,
                                                                                                    skillIndex,
                                                                                                    cooldown
                                                                                                  }, index) => (
        <Alert target={'talents.talents'} key={skillIndex + '-' + index}
               style={{ opacity: cooldown > 0 ? .5 : 1 }}
               title={cooldown > 0
                 ? <Timer type={'countdown'}
                          date={cooldown} lastUpdated={lastUpdated}/>
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
          title={<TalentList name={name} verb={'talents below max level'}
                             talents={alerts?.talents?.unmaxedTalents}/>}
          iconPath={`data/${getTalentBookIcon(character?.class)}`}/> : null}
      {trackers?.talents && alerts?.talents?.libraryUpgradableTalents?.length > 0 ?
        <Alert target={'talents.libraryUpgradableTalents'}
          title={<TalentList name={name} verb={'talents the Library can raise'}
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
          let { showMaxed, showNonMaxed } = options?.crystalCountdown || {};
          showMaxed = showMaxed?.checked;
          showNonMaxed = showNonMaxed?.checked;
          const ready = crystalCountdown > 0 && Math.floor(reduction) >= Math.floor(crystalCountdown);
          if (!showMaxed && ready || !showNonMaxed && (showMaxed && !ready) || (!showNonMaxed && !showMaxed)) return null;
          return <Alert target={'crystalCountdown'} key={icon + '-' + index + '-' + characterIndex}
                        style={{
                          border: '1px solid',
                          borderColor: ready ? '#66bb6a' : reduction > 0 ? '#d1921e' : '',
                          borderRadius: 5,
                          opacity: ready || reduction > 0 ? 1 : .5
                        }}
                        title={`Crystal CD for ${cleanUnderscore(pascalCase(name))} is ${ready
                          ? 'maxed'
                          : ''} ${Math.round(reduction * 100) / 100}% ${!ready
                          ? `(Max: ${Math.round(crystalCountdown * 100) / 100})`
                          : ''}`}
                        iconPath={`data/${icon}`}/>
        }
      ) : null}
    </Stack>;
    // toArray() mirrors what actually renders: it flattens the nested maps and drops the nulls of
    // every unmet condition, so none of the alert conditions above have to be repeated here.
    const hasAlerts = React.Children.toArray(alertIcons.props.children).length > 0;
    if (hideAlertless && !hasAlerts) return null;

    return <Card key={name} sx={{ width: 300 }} data-cy={`character-${name}`}>
      <CardContent>
        <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
          <Box sx={{ display: { sm: 'none', md: 'block' } }}><img src={`${prefix}${classIcon}`}
                                                                  alt=""/></Box>
          <Stack>
            <Typography>{name}</Typography>
            {isActive() ? <Typography>Active</Typography> : <Timer variant={'caption'} type={'up'} date={afkTime}
                                                                   lastUpdated={lastUpdated}/>}
          </Stack>
          <Stack direction={'row'} alignItems="center" gap={1} style={{ marginLeft: 'auto' }}>
            <HtmlTooltip title={cleanUnderscore(activity)}>
              <IconImg src={getActivityIcon(character)} alt="activity icon"
                       style={{ width: 32, height: 32 }}
              />
            </HtmlTooltip>
            {charForm ? <HtmlTooltip title={`${formMap?.[charForm]}`}>
              <IconImg src={`${prefix}${dbFormActive || acFormActive || wwFormActive}.png`} alt="form icon"
              />
            </HtmlTooltip> : null}
            <HtmlTooltip title={<CharacterInfo characters={characters} account={account} character={character}
                                               lastUpdated={lastUpdated}/>}>
              <IconInfoCircleFilled/>
            </HtmlTooltip>
          </Stack>
        </Stack>
        <Divider sx={{ my: 1 }}/>
        {alertIcons}
      </CardContent>
    </Card>
  })?.filter(Boolean);

  if (hideAlertless && cards?.length === 0) {
    return <Card>
      <CardContent>
        <Stack alignItems={'center'} gap={1} sx={{ py: 4 }}>
          <IconCircleCheckFilled size={48} color={'#66bb6a'}/>
          <Typography variant={'h6'}>All caught up</Typography>
          <Typography variant={'body2'} color={'text.secondary'} textAlign={'center'}>
            None of your characters have alerts right now.
          </Typography>
        </Stack>
      </CardContent>
    </Card>;
  }

  return <Stack gap={2} direction={'row'} flexWrap={'wrap'}>
    {cards}
  </Stack>
};

const TALENT_LIST_LIMIT = 15;
const TalentList = ({ name, verb, talents }) => {
  const shown = talents?.slice(0, TALENT_LIST_LIMIT);
  const rest = talents?.length - shown?.length;
  return <Stack gap={.5}>
    <Typography>{name} has {talents?.length} {verb}</Typography>
    {shown?.map(({ name: talentName, skillIndex, level, target }, index) => (
      <Stack key={`${skillIndex}-${index}`} direction={'row'} alignItems={'center'} gap={1}>
        <IconImg src={`${prefix}data/UISkillIcon${skillIndex}.png`} alt="" style={{ width: 24, height: 24 }}/>
        <Typography variant={'caption'}>
          {cleanUnderscore(pascalCase(talentName))} {level} -&gt; {target}
        </Typography>
      </Stack>
    ))}
    {rest > 0 ? <Typography variant={'caption'}>and {rest} more</Typography> : null}
  </Stack>
}

const BAG_TYPE_NAMES = { bCraft: 'Materials', Foods: 'Food' };
const BagList = ({ name, bags }) => {
  return <Stack gap={.5}>
    <Typography>{name} has {bags?.length} unmaxed carry bag{bags?.length === 1 ? '' : 's'}</Typography>
    {bags?.map(({ bagType, capacity, maxCapacity, rawName }, index) => (
      <Stack key={`${bagType}-${index}`} direction={'row'} alignItems={'center'} gap={1}>
        <IconImg src={`${prefix}data/${rawName}.png`} alt="" style={{ width: 24, height: 24 }}/>
        <Typography variant={'caption'}>
          {BAG_TYPE_NAMES[bagType] || bagType}: {notateNumber(capacity)} -&gt; {notateNumber(maxCapacity)}
        </Typography>
      </Stack>
    ))}
  </Stack>
}

// `target` is the dot path of the alert's own setting - clicking the icon opens the configuration
// modal on it. See utility/dashboard/settingsTarget.
const Alert = ({ title, iconPath, style = {}, extra, target }) => {
  const openSettings = useOpenDashboardSettings();
  return <Stack onClick={target ? () => openSettings('characters', target) : undefined}
                sx={{ position: 'relative', ...(target ? { cursor: 'pointer' } : {}) }}>
    <HtmlTooltip title={title}>
      <IconImg style={style} src={`${prefix}${iconPath}.png`} alt=""/>
    </HtmlTooltip>
    {extra}
  </Stack>
}

const CharacterInfo = ({ account, characters, character, lastUpdated }) => {
  const {
    name,
    stats,
    afkTime,
    crystalSpawnChance,
    nonConsumeChance
  } = character || {};
  const { cashMulti } = getCashMulti(character, account, characters) || {};
  const { dropRate } = getDropRate(character, account, characters) || {};
  const { respawnRate } = getRespawnRate(character, account) || {};
  const { afkGains } = getAfkGain(character, characters, account) || {};
  const playerInfo = getMaxDamage(character, characters, account) || {};
  const isActive = () => {
    const timePassed = new Date().getTime() + (afkTime - lastUpdated);
    const minutes = differenceInMinutes(new Date(), new Date(timePassed));
    return minutes <= 5;
  };
  return (
    (<Stack gap={1}>
      <TitleAndValue title={name} value={`lv. ${stats?.level || 0}`}/>
      <TitleAndValue title={'Afk time'}
                     value={isActive() ? <Typography>Active</Typography> : <Timer type={'up'} date={afkTime}
                                                                                  lastUpdated={lastUpdated}/>}/>
      <Divider flexItem/>
      <TitleAndValue title={'Damage'} value={notateDamage(playerInfo)?.at(0)?.replace(/\[/g, 'M')}/>
      <TitleAndValue title={'Hp'} value={notateNumber(playerInfo?.maxHp)}/>
      <TitleAndValue title={'Mp'} value={notateNumber(playerInfo?.maxMp)}/>
      <TitleAndValue title={'Accuracy'} value={notateNumber(playerInfo?.accuracy)}/>
      <TitleAndValue title={'Movement Speed'} value={notateNumber(playerInfo?.movementSpeed)}/>
      <Divider flexItem/>
      <TitleAndValue title={'Cash multi'} value={`${notateNumber(cashMulti)}%`}/>
      <TitleAndValue title={'Drop rate'} value={`${notateNumber(dropRate, 'MultiplierInfo')}x`}/>
      <TitleAndValue title={'Respawn rate'} value={`${notateNumber(respawnRate, 'MultiplierInfo')}%`}/>
      <TitleAndValue title={'Afk gains'}
                     value={afkGains == null ? 'N/A' : `${notateNumber(afkGains * 100, 'MultiplierInfo')}%`}/>
      {/* effectiveValue, not value: the game rolls min(cap, chance), so the raw number overstates
          how often a crystal actually spawns. */}
      <TitleAndValue title={'Crystal Chance'} value={(1 / crystalSpawnChance?.effectiveValue) < 100
        ?
        `${notateNumber(crystalSpawnChance?.effectiveValue * 100, 'MultiplierInfo')?.replace('.00', '')}%`
        : `1 in ${Math.floor(1 / crystalSpawnChance?.effectiveValue)}`}/>
      <TitleAndValue title={'Non consume chance'} value={`${kFormatter(nonConsumeChance, 2)}%`}/>
    </Stack>)
  );
}

const IconImg = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
`;

export default Characters;
