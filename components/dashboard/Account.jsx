import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import styled from '@emotion/styled';
import {
  cleanUnderscore,
  commaNotation,
  getNumberWithOrdinal,
  notateNumber,
  numberWithCommas,
  pascalCase,
  prefix,
  randomFloatBetween,
  secondsToShortDuration
} from '@utility/helpers';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import HtmlTooltip from '../Tooltip';
import {
  getGeneralAlerts,
  getWorld1Alerts,
  getWorld2Alerts,
  getWorld3Alerts,
  getWorld4Alerts,
  getWorld5Alerts,
  getWorld6Alerts,
  getWorld7Alerts
} from '@utility/dashboard/account';
import useAlerts from '@hooks/useAlerts';
import { useOpenDashboardSettings } from '@components/common/context/DashboardSettingsProvider';

// Every refinery alert draws the same salt icon, and one salt can raise several of them at once,
// so a corner glyph says which condition fired without having to hover each copy.
// The border repeats the badge colour in a muted tone so the pair reads as one signal at a glance,
// with the glyph there for anyone the colour alone doesn't reach.
// The drop arrows carry a lot of empty viewBox, so they need a larger size than the other glyphs
// to end up looking the same weight inside the badge.
const alertBadges = {
  saltRankUp: { Icon: ArrowDropUpIcon, color: '#66bb6a', border: '#3e6b40', size: 36 },
  // A chevron rather than a second filled triangle - this one is headroom to rank up later,
  // not power already banked and waiting.
  saltRankUpRoom: { Icon: KeyboardArrowUpIcon, color: '#66bb6a', border: '#3e6b40', size: 24 },
  saltDeficit: { Icon: ArrowDropDownIcon, color: '#d62727', border: '#833b3b', size: 36 },
  saltMaterials: { Icon: WarningRoundedIcon, color: '#d1921e', border: '#7a5a1e', size: 18 }
};

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
  const { alerts, emptyAlertRows } = useAlerts({
    alertsMap,
    data: account,
    extraData: characters,
    trackers,
    lastUpdated
  });

  return <>
    <Card sx={{ width: 'fit-content' }}>
      <CardContent>
        {alerts ? <Stack divider={<Divider/>} gap={1.5}>
          {!emptyAlertRows?.General ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>General</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.General?.etc?.familyObols ?
                <Alert target={'General.etc.familyObols'} title={`You have ${alerts?.General?.etc?.familyObols} empty family obol slots`}
                       iconPath={'etc/ObolEmpty1'}/> : null}
              {alerts?.General?.gemsFromBosses ?
                <Alert target={'General.gemsFromBosses'} title={`You can kill ${alerts?.General?.gemsFromBosses} more bosses for gems`}
                       iconPath={'data/PremiumGem'}/> : null}
              {alerts?.General?.etc?.freeCompanion ?
                <Alert target={'General.etc.freeCompanion'} title={`You can claim a free companion`}
                       iconPath={'afk_targets/Dog'}/> : null}
              {alerts?.General?.etc?.petMartGems ?
                <Alert target={'General.etc.petMartGems'} title={'You have unclaimed free gems from the Pet Mart'}
                       iconPath={'data/PremiumGem'}/> : null}
              {alerts?.General?.etc?.tournamentRegister ?
                <Alert target={'General.etc.tournamentRegister'} title={'You have not registered for the current Pet Tournament'}
                       iconPath={'data/TournyRank0'}/> : null}
              {alerts?.General?.etc?.glimmerwickCandle ?
                <Alert target={'General.etc.glimmerwickCandle'}
                  title={`You haven't used the Glimmerwick Candle today (${alerts?.General?.etc?.glimmerwickCandle?.attempts}/${alerts?.General?.etc?.glimmerwickCandle?.pity} wishes until guaranteed)`}
                  iconPath={'data/Quest114'}/> : null}
              {alerts?.General?.etc?.dailyCrystals ?
                <Alert target={'General.etc.dailyCrystals'}
                  title={`You have ${alerts?.General?.etc?.dailyCrystals} daily guaranteed crystal kill${alerts?.General?.etc?.dailyCrystals > 1 ? 's' : ''} remaining`}
                  iconPath={'afk_targets/Crystal_Carrot'}/> : null}
              {alerts?.General?.etc?.arcanistDailyDrops?.length > 0
                ?
                alerts?.General?.etc?.arcanistDailyDrops?.map(({ type, remaining }) => <Alert target={'General.etc.arcanistDailyDrops'}
                  key={`arcanist-${type}`}
                  title={`You have ${remaining} Arcanist ${type} drop${remaining > 1 ? 's' : ''} remaining today`}
                  iconPath={type === 'weapon' ? 'data/EquipmentWandsArc0' : 'data/EquipmentRingsArc0'}/>)
                : null}
              {alerts?.General?.etc?.topOfTheMornin ?
                <Alert target={'General.etc.topOfTheMornin'}
                  title={`You have ${alerts?.General?.etc?.topOfTheMornin} Top of the Mornin' kill${alerts?.General?.etc?.topOfTheMornin > 1 ? 's' : ''} remaining today`}
                  iconPath={'data/CompassUpg9'}/> : null}
              {alerts?.General?.etc?.newCharacters ?
                <Alert target={'General.etc.newCharacters'}
                  title={`You can create ${alerts?.General?.etc?.newCharacters} new character${alerts?.General?.etc?.newCharacters > 1
                    ? 's'
                    : ''}`} iconPath={'etc/CharFam0'}/> : null}
              {alerts?.General?.etc?.randomEvents ?
                <Alert target={'General.etc.randomEvents'} title={'You haven\'t done a random event today'} iconPath={'etc/Mega_Grumblo'}/> : null}
              {alerts?.General?.etc?.miniBosses?.length > 0
                ?
                alerts?.General?.etc?.miniBosses?.map(({ rawName, name, current }) => <Alert target={'General.etc.miniBosses'} key={rawName}
                                                                                             title={`You can kill ${current} ${cleanUnderscore(name)}s`}
                                                                                             iconPath={`etc/${rawName}`}/>)
                : null}
              {alerts?.General?.tasks?.length > 0 ?
                alerts?.General?.tasks?.map((world) => <Alert target={'General.tasks'} key={'task' + world}
                                                              title={`Daily task in world ${world + 1} not done yet`}
                                                              iconPath={`etc/Merit_${world}`}/>) : null}
              {alerts?.General?.etc?.keys?.length > 0
                ?
                alerts?.General?.etc?.keys?.map(({ rawName, totalAmount }, index) => <Alert target={'General.etc.keys'} key={rawName + '' + index}
                                                                                            title={`${totalAmount} of ${cleanUnderscore(pascalCase(rawName))} ${rawName.includes('Tix')
                                                                                              ? 'tickets'
                                                                                              : 'keys'} are ready`}
                                                                                            iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.General?.materialTracker?.length > 0
                ?
                alerts?.General?.materialTracker?.map(({ item, quantityOwned, text, note }, index) =>
                  <Link
                    key={item?.rawName + '' + index}
                    href={'/tools/material-tracker'}
                    style={{ display: 'flex', color: 'inherit', textDecoration: 'none' }}>
                    <Alert
                      title={<>
                        <Typography variant={'subtitle2'}>{text}</Typography>
                        {note ? <Typography fontWeight={500} variant={'caption'}>Note: {note}</Typography> : null}
                        <Typography variant={'caption'} sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>Click to open
                          Material Tracker</Typography>
                      </>}
                      iconPath={`data/${item?.rawName}`}/>
                  </Link>)
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
                         title={<ShopTitle shop={shop}/>}
                         iconPath={index === 8 ? `etc/ShopEZ${index}` : `data/ShopEZ${index}`}/> : null) : null}
              {alerts?.General?.guild?.daily ?
                <Alert target={'General.guild.daily'} title={`You have ${alerts?.General?.guild?.daily} uncompleted daily tasks`} iconPath={`etc/GP`}
                       imgStyle={{ filter: 'sepia(1) hue-rotate(46deg) saturate(1)' }}/> : null}
              {alerts?.General?.guild?.weekly ?
                <Alert target={'General.guild.weekly'} title={`You have ${alerts?.General?.guild?.weekly} uncompleted weekly tasks`} iconPath={`etc/GP`}
                       imgStyle={{ filter: 'sepia(1) hue-rotate(140deg) saturate(1)' }}/> : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 1'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 1</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 1']?.stamps?.gildedStamps > 0 ?
                <Alert target={'World 1.stamps.gildedStamps'} title={`You have ${alerts?.['World 1']?.stamps?.gildedStamps} available gilded stamps`}
                       iconPath={'data/GildedStamp'}/> : null}
              {alerts?.['World 1']?.stamps?.affordableStampLevels ?
                <Alert target={'World 1.stamps.affordableStampLevels'} title={<AffordableStampLevels {...alerts?.['World 1']?.stamps?.affordableStampLevels}/>}
                       iconPath={'data/StampA34'}/> : null}
              {alerts?.['World 1']?.stamps?.exaltedStamps > 0 ?
                <Alert target={'World 1.stamps.exaltedStamps'} title={`You have ${alerts?.['World 1']?.stamps?.exaltedStamps} unused exalted stamps`}
                       iconPath={'etc/Exalted_Stamp_Frame'}/> : null}
              {alerts?.['World 1']?.owl?.featherRestart ?
                <Alert target={'World 1.owl.featherRestart'} title={`Feather restart can be upgraded`}
                       iconPath={'etc/Owl_4'}/> : null}
              {alerts?.['World 1']?.owl?.megaFeatherRestart ?
                <Alert target={'World 1.owl.megaFeatherRestart'} title={`Mega feather restart can be upgraded`}
                       iconPath={'etc/Owl_8'}/> : null}
              {alerts?.['World 1']?.forge?.emptySlots ?
                <Alert target={'World 1.forge.emptySlots'} title={`You have empty forge slots`}
                       iconPath={'data/ForgeA'}/> : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 2'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 2</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 2']?.kangaroo?.shinyThreshold ?
                <Alert target={'World 2.kangaroo.shinyThreshold'}
                  title={`You have reached your shiny % threshold of ${alerts?.['World 2']?.kangaroo?.shinyThreshold}% (${Math.round(account?.kangaroo?.shinyProgress)}%)`}
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
                  title={`You haven't claimed your islands' content in ${alerts?.['World 2']?.islands?.unclaimedDays} days`}
                  iconPath={'data/Island1'}/> : null}
              {alerts?.['World 2']?.islands?.shimmerIsland ?
                <Alert target={'World 2.islands.shimmerIsland'}
                  title={<>
                    <div>You haven&apos;t claimed your shimmer&apos;s trial reward this week</div>
                    {typeof alerts?.['World 2']?.islands?.shimmerIsland === 'string' ? <div>
                      Challenge: {cleanUnderscore(alerts?.['World 2']?.islands?.shimmerIsland)}
                    </div> : null}
                  </>}
                  iconPath={'etc/Shimmer_Currency'}/> : null}
              {alerts?.['World 2']?.islands?.garbageUpgrade ?
                <Alert target={'World 2.islands.garbageUpgrade'}
                  title={'You have enough garbage to buy a \'Garbage Gain\' upgrade in trash island'}
                  iconPath={'etc/Trash_Currency'}/> : null}
              {alerts?.['World 2']?.islands?.collectibleGarbage ?
                <Alert target={'World 2.islands.collectibleGarbage'}
                  title={`You have around ${alerts?.['World 2']?.islands?.collectibleGarbage} garbage waiting to be collected in trash island`}
                  iconPath={'etc/Trash_Currency'}/> : null}
              {alerts?.['World 2']?.alchemy?.bargainTag ?
                <Alert target={'World 2.alchemy.bargainTag'} title={'You haven\'t use bargain tag even once today'} iconPath={'data/aShopItems10'}/> : null}
              {alerts?.['World 2']?.alchemy?.gems ?
                <Alert target={'World 2.alchemy.gems'} title={'You haven\'t bought alchemy gems even once today'} iconPath={'data/PremiumGem'}/> : null}
              {alerts?.['World 2']?.alchemy?.alternateParticles ?
                <Alert target={'World 2.alchemy.alternateParticles'}
                  title={`You have ${alerts?.['World 2']?.alchemy?.alternateParticles} alternate particles upgrades available`}
                  iconPath={'etc/Particle'}/> : null}
              {alerts?.['World 2']?.weeklyBosses?.daily
                ?
                <Alert target={'World 2.weeklyBosses.daily'} title={'You haven\'t done a W2 boss fight today'} iconPath={'data/Trophie'}/>
                : null}
              {alerts?.['World 2']?.weeklyBosses?.trophy
                ?
                <Alert target={'World 2.weeklyBosses.trophy'}
                  title={`You can still earn W2 boss trophies this week (${alerts?.['World 2']?.weeklyBosses?.trophy?.bestSkulls}/${alerts?.['World 2']?.weeklyBosses?.trophy?.maxSkulls} skulls)`}
                  iconPath={'data/Trophie'}/>
                : null}
              {alerts?.['World 2']?.killRoy?.general
                ?
                <Alert target={'World 2.killRoy.general'}
                  title={alerts?.['World 2']?.killRoy?.general
                    ? `You haven't done a killroy this week (${account?.killroy?.killRoyClasses.join(', ')})` :
                    alerts?.['World 2']?.killRoy > 0 && account?.accountOptions?.[113] < (account?.killroy?.rooms === 3
                      ? 321
                      : 21) && account?.finishedWorlds?.World3
                      ? `You haven\'t done a killroy this week (${account?.killroy?.killRoyClasses.join(', ')})`
                      : ''} iconPath={'etc/Killroy'}/>
                : null}
              {alerts?.['World 2']?.killRoy?.underHundredKills ?
                <Alert target={'World 2.killRoy.underHundredKills'}
                  title={`Killroy includes a monster with less than 100 kills (${alerts?.['World 2']?.killRoy?.underHundredKills?.map((m) => cleanUnderscore(m?.Name)).join(', ')})`}
                  iconPath={'etc/KillroyPrime'}
                /> : null}
              {alerts?.['World 2']?.killRoy?.skulls ?
                <Alert target={'World 2.killRoy.skulls'}
                  title={`You have ${alerts?.['World 2']?.killRoy?.skulls} unspent killroy skull${alerts?.['World 2']?.killRoy?.skulls === 1 ? '' : 's'}`}
                  iconPath={'etc/Killroy_Skull'}
                /> : null}
              {alerts?.['World 2']?.arcade?.balls ?
                <Alert target={'World 2.arcade.balls'} title={'Max ball capacity has been reached'} iconPath={'data/PachiBall0'}/> : null}
              {alerts?.['World 2']?.arcade?.unmaxedRotation?.length > 0 ?
                alerts?.['World 2']?.arcade?.unmaxedRotation?.map((upgrade) => <Alert target={'World 2.arcade.unmaxedRotation'}
                  key={`arcade-${upgrade?.rotationIndex}`}
                  title={`Arcade rotation upgrade "${cleanUnderscore(upgrade?.effect?.replace(/[{}]/g, ''))}" is not maxed (Lv ${upgrade?.level})`}
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
                      {label}: Lv. {level} / {maxLevel} ({notateNumber(cost, 'Big')} coins)
                    </div>)}
                  </>}
                  iconPath={`data/aJar${type === 'cauldron' ? 'B' : 'L'}${index}`}/>)
                : null}
              {alerts?.['World 2']?.alchemy?.vials?.length > 0 ?
                alerts?.['World 2']?.alchemy?.vials?.map((vial) => <Alert target={'World 2.alchemy.vials'} key={vial?.mainItem}
                                                                          vial={vial}
                                                                          title={`You have enough materials to upgrade ${cleanUnderscore(vial?.name)} vial`}
                                                                          iconPath={`data/${vial?.mainItem}`}/>) : null}

            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 3'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 3</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 3']?.library?.books ?
                <Alert target={'World 3.library.books'}
                  title={`Library has ${account?.libraryTimes?.bookCount} books ready`}
                  iconPath={'data/Libz'}/> : null}
              {alerts?.['World 3']?.atomCollider?.stampReducer ?
                <Alert target={'World 3.atomCollider.stampReducer'}
                  title={`Stamp reducer has reached your threshold (${alerts?.['World 3']?.atomCollider?.stampReducerValue}%)`}
                  iconPath={'data/Atom0'}/> : null}
              {alerts?.['World 3']?.construction?.flags?.length > 0 ?
                <Alert target={'World 3.construction.flags'}
                  title={`There are ${alerts?.['World 3']?.construction?.flags?.length} flags finished in construction board`}
                  iconPath={'data/CogFLflag'}/> : null}
              {alerts?.['World 3']?.equinox?.bar ?
                <Alert target={'World 3.equinox.bar'} title={`Your Equinox bar is full`} iconPath={'data/Quest78'}/> : null}
              {alerts?.['World 3']?.equinox?.challenges > 0 ?
                <Alert target={'World 3.equinox.challenges'} title={`You have ${alerts?.['World 3']?.equinox?.challenges} challenges to validate`}
                       iconPath={'data/Quest78'}/> : null}
              {alerts?.['World 3']?.equinox?.foodLust ?
                <Alert target={'World 3.equinox.foodLust'} title={alerts?.['World 3']?.equinox?.foodLustMaxed
                  ? `Food Lust is maxed (${alerts?.['World 3']?.equinox?.foodLustStacks} stacks)`
                  : `You have ${alerts?.['World 3']?.equinox?.foodLustStacks} Food Lust stacks`}
                       iconPath={'etc/Dream_Upgrade_10'}/> : null}
              {alerts?.['World 3']?.construction?.materials?.length > 0
                ?
                alerts?.['World 3']?.construction?.materials?.map(({ rawName, missingMats, hoursLeft }) => <Alert target={'World 3.construction.materials'} key={rawName}
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
                                                                                                 title={`${cleanUnderscore(saltName)} is ready to rank up`}
                                                                                                 badge={'saltRankUp'}
                                                                                                 iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 3']?.construction?.saltDeficit?.length > 0
                ?
                alerts?.['World 3']?.construction?.saltDeficit?.map(({
                  rawName,
                  saltName,
                  previousSaltName,
                  maxSafeRank,
                  isDeficit
                }) => <Alert target={'World 3.construction.saltDeficit'}
                  key={`salt-deficit-${rawName}`}
                  title={isDeficit
                    ? `${cleanUnderscore(saltName)} is consuming more ${cleanUnderscore(previousSaltName)} than you produce (max rank without a deficit: ${maxSafeRank})`
                    : `Don't rank up ${cleanUnderscore(saltName)} past ${maxSafeRank}, it would cause a ${cleanUnderscore(previousSaltName)} deficit`}
                  badge={'saltDeficit'}
                  iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 3']?.construction?.saltRankUpRoom?.length > 0
                ?
                alerts?.['World 3']?.construction?.saltRankUpRoom?.map(({ rawName, saltName, maxSafeRank }) => <Alert target={'World 3.construction.saltRankUpRoom'}
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
                                                                                       title={`Printing is at maximum (storage) capacity for ${cleanUnderscore(name)}`}
                                                                                       atom
                                                                                       iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 3']?.traps?.overdue > 0 ?
                <Alert target={'World 3.traps.overdue'} title={`${alerts?.['World 3']?.traps?.overdue} traps are overdue`}
                       iconPath={'data/TrapBoxSet1'}/> : null}
              {alerts?.['World 3']?.hatRack?.missingHats?.length > 0 ?
                alerts?.['World 3']?.hatRack?.missingHats?.map(({ itemName, owner, rawName }, index) =>
                  <Alert target={'World 3.hatRack.missingHats'}
                    key={`missing-hat-${rawName}-${index}`}
                    title={`${cleanUnderscore(itemName)} is missing from hat rack (${owner})`}
                    iconPath={`data/${rawName}`}/>) : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 4'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 4</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
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
                       title={`You have ${alerts?.['World 4']?.tome?.nametagClaim} Tome ranking nametag${alerts?.['World 4']?.tome?.nametagClaim > 1 ? 's' : ''} available to claim`}
                       iconPath={'data/EquipmentNametag22'}/> : null}
              {alerts?.['World 4']?.cooking?.spices > 0 ?
                <Alert target={'World 4.cooking.spices'} title={`You have ${alerts?.['World 4']?.cooking?.spices} spice clicks left`}
                       iconPath={'data/CookingSpice0'}/> : null}
              {alerts?.['World 4']?.cooking?.ribbons ?
                <Alert target={'World 4.cooking.ribbons'}
                  title={`You have reached your threshold of ${alerts?.['World 4']?.cooking?.ribbons} empty ribbon slots`}
                  iconPath={'data/Ribbon0'}/> : null}
              {alerts?.['World 4']?.cooking?.cookingMastery?.purple > 0 ?
                <Alert target={'World 4.cooking.cookingMastery'}
                  title={`You have ${alerts?.['World 4']?.cooking?.cookingMastery?.purple} unspent purple Cooking Mastery point${alerts?.['World 4']?.cooking?.cookingMastery?.purple > 1 ? 's' : ''}`}
                  iconPath={'etc/CookingMastery'}/> : null}
              {alerts?.['World 4']?.cooking?.cookingMastery?.yellow > 0 ?
                <Alert target={'World 4.cooking.cookingMastery'}
                  title={`You have ${alerts?.['World 4']?.cooking?.cookingMastery?.yellow} unspent yellow Cooking Mastery point${alerts?.['World 4']?.cooking?.cookingMastery?.yellow > 1 ? 's' : ''}`}
                  iconPath={'etc/CookingMastery'}
                  imgStyle={{ filter: 'sepia(1) saturate(4) hue-rotate(5deg) brightness(1.1)' }}/> : null}
              {alerts?.['World 4']?.breeding?.eggs ? <Alert target={'World 4.breeding.eggs'} key={'breeding-eggs'}
                                                            title={`Eggs are at full capacity`}
                                                            iconPath={`data/PetEgg1`}/> : null}
              {alerts?.['World 4']?.breeding?.eggsRarity

                ? <Alert target={'World 4.breeding.eggsRarity'} key={'breeding-eggsRarity'}
                         title={`You have reached your desired rarity level of ${alerts?.['World 4']?.breeding?.eggsRarity} with at least one egg`}
                         iconPath={`data/PetEgg${alerts?.['World 4']?.breeding?.eggsRarity}`}/>
                : null}
              {alerts?.['World 4']?.breeding?.shinies?.pets?.length > 0 ?
                alerts?.['World 4']?.breeding?.shinies?.pets?.map(({ monsterName, shinyLevel }, index) => {
                  return <Alert target={'World 4.breeding.shinies'}
                    key={monsterName + index}
                    imgStyle={{ filter: `hue-rotate(${randomFloatBetween(45, 180)}deg)` }}
                    title={`${cleanUnderscore(monsterName)} has reached ${shinyLevel === 20
                      ? 'level 20 (max)'
                      : `the shiny threshold (${alerts?.['World 4']?.breeding?.shinies?.threshold})`}`}
                    iconPath={`afk_targets/${monsterName}`}/>
                }) : null}
              {alerts?.['World 4']?.breeding?.breedability?.pets?.length > 0 ?
                alerts?.['World 4']?.breeding?.breedability?.pets?.map(({ monsterName, icon }, index) => {
                  return <Alert target={'World 4.breeding.breedability'}
                    key={monsterName + index}
                    breedability
                    title={`${cleanUnderscore(monsterName)} has surpassed the breedability level threshold (${alerts?.['World 4']?.breeding?.breedability?.threshold})`}
                    iconPath={`afk_targets/${monsterName}`}/>
                }) : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 5'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 5</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 5']?.gaming?.sprouts ?
                <Alert target={'World 5.gaming.sprouts'} title={`Max sprouts capacity has reached (${alerts?.['World 5']?.gaming?.sprouts})`}
                       imgStyle={{ objectFit: 'none' }}
                       iconPath={'etc/Sprouts'}/> : null}
              {alerts?.['World 5']?.gaming?.drops ?
                <Alert target={'World 5.gaming.drops'} title={`Sprinkler drops has reached it's capacity (${alerts?.['World 5']?.gaming?.drops})`}
                       iconPath={'data/GamingItem0b'}/> : null}
              {alerts?.['World 5']?.gaming?.squirrel >= 1 ?
                <Alert target={'World 5.gaming.squirrel'}
                  title={`${alerts?.['World 5']?.gaming?.squirrel} hours has passed since you've clicked the squirrel`}
                  iconPath={'data/GamingItem2'}/> : null}
              {alerts?.['World 5']?.gaming?.shovel >= 1 ?
                <Alert target={'World 5.gaming.shovel'}
                  title={`${alerts?.['World 5']?.gaming?.shovel} hours has passed since you've clicked the shovel`}
                  iconPath={'data/GamingItem1'}/> : null}

              {alerts?.['World 5']?.sailing?.chests > 0 ? <Alert target={'World 5.sailing.chests'} key={'sailing-chest-alert'}
                                                                 title={`You've reached the maximum capacity of chests`}
                                                                 iconPath={'npcs/Chesty'}/> : null}
              {alerts?.['World 5']?.sailing?.captains?.length > 0 ?
                alerts?.['World 5']?.sailing?.captains?.map(({ captain, bonus, badCaptains, enderCaptain }) => {
                  return <Alert target={'World 5.sailing.captains'}
                    key={'captain' + captain?.captainIndex}
                    title={<Stack>
                      <Typography sx={{ mb: 1 }}>Captain <Typography
                        component={'span'}
                        sx={{ fontWeight: 'bold' }}>{captain?.captainIndex}</Typography> with {cleanUnderscore(bonus)} from
                        the shop is {enderCaptain ? 'an ender captain (hidden +25% loot and artifact)' : `better
                        than ${badCaptains.length} of
                        your captains`}</Typography>
                      <Stack>
                        {badCaptains?.map(({ captainIndex, bonus }) => {
                          return <Typography key={`cap-${captainIndex}`}><Typography
                            component={'span'}
                            sx={{ fontWeight: 'bold' }}>{captainIndex}</Typography>: {cleanUnderscore(bonus)}
                          </Typography>
                        })}
                      </Stack>
                    </Stack>}
                    iconPath={`etc/Captain_${captain?.captainType}`}/>
                }) : null}
              {alerts?.['World 5']?.hole?.buckets ?
                <Alert target={'World 5.hole.buckets'} title={`One of your sediments has reached the threshold`}
                       imgStyle={{ objectFit: 'cover' }}
                       iconPath={'data/HoleWellBucket0'}/> : null}
              {alerts?.['World 5']?.hole?.motherlodeMaxed ?
                <Alert target={'World 5.hole.motherlodeMaxed'} title={`You can break a layer in the motherlode cavern`}
                       imgStyle={{ objectFit: 'none' }}
                       iconPath={'data/Motherlode_x1'}/> : null}
              {alerts?.['World 5']?.hole?.bravery ?
                <Alert target={'World 5.hole.bravery'} title={`You can hear a story in the bravery cavern`}
                       imgStyle={{ objectFit: 'none' }}
                       iconPath={'etc/Bravery_Statue'}/> : null}
              {alerts?.['World 5']?.hole?.justice ?
                <Alert target={'World 5.hole.justice'} title={`You can hear a story in the justice cavern`}
                       imgStyle={{ objectFit: 'none' }}
                       iconPath={'data/Justice_Monument_x1'}/> : null}
              {alerts?.['World 5']?.hole?.wisdom ?
                <Alert target={'World 5.hole.wisdom'} title={`You can play a memory game in the wisdom cavern`}
                       imgStyle={{ objectFit: 'none' }}
                       iconPath={'data/Wisdom_Monument_x1'}/> : null}
              {alerts?.['World 5']?.hole?.theBell ?
                <Alert target={'World 5.hole.theBell'} title={`One of your cavern bells is ready`}
                       iconPath={'etc/TheBell'}/> : null}
              {alerts?.['World 5']?.hole?.theHarp ?
                <Alert target={'World 5.hole.theHarp'} title={`Harp power has reached the threshold`}
                       iconPath={'etc/TheHarp'}/> : null}
              {alerts?.['World 5']?.hole?.hiveMaxed ?
                <Alert target={'World 5.hole.hiveMaxed'} title={`You can break a layer in the hive cavern`}
                       iconPath={'etc/TheHive'}/> : null}
              {alerts?.['World 5']?.hole?.evertreeMaxed ?
                <Alert target={'World 5.hole.evertreeMaxed'} title={`You can break a layer in the evertree cavern`}
                       imgStyle={{ objectFit: 'none' }}
                       iconPath={'data/MotherlodeTREE_x1'}/> : null}
              {alerts?.['World 5']?.hole?.bottomlessTrenchMaxed ?
                <Alert target={'World 5.hole.bottomlessTrenchMaxed'} title={`You can break a layer in the bottomless trench cavern`}
                       imgStyle={{ objectFit: 'none' }}
                       iconPath={'data/MotherlodeFISH_x1'}/> : null}
              {alerts?.['World 5']?.hole?.grotto ?
                <Alert target={'World 5.hole.grotto'} title={`You can kill the monarch`}
                       iconPath={'etc/Grotto'}/> : null}
              {alerts?.['World 5']?.hole?.jars >= 0 ?
                <Alert target={'World 5.hole.jars'} title={`You can break ${alerts?.['World 5']?.hole?.jars} jars in the jars cavern`}
                       iconPath={'etc/Jar_0'}/> : null}
              {alerts?.['World 5']?.hole?.jarsFull > 0 ?
                <Alert target={'World 5.hole.jarsFull'} title={`${alerts?.['World 5']?.hole?.jarsFull} jar slot${alerts?.['World 5']?.hole?.jarsFull > 1 ? 's are' : ' is'} full and ready to open`}
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
                  title={`You can use ${alerts?.['World 5']?.hole?.lanterns} more Blinding Lantern${alerts?.['World 5']?.hole?.lanterns > 1 ? 's' : ''} today`}
                  iconPath={'data/Quest90_x1'}/> : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 6'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 6</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 6']?.sneaking?.lastLooted ?
                <Alert target={'World 6.sneaking.lastLooted'}
                  title={`You haven't looted rewards from sneaking for ${Math.floor(account?.sneaking?.lastLooted / 60)} minutes`}
                  iconPath={'data/NjUpgI14'}/> : null}
              {alerts?.['World 6']?.sneaking?.remainingPristineRolls ?
                <Alert target={'World 6.sneaking.remainingPristineRolls'}
                  title={`${alerts?.['World 6']?.sneaking?.remainingPristineRolls.remaining} pristine charm rolls remaining (${alerts?.['World 6']?.sneaking?.remainingPristineRolls.used}/120 used)`}
                  iconPath={'data/NjTrP0'}/> : null}
              {alerts?.['World 6']?.sneaking?.remainingSymbolRolls ?
                <Alert target={'World 6.sneaking.remainingSymbolRolls'}
                  title={`${alerts?.['World 6']?.sneaking?.remainingSymbolRolls.remaining} symbol rolls remaining (${alerts?.['World 6']?.sneaking?.remainingSymbolRolls.used}/75 used)`}
                  iconPath={'data/NjTrP0'}/> : null}
              {alerts?.['World 6']?.beanstalk?.readyToPlant?.length > 0
                ?
                alerts?.['World 6']?.beanstalk?.readyToPlant?.map(({ rawName, displayName, total, breakpoint }) =>
                  <Link
                    key={'beanstalk' + rawName}
                    href={'/account/world-6/beanstalk'}
                    style={{ display: 'flex', color: 'inherit', textDecoration: 'none' }}>
                    <Alert
                      title={`You own ${commaNotation(total)} ${cleanUnderscore(displayName)} - enough to rank it up on the beanstalk (${commaNotation(breakpoint)} needed)`}
                      iconPath={`data/${rawName}`}/>
                  </Link>)
                : null}
              {alerts?.['World 6']?.summoning?.familiar ?
                <Alert target={'World 6.summoning.familiar'}
                  title={`Summoning familiar bonus isn't maxed (${alerts?.['World 6']?.summoning?.familiar.level}/${alerts?.['World 6']?.summoning?.familiar.maxLvl})`}
                  iconPath={'data/SumUpgIc2'}/> : null}
              {alerts?.['World 6']?.summoning?.battleAttempts ?
                <Alert target={'World 6.summoning.battleAttempts'}
                  title={`You have ${alerts?.['World 6']?.summoning?.battleAttempts} summoning battle attempts`}
                  iconPath={'data/Heart'}/> : null}
              {alerts?.['World 6']?.farming?.missingPlots?.length > 0 ?
                <Alert target={'World 6.farming.missingPlots'}
                  title={`You have ${alerts?.['World 6']?.farming?.missingPlots?.length} seeds available to be planted`}
                  iconPath={'data/FarmPlant1'}/> : null}
              {alerts?.['World 6']?.farming?.plots?.length > 0 ?
                <Alert target={'World 6.farming.plots'}
                  title={`${alerts?.['World 6']?.farming?.plots?.length} plots reached the threshold of ${alerts?.['World 6']?.farming?.plots?.[0]?.threshold} OGs (x${Math.min(1e9, Math.max(1, Math.pow(2, alerts?.['World 6']?.farming?.plots?.[0]?.threshold)))})`}
                  iconPath={'data/ClassIcons57'}/> : null}
              {alerts?.['World 6']?.farming?.finishedPlots ?
                <Alert target={'World 6.farming.finishedPlots'}
                  title={`${alerts?.['World 6']?.farming?.finishedPlots.plots.length} plot${alerts?.['World 6']?.farming?.finishedPlots.plots.length > 1
                    ? 's'
                    : ''} won't double again within ${alerts?.['World 6']?.farming?.finishedPlots.days} days - collect to restart them`}
                  iconPath={'data/FarmPlant1'}/> : null}
              {alerts?.['World 6']?.farming?.totalCrops > 0 ?
                <Alert target={'World 6.farming.totalCrops'}
                  title={`You have ${commaNotation(alerts?.['World 6']?.farming?.totalCrops)} crops ready to be collected`}
                  iconPath={'data/FarmPlant6'}/> : null}
              {alerts?.['World 6']?.farming?.beanTrade > 0 ?
                <Alert target={'World 6.farming.beanTrade'}
                  title={`Your bean trade has reached ${numberWithCommas(Math.floor(alerts?.['World 6']?.farming?.beanTrade))}`}
                  iconPath={'data/Quest80_x1'}/> : null}
              {alerts?.['World 6']?.farming?.exoticPurchases ?
                <Alert target={'World 6.farming.exoticPurchases'}
                  title={`You have ${alerts?.['World 6']?.farming?.exoticPurchases.available} exotic purchase${alerts?.['World 6']?.farming?.exoticPurchases.available > 1
                    ? 's'
                    : ''} available (${alerts?.['World 6']?.farming?.exoticPurchases.purchased}/${alerts?.['World 6']?.farming?.exoticPurchases.max})`}
                  iconPath={'data/FarmStT3'}/> : null}
              {alerts?.['World 6']?.etc?.emperorAttempts > 0 ?
                <Alert target={'World 6.etc.emperorAttempts'}
                  title={`You have reached ${alerts?.['World 6']?.etc?.emperorAttempts} emperor attempts`}
                  iconPath={'data/Boss6'}/> : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 7'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 7</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 7']?.royalGuardian?.idleOutposts?.length > 0 ?
                <Alert target={'World 7.royalGuardian.idleOutposts'}
                  title={<RoyalGuardianList
                    headline={`${alerts?.['World 7']?.royalGuardian?.idleOutposts?.length} outpost${alerts?.['World 7']?.royalGuardian?.idleOutposts?.length === 1
                      ? ' is'
                      : 's are'} connected to an empty resource, and could switch to one in range that still has some`}
                    entries={alerts?.['World 7']?.royalGuardian?.idleOutposts}/>}
                  iconPath={'etc/Royal_Outpost'}/> : null}
              {alerts?.['World 7']?.royalGuardian?.unwiredOutposts?.length > 0 ?
                <Alert target={'World 7.royalGuardian.unwiredOutposts'}
                  title={<RoyalGuardianList
                    headline={`${alerts?.['World 7']?.royalGuardian?.unwiredOutposts?.length} outpost${alerts?.['World 7']?.royalGuardian?.unwiredOutposts?.length === 1
                      ? ' has'
                      : 's have'} no resource connected`}
                    entries={alerts?.['World 7']?.royalGuardian?.unwiredOutposts}/>}
                  iconPath={'data/RGresB5'}/> : null}
              {alerts?.['World 7']?.royalGuardian?.idleSupportCamps?.length > 0 ?
                <Alert target={'World 7.royalGuardian.idleSupportCamps'}
                  title={<RoyalGuardianList
                    headline={`${alerts?.['World 7']?.royalGuardian?.idleSupportCamps?.length} support camp${alerts?.['World 7']?.royalGuardian?.idleSupportCamps?.length === 1
                      ? ' is'
                      : 's are'} boosting nothing`}
                    entries={alerts?.['World 7']?.royalGuardian?.idleSupportCamps}/>}
                  iconPath={'data/UISkillIcon226'}/> : null}
              {alerts?.['World 7']?.royalGuardian?.unspentPts ?
                <Alert target={'World 7.royalGuardian.unspentPts'}
                  title={`You have ${alerts?.['World 7']?.royalGuardian?.unspentPts?.count} unspent outpost PTS (threshold: ${alerts?.['World 7']?.royalGuardian?.unspentPts?.threshold})`}
                  iconPath={'etc/Royal_Cost'} imgStyle={{ width: 18, height: 18 }} /> : null}
              {alerts?.['World 7']?.royalGuardian?.claimableMaps?.length > 0 ?
                <Alert target={'World 7.royalGuardian.claimableMaps'}
                  title={<RoyalGuardianList
                    headline={`${alerts?.['World 7']?.royalGuardian?.claimableMaps?.length} map${alerts?.['World 7']?.royalGuardian?.claimableMaps?.length === 1
                      ? ' is'
                      : 's are'} cleared and ready to claim an outpost`}
                    entries={alerts?.['World 7']?.royalGuardian?.claimableMaps}/>}
                  iconPath={'etc/RGglyphCheck'} imgStyle={{ width: 18, height: 18 }}/> : null}
              {alerts?.['World 7']?.royalGuardian?.idleUnits ?
                <Alert target={'World 7.royalGuardian.idleUnits'}
                  title={`${alerts?.['World 7']?.royalGuardian?.idleUnits?.count} unit${alerts?.['World 7']?.royalGuardian?.idleUnits?.count === 1 ? ' is' : 's are'} ${alerts?.['World 7']?.royalGuardian?.idleUnits?.unassigned > 0
                    ? 'unassigned or clearing a map you already claimed'
                    : 'clearing a map you already claimed'}${alerts?.['World 7']?.royalGuardian?.idleUnits?.discounted
                    ? ', earning half rank EXP instead of clearing a new one'
                    : ', earning nothing'}`}
                  iconPath={'etc/RGunit0'}/> : null}
              {alerts?.['World 7']?.royalGuardian?.restockLocked ?
                <Alert target={'World 7.royalGuardian.restockLocked'}
                  title={'Resource Replenish is unbought, so your empty resources never refill'}
                  iconPath={'data/UISkillIcon226'}/> : null}
              {alerts?.['World 7']?.gallery?.missingTrophies?.length > 0 ?
                alerts?.['World 7']?.gallery?.missingTrophies?.map(({ itemName, owner, rawName }, index) =>
                  <Alert target={'World 7.gallery.missingTrophies'}
                    key={`missing-trophy-${rawName}-${index}`}
                    title={`${cleanUnderscore(itemName)} is missing from gallery (${owner})`}
                    iconPath={`data/${rawName}`}/>) : null}
              {alerts?.['World 7']?.gallery?.missingNametags?.length > 0 ?
                alerts?.['World 7']?.gallery?.missingNametags?.map(({ itemName, owner, rawName }, index) =>
                  <Alert target={'World 7.gallery.missingNametags'}
                    key={`missing-nametag-${rawName}-${index}`}
                    title={`${cleanUnderscore(itemName)} is missing from gallery (${owner})`}
                    iconPath={`data/${rawName}`}/>) : null}
              {alerts?.['World 7']?.spelunking?.pageReads?.available > 0 ?
                <Alert target={'World 7.spelunking.pageReads'}
                  title={`You have ${alerts?.['World 7']?.spelunking?.pageReads?.available} page read${alerts?.['World 7']?.spelunking?.pageReads?.available === 1
                    ? ''
                    : 's'} available (${alerts?.['World 7']?.spelunking?.pageReads?.current}/${alerts?.['World 7']?.spelunking?.pageReads?.max})`}
                  iconPath={'data/Spelunking0'}/> : null}
              {alerts?.['World 7']?.spelunking?.fullStaminaCharacters?.count >= alerts?.['World 7']?.spelunking?.fullStaminaCharacters?.threshold
                ?
                <Alert target={'World 7.spelunking.fullStaminaCharacters'}
                  title={`${alerts?.['World 7']?.spelunking?.fullStaminaCharacters?.count} character${alerts?.['World 7']?.spelunking?.fullStaminaCharacters?.count === 1
                    ? ''
                    : 's'} ${alerts?.['World 7']?.spelunking?.fullStaminaCharacters?.count === 1
                    ? 'has'
                    : 'have'} full stamina`}
                  iconPath={'data/CaveShopUpg4'}/>
                : null}
              {alerts?.['World 7']?.spelunking?.overstimLevel?.current >= alerts?.['World 7']?.spelunking?.overstimLevel?.threshold
                ?
                <Alert target={'World 7.spelunking.overstimLevel'}
                  title={`Overstim level has reached ${alerts?.['World 7']?.spelunking?.overstimLevel?.current} (threshold: ${alerts?.['World 7']?.spelunking?.overstimLevel?.threshold})`}
                  iconPath={'data/CaveShopUpg6'}/>
                : null}
              {alerts?.['World 7']?.legendTalents?.legendPointsLeftToSpend > 0 ?
                <Alert target={'World 7.legendTalents.legendPointsLeftToSpend'}
                  title={`You have ${alerts?.['World 7']?.legendTalents?.legendPointsLeftToSpend} unspent legend talent point${alerts?.['World 7']?.legendTalents?.legendPointsLeftToSpend === 1
                    ? ''
                    : 's'}`}
                  iconPath={'data/LegendTalentIcon0'}/> : null}
              {alerts?.['World 7']?.legendTalents?.cheaperMasterclassUpgrades ?
                <Alert target={'World 7.legendTalents.cheaperMasterclassUpgrades'}
                  title={`You have ${alerts?.['World 7']?.legendTalents?.cheaperMasterclassUpgrades.available} cheaper masterclass upgrade${alerts?.['World 7']?.legendTalents?.cheaperMasterclassUpgrades.available === 1
                    ? ''
                    : 's'} available (${alerts?.['World 7']?.legendTalents?.cheaperMasterclassUpgrades.used}/${alerts?.['World 7']?.legendTalents?.cheaperMasterclassUpgrades.max})`}
                  iconPath={'data/LegendTalentIcon12'}/> : null}
              {alerts?.['World 7']?.zenithMarket?.doubleCluster ?
                <Alert target={'World 7.zenithMarket.doubleCluster'}
                  title={'You can afford Double Clusters upgrade'}
                  iconPath={'etc/Cluster'}/> : null}
              {alerts?.['World 7']?.zenithMarket?.clusterFarming ?
                <Alert target={'World 7.zenithMarket.clusterFarming'}
                  title={`Zenith Cluster Farming is ${alerts?.['World 7']?.zenithMarket?.clusterFarming}`}
                  iconPath={'etc/Cluster'}/> : null}
              {alerts?.['World 7']?.construction?.jeweledCogs ?
                <Alert target={'World 7.construction.jeweledCogs'}
                  title={`You have ${alerts?.['World 7']?.construction?.jeweledCogs?.available} jeweled cog pull${alerts?.['World 7']?.construction?.jeweledCogs?.available > 1
                    ? 's'
                    : ''} left (${alerts?.['World 7']?.construction?.jeweledCogs?.current}/${alerts?.['World 7']?.construction?.jeweledCogs?.max})`}
                  iconPath={'data/CogCry0'}/> : null}
              {alerts?.['World 7']?.minehead?.dailyTries ?
                <Alert target={'World 7.minehead.dailyTries'}
                  title={`You have ${alerts?.['World 7']?.minehead?.dailyTries?.left} minehead attempt${alerts?.['World 7']?.minehead?.dailyTries?.left === 1 ? '' : 's'} left (${alerts?.['World 7']?.minehead?.dailyTries?.left}/${alerts?.['World 7']?.minehead?.dailyTries?.max})`}
                  iconPath={'data/MineHead0'}/> : null}
              {alerts?.['World 7']?.minehead?.currencyUpgrades?.length > 0 ?
                alerts?.['World 7']?.minehead?.currencyUpgrades?.map((upgrade) => <Alert target={'World 7.minehead.currencyUpgrades'}
                  key={`minehead-upgrade-${upgrade?.index}`}
                  title={`You can afford ${cleanUnderscore(upgrade?.name)} Lv. ${upgrade?.level + 1} (${notateNumber(upgrade?.cost, 'Big')})`}
                  iconPath={`data/MineUpg${upgrade?.index}`}/>) : null}
              {alerts?.['World 7']?.research?.observationRollsLeft ?
                <Alert target={'World 7.research.observationRollsLeft'}
                  title={`You have ${alerts?.['World 7']?.research?.observationRollsLeft?.left} observation roll${alerts?.['World 7']?.research?.observationRollsLeft?.left === 1 ? '' : 's'} left (${alerts?.['World 7']?.research?.observationRollsLeft?.left}/${alerts?.['World 7']?.research?.observationRollsLeft?.max})`}
                  iconPath={'data/ResObsClip'}/> : null}
              {alerts?.['World 7']?.research?.insightLevel?.observations?.length > 0 ?
                <Alert target={'World 7.research.insightLevel'}
                  title={<Stack alignItems={'center'} gap={0.5}>
                    <Typography variant={'subtitle2'}>{alerts?.['World 7']?.research?.insightLevel?.observations?.length} observation{alerts?.['World 7']?.research?.insightLevel?.observations?.length === 1 ? '' : 's'} at insight Lv. {alerts?.['World 7']?.research?.insightLevel?.threshold}+</Typography>
                    {alerts?.['World 7']?.research?.insightLevel?.observations?.map((obs) =>
                      <Typography key={obs.index} variant={'body2'}>{cleanUnderscore(obs.name)} - Lv. {obs.insightLevel}</Typography>
                    )}
                  </Stack>}
                  iconPath={'data/ResMagni1'}/> : null}
              {alerts?.['World 7']?.sushiStation?.fuelFull ?
                <Alert target={'World 7.sushiStation.fuelFull'}
                  title={'Sushi Station fuel is full: cook some sushi!'}
                  iconPath={'data/Sushi6'}/> : null}
              {alerts?.['World 7']?.sushiStation?.shakerUses?.length > 0 ?
                alerts?.['World 7']?.sushiStation?.shakerUses?.map((shaker) => {
                  const iconMap = { Salt: 'SushiUpg17', Pepper: 'SushiUpg18', Saffron: 'SushiUpg19' };
                  return <Alert target={'World 7.sushiStation.shakerUses'}
                    key={`shaker-${shaker.name}`}
                    title={`${shaker.name} Shaker: ${shaker.uses} use${shaker.uses === 1 ? '' : 's'} available`}
                    iconPath={`data/${iconMap[shaker.name]}`}/>;
                }) : null}

              {alerts?.['World 7']?.sushiStation?.knowledgeLevelUp?.length > 0 ?
                alerts?.['World 7']?.sushiStation?.knowledgeLevelUp?.map((sushi) =>
                  <Alert target={'World 7.sushiStation.knowledgeLevelUp'}
                    key={`sushi-kn-${sushi.index}`}
                    title={`${sushi.name} is ready for knowledge level-up (Lv.${sushi.level})`}
                    iconPath={`data/Sushi${sushi.index}`}/>) : null}
              {alerts?.['World 7']?.clamWork?.promotionAffordable ?
                <Alert target={'World 7.clamWork.promotionAffordable'}
                  title={`You can afford a promotion to Worker Class Lv. ${alerts?.['World 7']?.clamWork?.promotionAffordable?.nextClass} (${notateNumber(alerts?.['World 7']?.clamWork?.promotionAffordable?.cost, 'Big')} pearls, ${(alerts?.['World 7']?.clamWork?.promotionAffordable?.chance * 100).toFixed(2)}% chance)`}
                  iconPath={'data/ClamPearl0'}/> : null}
              {alerts?.['World 7']?.theButton?.instaSkipAvailable ?
                <Alert target={'World 7.theButton.instaSkipAvailable'}
                  title={`${alerts?.['World 7']?.theButton?.instaSkipAvailable?.skipsLeft} insta-skip${alerts?.['World 7']?.theButton?.instaSkipAvailable?.skipsLeft === 1 ? '' : 's'} available - current task can be skipped`}
                  iconPath={'etc/ButtonG'}
                  imgStyle={{ filter: 'hue-rotate(180deg) saturate(1.5)' }}/> : null}
              {alerts?.['World 7']?.theButton?.taskReady ?
                <Alert target={'World 7.theButton.taskReady'}
                  title={'Button task ready - no insta-skip needed'}
                  iconPath={'etc/ButtonG'}/> : null}
            </Stack>
          </Stack> : null}
        </Stack> : <Typography>There are no account alerts to display</Typography>}
      </CardContent>
    </Card>
  </>
};

