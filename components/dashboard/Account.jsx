import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import {
  cleanUnderscore,
  formatDuration,
  formatNum,
  getNumberWithOrdinal,
  pascalCase
} from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import LinkIcon from '@mui/icons-material/Link';
import LockIcon from '@mui/icons-material/Lock';
import StatusText from '@components/common/StatusText';
import { isSectionFailed } from '@components/common/styles';
import Notice from '@components/common/Notice';
import GameIcon from '@components/common/GameIcon';
import VialArt from '@components/common/VialArt';
import Panel from '@components/common/cards/Panel';
import ItemCard from '@components/common/cards/ItemCard';
import AlertIcon, { counted } from './AlertIcon';
import {
  getGeneralAlerts,
  getWorld1Alerts,
  getWorld2Alerts,
  getWorld3Alerts,
  getWorld4Alerts,
  getWorld5Alerts,
  getWorld6Alerts,
  getWorld7Alerts,
  getCrystalIslandAlertTitle,
  GREENSTACK_ALERT_SHOWN
} from '@utility/dashboard/account';
import useAlerts from '@hooks/useAlerts';
import { useGoals } from '@components/goals/GoalsProvider';
import { useMaterialTrackerMigration } from '@components/goals/useMaterialTrackerMigration';
import { resolveGoal } from '@utility/goals/resolve';
import useBossRespawns from '@hooks/useBossRespawns';
import { BOSS_RESPAWN_ALERTS } from '@utility/dashboard/bossRespawns';
import { monsterSprite } from '@utility/spriteImages';
import { pickerItemLabel } from '@utility/dashboard/quickEdit';
import { formatArcadeEffect } from '@parsers/world-2/arcade';
import { BASE_MAX_SHINY_LEVEL } from '@parsers/world-4/breeding';

// Every refinery alert draws the same salt icon, and one salt can raise several of them at once,
// so a corner glyph says which condition fired without having to hover each copy.
// The glyph takes its state's text role and the border the same state's main shade, so the pair reads as one
// signal at a glance, with the glyph there for anyone the colour alone doesn't reach.
// The drop arrows carry a lot of empty viewBox, so they need a larger size than the other glyphs
// to end up looking the same weight inside the badge.
const alertBadges = {
  saltRankUp: { Icon: ArrowDropUpIcon, color: 'var(--mui-palette-text-success)', border: 'var(--mui-palette-success-main)', size: 36 },
  // A chevron rather than a second filled triangle - this one is headroom to rank up later,
  // not power already banked and waiting.
  saltRankUpRoom: { Icon: KeyboardArrowUpIcon, color: 'var(--mui-palette-text-success)', border: 'var(--mui-palette-success-main)', size: 24 },
  saltDeficit: { Icon: ArrowDropDownIcon, color: 'var(--mui-palette-text-error)', border: 'var(--mui-palette-error-main)', size: 36 },
  saltMaterials: { Icon: WarningRoundedIcon, color: 'var(--mui-palette-text-warning)', border: 'var(--mui-palette-warning-main)', size: 18 },
  rankUp: { Icon: ArrowDropUpIcon, color: 'var(--mui-palette-text-success)', size: 36 },
  deficit: { Icon: ArrowDropDownIcon, color: 'var(--mui-palette-text-error)', size: 36 },
  sharedLink: { Icon: LinkIcon, color: 'var(--mui-palette-primary-main)', size: 18 },
  locked: { Icon: LockIcon, color: 'var(--mui-palette-text-warning)', size: 15 }
};

const captainBonus = (bonus) => cleanUnderscore(bonus).replace(/,(?=\S)/g, ', ');

const ROWS = ['General', 'World 1', 'World 2', 'World 3', 'World 4', 'World 5', 'World 6', 'World 7'];

const alertsMap = {
  General: getGeneralAlerts,
  ['World 1']: getWorld1Alerts,
  ['World 2']: getWorld2Alerts,
  ['World 3']: getWorld3Alerts,
  ['World 4']: getWorld4Alerts,
  ['World 5']: getWorld5Alerts,
  ['World 6']: getWorld6Alerts,
  ['World 7']: getWorld7Alerts
}