// Past this many stamps the tooltip turns into a wall of names, so the rest is summed up instead.
const MAX_LISTED_STAMPS = 4;

// Same treatment for the Royal Guardian alerts: an account can have dozens of outposts in one
// state, and a comma-joined line of eighteen map names is unreadable.
const MAX_LISTED_OUTPOSTS = 6;

const RoyalGuardianList = ({ headline, entries = [] }) => {
  const listed = entries.slice(0, MAX_LISTED_OUTPOSTS);
  const others = entries.length - listed.length;
  return <Stack gap={.5}>
    <Typography>{headline}{listed.length > 0 ? ':' : ''}</Typography>
    {listed.length > 0 ? <Stack component={'ul'} sx={{ m: 0, pl: 2.5 }}>
      {listed.map(({ name, mapIndex }) => <Typography component={'li'} key={mapIndex}>{name}</Typography>)}
      {others > 0 ? <Typography component={'li'} sx={{ opacity: .7 }}>
        and {others} more
      </Typography> : null}
    </Stack> : null}
  </Stack>
}

const AffordableStampLevels = ({ count, names = [], totalCost, percentOfMoney, stampsPerDay }) => {
  const listed = names.slice(0, MAX_LISTED_STAMPS).map((name) => cleanUnderscore(name));
  const others = names.length - listed.length;
  return <Stack gap={.5}>
    <Typography>
      You can afford to level {count} stamp{count > 1 ? 's' : ''} for {notateNumber(totalCost)} coins
      ({percentOfMoney}% of your account coins){listed.length > 0 ? ':' : ''}
    </Typography>
    {listed.length > 0 ? <Stack component={'ul'} sx={{ m: 0, pl: 2.5 }}>
      {listed.map((name) => <Typography component={'li'} key={name}>{name}</Typography>)}
      {others > 0 ? <Typography component={'li'} sx={{ opacity: .7 }}>
        and {others} more
      </Typography> : null}
    </Stack> : null}
    {stampsPerDay > 0 ? <Typography>
      Level them before your +{stampsPerDay} free stamp LVs roll today
    </Typography> : null}
  </Stack>
}

// `target` is the dot path of the alert's own setting - clicking the icon opens the configuration
// modal on it. See utility/dashboard/settingsTarget.
const Alert = ({
                 title,
                 iconPath,
                 vial,
                 atom,
                 breedability,
                 style = {},
                 imgStyle = {},
                 onError = () => { },
                 badge,
                 extra,
                 target
               }) => {
  const openSettings = useOpenDashboardSettings();
  const { Icon: BadgeIcon, color: badgeColor, border: badgeBorder, size: badgeSize } = alertBadges[badge] || {};
  const badgeImgStyle = badgeBorder ? { border: '1px solid', borderColor: badgeBorder } : {};
  return <HtmlTooltip title={title}>
    <Stack onClick={target ? () => openSettings('account', target) : undefined}
           sx={{
             position: 'relative', ...style, alignItems: 'center', justifyContent: 'center',
             ...(target ? { cursor: 'pointer' } : {})
           }}>
      <IconImg onError={onError} style={{ ...badgeImgStyle, ...imgStyle }} vial={vial}
               src={`${prefix}${iconPath}.png`} alt=""/>
      {BadgeIcon ? <AlertBadge badgeColor={badgeColor}><BadgeIcon sx={{ fontSize: badgeSize }}/></AlertBadge> : null}
      {atom || breedability ? <FloatingIcon vial={vial} src={`${prefix}etc/${atom ? 'Particle' : breedability
        ? 'PetHeart'
        : ''}.png`} alt={atom ? 'Particle' : breedability
        ? 'PetHeart'
        : ''}/> : null}
      {vial ? <div style={{ width: 35, height: 35, overflow: 'hidden' }}>
        <img
          key={vial?.name}
          onError={(e) => {
            e.target.src = `${prefix}data/aVials12.png`;
            e.target.style.opacity = 0;
          }}
          src={`${prefix}data/aVials${vial?.level === 0 ? '1' : vial?.level}.png`}
          style={{ opacity: vial?.level === 0 ? 0.5 : 1, width: 35, height: 40, display: 'block' }}
          alt="vial image missing"
        />
      </div> : null}
      {extra}
    </Stack>
  </HtmlTooltip>
}