const Account = ({ account, characters, trackers, lastUpdated }) => {
  const { defecausStatus, babaUp } = useBossRespawns({ account, characters, lastUpdated });
  const { goals } = useGoals();
  // The Goals section runs it too, but it can be hidden and the material alert reads the migrated goals
  useMaterialTrackerMigration();
  const itemGoals = goals.filter(({ system }) => system === 'item');
  // the alert follows the "All greenstacks" goal; a single greenstack entry goal has no short list to name
  const greenstackGoal = goals.find(({ system, kind }) => system === 'greenstack' && kind === 'all');
  const greenstackView = greenstackGoal ? resolveGoal(greenstackGoal, { account, characters }) : null;
  const { alerts, emptyAlertRows, failedRows } = useAlerts({
    alertsMap,
    data: account,
    extraData: characters,
    trackers,
    lastUpdated,
    context: {
      bossesUp: { drDefecaus: defecausStatus === 'up', babaYaga: babaUp },
      itemGoals,
      // The alert names only the closest few, and the whole context is serialized to detect changes
      greenstackView: greenstackView && { ...greenstackView, short: greenstackView.short.slice(0, GREENSTACK_ALERT_SHOWN) }
    }
  });

  // A failed killroy section has no classes to name
  const killroyClasses = account?.killroy?.killRoyClasses?.join(', ');
  // These alerts read a failed section's default as the real thing ("every hat is missing"): they stay silent, under the
  // page's note. The salt balance reads a dozen sections' bonuses, so any failed one makes its deficits false.
  const failed = (section) => isSectionFailed(account, section);
  const anyFailed = account?.failedSections?.length > 0;
  const rowIcons = {
    General: <>
              {alerts?.General?.etc?.familyObols ?
                <Alert target={'General.etc.familyObols'} title={`You have ${counted(alerts?.General?.etc?.familyObols, 'empty family obol slot')}`}
                       iconPath={'etc/ObolEmpty1'}/> : null}
              {alerts?.General?.gemsFromBosses ?
                <Alert target={'General.gemsFromBosses'} title={`You can kill ${counted(alerts?.General?.gemsFromBosses, 'more boss', 'more bosses')} for gems`}
                       iconPath={'data/PremiumGem'}/> : null}
              {alerts?.General?.etc?.freeCompanion && !failed('companions') ?
                <Alert target={'General.etc.freeCompanion'} title={`You can claim a free companion`}
                       iconPath={'afk_targets/Dog'}/> : null}
              {alerts?.General?.etc?.petMartGems ?
                <Alert target={'General.etc.petMartGems'} title={'You have unclaimed free gems from the Pet Mart'}
                       iconPath={'data/PremiumGem'}/> : null}
              {alerts?.General?.etc?.tournamentRegister ?
                <Alert target={'General.etc.tournamentRegister'} title={'You have not registered for the current Pet Tournament'}
                       iconPath={'data/TournyRank0'}/> : null}
              {alerts?.General?.etc?.raidRegister ?
                <Alert target={'General.etc.raidRegister'} title={'You have not registered for the current Raid'}
                       iconPath={'data/TournyRankR0'}/> : null}
              {alerts?.General?.etc?.glimmerwickCandle && !failed('tome') ?
                <Alert target={'General.etc.glimmerwickCandle'}
                  title={`You haven't used the Glimmerwick Candle today (${formatNum(alerts?.General?.etc?.glimmerwickCandle?.attempts)}/${formatNum(alerts?.General?.etc?.glimmerwickCandle?.pity)} wishes until guaranteed)`}
                  iconPath={'data/Quest114'}/> : null}
              {alerts?.General?.etc?.dailyCrystals ?
                <Alert target={'General.etc.dailyCrystals'}
                  title={`You have ${formatNum(alerts?.General?.etc?.dailyCrystals)} daily guaranteed crystal kill${alerts?.General?.etc?.dailyCrystals > 1 ? 's' : ''} remaining`}
                  iconPath={'afk_targets/Crystal_Carrot'}/> : null}
              {alerts?.General?.etc?.arcanistDailyDrops?.length > 0
                ?
                alerts?.General?.etc?.arcanistDailyDrops?.map(({ type, remaining }) => <Alert target={'General.etc.arcanistDailyDrops'}
                  items={[{ key: type, label: `Arcanist ${type}` }]}
                  key={`arcanist-${type}`}
                  title={`You have ${formatNum(remaining)} Arcanist ${type} drop${remaining > 1 ? 's' : ''} remaining today`}
                  iconPath={type === 'weapon' ? 'data/EquipmentWandsArc0' : 'data/EquipmentRingsArc0'}/>)
                : null}
              {alerts?.General?.etc?.topOfTheMornin ?
                <Alert target={'General.etc.topOfTheMornin'}
                  title={`You have ${formatNum(alerts?.General?.etc?.topOfTheMornin)} Top of the Mornin' kill${alerts?.General?.etc?.topOfTheMornin > 1 ? 's' : ''} remaining today`}
                  iconPath={'data/CompassUpg9'}/> : null}
              {alerts?.General?.etc?.newCharacters ?
                <Alert target={'General.etc.newCharacters'}
                  title={`You can create ${formatNum(alerts?.General?.etc?.newCharacters)} new character${alerts?.General?.etc?.newCharacters > 1
                    ? 's'
                    : ''}`} iconPath={'etc/CharFam0'}/> : null}
              {alerts?.General?.etc?.randomEvents ?
                <Alert target={'General.etc.randomEvents'} title={'You haven\'t done a random event today'} iconPath={'etc/Mega_Grumblo'}/> : null}
              {alerts?.General?.etc?.bossRespawns?.map((boss) => <Alert target={'General.etc.bossRespawns'} key={boss}
                items={[{ key: boss, label: BOSS_RESPAWN_ALERTS[boss].name }]}
                title={`${BOSS_RESPAWN_ALERTS[boss].name} is up`}
                iconPath={BOSS_RESPAWN_ALERTS[boss].icon}/>)}
              {alerts?.General?.etc?.miniBosses?.length > 0
                ?
                alerts?.General?.etc?.miniBosses?.map(({ rawName, name, current }) => <Alert target={'General.etc.miniBosses'} key={rawName}
                                                                                             title={`${cleanUnderscore(name)}: ${counted(current, 'kill')}`}
                                                                                             iconPath={`etc/${rawName}`}/>)
                : null}
              {alerts?.General?.tasks?.length > 0 ?
                alerts?.General?.tasks?.map((world) => <Alert target={'General.tasks'} key={'task' + world}
                                                              title={`Daily task in World ${world + 1} not done yet`}
                                                              items={[{ key: world + 1, label: `World ${world + 1}` }]}
                                                              iconPath={`etc/Merit_${world}`}/>) : null}
              {alerts?.General?.etc?.keys?.length > 0
                ?
                alerts?.General?.etc?.keys?.map(({ rawName, totalAmount }, index) => <Alert target={'General.etc.keys'} key={rawName + '' + index}
                                                                                            title={`${formatNum(totalAmount, 'whole')} of ${cleanUnderscore(pascalCase(rawName))} ${rawName.includes('Tix')
                                                                                              ? 'tickets'
                                                                                              : 'keys'} ${totalAmount === 1 ? 'is' : 'are'} ready`}
                                                                                            iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.General?.materialTracker?.length > 0
                ?
                alerts?.General?.materialTracker?.map(({ key, iconPath, text, note, lines }) =>
                  <Alert target={'General.materialTracker'}
                    key={key}
                    ariaLabel={text}
                    title={<Stack gap={.5}>
                      <Typography variant={'body2'}>{text}</Typography>
                      {lines?.map((line) => <Typography key={line} variant={'caption'} sx={{ display: 'block' }}>{line}</Typography>)}
                      {note ? <ItemCard.Facts rows={[['Note', note]]}/> : null}
                    </Stack>}
                    iconPath={iconPath}/>)
                : null}
              {alerts?.General?.etc?.dungeonTraits?.length > 0
                ?
                alerts?.General?.etc?.dungeonTraits?.map((traitName, index) => <Alert target={'General.etc.dungeonTraits'} key={'dungeonTraits' + index}
                                                                                      title={`You haven't selected a trait for ${traitName}`}
                                                                                      iconPath={`data/DungTraitB0`}/>)
                : null}
              {alerts?.General?.shops?.items?.length > 0 ?
                alerts?.General?.shops?.items?.map((shop, index) => shop?.length > 0 ?
                  <Alert target={'General.shops.items'} key={'shop' + index + shop?.[0]?.rawName}
                         items={shop.map(({ rawName }) => ({ key: rawName }))}
                         title={<ShopTitle shop={shop}/>}
                         ariaLabel={`Shop stock: ${shop.map(({ rawName }) => pickerItemLabel(rawName)).join(', ')}`}
                         iconPath={index === 8 ? `etc/ShopEZ${index}` : `data/ShopEZ${index}`}/> : null) : null}
              {alerts?.General?.guild?.daily ?
                <Alert target={'General.guild.daily'} title={`You have ${formatNum(alerts?.General?.guild?.daily)} uncompleted daily guild task${alerts?.General?.guild?.daily === 1 ? '' : 's'}`} iconPath={`etc/GP`}
                       imgStyle={{ filter: 'sepia(1) hue-rotate(46deg) saturate(1)' }}/> : null}
              {alerts?.General?.guild?.weekly ?
                <Alert target={'General.guild.weekly'} title={`You have ${formatNum(alerts?.General?.guild?.weekly)} uncompleted weekly guild task${alerts?.General?.guild?.weekly === 1 ? '' : 's'}`} iconPath={`etc/GP`}
                       imgStyle={{ filter: 'sepia(1) hue-rotate(140deg) saturate(1)' }}/> : null}
    </>,
    'World 1': <>
              {alerts?.['World 1']?.stamps?.gildedStamps > 0 ?
                <Alert target={'World 1.stamps.gildedStamps'} title={`You have ${counted(alerts?.['World 1']?.stamps?.gildedStamps, 'available gilded stamp')}`}
                       iconPath={'data/GildedStamp'}/> : null}
              {alerts?.['World 1']?.stamps?.affordableStampLevels ?
                <Alert target={'World 1.stamps.affordableStampLevels'} title={<AffordableStampLevels {...alerts?.['World 1']?.stamps?.affordableStampLevels}/>}
                       iconPath={'data/StampA34'}/> : null}
              {alerts?.['World 1']?.stamps?.exaltedStamps > 0 ?
                <Alert target={'World 1.stamps.exaltedStamps'} title={`You have ${counted(alerts?.['World 1']?.stamps?.exaltedStamps, 'unused exalted stamp')}`}
                       iconPath={'etc/Exalted_Stamp_Frame'}/> : null}
              {alerts?.['World 1']?.owl?.featherRestart ?
                <Alert target={'World 1.owl.featherRestart'} title={`Feather restart can be upgraded`}
                       iconPath={'etc/Owl_4'}/> : null}
              {alerts?.['World 1']?.owl?.megaFeatherRestart ?
                <Alert target={'World 1.owl.megaFeatherRestart'} title={`Megafeather restart can be upgraded`}
                       iconPath={'etc/Owl_8'}/> : null}
              {alerts?.['World 1']?.forge?.emptySlots ?
                <Alert target={'World 1.forge.emptySlots'} title={`You have empty forge slots`}
                       iconPath={'data/ForgeA'}/> : null}
    </>,
    'World 2': <>
              {alerts?.['World 2']?.kangaroo?.shinyThreshold ?
                <Alert target={'World 2.kangaroo.shinyThreshold'}
                  title={`You have reached your shiny threshold of ${formatNum(alerts?.['World 2']?.kangaroo?.shinyThreshold, 'pct')} (${formatNum(account?.kangaroo?.shinyProgress, 'pct')})`}
                  iconPath={'etc/KShiny'}/> : null}
              {alerts?.['World 2']?.kangaroo?.fisherooReset ?
                <Alert target={'World 2.kangaroo.fisherooReset'}
                  title={'Fisheroo Reset can be upgraded'}
                  iconPath={'etc/KUpga_6'}/> : null}
              {alerts?.['World 2']?.kangaroo?.greatestCatch ?
                <Alert target={'World 2.kangaroo.greatestCatch'}
                  title={'Greatest Catch can be upgraded'}
                  iconPath={'etc/KUpga_11'}/> : null}
              {alerts?.['World 2']?.islands?.unclaimedDays ?
                <Alert target={'World 2.islands.unclaimedDays'}
                  title={`You haven't claimed your islands' content in ${counted(alerts?.['World 2']?.islands?.unclaimedDays, 'day')}`}
                  iconPath={'data/Island1'}/> : null}
              {alerts?.['World 2']?.islands?.shimmerIsland ?
                <Alert target={'World 2.islands.shimmerIsland'}
                  label={'You haven\'t claimed your shimmer\'s trial reward this week'}
                  title={<Stack gap={.5}>
                    <div>You haven&apos;t claimed your shimmer&apos;s trial reward this week</div>
                    {typeof alerts?.['World 2']?.islands?.shimmerIsland === 'string'
                      ? <ItemCard.Facts rows={[['Challenge', cleanUnderscore(alerts?.['World 2']?.islands?.shimmerIsland)]]}/> : null}
                  </Stack>}
                  iconPath={'etc/Shimmer_Currency'}/> : null}
              {alerts?.['World 2']?.islands?.garbageUpgrade ?
                <Alert target={'World 2.islands.garbageUpgrade'}
                  title={'You have enough garbage to buy a \'Garbage Gain\' upgrade in trash island'}
                  iconPath={'etc/Trash_Currency'}/> : null}
              {alerts?.['World 2']?.islands?.collectibleGarbage ?
                <Alert target={'World 2.islands.collectibleGarbage'}
                  title={`You have around ${formatNum(alerts?.['World 2']?.islands?.collectibleGarbage, 'whole')} garbage waiting to be collected in trash island`}
                  iconPath={'etc/Trash_Currency'}/> : null}
              {alerts?.['World 2']?.islands?.crystalIsland ?
                <Alert target={'World 2.islands.crystalIsland'}
                  title={getCrystalIslandAlertTitle(alerts['World 2'].islands.crystalIsland)}
                  iconPath={'afk_targets/Crystal_Carrot'}/> : null}
              {alerts?.['World 2']?.alchemy?.bargainTag ?
                <Alert target={'World 2.alchemy.bargainTag'} title={'You haven\'t used the bargain tag today'} iconPath={'data/aShopItems10'}/> : null}
              {alerts?.['World 2']?.alchemy?.gems ?
                <Alert target={'World 2.alchemy.gems'} title={'You haven\'t bought alchemy gems today'} iconPath={'data/PremiumGem'}/> : null}
              {alerts?.['World 2']?.alchemy?.alternateParticles ?
                <Alert target={'World 2.alchemy.alternateParticles'}
                  title={`You have ${counted(alerts?.['World 2']?.alchemy?.alternateParticles, 'alternate particle upgrade')} available`}
                  iconPath={'etc/Particle'}/> : null}
              {alerts?.['World 2']?.weeklyBosses?.daily
                ?
                <Alert target={'World 2.weeklyBosses.daily'} title={'You haven\'t done a World 2 boss fight today'} iconPath={'data/Trophie'}/>
                : null}
              {alerts?.['World 2']?.weeklyBosses?.trophy
                ?
                <Alert target={'World 2.weeklyBosses.trophy'}
                  title={`You can still earn World 2 boss trophies this week (${formatNum(alerts?.['World 2']?.weeklyBosses?.trophy?.bestSkulls)}/${formatNum(alerts?.['World 2']?.weeklyBosses?.trophy?.maxSkulls)} skulls)`}
                  iconPath={'data/Trophie'}/>
                : null}
              {alerts?.['World 2']?.killRoy?.general && !failed('killroy')
                ?
                <Alert target={'World 2.killRoy.general'}
                  title={`You haven't done a Killroy this week${killroyClasses ? ` (${killroyClasses})` : ''}`} iconPath={'etc/Killroy'}/>
                : null}
              {alerts?.['World 2']?.killRoy?.underHundredKills ?
                <Alert target={'World 2.killRoy.underHundredKills'}
                  title={`Killroy includes a monster with less than 100 kills (${alerts?.['World 2']?.killRoy?.underHundredKills?.map((m) => cleanUnderscore(m?.Name)).join(', ')})`}
                  iconPath={'etc/KillroyPrime'}
                /> : null}
              {alerts?.['World 2']?.killRoy?.skulls ?
                <Alert target={'World 2.killRoy.skulls'}
                  title={`You have ${formatNum(alerts?.['World 2']?.killRoy?.skulls)} unspent Killroy skull${alerts?.['World 2']?.killRoy?.skulls === 1 ? '' : 's'}`}
                  iconPath={'etc/Killroy_Skull'}
                /> : null}
              {alerts?.['World 2']?.arcade?.balls ?
                <Alert target={'World 2.arcade.balls'} title={'Max ball capacity has been reached'} iconPath={'data/PachiBall0'}/> : null}
              {alerts?.['World 2']?.arcade?.unmaxedRotation?.length > 0 ?
                alerts?.['World 2']?.arcade?.unmaxedRotation?.map((upgrade) => <Alert target={'World 2.arcade.unmaxedRotation'}
                  key={`arcade-${upgrade?.rotationIndex}`}
                  title={`Arcade rotation upgrade "${cleanUnderscore(formatArcadeEffect(upgrade?.effect, upgrade?.bonus))}" is not maxed (Lv ${upgrade?.level})`}
                  iconPath={`data/${upgrade?.iconName}`}/>) : null}
              {alerts?.['World 2']?.alchemy?.sigils?.length > 0
                ?
                alerts?.['World 2']?.alchemy?.sigils?.map(({ name, index }) => <Alert target={'World 2.alchemy.sigils'} key={name}
                                                                                      title={`${cleanUnderscore(pascalCase(name))} is already unlocked`}
                                                                                      iconPath={`data/aSiga${index}`}/>)
                : null}
              {alerts?.['World 2']?.alchemy?.liquids?.length > 0
                ?
                alerts?.['World 2']?.alchemy?.liquids?.map(({ index }) => <Alert target={'World 2.alchemy.liquids'} key={'liq' + index}
                                                                                 title={`${getNumberWithOrdinal(index + 1)} liquid is full`}
                                                                                 iconPath={`data/Liquid${index + 1}_x1`}/>)
                : null}
              {alerts?.['World 2']?.postOffice?.dailyShipments?.length > 0
                ?
                alerts?.['World 2']?.postOffice?.dailyShipments?.map(({ index }) => <Alert target={'World 2.postOffice.dailyShipments'} key={'shipment' + index}
                                                                                           items={[{ key: index + 1, label: `shipment #${index + 1}` }]}
                                                                                           title={`You haven't completed an order for shipment #${index + 1} today`}
                                                                                           iconPath={`data/UIlilbox`}/>)
                : null}
              {alerts?.['World 2']?.alchemy?.vialsAttempts ? <Alert target={'World 2.alchemy.vialsAttempts'} key={'vialsAttempts'}
                                                                    title={`You have available vial attempts`}
                                                                    iconPath={`data/aVials1`}/> : null}
              {alerts?.['World 2']?.alchemy?.p2wUpgrades?.length > 0
                ?
                alerts?.['World 2']?.alchemy?.p2wUpgrades?.map(({ type, index, name, upgrades }) => <Alert target={'World 2.alchemy.p2wUpgrades'}
                  key={`p2w-${type}-${index}`}
                  title={<>
                    <div>{name} {type === 'cauldron' ? 'cauldron' : 'liquid'} p2w upgrades you can afford</div>
                    {upgrades?.map(({ label, level, maxLevel, cost }) => <div key={label}>
                      {label}: Lv {level} / {maxLevel} ({formatGame(cost, 'Big', { whole: true })} coins)
                    </div>)}
                  </>}
                  iconPath={`data/aJar${type === 'cauldron' ? 'B' : 'L'}${index}`}/>)
                : null}
              {alerts?.['World 2']?.alchemy?.vials?.length > 0 ?
                alerts?.['World 2']?.alchemy?.vials?.map((vial) => <Alert target={'World 2.alchemy.vials'} key={vial?.mainItem}
                                                                          vial={vial}
                                                                          title={`You have enough materials to upgrade ${cleanUnderscore(vial?.name)} vial`}
                                                                          iconPath={`data/${vial?.mainItem}`}/>) : null}

    </>,
    'World 3': <>
              {alerts?.['World 3']?.library?.books && !anyFailed ?
                <Alert target={'World 3.library.books'}
                  title={`Library has ${counted(account?.libraryTimes?.bookCount, 'book')} ready`}
                  iconPath={'data/Libz'}/> : null}
              {alerts?.['World 3']?.atomCollider?.stampReducer ?
                <Alert target={'World 3.atomCollider.stampReducer'}
                  title={`Stamp reducer has reached your threshold (${formatNum(alerts?.['World 3']?.atomCollider?.stampReducerValue, 'pct')})`}
                  iconPath={'data/Atom0'}/> : null}
              {alerts?.['World 3']?.construction?.flags?.length > 0 ?
                <Alert target={'World 3.construction.flags'}
                  title={`${formatNum(alerts?.['World 3']?.construction?.flags?.length)} flag${alerts?.['World 3']?.construction?.flags?.length === 1 ? ' is' : 's are'} finished on the construction board`}
                  iconPath={'data/CogFLflag'}/> : null}
              {alerts?.['World 3']?.equinox?.bar ?
                <Alert target={'World 3.equinox.bar'} title={`Your Equinox bar is full`} iconPath={'data/Quest78'}/> : null}
              {alerts?.['World 3']?.equinox?.challenges > 0 ?
                <Alert target={'World 3.equinox.challenges'} title={`You have ${counted(alerts?.['World 3']?.equinox?.challenges, 'challenge')} to validate`}
                       iconPath={'data/Quest78'}/> : null}
              {alerts?.['World 3']?.equinox?.foodLust ?
                <Alert target={'World 3.equinox.foodLust'} title={alerts?.['World 3']?.equinox?.foodLustMaxed
                  ? `Food Lust is maxed (${counted(alerts?.['World 3']?.equinox?.foodLustStacks, 'stack')})`
                  : `You have ${counted(alerts?.['World 3']?.equinox?.foodLustStacks, 'Food Lust stack')}`}
                       iconPath={'etc/Dream_Upgrade_10'}/> : null}
              {alerts?.['World 3']?.construction?.materials?.length > 0
                ?
                alerts?.['World 3']?.construction?.materials?.map(({ rawName, missingMats, hoursLeft }) => <Alert target={'World 3.construction.materials'} key={rawName}
                                                                                                       items={[{ key: rawName }]}
                                                                                                       title={
                                                                                                         <RefineryTitle
                                                                                                           missingMats={missingMats}
                                                                                                           hoursLeft={hoursLeft}/>}
                                                                                                       badge={'saltMaterials'}
                                                                                                       iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 3']?.construction?.rankUp?.length > 0
                ?
                alerts?.['World 3']?.construction?.rankUp?.map(({ rawName, saltName }) => <Alert target={'World 3.construction.rankUp'} key={rawName}
                                                                                                 items={[{ key: rawName, label: cleanUnderscore(saltName) }]}
                                                                                                 title={`${cleanUnderscore(saltName)} is ready to rank up`}
                                                                                                 badge={'saltRankUp'}
                                                                                                 iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 3']?.construction?.saltDeficit?.length > 0 && !anyFailed
                ?
                alerts?.['World 3']?.construction?.saltDeficit?.map(({
                  rawName,
                  saltName,
                  previousSaltName,
                  maxSafeRank,
                  isDeficit
                }) => <Alert target={'World 3.construction.saltDeficit'}
                  items={[{ key: rawName, label: cleanUnderscore(saltName) }]}
                  key={`salt-deficit-${rawName}`}
                  title={isDeficit
                    ? `${cleanUnderscore(saltName)} is consuming more ${cleanUnderscore(previousSaltName)} than you produce (max rank without a deficit: ${maxSafeRank})`
                    : `Don't rank up ${cleanUnderscore(saltName)} past ${maxSafeRank}, it would cause a ${cleanUnderscore(previousSaltName)} deficit`}
                  badge={'saltDeficit'}
                  iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 3']?.construction?.saltRankUpRoom?.length > 0 && !anyFailed
                ?
                alerts?.['World 3']?.construction?.saltRankUpRoom?.map(({ rawName, saltName, maxSafeRank }) => <Alert target={'World 3.construction.saltRankUpRoom'}
                  items={[{ key: rawName, label: cleanUnderscore(saltName) }]}
                  key={`salt-rank-room-${rawName}`}
                  title={`${cleanUnderscore(saltName)} can be ranked up to ${maxSafeRank} without causing a deficit`}
                  badge={'saltRankUpRoom'}
                  iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 3']?.construction?.buildings?.length > 0
                ?
                alerts?.['World 3']?.construction?.buildings?.map(({ name, index }) => <Alert target={'World 3.construction.buildings'} key={name}
                                                                                              title={`${cleanUnderscore(pascalCase(name))} is ready to be built`}
                                                                                              iconPath={`data/ConTower${index}`}/>)
                : null}
              {alerts?.['World 3']?.printer?.atoms?.length > 0
                ?
                alerts?.['World 3']?.printer?.atoms?.map(({ name, rawName }) => <Alert target={'World 3.printer.atoms'} key={'printer-atoms-' + rawName}
                                                                                       items={[{ key: rawName, label: cleanUnderscore(name) }]}
                                                                                       title={`Printing is at maximum (storage) capacity for ${cleanUnderscore(name)}`}
                                                                                       atom
                                                                                       iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 3']?.traps?.overdue > 0 ?
                <Alert target={'World 3.traps.overdue'} title={`${counted(alerts?.['World 3']?.traps?.overdue, 'trap')} ${alerts?.['World 3']?.traps?.overdue === 1 ? 'is' : 'are'} overdue`}
                       iconPath={'data/TrapBoxSet1'}/> : null}
              {alerts?.['World 3']?.hatRack?.missingHats?.length > 0 && !failed('hatRack') ?
                alerts?.['World 3']?.hatRack?.missingHats?.map(({ itemName, owner, rawName }, index) =>
                  <Alert target={'World 3.hatRack.missingHats'}
                    key={`missing-hat-${rawName}-${index}`}
                    title={`${cleanUnderscore(itemName)} is missing from hat rack (${owner})`}
                    iconPath={`data/${rawName}`}/>) : null}
    </>,
    'World 4': <>
              {alerts?.['World 4']?.cooking?.meals?.length > 0
                ?
                alerts?.['World 4']?.cooking?.meals?.map(({ rawName, name }) => <Alert target={'World 4.cooking.meals'} key={rawName}
                                                                                       title={`${cleanUnderscore(name)} is ready to be leveled up`}
                                                                                       iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 4']?.laboratory?.chipsRotation?.length > 0
                ?
                alerts?.['World 4']?.laboratory?.chipsRotation?.map(({ rawName, name }, index) => <Alert target={'World 4.laboratory.chipsRotation'}
                  key={rawName + index}
                  title={`You can claim ${cleanUnderscore(name)} in chip repository`}
                  iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 4']?.laboratory?.jewelsRotation?.length > 0
                ?
                alerts?.['World 4']?.laboratory?.jewelsRotation?.map(({ rawName, name }, index) => <Alert target={'World 4.laboratory.jewelsRotation'}
                  key={rawName + index}
                  title={`You can claim ${cleanUnderscore(name)} in jewel repository`}
                  iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 4']?.tome?.nametagClaim > 0 ?
                <Alert target={'World 4.tome.nametagClaim'} key={'tome-nametag-claim'}
                       title={`You have ${formatNum(alerts?.['World 4']?.tome?.nametagClaim)} Tome ranking nametag${alerts?.['World 4']?.tome?.nametagClaim > 1 ? 's' : ''} available to claim`}
                       iconPath={'data/EquipmentNametag22'}/> : null}
              {alerts?.['World 4']?.capeVine?.missingCapes?.length > 0 ?
                alerts?.['World 4']?.capeVine?.missingCapes?.map(({ itemName, owner, rawName }, index) =>
                  <Alert target={'World 4.capeVine.missingCapes'}
                    key={`missing-cape-${rawName}-${index}`}
                    title={`${cleanUnderscore(itemName)} is missing from the cape vine (${owner})`}
                    iconPath={`data/${rawName}`}/>) : null}
              {alerts?.['World 4']?.capeVine?.goldenVine ?
                <Alert target={'World 4.capeVine.goldenVine'} key={'cape-vine-golden-vine'}
                       title={`A Golden Vine is ready to unlock: ${alerts?.['World 4']?.capeVine?.goldenVine?.owner} has reached class Lv. ${alerts?.['World 4']?.capeVine?.goldenVine?.level}`}
                       iconPath={'data/CapeVineRope1'}/> : null}
              {alerts?.['World 4']?.cooking?.spices > 0 ?
                <Alert target={'World 4.cooking.spices'} title={`You have ${counted(alerts?.['World 4']?.cooking?.spices, 'spice click')} left`}
                       iconPath={'data/CookingSpice0'}/> : null}
              {Number.isFinite(alerts?.['World 4']?.cooking?.ribbons) ?
                <Alert target={'World 4.cooking.ribbons'}
                  title={alerts?.['World 4']?.cooking?.ribbons === 0
                    ? 'Your ribbon shelf is full'
                    : `Your ribbon shelf has ${counted(alerts?.['World 4']?.cooking?.ribbons, 'empty slot')} left`}
                  iconPath={'data/Ribbon0'}/> : null}
              {alerts?.['World 4']?.cooking?.mealLadleCost?.count > 0 ?
                <Alert target={'World 4.cooking.mealLadleCost'}
                  title={`${formatNum(alerts?.['World 4']?.cooking?.mealLadleCost?.count)} meal${alerts?.['World 4']?.cooking?.mealLadleCost?.count > 1 ? 's are' : ' is'} below ${formatGame(alerts?.['World 4']?.cooking?.mealLadleCost?.threshold, 'Big', { whole: true })} ladle${alerts?.['World 4']?.cooking?.mealLadleCost?.threshold === 1 ? '' : 's'} to level up`}
                  iconPath={'data/Ladle'}/> : null}
              {alerts?.['World 4']?.cooking?.cookingMastery?.purple > 0 ?
                <Alert target={'World 4.cooking.cookingMastery'}
                  title={`You have ${formatNum(alerts?.['World 4']?.cooking?.cookingMastery?.purple)} unspent purple Cooking Mastery point${alerts?.['World 4']?.cooking?.cookingMastery?.purple > 1 ? 's' : ''}`}
                  iconPath={'etc/CookingMastery'}/> : null}
              {alerts?.['World 4']?.cooking?.cookingMastery?.yellow > 0 ?
                <Alert target={'World 4.cooking.cookingMastery'}
                  title={`You have ${formatNum(alerts?.['World 4']?.cooking?.cookingMastery?.yellow)} unspent yellow Cooking Mastery point${alerts?.['World 4']?.cooking?.cookingMastery?.yellow > 1 ? 's' : ''}`}
                  iconPath={'etc/CookingMastery'}
                  imgStyle={{ filter: 'sepia(1) saturate(4) hue-rotate(5deg) brightness(1.1)' }}/> : null}
              {alerts?.['World 4']?.breeding?.eggs ? <Alert target={'World 4.breeding.eggs'} key={'breeding-eggs'}
                                                            title={`Eggs are at full capacity`}
                                                            iconPath={`data/PetEgg1`}/> : null}
              {alerts?.['World 4']?.breeding?.eggsRarity

                ? <Alert target={'World 4.breeding.eggsRarity'} key={'breeding-eggsRarity'}
                         title={`Your highest egg has reached rarity level ${alerts?.['World 4']?.breeding?.eggsRarity}`}
                         iconPath={`data/PetEgg${alerts?.['World 4']?.breeding?.eggsRarity}`}/>
                : null}
              {alerts?.['World 4']?.breeding?.shinies?.pets?.length > 0 ?
                alerts?.['World 4']?.breeding?.shinies?.pets?.map(({ monsterName, shinyLevel }, index) => {
                  const maxShinyLevel = account?.breeding?.maxShinyLevel ?? BASE_MAX_SHINY_LEVEL;
                  return <Alert target={'World 4.breeding.shinies'}
                    key={monsterName + index}
                    title={`${cleanUnderscore(monsterName)} has reached ${shinyLevel === maxShinyLevel
                      ? `level ${maxShinyLevel} (max)`
                      : `the shiny threshold (${formatNum(alerts?.['World 4']?.breeding?.shinies?.threshold)})`}`}
                    iconPath={`afk_targets/${monsterName}`}/>
                }) : null}
              {alerts?.['World 4']?.breeding?.breedability?.pets?.length > 0 ?
                alerts?.['World 4']?.breeding?.breedability?.pets?.map(({ monsterName, icon }, index) => {
                  return <Alert target={'World 4.breeding.breedability'}
                    key={monsterName + index}
                    breedability
                    title={`${cleanUnderscore(monsterName)} has surpassed the breedability level threshold (${formatNum(alerts?.['World 4']?.breeding?.breedability?.threshold)})`}
                    iconPath={`afk_targets/${monsterName}`}/>
                }) : null}
    </>,
    'World 5': <>
              {alerts?.['World 5']?.gaming?.sprouts ?
                <Alert target={'World 5.gaming.sprouts'} title={`Sprouts are at max capacity (${formatNum(alerts?.['World 5']?.gaming?.sprouts)})`}
                       iconPath={'etc/Sprouts'}/> : null}
              {alerts?.['World 5']?.gaming?.drops ?
                <Alert target={'World 5.gaming.drops'} title={`Sprinkler drops are at capacity (${formatNum(alerts?.['World 5']?.gaming?.drops)})`}
                       iconPath={'data/GamingItem0b'}/> : null}
              {alerts?.['World 5']?.gaming?.squirrel >= 1 ?
                <Alert target={'World 5.gaming.squirrel'}
                  title={`${formatNum(alerts?.['World 5']?.gaming?.squirrel)} hour${alerts?.['World 5']?.gaming?.squirrel === 1 ? ' has' : 's have'} passed since you clicked the squirrel`}
                  iconPath={'data/GamingItem2'}/> : null}
              {alerts?.['World 5']?.gaming?.shovel >= 1 ?
                <Alert target={'World 5.gaming.shovel'}
                  title={`${formatNum(alerts?.['World 5']?.gaming?.shovel)} hour${alerts?.['World 5']?.gaming?.shovel === 1 ? ' has' : 's have'} passed since you clicked the shovel`}
                  iconPath={'data/GamingItem1'}/> : null}
              {alerts?.['World 5']?.gaming?.bogLog ?
                <Alert target={'World 5.gaming.bogLog'} title={'The Bog Log minigame is ready to play'}
                  iconPath={'data/GamingItem5'}/> : null}
              {alerts?.['World 5']?.gaming?.snail ?
                <Alert target={'World 5.gaming.snail'}
                  title={`Snail upgrade success chance is ${formatNum(alerts?.['World 5']?.gaming?.snail, 'pct')}`}
                  iconPath={'data/GamingItem7'}/> : null}

              {alerts?.['World 5']?.sailing?.chests > 0 ? <Alert target={'World 5.sailing.chests'} key={'sailing-chest-alert'}
                                                                 title={`You've reached the maximum capacity of chests`}
                                                                 iconPath={'npcs/Chesty'}/> : null}
              {alerts?.['World 5']?.sailing?.captains?.length > 0 ?
                alerts?.['World 5']?.sailing?.captains?.map(({ captain, bonus, badCaptains, enderCaptain }) => {
                  return <Alert target={'World 5.sailing.captains'}
                    key={'captain' + captain?.captainIndex}
                    ariaLabel={`Captain ${captain?.captainIndex} in the shop`}
                    title={<Stack gap={1}>
                      <Typography variant={'body2'}>Captain {captain?.captainIndex} with {captainBonus(bonus)} from
                        the shop is {enderCaptain ? 'an ender captain (hidden +25% loot and artifact)' : `better
                        than ${badCaptains.length} of
                        your captains`}</Typography>
                      <Stack>
                        {badCaptains?.map(({ captainIndex, bonus }) => <Typography variant={'body2'} key={`cap-${captainIndex}`}>
                          {captainIndex}: {captainBonus(bonus)}
                        </Typography>)}
                      </Stack>
                    </Stack>}
                    iconPath={`etc/Captain_${captain?.captainType}`}/>
                }) : null}
              {alerts?.['World 5']?.hole?.buckets ?
                <Alert target={'World 5.hole.buckets'} title={`One of your sediments has reached the threshold`}
                       iconPath={'data/HoleWellBucket0'}/> : null}
              {alerts?.['World 5']?.hole?.motherlodeMaxed ?
                <Alert target={'World 5.hole.motherlodeMaxed'} title={`You can break a layer in the motherlode cavern`}
                       iconPath={'data/Motherlode_x1'}/> : null}
              {alerts?.['World 5']?.hole?.bravery ?
                <Alert target={'World 5.hole.bravery'} title={`You can hear a story in the bravery cavern`}
                       iconPath={'etc/Bravery_Statue'}/> : null}
              {alerts?.['World 5']?.hole?.justice ?
                <Alert target={'World 5.hole.justice'} title={`You can hear a story in the justice cavern`}
                       iconPath={'data/Justice_Monument_x1'}/> : null}
              {alerts?.['World 5']?.hole?.wisdom ?
                <Alert target={'World 5.hole.wisdom'} title={`You can play a memory game in the wisdom cavern`}
                       iconPath={'data/Wisdom_Monument_x1'}/> : null}
              {alerts?.['World 5']?.hole?.bells?.map(({ name, readyUses, index }) => {
                const bellName = name?.capitalize();
                return <Alert key={name} target={`World 5.hole.bell${bellName}`}
                              title={`${bellName} bell has ${formatNum(readyUses)} ${readyUses === 1 ? 'use' : 'uses'} ready`}
                              iconPath={`etc/HoleBellReady${index}`}/>
              })}
              {alerts?.['World 5']?.hole?.theHarp ?
                <Alert target={'World 5.hole.theHarp'} title={`Harp power has reached the threshold`}
                       iconPath={'etc/TheHarp'}/> : null}
              {alerts?.['World 5']?.hole?.hiveMaxed ?
                <Alert target={'World 5.hole.hiveMaxed'} title={`You can break a layer in the hive cavern`}
                       iconPath={'etc/TheHive'}/> : null}
              {alerts?.['World 5']?.hole?.evertreeMaxed ?
                <Alert target={'World 5.hole.evertreeMaxed'} title={`You can break a layer in the evertree cavern`}
                       iconPath={'data/MotherlodeTREE_x1'}/> : null}
              {alerts?.['World 5']?.hole?.bottomlessTrenchMaxed ?
                <Alert target={'World 5.hole.bottomlessTrenchMaxed'} title={`You can break a layer in the bottomless trench cavern`}
                       iconPath={'data/MotherlodeFISH_x1'}/> : null}
              {alerts?.['World 5']?.hole?.grotto ?
                <Alert target={'World 5.hole.grotto'} title={`You can kill the monarch`}
                       iconPath={'etc/Grotto'}/> : null}
              {alerts?.['World 5']?.hole?.jars >= 0 ?
                <Alert target={'World 5.hole.jars'} title={`You can break ${counted(alerts?.['World 5']?.hole?.jars, 'jar')} in the jars cavern`}
                       iconPath={'etc/Jar_0'}/> : null}
              {alerts?.['World 5']?.hole?.jarsFull > 0 ?
                <Alert target={'World 5.hole.jarsFull'} title={`${formatNum(alerts?.['World 5']?.hole?.jarsFull)} jar slot${alerts?.['World 5']?.hole?.jarsFull > 1 ? 's are' : ' is'} full and ready to open`}
                       iconPath={'etc/Jar_4'}/> : null}
              {alerts?.['World 5']?.hole?.villagersLevelUp?.length > 0
                ? alerts?.['World 5']?.hole?.villagersLevelUp?.map(({ name, index }) => <Alert target={'World 5.hole.villagersLevelUp'}
                  key={name}
                  title={`${name} is ready to level up`}
                  iconPath={`etc/Villager_${index}`}/>)
                : null}
              {alerts?.['World 5']?.hole?.studyLevelUp?.length > 0
                ? alerts?.['World 5']?.hole?.studyLevelUp?.map(({ name, index }) => <Alert target={'World 5.hole.studyLevelUp'}
                  key={name + index}
                  title={`${cleanUnderscore(name)} study is ready to level up`}
                  iconPath={`etc/Study_Rate`}/>)
                : null}
              {alerts?.['World 5']?.hole?.lanterns > 0 ?
                <Alert target={'World 5.hole.lanterns'}
                  title={`You can use ${formatNum(alerts?.['World 5']?.hole?.lanterns)} more Blinding Lantern${alerts?.['World 5']?.hole?.lanterns > 1 ? 's' : ''} today`}
                  iconPath={'data/Quest90_x1'}/> : null}
    </>,
    'World 6': <>
              {alerts?.['World 6']?.sneaking?.lastLooted ?
                <Alert target={'World 6.sneaking.lastLooted'}
                  title={`You haven't looted rewards from sneaking for ${counted(Math.floor(account?.sneaking?.lastLooted / 60), 'minute')}`}
                  iconPath={'data/NjUpgI14'}/> : null}
              {alerts?.['World 6']?.sneaking?.remainingPristineRolls ?
                <Alert target={'World 6.sneaking.remainingPristineRolls'}
                  title={`${counted(alerts?.['World 6']?.sneaking?.remainingPristineRolls.remaining, 'pristine charm roll')} remaining (${formatNum(alerts?.['World 6']?.sneaking?.remainingPristineRolls.used)}/120 used)`}
                  iconPath={'data/NjTrP0'}/> : null}
              {alerts?.['World 6']?.sneaking?.remainingSymbolRolls ?
                <Alert target={'World 6.sneaking.remainingSymbolRolls'}
                  title={`${counted(alerts?.['World 6']?.sneaking?.remainingSymbolRolls.remaining, 'symbol roll')} remaining (${formatNum(alerts?.['World 6']?.sneaking?.remainingSymbolRolls.used)}/75 used)`}
                  iconPath={'data/NjTrP0'}/> : null}
              {alerts?.['World 6']?.beanstalk?.readyToPlant?.length > 0 && !failed('storage')
                ?
                alerts?.['World 6']?.beanstalk?.readyToPlant?.map(({ rawName, displayName, total, breakpoint }) =>
                  <Alert
                    target={'World 6.beanstalk.readyToPlant'}
                    key={'beanstalk' + rawName}
                    title={`You own ${formatNum(total, 'whole')} ${cleanUnderscore(displayName)}: enough to rank it up on the beanstalk (${formatNum(breakpoint, 'whole')} needed)`}
                    iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 6']?.summoning?.familiar ?
                <Alert target={'World 6.summoning.familiar'}
                  title={`Summoning familiar bonus isn't maxed (${formatNum(alerts?.['World 6']?.summoning?.familiar.level)}/${formatNum(alerts?.['World 6']?.summoning?.familiar.maxLvl)})`}
                  iconPath={'data/SumUpgIc2'}/> : null}
              {alerts?.['World 6']?.summoning?.battleAttempts ?
                <Alert target={'World 6.summoning.battleAttempts'}
                  title={`You have ${counted(alerts?.['World 6']?.summoning?.battleAttempts, 'summoning battle attempt')}`}
                  iconPath={'data/Heart'}/> : null}
              {alerts?.['World 6']?.summoning?.familiarExp ?
                <Alert target={'World 6.summoning.familiarExp'}
                  title={`${formatNum(alerts?.['World 6']?.summoning?.familiarExp.exp, 'whole')} familiar EXP unclaimed (${formatDuration(alerts?.['World 6']?.summoning?.familiarExp.seconds)})`}
                  iconPath={'data/SumExp'}/> : null}
              {alerts?.['World 6']?.summoning?.familiarLevelUp ?
                <Alert target={'World 6.summoning.familiarLevelUp'}
                  title={`Claiming familiar EXP gives ${formatNum(alerts?.['World 6']?.summoning?.familiarLevelUp.characters)} character${alerts?.['World 6']?.summoning?.familiarLevelUp.characters > 1 ? 's' : ''} a Summoning level`}
                  iconPath={'data/SumExp'}/> : null}
              {alerts?.['World 6']?.farming?.missingPlots?.length > 0 ?
                <Alert target={'World 6.farming.missingPlots'}
                  title={`You have ${counted(alerts?.['World 6']?.farming?.missingPlots?.length, 'seed')} available to be planted`}
                  iconPath={'data/FarmPlant1'}/> : null}
              {alerts?.['World 6']?.farming?.plots?.length > 0 ?
                <Alert target={'World 6.farming.plots'}
                  title={`${counted(alerts?.['World 6']?.farming?.plots?.length, 'plot')} reached the threshold of ${formatNum(alerts?.['World 6']?.farming?.plots?.[0]?.threshold)} OGs (${formatGame(Math.min(1e9, Math.max(1, Math.pow(2, alerts?.['World 6']?.farming?.plots?.[0]?.threshold))), 'FarmingStuffs.OGmulti')}x)`}
                  iconPath={'data/ClassIcons57'}/> : null}
              {alerts?.['World 6']?.farming?.finishedPlots ?
                <Alert target={'World 6.farming.finishedPlots'}
                  title={`${formatNum(alerts?.['World 6']?.farming?.finishedPlots.plots.length)} plot${alerts?.['World 6']?.farming?.finishedPlots.plots.length > 1
                    ? 's'
                    : ''} won't double again within ${formatNum(alerts?.['World 6']?.farming?.finishedPlots.hours)} hours: collect to restart them`}
                  iconPath={'data/FarmPlant1'}/> : null}
              {alerts?.['World 6']?.farming?.totalCrops > 0 ?
                <Alert target={'World 6.farming.totalCrops'}
                  title={`You have ${counted(alerts?.['World 6']?.farming?.totalCrops, 'crop')} ready to be collected`}
                  iconPath={'data/FarmPlant6'}/> : null}
              {alerts?.['World 6']?.farming?.beanTrade > 0 ?
                <Alert target={'World 6.farming.beanTrade'}
                  title={`Your bean trade has reached ${formatGame(Math.floor(alerts?.['World 6']?.farming?.beanTrade), 'FarmingStuffs.BeanTradeQTY')}`}
                  iconPath={'data/Quest80_x1'}/> : null}
              {alerts?.['World 6']?.farming?.exoticPurchases ?
                <Alert target={'World 6.farming.exoticPurchases'}
                  title={`You have ${formatNum(alerts?.['World 6']?.farming?.exoticPurchases.available)} exotic purchase${alerts?.['World 6']?.farming?.exoticPurchases.available > 1
                    ? 's'
                    : ''} available (${formatNum(alerts?.['World 6']?.farming?.exoticPurchases.purchased)}/${formatNum(alerts?.['World 6']?.farming?.exoticPurchases.max)})`}
                  iconPath={'data/FarmStT3'}/> : null}
              {alerts?.['World 6']?.etc?.emperorAttempts > 0 ?
                <Alert target={'World 6.etc.emperorAttempts'}
                  title={`You have reached ${counted(alerts?.['World 6']?.etc?.emperorAttempts, 'emperor attempt')}`}
                  iconPath={'data/Boss6'}/> : null}
    </>,
    'World 7': <>
              {alerts?.['World 7']?.royalGuardian?.idleOutposts?.length > 0 ?
                <Alert target={'World 7.royalGuardian.idleOutposts'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.idleOutposts?.length)} outpost${alerts?.['World 7']?.royalGuardian?.idleOutposts?.length === 1
                      ? ' is'
                      : 's are'} connected to an empty resource, and could switch to one in range that still has some`}
                    entries={alerts?.['World 7']?.royalGuardian?.idleOutposts}/>}
                  iconPath={'etc/Royal_Outpost'} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {alerts?.['World 7']?.royalGuardian?.unwiredOutposts?.length > 0 ?
                <Alert target={'World 7.royalGuardian.unwiredOutposts'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.unwiredOutposts?.length)} outpost${alerts?.['World 7']?.royalGuardian?.unwiredOutposts?.length === 1
                      ? ' has'
                      : 's have'} no resource connected`}
                    entries={alerts?.['World 7']?.royalGuardian?.unwiredOutposts}/>}
                  iconPath={'data/RGresB5'} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {alerts?.['World 7']?.royalGuardian?.idleSupportCamps?.length > 0 ?
                <Alert target={'World 7.royalGuardian.idleSupportCamps'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.idleSupportCamps?.length)} support camp${alerts?.['World 7']?.royalGuardian?.idleSupportCamps?.length === 1
                      ? ' is'
                      : 's are'} boosting nothing`}
                    entries={alerts?.['World 7']?.royalGuardian?.idleSupportCamps}/>}
                  iconPath={'data/UISkillIcon226'} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {alerts?.['World 7']?.royalGuardian?.unspentPts ?
                <Alert target={'World 7.royalGuardian.unspentPts'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.unspentPts?.count)} outpost${alerts?.['World 7']?.royalGuardian?.unspentPts?.count === 1
                      ? ' has'
                      : 's have'} ${formatNum(alerts?.['World 7']?.royalGuardian?.unspentPts?.threshold)}+ unspent PTS`}
                    entries={alerts?.['World 7']?.royalGuardian?.unspentPts?.outposts?.map((outpost) => ({
                      ...outpost,
                      detail: `${formatNum(outpost?.ptsLeft, 'whole')} PTS`
                    }))}/>}
                  iconPath={'etc/Royal_Cost'} imgStyle={{ width: 18, height: 18 }} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {alerts?.['World 7']?.royalGuardian?.claimableMaps?.length > 0 ?
                <Alert target={'World 7.royalGuardian.claimableMaps'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.claimableMaps?.length)} map${alerts?.['World 7']?.royalGuardian?.claimableMaps?.length === 1
                      ? ' is'
                      : 's are'} cleared and ready to claim an outpost`}
                    entries={alerts?.['World 7']?.royalGuardian?.claimableMaps}/>}
                  iconPath={'etc/RGglyphCheck'} imgStyle={{ width: 18, height: 18 }} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {alerts?.['World 7']?.royalGuardian?.idleUnits ?
                <Alert target={'World 7.royalGuardian.idleUnits'}
                  title={`${formatNum(alerts?.['World 7']?.royalGuardian?.idleUnits?.count)} unit${alerts?.['World 7']?.royalGuardian?.idleUnits?.count === 1 ? ' is' : 's are'} ${alerts?.['World 7']?.royalGuardian?.idleUnits?.unassigned > 0
                    ? 'unassigned or clearing a map you already claimed'
                    : 'clearing a map you already claimed'}${alerts?.['World 7']?.royalGuardian?.idleUnits?.discounted
                    ? ', earning half rank EXP instead of clearing a new one'
                    : ', earning nothing'}`}
                  iconPath={'etc/RGmilitia'}/> : null}
              {alerts?.['World 7']?.royalGuardian?.overkillWorkers ?
                <Alert target={'World 7.royalGuardian.overkillWorkers'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.overkillWorkers?.count)} outpost${alerts?.['World 7']?.royalGuardian?.overkillWorkers?.count === 1
                      ? ' has'
                      : 's have'} more Workers than they need to empty their resource ${alerts?.['World 7']?.royalGuardian?.overkillWorkers?.beforeReset
                      ? "before today's reset"
                      : `within ${formatNum(alerts?.['World 7']?.royalGuardian?.overkillWorkers?.horizon)}h`}: the spare ones would earn ${alerts?.['World 7']?.royalGuardian?.overkillWorkers?.surveyors
                      ? 'rank EXP as Traders or Surveyors'
                      : 'Trade rank EXP as Traders'}`}
                    entries={alerts?.['World 7']?.royalGuardian?.overkillWorkers?.outposts?.map((outpost) => ({
                      ...outpost,
                      detail: `${formatNum(outpost?.workers)} Worker${outpost?.workers === 1 ? '' : 's'}, ${formatNum(outpost?.expPerHour, 'rate')}${alerts?.['World 7']?.royalGuardian?.overkillWorkers?.surveyors
                        ? ` Trade or ${formatNum(outpost?.intelExpPerHour, 'rate')} Intel`
                        : ''} EXP`
                    }))}/>}
                  iconPath={'etc/RGunit0'} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {alerts?.['World 7']?.royalGuardian?.missingWorkers ?
                <Alert target={'World 7.royalGuardian.missingWorkers'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.missingWorkers?.count)} outpost${alerts?.['World 7']?.royalGuardian?.missingWorkers?.count === 1
                      ? ' needs'
                      : 's need'} more Workers to empty their resource ${alerts?.['World 7']?.royalGuardian?.missingWorkers?.beforeReset
                      ? `before the reset in ${formatDuration(alerts?.['World 7']?.royalGuardian?.missingWorkers?.horizon * 3600)}`
                      : `within ${formatNum(alerts?.['World 7']?.royalGuardian?.missingWorkers?.horizon)}h`}: retrain Traders or Surveyors there as Workers`}
                    entries={alerts?.['World 7']?.royalGuardian?.missingWorkers?.outposts?.map((outpost) => ({
                      ...outpost,
                      detail: `+${formatNum(outpost?.workers)} Worker${outpost?.workers === 1 ? '' : 's'}, empties in ${formatDuration(outpost?.hoursToEmpty * 3600)}`
                    }))}/>}
                  iconPath={'etc/RGunit0'} badge={'deficit'} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {alerts?.['World 7']?.royalGuardian?.strandedWorkers ?
                <Alert target={'World 7.royalGuardian.strandedWorkers'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.strandedWorkers?.count)} outpost${alerts?.['World 7']?.royalGuardian?.strandedWorkers?.count === 1
                      ? ' has'
                      : 's have'} Workers on an empty resource with nothing better in range: ${alerts?.['World 7']?.royalGuardian?.strandedWorkers?.surveyors
                      ? 'Traders or Surveyors would earn rank EXP instead'
                      : 'Traders would earn Trade rank EXP instead'}`}
                    entries={alerts?.['World 7']?.royalGuardian?.strandedWorkers?.outposts?.map((outpost) => ({
                      ...outpost,
                      detail: `${outpost?.workers} Worker${outpost?.workers === 1 ? '' : 's'}`
                    }))}/>}
                  iconPath={'etc/RGunit1'} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {alerts?.['World 7']?.royalGuardian?.idleGuards ?
                <Alert target={'World 7.royalGuardian.idleGuards'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.idleGuards?.count)} outpost${alerts?.['World 7']?.royalGuardian?.idleGuards?.count === 1
                      ? ' has'
                      : 's have'} Guards whose range ${alerts?.['World 7']?.royalGuardian?.idleGuards?.count === 1 ? 'it does' : 'they do'} not need: ${alerts?.['World 7']?.royalGuardian?.idleGuards?.surveyors
                      ? 'Traders or Surveyors would earn rank EXP instead'
                      : 'Traders would earn Trade rank EXP instead'}`}
                    entries={alerts?.['World 7']?.royalGuardian?.idleGuards?.outposts?.map((outpost) => ({
                      ...outpost,
                      detail: `${outpost?.spare} spare Guard${outpost?.spare === 1 ? '' : 's'}`
                    }))}/>}
                  iconPath={'etc/RGunit2'} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {alerts?.['World 7']?.royalGuardian?.parkedGuards ?
                <Alert target={'World 7.royalGuardian.parkedGuards'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.parkedGuards?.count)} outpost${alerts?.['World 7']?.royalGuardian?.parkedGuards?.count === 1
                      ? ' has'
                      : 's have'} Guards that only reach an empty resource: ${alerts?.['World 7']?.royalGuardian?.parkedGuards?.surveyors
                      ? 'Traders or Surveyors'
                      : 'Traders'} would earn rank EXP until the daily reset. Swapping them drops that connection, so rewire it after the reset`}
                    entries={alerts?.['World 7']?.royalGuardian?.parkedGuards?.outposts?.map((outpost) => ({
                      ...outpost,
                      detail: `${outpost?.parked} Guard${outpost?.parked === 1 ? '' : 's'} on an empty resource`
                    }))}/>}
                  iconPath={'etc/RGunit2'} badge={'deficit'} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {alerts?.['World 7']?.royalGuardian?.sharedNodes ?
                <Alert target={'World 7.royalGuardian.sharedNodes'}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.sharedNodes?.count)} outpost${alerts?.['World 7']?.royalGuardian?.sharedNodes?.count === 1
                      ? ' is'
                      : 's are'} sharing a resource the other outpost empties within ${formatNum(alerts?.['World 7']?.royalGuardian?.sharedNodes?.horizon)}h on its own, so the connection is spare`}
                    entries={alerts?.['World 7']?.royalGuardian?.sharedNodes?.outposts}/>}
                  iconPath={'data/RGresB5'} badge={'sharedLink'} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null}
              {RG_RANK_ALERTS.map(({ option, rank, holders, unit, iconPath, badge }) => alerts?.['World 7']?.royalGuardian?.[option] ?
                <Alert target={`World 7.royalGuardian.${option}`}
                  worlds={alerts?.['World 7']?.royalGuardian?.[option]?.outposts?.map(({ world }) => world)}
                  key={option}
                  title={<RoyalGuardianList
                    headline={`${formatNum(alerts?.['World 7']?.royalGuardian?.[option]?.count)} outpost${alerts?.['World 7']?.royalGuardian?.[option]?.count === 1
                      ? ' has'
                      : 's have'} reached ${alerts?.['World 7']?.royalGuardian?.[option]?.threshold != null
                      ? `${rank} rank ${formatNum(alerts?.['World 7']?.royalGuardian?.[option]?.threshold)}`
                      : `their ${rank} rank target`} with ${holders} still on it`}
                    entries={alerts?.['World 7']?.royalGuardian?.[option]?.outposts?.map((outpost) => ({
                      ...outpost,
                      detail: `Rank ${outpost?.rank}/${outpost?.threshold}, ${outpost?.units} ${unit}${outpost?.units === 1 ? '' : 's'}`
                    }))}/>}
                  iconPath={iconPath} badge={badge} maxWidth={RG_LIST_TOOLTIP_WIDTH}/> : null)}
              {alerts?.['World 7']?.royalGuardian?.restockLocked ?
                <Alert target={'World 7.royalGuardian.restockLocked'}
                  title={'Resource Replenish is unbought, so your empty resources never refill'}
                  iconPath={'data/UISkillIcon226'} badge={'locked'}/> : null}
              {alerts?.['World 7']?.gallery?.missingTrophies?.length > 0 && !failed('gallery') ?
                alerts?.['World 7']?.gallery?.missingTrophies?.map(({ itemName, owner, rawName }, index) =>
                  <Alert target={'World 7.gallery.missingTrophies'}
                    key={`missing-trophy-${rawName}-${index}`}
                    title={`${cleanUnderscore(itemName)} is missing from gallery (${owner})`}
                    iconPath={`data/${rawName}`}/>) : null}
              {alerts?.['World 7']?.gallery?.missingNametags?.length > 0 && !failed('gallery') ?
                alerts?.['World 7']?.gallery?.missingNametags?.map(({ itemName, owner, rawName }, index) =>
                  <Alert target={'World 7.gallery.missingNametags'}
                    key={`missing-nametag-${rawName}-${index}`}
                    title={`${cleanUnderscore(itemName)} is missing from gallery (${owner})`}
                    iconPath={`data/${rawName}`}/>) : null}
              {alerts?.['World 7']?.spelunking?.pageReads?.available > 0 ?
                <Alert target={'World 7.spelunking.pageReads'}
                  title={`You have ${formatNum(alerts?.['World 7']?.spelunking?.pageReads?.available)} page read${alerts?.['World 7']?.spelunking?.pageReads?.available === 1
                    ? ''
                    : 's'} available (${formatNum(alerts?.['World 7']?.spelunking?.pageReads?.current)}/${formatNum(alerts?.['World 7']?.spelunking?.pageReads?.max)})`}
                  iconPath={'data/Spelunking0'}/> : null}
              {alerts?.['World 7']?.spelunking?.fullStaminaCharacters?.count >= alerts?.['World 7']?.spelunking?.fullStaminaCharacters?.threshold
                ?
                <Alert target={'World 7.spelunking.fullStaminaCharacters'}
                  title={`${formatNum(alerts?.['World 7']?.spelunking?.fullStaminaCharacters?.count)} character${alerts?.['World 7']?.spelunking?.fullStaminaCharacters?.count === 1
                    ? ''
                    : 's'} ${alerts?.['World 7']?.spelunking?.fullStaminaCharacters?.count === 1
                    ? 'has'
                    : 'have'} full stamina`}
                  iconPath={'data/CaveShopUpg4'}/>
                : null}
              {alerts?.['World 7']?.spelunking?.overstimLevel?.current >= alerts?.['World 7']?.spelunking?.overstimLevel?.threshold
                ?
                <Alert target={'World 7.spelunking.overstimLevel'}
                  title={`Overstim level has reached ${formatNum(alerts?.['World 7']?.spelunking?.overstimLevel?.current)} (threshold: ${formatNum(alerts?.['World 7']?.spelunking?.overstimLevel?.threshold)})`}
                  iconPath={'data/CaveShopUpg6'}/>
                : null}
              {alerts?.['World 7']?.legendTalents?.legendPointsLeftToSpend > 0 ?
                <Alert target={'World 7.legendTalents.legendPointsLeftToSpend'}
                  title={`You have ${formatNum(alerts?.['World 7']?.legendTalents?.legendPointsLeftToSpend)} unspent legend talent point${alerts?.['World 7']?.legendTalents?.legendPointsLeftToSpend === 1
                    ? ''
                    : 's'}`}
                  iconPath={'data/LegendTalentIcon0'}/> : null}
              {alerts?.['World 7']?.legendTalents?.cheaperMasterclassUpgrades ?
                <Alert target={'World 7.legendTalents.cheaperMasterclassUpgrades'}
                  title={`You have ${formatNum(alerts?.['World 7']?.legendTalents?.cheaperMasterclassUpgrades.available)} cheaper masterclass upgrade${alerts?.['World 7']?.legendTalents?.cheaperMasterclassUpgrades.available === 1
                    ? ''
                    : 's'} available (${formatNum(alerts?.['World 7']?.legendTalents?.cheaperMasterclassUpgrades.used)}/${formatNum(alerts?.['World 7']?.legendTalents?.cheaperMasterclassUpgrades.max)})`}
                  iconPath={'data/LegendTalentIcon12'}/> : null}
              {alerts?.['World 7']?.zenithMarket?.doubleCluster ?
                <Alert target={'World 7.zenithMarket.doubleCluster'}
                  title={'You can afford Double Clusters upgrade'}
                  iconPath={'etc/Cluster'}/> : null}
              {alerts?.['World 7']?.zenithMarket?.clusterFarming ?
                <Alert target={'World 7.zenithMarket.clusterFarming'}
                  title={`Zenith Cluster Farming is ${alerts?.['World 7']?.zenithMarket?.clusterFarming?.toLowerCase?.()}`}
                  iconPath={'etc/Cluster'}
                  imgStyle={alerts?.['World 7']?.zenithMarket?.clusterFarming === 'OFF'
                    ? { filter: 'grayscale(1)' }
                    : undefined}/> : null}
              {alerts?.['World 7']?.construction?.jeweledCogs && !failed('legendTalents') ?
                <Alert target={'World 7.construction.jeweledCogs'}
                  title={`You have ${formatNum(alerts?.['World 7']?.construction?.jeweledCogs?.available)} jeweled cog pull${alerts?.['World 7']?.construction?.jeweledCogs?.available > 1
                    ? 's'
                    : ''} left (${formatNum(alerts?.['World 7']?.construction?.jeweledCogs?.current)}/${formatNum(alerts?.['World 7']?.construction?.jeweledCogs?.max)})`}
                  iconPath={'data/CogCry0'}/> : null}
              {alerts?.['World 7']?.minehead?.dailyTries ?
                <Alert target={'World 7.minehead.dailyTries'}
                  title={`You have ${formatNum(alerts?.['World 7']?.minehead?.dailyTries?.left)} minehead attempt${alerts?.['World 7']?.minehead?.dailyTries?.left === 1 ? '' : 's'} left (${formatNum(alerts?.['World 7']?.minehead?.dailyTries?.left)}/${formatNum(alerts?.['World 7']?.minehead?.dailyTries?.max)})`}
                  iconPath={'data/MineHead0'}/> : null}
              {alerts?.['World 7']?.minehead?.currencyUpgrades?.length > 0 ?
                alerts?.['World 7']?.minehead?.currencyUpgrades?.map((upgrade) => <Alert target={'World 7.minehead.currencyUpgrades'}
                  items={[{ key: `MineUpg${upgrade?.index}`, label: cleanUnderscore(upgrade?.name) }]}
                  key={`minehead-upgrade-${upgrade?.index}`}
                  title={`You can afford ${cleanUnderscore(upgrade?.name)} Lv ${formatNum(upgrade?.level + 1)} (${formatGame(upgrade?.cost, 'Minehead.UpgCost', { whole: true })})`}
                  iconPath={`data/MineUpg${upgrade?.index}`}/>) : null}
              {alerts?.['World 7']?.research?.observationRollsLeft ?
                <Alert target={'World 7.research.observationRollsLeft'}
                  title={`You have ${formatNum(alerts?.['World 7']?.research?.observationRollsLeft?.left)} observation roll${alerts?.['World 7']?.research?.observationRollsLeft?.left === 1 ? '' : 's'} left (${formatNum(alerts?.['World 7']?.research?.observationRollsLeft?.left)}/${formatNum(alerts?.['World 7']?.research?.observationRollsLeft?.max)})`}
                  iconPath={'data/ResObsClip'}/> : null}
              {alerts?.['World 7']?.research?.insightLevel?.observations?.length > 0 ?
                <Alert target={'World 7.research.insightLevel'}
                  ariaLabel={`${alerts?.['World 7']?.research?.insightLevel?.observations?.length} observations at their insight target`}
                  title={<Stack gap={0.5}>
                    <Typography variant={'body2'}>{alerts?.['World 7']?.research?.insightLevel?.observations?.length} observation{alerts?.['World 7']?.research?.insightLevel?.observations?.length === 1 ? '' : 's'} at insight Lv {alerts?.['World 7']?.research?.insightLevel?.threshold}+</Typography>
                    {alerts?.['World 7']?.research?.insightLevel?.observations?.map((obs) =>
                      <Typography key={obs.index} variant={'body2'}>{cleanUnderscore(obs.name)}: Lv {obs.insightLevel}</Typography>
                    )}
                  </Stack>}
                  iconPath={'data/ResMagni1'}/> : null}
              {alerts?.['World 7']?.sushiStation?.fuelFull ?
                <Alert target={'World 7.sushiStation.fuelFull'}
                  title={'Sushi Station fuel is full: cook some sushi'}
                  iconPath={'data/Sushi6'}/> : null}
              {alerts?.['World 7']?.sushiStation?.shakerUses?.length > 0 ?
                alerts?.['World 7']?.sushiStation?.shakerUses?.map((shaker) => {
                  const iconMap = { Salt: 'SushiUpg17', Pepper: 'SushiUpg18', Saffron: 'SushiUpg19' };
                  return <Alert target={'World 7.sushiStation.shakerUses'}
                    items={[{ key: iconMap[shaker.name], label: `${shaker.name} Shaker` }]}
                    key={`shaker-${shaker.name}`}
                    title={`${shaker.name} Shaker: ${formatNum(shaker.uses)} use${shaker.uses === 1 ? '' : 's'} available`}
                    iconPath={`data/${iconMap[shaker.name]}`}/>;
                }) : null}

              {alerts?.['World 7']?.sushiStation?.knowledgeLevelUp?.length > 0 ?
                alerts?.['World 7']?.sushiStation?.knowledgeLevelUp?.map((sushi) =>
                  <Alert target={'World 7.sushiStation.knowledgeLevelUp'}
                    key={`sushi-kn-${sushi.index}`}
                    title={`${sushi.name} is ready for knowledge level-up (Lv ${formatNum(sushi.level)})`}
                    iconPath={`data/Sushi${sushi.index}`}/>) : null}
              {alerts?.['World 7']?.jellyOperator?.operationsLeft ?
                <Alert target={'World 7.jellyOperator.operationsLeft'}
                  title={`You have ${formatNum(alerts?.['World 7']?.jellyOperator?.operationsLeft?.left)} Jelly operation${alerts?.['World 7']?.jellyOperator?.operationsLeft?.left === 1 ? '' : 's'} left (${alerts?.['World 7']?.jellyOperator?.operationsLeft?.left > alerts?.['World 7']?.jellyOperator?.operationsLeft?.max ? `${formatNum(alerts?.['World 7']?.jellyOperator?.operationsLeft?.max)}/day` : `${formatNum(alerts?.['World 7']?.jellyOperator?.operationsLeft?.left)}/${formatNum(alerts?.['World 7']?.jellyOperator?.operationsLeft?.max)}`})`}
                  iconPath={'data/JellyUnit0'}/> : null}
              {alerts?.['World 7']?.jellyOperator?.slotsToBuy ?
                <Alert target={'World 7.jellyOperator.slotsToBuy'}
                  title={`You can unlock ${formatNum(alerts?.['World 7']?.jellyOperator?.slotsToBuy)} more Jelly slot${alerts?.['World 7']?.jellyOperator?.slotsToBuy === 1 ? '' : 's'}`}
                  iconPath={'data/JellySq0_0'}/> : null}
              {alerts?.['World 7']?.jellyOperator?.emptySlots ?
                <Alert target={'World 7.jellyOperator.emptySlots'}
                  title={`${formatNum(alerts?.['World 7']?.jellyOperator?.emptySlots)} open Jelly slot${alerts?.['World 7']?.jellyOperator?.emptySlots === 1 ? ' has' : 's have'} no cell on ${alerts?.['World 7']?.jellyOperator?.emptySlots === 1 ? 'it' : 'them'}`}
                  iconPath={'data/JellySq0_0'}/> : null}
              {alerts?.['World 7']?.jellyOperator?.virusesUnplaced ?
                <Alert target={'World 7.jellyOperator.virusesUnplaced'}
                  title={`You can place ${formatNum(alerts?.['World 7']?.jellyOperator?.virusesUnplaced)} more Virus${alerts?.['World 7']?.jellyOperator?.virusesUnplaced === 1 ? '' : 'es'}`}
                  iconPath={'data/JellyUnit5'}/> : null}
              {alerts?.['World 7']?.menagerie?.claimableMissions?.length > 0 ?
                <Alert target={'World 7.menagerie.claimableMissions'}
                  ariaLabel={`${formatNum(alerts?.['World 7']?.menagerie?.claimableMissions?.length)} Menagerie missions ready to claim`}
                  title={<MenagerieAlertList
                    headline={`${formatNum(alerts?.['World 7']?.menagerie?.claimableMissions?.length)} Menagerie mission${alerts?.['World 7']?.menagerie?.claimableMissions?.length === 1 ? ' is' : 's are'} ready to claim`}
                    entries={alerts?.['World 7']?.menagerie?.claimableMissions?.map(({ index, name }) => ({ key: index, text: name }))}/>}
                  iconPath={`data/MenaIconY${alerts?.['World 7']?.menagerie?.claimableMissions?.[0]?.index}`}/> : null}
              {alerts?.['World 7']?.menagerie?.affordableUnlocks?.length > 0 ?
                <Alert target={'World 7.menagerie.affordableUnlocks'}
                  ariaLabel={`${formatNum(alerts?.['World 7']?.menagerie?.affordableUnlocks?.length)} Menagerie unlocks affordable`}
                  title={<MenagerieAlertList
                    headline={`You can afford ${formatNum(alerts?.['World 7']?.menagerie?.affordableUnlocks?.length)} Menagerie unlock${alerts?.['World 7']?.menagerie?.affordableUnlocks?.length === 1 ? '' : 's'}`}
                    entries={alerts?.['World 7']?.menagerie?.affordableUnlocks?.map(({ index, name, cost }) => ({
                      key: index,
                      text: `${name}: ${formatGame(cost, 'MenagerieStuff.Cost', { whole: true })} Lumi`
                    }))}/>}
                  iconPath={`data/MenaIconO${alerts?.['World 7']?.menagerie?.affordableUnlocks?.[0]?.index}`}/> : null}
              {alerts?.['World 7']?.menagerie?.affordableBoosts?.length > 0 ?
                <Alert target={'World 7.menagerie.affordableBoosts'}
                  title={`You can afford ${formatNum(alerts?.['World 7']?.menagerie?.affordableBoosts?.length)} Menagerie boost${alerts?.['World 7']?.menagerie?.affordableBoosts?.length === 1 ? '' : 's'}`}
                  iconPath={`data/MenaIconP${alerts?.['World 7']?.menagerie?.affordableBoosts?.[0]?.index}`}/> : null}
              {alerts?.['World 7']?.menagerie?.lumiBoost ?
                <Alert target={'World 7.menagerie.lumiBoost'}
                  title={`You can afford the Lumi/hr boost (Lv ${alerts?.['World 7']?.menagerie?.lumiBoost?.level + 1}, ${formatGame(alerts?.['World 7']?.menagerie?.lumiBoost?.cost, 'MenagerieStuff.Cost', { whole: true })} Lumi)`}
                  iconPath={'data/MenaIconP1'}/> : null}
              {alerts?.['World 7']?.menagerie?.missionBoost ?
                <Alert target={'World 7.menagerie.missionBoost'}
                  title={`You can afford the Mission boost (Lv ${alerts?.['World 7']?.menagerie?.missionBoost?.level + 1}, ${formatGame(alerts?.['World 7']?.menagerie?.missionBoost?.cost, 'MenagerieStuff.Cost', { whole: true })} Lumi)`}
                  iconPath={'data/MenaIconP0'}/> : null}
              {alerts?.['World 7']?.menagerie?.pinkJelly?.map((upgrade) =>
                <Alert target={'World 7.menagerie.pinkJelly'}
                  key={`menagerie-pink-${upgrade}`}
                  title={`You can afford the Pink jelly ${upgrade} upgrade`}
                  iconPath={'data/MenaJelly1'}/>)}
              {alerts?.['World 7']?.menagerie?.blueJelly ?
                <Alert target={'World 7.menagerie.blueJelly'}
                  title={`You have ${formatGame(alerts?.['World 7']?.menagerie?.blueJelly, 'Big', { whole: true })} ladles to give the Blue jelly`}
                  iconPath={'data/MenaJelly2'}/> : null}
              {alerts?.['World 7']?.menagerie?.redJelly ?
                <Alert target={'World 7.menagerie.redJelly'}
                  title={`Red jelly reading ready: ${formatNum(alerts?.['World 7']?.menagerie?.redJelly?.daysRested)} days rested, ${formatGame(alerts?.['World 7']?.menagerie?.redJelly?.readingMulti, 'MenagerieStuff.RedJellyReadingMulti')}x gains`}
                  iconPath={'data/MenaJelly3'}/> : null}
              {alerts?.['World 7']?.menagerie?.silverJelly?.map((upgrade) =>
                <Alert target={'World 7.menagerie.silverJelly'}
                  key={`menagerie-silver-${upgrade}`}
                  title={`You can afford the Silver jelly ${upgrade} upgrade`}
                  iconPath={'data/MenaJelly4'}/>)}
              {alerts?.['World 7']?.menagerie?.yellowJelly ?
                <Alert target={'World 7.menagerie.yellowJelly'}
                  title={'Yellow jelly construction purchase ready'}
                  iconPath={'data/MenaJelly5'}/> : null}
              {alerts?.['World 7']?.menagerie?.unusedDoublers?.map(({ key, left }) =>
                <Alert target={'World 7.menagerie.unusedDoublers'}
                  key={`menagerie-doubler-${key}`}
                  title={`You have ${formatNum(left)} unused ${left === 1 ? MENAGERIE_DOUBLER_ALERTS[key]?.name : MENAGERIE_DOUBLER_ALERTS[key]?.plural}`}
                  iconPath={MENAGERIE_DOUBLER_ALERTS[key]?.iconPath}/>)}
              {alerts?.['World 7']?.clamWork?.promotionAffordable ?
                <Alert target={'World 7.clamWork.promotionAffordable'}
                  title={`You can afford a promotion to Worker Class Lv ${formatNum(alerts?.['World 7']?.clamWork?.promotionAffordable?.nextClass)} (${formatGame(alerts?.['World 7']?.clamWork?.promotionAffordable?.cost, 'Thingies.Clam_Cost', { whole: true })} pearls, ${formatNum(alerts?.['World 7']?.clamWork?.promotionAffordable?.chance * 100, 'pct')} chance)`}
                  iconPath={'data/ClamPearl0'}/> : null}
              {alerts?.['World 7']?.theButton?.instaSkipAvailable ?
                <Alert target={'World 7.theButton.instaSkipAvailable'}
                  title={`${formatNum(alerts?.['World 7']?.theButton?.instaSkipAvailable?.skipsLeft)} insta-skip${alerts?.['World 7']?.theButton?.instaSkipAvailable?.skipsLeft === 1 ? '' : 's'} available: the current task can be skipped`}
                  iconPath={'etc/ButtonG'}
                  imgStyle={{ filter: 'hue-rotate(180deg) saturate(1.5)' }}/> : null}
              {alerts?.['World 7']?.theButton?.taskReady ?
                <Alert target={'World 7.theButton.taskReady'}
                  title={'Button task ready: no insta-skip needed'}
                  iconPath={'etc/ButtonG'}/> : null}
    </>
  };
  // toArray mirrors what renders: it flattens the nested maps and drops the nulls of every unmet condition.
  const rows = ROWS.map((row) => ({ row, icons: React.Children.toArray(rowIcons[row].props.children), failed: failedRows?.includes(row) }))
    .filter(({ icons, failed }) => failed || icons.length > 0);
  const count = rows.reduce((total, { icons }) => total + icons.length, 0);
  return <Panel title={'Account alerts'} meta={count > 0 ? `${formatNum(count)} alert${count === 1 ? '' : 's'}` : undefined}>
    {rows.map(({ row, icons, failed }) => <AlertRow key={row} label={row}>
      {failed ? <StatusText status={'problem'}>Couldn't check these alerts.</StatusText> : icons}
    </AlertRow>)}
    {/* A failed section's note says more than this one could */}
    {!rows.length && !account?.failedSections?.length
      ? <Notice tone={'info'} sx={{ m: 2 }}>No account alert is on right now.</Notice> : null}
  </Panel>;
};

// A row's label over its icons on a phone, beside them from sm.
const AlertRow = ({ label, children }) => <Stack direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 0.5, sm: 2 }} sx={{ px: 2, py: 1.5 }}>
  <Typography variant={'groupLabel'} color={'text.secondary'} sx={{ flexShrink: 0, width: { sm: 72 }, pt: { sm: 0.75 } }}>{label}</Typography>
  <Stack direction={'row'} gap={1.5} flexWrap={'wrap'} alignItems={'center'} sx={{ minWidth: 0 }}>{children}</Stack>
</Stack>;

// Icons are the glyphs the game draws beside each doubler's left count (DOUBLER_ICONS).
const MENAGERIE_DOUBLER_ALERTS = {
  blackStars: { name: 'Black Star', plural: 'Black Stars', iconPath: 'etc/BlackStar' },
  organicLabels: { name: 'Organic Label', plural: 'Organic Labels', iconPath: 'etc/OrganicLabel' },
  minehead: { name: 'Minehead doubler', plural: 'Minehead doublers', iconPath: 'etc/MineheadDoubler' },
  sushi: { name: 'Sushi Station doubler', plural: 'Sushi Station doublers', iconPath: 'etc/SushiDoubler' },
  jellyOperator: { name: 'Jelly Operator doubler', plural: 'Jelly Operator doublers', iconPath: 'etc/JellyOpDoubler' },
  omnijade: { name: 'Omnijade', plural: 'Omnijade', iconPath: 'etc/Omnijade' }
};

const MenagerieAlertList = ({ headline, entries = [] }) => <Stack gap={.5}>
  <Typography variant={'body2'}>{headline}</Typography>
  {entries.map(({ key, text }) => <Typography key={key} variant={'body2'}>{text}</Typography>)}
</Stack>;

// Past this many stamps the tooltip turns into a wall of names, so the rest is summed up instead.
const MAX_LISTED_STAMPS = 4;

// Same treatment for the Royal Guardian alerts: an account can have dozens of outposts in one
// state, and a comma-joined line of eighteen map names is unreadable.
const MAX_LISTED_OUTPOSTS = 6;

// Each line carries a map name, its world, the map's monster and, for some alerts, a numbers
// column ("2 Workers, +6/hr EXP"); the default hover preview wraps that into a ragged second
// line for most entries, and 460 still did for the longer map names. The quick edit stacks them on a phone.
const RG_LIST_TOOLTIP_WIDTH = 540;

const RG_RANK_ALERTS = [
  { option: 'tradeRank', rank: 'Trade', holders: 'Traders', unit: 'Trader', iconPath: 'etc/RGunit1', badge: 'rankUp' },
  { option: 'intelRank', rank: 'Intel', holders: 'Surveyors', unit: 'Surveyor', iconPath: 'etc/RGunit3', badge: 'rankUp' },
  { option: 'commandRank', rank: 'Command', holders: 'Commanders', unit: 'Commander', iconPath: 'etc/RGcommander', badge: 'rankUp' },
  { option: 'militaryRank', rank: 'Military', holders: 'Knights', unit: 'Knight', iconPath: 'etc/RGknight', badge: 'rankUp' },
  { option: 'purityRank', rank: 'Purity', holders: 'Priests', unit: 'Priest', iconPath: 'etc/RGpriest', badge: 'rankUp' }
];

const RoyalGuardianList = ({ headline, entries = [] }) => {
  const listed = entries.slice(0, MAX_LISTED_OUTPOSTS);
  const others = entries.length - listed.length;
  return <Stack gap={.5}>
    <Typography variant={'body2'}>{headline}{listed.length > 0 ? ':' : ''}</Typography>
    {listed.length > 0 ? <Stack component={'ul'} sx={{ m: 0, pl: 2.5 }}>
      {listed.map(({ name, mapIndex, world, monsterRawName, monsterName, detail }) => <Typography component={'li'} variant={'body2'}
                                                                                                  key={mapIndex}>
        {/* Two columns: what the outpost is on the left, its numbers (worker count, PTS) on the
            right, so the numbers line up down the list instead of trailing each name at a
            different offset. */}
        <Box component={'span'} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: detail ? 'minmax(0, 1fr) auto' : 'minmax(0, 1fr)' }, columnGap: 1.5 }}>
          <span>
            <span>{world > 0 ? `W${world} ` : ''}{name}</span>
            {/* Map names alone ("Hell Hath Frozen Over") place nothing for most players, so the
                map's native monster or resource rides along as the thing they actually recognise. */}
            {monsterName ? <>{' '}<Box component={'span'} sx={{ color: 'text.secondary', ml: 0.25, whiteSpace: 'nowrap' }}>
              <GameIcon src={monsterSprite(monsterRawName)} size={16} alt={''}/>{' '}
              {monsterName}
            </Box></> : null}
          </span>
          {detail ? <Box component={'span'} sx={{ color: 'text.secondary', textAlign: { sm: 'right' }, whiteSpace: { sm: 'nowrap' } }}>{detail}</Box> : null}
        </Box>
      </Typography>)}
      {others > 0 ? <Typography component={'li'} variant={'body2'} color={'text.secondary'}>
        and {others} more
      </Typography> : null}
    </Stack> : null}
  </Stack>
}

const AffordableStampLevels = ({ count, names = [], totalCost, percentOfMoney, stampsPerDay }) => {
  const listed = names.slice(0, MAX_LISTED_STAMPS).map((name) => cleanUnderscore(name));
  const others = names.length - listed.length;
  return <Stack gap={.5}>
    <Typography variant={'body2'}>
      You can afford to level {formatNum(count, 'whole')} stamp{count > 1 ? 's' : ''} for {formatNum(totalCost, 'whole')} coins
      ({formatNum(percentOfMoney, 'pct')} of your account coins){listed.length > 0 ? ':' : ''}
    </Typography>
    {listed.length > 0 ? <Stack component={'ul'} sx={{ m: 0, pl: 2.5 }}>
      {listed.map((name) => <Typography component={'li'} variant={'body2'} key={name}>{name}</Typography>)}
      {others > 0 ? <Typography component={'li'} variant={'body2'} color={'text.secondary'}>
        and {others} more
      </Typography> : null}
    </Stack> : null}
    {stampsPerDay > 0 ? <Typography variant={'body2'}>
      Level them before your +{stampsPerDay} free stamp levels roll today
    </Typography> : null}
  </Stack>
}

// The section's icon on the shared AlertIcon. `target` is the dot path of the alert's own setting (see
// utility/dashboard/settingsTarget), so a tap opens its quick edit, which leads with the title. The corner glyph,
// the atom's particle, the breeding heart and the vial's bottle are the game marks the sprite carries.
const Alert = ({ title, iconPath, vial, atom, breedability, imgStyle, badge, target, items, worlds, maxWidth, ariaLabel, label }) => {
  const { Icon: BadgeIcon, color, border, size } = alertBadges[badge] || {};
  return <AlertIcon configType={'account'} target={target} extra={items || worlds ? { items, worlds } : undefined}
                    message={title} label={ariaLabel ?? label} maxWidth={maxWidth}
                    icon={vial ? <VialArt level={vial?.level} material={`${iconPath}.png`} size={32}/> : `${iconPath}.png`}
                    look={{ ...(border ? { outline: '1px solid', outlineColor: border } : {}), ...imgStyle }}
                    badge={BadgeIcon ? <Box component={'span'} sx={{ ...BADGE_SX, color }}><BadgeIcon sx={{ fontSize: size }}/></Box> : null}>
    {atom || breedability ? <Box component={'span'} sx={MARK_SX}>
      <GameIcon src={`etc/${atom ? 'Particle' : 'PetHeart'}.png`} size={16} alt={atom ? 'Particle' : 'Heart'}/>
    </Box> : null}
  </AlertIcon>;
};

// Coarse on purpose - the projection is only as good as the current cycle rates, so minute
// precision would read as more certain than it is.
const RefineryTitle = ({ missingMats, hoursLeft }) => <Stack gap={.5}>
  <Typography variant={'body2'}>
    {hoursLeft > 0 ? `Materials run out in ${formatDuration(hoursLeft * 3600)}` : 'Missing materials'}
  </Typography>
  <Stack direction={'row'} gap={.5} flexWrap={'wrap'}>
    {missingMats.map(({ rawName }) => <GameIcon key={rawName} src={`data/${rawName}.png`} size={24} alt={pickerItemLabel(rawName)}/>)}
  </Stack>
</Stack>;

const ShopTitle = ({ shop }) => <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
  {shop?.map(({ amount, rawName }, index) => <Stack alignItems={'center'} key={rawName + index}>
    <GameIcon src={`data/${rawName}.png`} size={32} alt={pickerItemLabel(rawName)}/>
    <Typography variant={'body2'}>{formatNum(amount, 'whole')}</Typography>
  </Stack>)}
</Stack>;

// Bottom right - the atom/breeding mark owns the bottom left corner. The glyph sits bare on top of the icon, with a
// dark outline so it stays readable over the brighter salt colours; anchored by a percentage of its own box so every
// glyph size hangs off the corner the same way.
const BADGE_SX = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  transform: 'translate(40%, 40%)',
  display: 'flex',
  filter: 'drop-shadow(0 0 1px var(--mui-palette-common-black)) drop-shadow(0 0 2px var(--mui-palette-common-black))'
};
const MARK_SX = { position: 'absolute', left: -5, bottom: '30%', display: 'inline-flex' };

export default Account;