// Coarse on purpose - the projection is only as good as the current cycle rates, so minute
// precision would read as more certain than it is.
const RefineryTitle = ({ missingMats, hoursLeft }) => {
  return <Stack alignItems={'center'}>
    {hoursLeft > 0
      ? `Materials run out in ${secondsToShortDuration(hoursLeft * 3600, { minUnit: 'minute' })}`
      : 'Missing materials'}
    <Stack direction={'row'}>
      {missingMats.map(({ rawName }) =>
        <IconImg
          key={rawName}
          src={`${prefix}data/${rawName}.png`}
          alt={rawName}/>)}
    </Stack>
  </Stack>
}

const ShopTitle = ({ shop }) => {
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
    {shop?.map(({ amount, rawName }, index) => {
      return <Stack alignItems={'center'} key={rawName + index}>
        <IconImg key={'shop' + rawName} src={`${prefix}data/${rawName}.png`} alt={rawName}/>
        <Typography>{notateNumber(amount)}</Typography>
      </Stack>
    })}
  </Stack>
}

// Bottom right - the atom/breeding FloatingIcon owns the bottom left corner. The glyph sits bare on
// top of the icon, with a dark outline so it stays readable over the brighter salt colours.
const AlertBadge = styled.div`
  position: absolute;
  /* Anchored by a percentage of its own box so every glyph size hangs off the corner the same way. */
  right: 0;
  bottom: 0;
  transform: translate(40%, 40%);
  display: flex;
  color: ${({ badgeColor }) => badgeColor};
  filter: drop-shadow(0 0 1px #000) drop-shadow(0 0 2px #000);
`;

const FloatingIcon = styled.img`
  width: 15px;
  height: 15px;
  position: absolute;
  left: -5px;
  bottom: 30%;
`;

const IconImg = styled.img`
  width: ${({ vial }) => vial ? '20px' : '30px'};
  height: ${({ vial }) => vial ? '20px' : '30px'};
  object-fit: contain;
  ${({ vial }) => vial ? `top: 50%;left: 50%;transform:translate(-60%, -50%);` : ''}
  position: ${({ vial }) => vial ? 'absolute' : 'relative'};
`;

export default Account;
