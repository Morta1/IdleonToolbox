import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import {
  cleanUnderscore,
  commaNotation,
  getNumberWithOrdinal,
  notateNumber,
  numberWithCommas,
  pascalCase,
  prefix,
  randomFloatBetween
} from '@utility/helpers';
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
import useAlerts from '../hooks/useAlerts';

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
        {alerts ? <Stack divider={<Divider />} gap={1.5}>
          {!emptyAlertRows?.General ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>General</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.General?.etc?.familyObols ?
                <Alert title={`You have ${alerts?.General?.etc?.familyObols} empty family obol slots`}
                  iconPath={'data/ObolEmpty1'} /> : null}
              {alerts?.General?.gemsFromBosses ?
                <Alert title={`You can kill ${alerts?.General?.gemsFromBosses} more bosses for gems`}
                  iconPath={'data/PremiumGem'} /> : null}
              {alerts?.General?.etc?.freeCompanion ?
                <Alert title={`You can claim a free companion`}
                  iconPath={'afk_targets/Dog'} /> : null}
              {alerts?.General?.etc?.newCharacters ?
                <Alert
                  title={`You can create ${alerts?.General?.etc?.newCharacters} new character${alerts?.General?.etc?.newCharacters > 1
                    ? 's'
                    : ''}`} iconPath={'etc/CharFam0'} /> : null}
              {alerts?.General?.etc?.randomEvents ?
                <Alert title={'You haven\'t done a random event today'} iconPath={'etc/Mega_Grumblo'} /> : null}
              {alerts?.General?.etc?.miniBosses?.length > 0
                ?
                alerts?.General?.etc?.miniBosses?.map(({ rawName, name, current }) => <Alert key={rawName}
                  title={`You can kill ${current} ${cleanUnderscore(name)}s`}
                  iconPath={`etc/${rawName}`} />)
                : null}
              {alerts?.General?.tasks?.length > 0 ?
                alerts?.General?.tasks?.map((world) => <Alert key={'task' + world}
                  title={`Daily task in world ${world + 1} not done yet`}
                  iconPath={`etc/Merit_${world}`} />) : null}
              {alerts?.General?.etc?.keys?.length > 0
                ?
                alerts?.General?.etc?.keys?.map(({ rawName, totalAmount }, index) => <Alert key={rawName + '' + index}
                  title={`${totalAmount} of ${cleanUnderscore(pascalCase(name))} ${rawName.includes('Tix')
                    ? 'tickets'
                    : 'keys'} are ready`}
                  iconPath={`data/${rawName}`} />)
                : null}
              {alerts?.General?.materialTracker?.length > 0
                ?
                alerts?.General?.materialTracker?.map(({ item, quantityOwned, text, note }, index) =>
                  <Alert
                    key={item?.rawName + '' + index}
                    title={<>
                      <Typography variant={'subtitle2'}>{text}</Typography>
                      {note ? <Typography fontWeight={500} variant={'caption'}>Note: {note}</Typography> : null}
                    </>}
                    iconPath={`data/${item?.rawName}`} />)
                : null}
              {alerts?.General?.etc?.dungeonTraits?.length > 0
                ?
                alerts?.General?.etc?.dungeonTraits?.map((traitName, index) => <Alert key={'dungeonTraits' + index}
                  title={`You haven't selected a trait for ${traitName}`}
                  iconPath={`data/DungTraitB0`} />)
                : null}
              {alerts?.General?.shops?.items?.length > 0 ?
                alerts?.General?.shops?.items?.map((shop, index) => shop?.length > 0 ?
                  <Alert key={'shop' + index + shop?.[0]?.rawName}
                    title={<ShopTitle shop={shop} />}
                    iconPath={index === 7 ? `etc/ShopEZ${index}` : `data/ShopEZ${index}`} /> : null) : null}
              {alerts?.General?.guild?.daily ?
                <Alert title={`You have ${alerts?.General?.guild?.daily} uncompleted daily tasks`} iconPath={`etc/GP`}
                  imgStyle={{ filter: 'sepia(1) hue-rotate(46deg) saturate(1)' }} /> : null}
              {alerts?.General?.guild?.weekly ?
                <Alert title={`You have ${alerts?.General?.guild?.weekly} uncompleted weekly tasks`} iconPath={`etc/GP`}
                  imgStyle={{ filter: 'sepia(1) hue-rotate(140deg) saturate(1)' }} /> : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 1'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 1</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 1']?.stamps?.gildedStamps > 0 ?
                <Alert title={`You have ${alerts?.['World 1']?.stamps?.gildedStamps} available gilded stamps`}
                  iconPath={'data/GildedStamp'} /> : null}
              {alerts?.['World 1']?.owl?.featherRestart ?
                <Alert title={`Feather restart can be upgraded`}
                  iconPath={'etc/Owl_4'} /> : null}
              {alerts?.['World 1']?.owl?.megaFeatherRestart ?
                <Alert title={`Mega feather restart can be upgraded`}
                  iconPath={'etc/Owl_8'} /> : null}
              {alerts?.['World 1']?.forge?.emptySlots ?
                <Alert title={`You have empty forge slots`}
                  iconPath={'data/ForgeA'} /> : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 2'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 2</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 2']?.kangaroo?.shinyThreshold ?
                <Alert
                  title={`You have reached your shiny % threshold of ${alerts?.['World 2']?.kangaroo?.shinyThreshold}% (${Math.round(account?.kangaroo?.shinyProgress)}%)`}
                  iconPath={'etc/KShiny'} /> : null}
              {alerts?.['World 2']?.kangaroo?.fisherooReset ?
                <Alert
                  title={'Fisheroo Reset can be upgraded'}
                  iconPath={'etc/KUpga_6'} /> : null}
              {alerts?.['World 2']?.kangaroo?.greatestCatch ?
                <Alert
                  title={'Greatest Catch can be upgraded'}
                  iconPath={'etc/KUpga_11'} /> : null}
              {alerts?.['World 2']?.islands?.unclaimedDays ?
                <Alert
                  title={`You haven't claimed your islands' content in ${alerts?.['World 2']?.islands?.unclaimedDays} days`}
                  iconPath={'data/Island1'} /> : null}
              {alerts?.['World 2']?.islands?.shimmerIsland ?
                <Alert
                  title={'You haven\'t claimed your shimmer\'s trial reward this week'}
                  iconPath={'etc/Shimmer_Currency'} /> : null}
              {alerts?.['World 2']?.islands?.garbageUpgrade ?
                <Alert
                  title={'You have enough garbage to buy a \'Garbage Gain\' upgrade in trash island'}
                  iconPath={'etc/Trash_Currency'} /> : null}
              {alerts?.['World 2']?.alchemy?.bargainTag ?
                <Alert title={'You haven\'t use bargain tag even once today'} iconPath={'data/aShopItems10'} /> : null}
              {alerts?.['World 2']?.alchemy?.gems ?
                <Alert title={'You haven\'t bought alchemy gems even once today'} iconPath={'data/PremiumGem'} /> : null}
              {alerts?.['World 2']?.alchemy?.alternateParticles ?
                <Alert
                  title={`You have ${alerts?.['World 2']?.alchemy?.alternateParticles} alternate particles upgrades available`}
                  iconPath={'etc/Particle'} /> : null}
              {alerts?.['World 2']?.weeklyBosses
                ?
                <Alert title={'You haven\'t done a weekly (W2) boss fight this week'} iconPath={'data/Trophie'} />
                : null}
              {alerts?.['World 2']?.killRoy?.general
                ?
                <Alert
                  title={alerts?.['World 2']?.killRoy?.general
                    ? `You haven't done a killroy this week (${account?.killroy?.killRoyClasses.join(', ')})` :
                    alerts?.['World 2']?.killRoy > 0 && account?.accountOptions?.[113] < (account?.killroy?.rooms === 3
                      ? 321
                      : 21) && account?.finishedWorlds?.World3
                      ? `You haven\'t done a killroy this week (${account?.killroy?.killRoyClasses.join(', ')})`
                      : ''} iconPath={'etc/Killroy'} />
                : null}
              {alerts?.['World 2']?.killRoy?.underHundredKills ?
                <Alert
                  title={`Killroy includes a monster with less than 100 kills (${alerts?.['World 2']?.killRoy?.underHundredKills?.map((m) => cleanUnderscore(m?.Name)).join(', ')})`}
                  iconPath={'etc/KillroyPrime'}
                /> : null}
              {alerts?.['World 2']?.arcade?.balls ?
                <Alert title={'Max ball capacity has been reached'} iconPath={'data/PachiBall0'} /> : null}
              {alerts?.['World 2']?.alchemy?.sigils?.length > 0
                ?
                alerts?.['World 2']?.alchemy?.sigils?.map(({ name, index }) => <Alert key={name}
                  title={`${cleanUnderscore(pascalCase(name))} is already unlocked`}
                  iconPath={`data/aSiga${index}`} />)
                : null}
              {alerts?.['World 2']?.alchemy?.liquids?.length > 0
                ?
                alerts?.['World 2']?.alchemy?.liquids?.map(({ index }) => <Alert key={'liq' + index}
                  title={`${getNumberWithOrdinal(index + 1)} liquid is full`}
                  iconPath={`data/Liquid${index + 1}_x1`} />)
                : null}
              {alerts?.['World 2']?.postOffice?.dailyShipments?.length > 0
                ?
                alerts?.['World 2']?.postOffice?.dailyShipments?.map(({ index }) => <Alert key={'shipment' + index}
                  title={`You haven't completed an order for shipment #${index + 1} today`}
                  iconPath={`data/UIlilbox`} />)
                : null}
              {alerts?.['World 2']?.alchemy?.vialsAttempts ? <Alert key={'vialsAttempts'}
                title={`You have available vial attempts`}
                iconPath={`data/aVials1`} /> : null}
              {alerts?.['World 2']?.alchemy?.vials?.length > 0 ?
                alerts?.['World 2']?.alchemy?.vials?.map((vial) => <Alert key={vial?.mainItem}
                  vial={vial}
                  title={`You have enough materials to upgrade ${cleanUnderscore(vial?.name)} vial`}
                  iconPath={`data/${vial?.mainItem}`} />) : null}

            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 3'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 3</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 3']?.library?.books ?
                <Alert
                  title={`Library has ${account?.libraryTimes?.bookCount} books ready`}
                  iconPath={'data/Libz'} /> : null}
              {alerts?.['World 3']?.atomCollider?.stampReducer ?
                <Alert
                  title={`Stamp reducer has reached your threshold (${alerts?.['World 3']?.atomCollider?.stampReducerValue}%)`}
                  iconPath={'data/Atom0'} /> : null}
              {alerts?.['World 3']?.construction?.flags?.length > 0 ?
                <Alert
                  title={`There are ${alerts?.['World 3']?.construction?.flags?.length} flags finished in construction board`}
                  iconPath={'data/CogFLflag'} /> : null}
              {alerts?.['World 3']?.equinox?.bar ?
                <Alert title={`Your Equinox bar is full`} iconPath={'data/Quest78'} /> : null}
              {alerts?.['World 3']?.equinox?.challenges > 0 ?
                <Alert title={`You have ${alerts?.['World 3']?.equinox?.challenges} challenges to validate`}
                  iconPath={'data/Quest78'} /> : null}
              {alerts?.['World 3']?.equinox?.foodLust ?
                <Alert title={`Food Lust is maxed`} iconPath={'etc/Dream_Upgrade_10'} /> : null}
              {alerts?.['World 3']?.construction?.materials?.length > 0
                ?
                alerts?.['World 3']?.construction?.materials?.map(({ rawName, missingMats }) => <Alert key={rawName}
                  title={
                    <RefineryTitle
                      missingMats={missingMats} />}
                  imgStyle={{
                    border: '1px solid',
                    borderColor: '#833b3b'
                  }}
                  iconPath={`data/${rawName}`} />)
                : null}
              {alerts?.['World 3']?.construction?.rankUp?.length > 0
                ?
                alerts?.['World 3']?.construction?.rankUp?.map(({ rawName, saltName }) => <Alert key={rawName}
                  title={`${cleanUnderscore(saltName)} is ready to rank up`}
                  iconPath={`data/${rawName}`} />)
                : null}
              {alerts?.['World 3']?.construction?.buildings?.length > 0
                ?
                alerts?.['World 3']?.construction?.buildings?.map(({ name, index }) => <Alert key={name}
                  title={`${cleanUnderscore(pascalCase(name))} is ready to be built`}
                  iconPath={`data/ConTower${index}`} />)
                : null}
              {alerts?.['World 3']?.printer?.atoms?.length > 0
                ?
                alerts?.['World 3']?.printer?.atoms?.map(({ name, rawName }) => <Alert key={'printer-atoms-' + rawName}
                  title={`Printing is at maximum (storage) capacity for ${cleanUnderscore(name)}`}
                  atom
                  iconPath={`data/${rawName}`} />)
                : null}
              {alerts?.['World 3']?.traps?.overdue > 0 ?
                <Alert title={`${alerts?.['World 3']?.traps?.overdue} traps are overdue`}
                  iconPath={'data/TrapBoxSet1'} /> : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 4'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 4</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 4']?.cooking?.meals?.length > 0
                ?
                alerts?.['World 4']?.cooking?.meals?.map(({ rawName, name }) => <Alert key={rawName}
                  title={`${cleanUnderscore(name)} is ready to be leveled up`}
                  iconPath={`data/${rawName}`} />)
                : null}
              {alerts?.['World 4']?.laboratory?.chipsRotation?.length > 0
                ?
                alerts?.['World 4']?.laboratory?.chipsRotation?.map(({ rawName, name }, index) => <Alert
                  key={rawName + index}
                  title={`You can claim ${cleanUnderscore(name)} in chip repository`}
                  iconPath={`data/${rawName}`} />)
                : null}
              {alerts?.['World 4']?.laboratory?.jewelsRotation?.length > 0
                ?
                alerts?.['World 4']?.laboratory?.jewelsRotation?.map(({ rawName, name }, index) => <Alert
                  key={rawName + index}
                  title={`You can claim ${cleanUnderscore(name)} in jewel repository`}
                  iconPath={`data/${rawName}`} />)
                : null}
              {alerts?.['World 4']?.cooking?.spices > 0 ?
                <Alert title={`You have ${alerts?.['World 4']?.cooking?.spices} spice clicks left`}
                  iconPath={'data/CookingSpice0'} /> : null}
              {alerts?.['World 4']?.cooking?.ribbons ?
                <Alert
                  title={`You have reached your threshold of ${alerts?.['World 4']?.cooking?.ribbons} empty ribbon slots`}
                  iconPath={'data/Ribbon0'} /> : null}
              {alerts?.['World 4']?.breeding?.eggs ? <Alert key={'breeding-eggs'}
                title={`Eggs are at full capacity`}
                iconPath={`data/PetEgg1`} /> : null}
              {alerts?.['World 4']?.breeding?.eggsRarity

                ? <Alert key={'breeding-eggsRarity'}
                  title={`You have reached your desired rarity level of ${alerts?.['World 4']?.breeding?.eggsRarity} with at least one egg`}
                  iconPath={`data/PetEgg${alerts?.['World 4']?.breeding?.eggsRarity}`} />
                : null}
              {alerts?.['World 4']?.breeding?.shinies?.pets?.length > 0 ?
                alerts?.['World 4']?.breeding?.shinies?.pets?.map(({ monsterName, shinyLevel }, index) => {
                  return <Alert
                    key={monsterName + index}
                    imgStyle={{ filter: `hue-rotate(${randomFloatBetween(45, 180)}deg)` }}
                    title={`${cleanUnderscore(monsterName)} has reached ${shinyLevel === 20
                      ? 'level 20 (max)'
                      : `the shiny threshold (${alerts?.['World 4']?.breeding?.shinies?.threshold})`}`}
                    iconPath={`afk_targets/${monsterName}`} />
                }) : null}
              {alerts?.['World 4']?.breeding?.breedability?.pets?.length > 0 ?
                alerts?.['World 4']?.breeding?.breedability?.pets?.map(({ monsterName, icon }, index) => {
                  return <Alert
                    key={monsterName + index}
                    breedability
                    title={`${cleanUnderscore(monsterName)} has surpassed the breedability level threshold (${alerts?.['World 4']?.breeding?.breedability?.threshold})`}
                    iconPath={`afk_targets/${monsterName}`} />
                }) : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 5'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 5</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 5']?.gaming?.sprouts ?
                <Alert title={`Max sprouts capacity has reached (${alerts?.['World 5']?.gaming?.sprouts})`}
                  imgStyle={{ objectFit: 'none' }}
                  iconPath={'etc/Sprouts'} /> : null}
              {alerts?.['World 5']?.gaming?.drops ?
                <Alert title={`Sprinkler drops has reached it's capacity (${alerts?.['World 5']?.gaming?.drops})`}
                  iconPath={'data/GamingItem0b'} /> : null}
              {alerts?.['World 5']?.gaming?.squirrel >= 1 ?
                <Alert
                  title={`${alerts?.['World 5']?.gaming?.squirrel} hours has passed since you've clicked the squirrel`}
                  iconPath={'data/GamingItem2'} /> : null}
              {alerts?.['World 5']?.gaming?.shovel >= 1 ?
                <Alert
                  title={`${alerts?.['World 5']?.gaming?.shovel} hours has passed since you've clicked the shovel`}
                  iconPath={'data/GamingItem1'} /> : null}

              {alerts?.['World 5']?.sailing?.chests > 0 ? <Alert key={'sailing-chest-alert'}
                title={`You've reached the maximum capacity of chests`}
                iconPath={'npcs/Chesty'} /> : null}
              {alerts?.['World 5']?.sailing?.captains?.length > 0 ?
                alerts?.['World 5']?.sailing?.captains?.map(({ captain, bonus, badCaptains, enderCaptain }) => {
                  return <Alert
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
                    iconPath={`etc/Captain_${captain?.captainType}`} />
                }) : null}
              {alerts?.['World 5']?.hole?.buckets ?
                <Alert title={`One of your sediments has reached the threshold`}
                  imgStyle={{ objectFit: 'cover' }}
                  iconPath={'data/HoleWellBucket0'} /> : null}
              {alerts?.['World 5']?.hole?.motherlodeMaxed ?
                <Alert title={`You can break a layer in the motherlode cavern`}
                  imgStyle={{ objectFit: 'none' }}
                  iconPath={'data/Motherlode_x1'} /> : null}
              {alerts?.['World 5']?.hole?.bravery ?
                <Alert title={`You can hear a story in the bravery cavern`}
                  imgStyle={{ objectFit: 'none' }}
                  iconPath={'etc/Bravery_Statue'} /> : null}
              {alerts?.['World 5']?.hole?.justice ?
                <Alert title={`You can hear a story in the justice cavern`}
                  imgStyle={{ objectFit: 'none' }}
                  iconPath={'data/Justice_Monument_x1'} /> : null}
              {alerts?.['World 5']?.hole?.wisdom ?
                <Alert title={`You can play a memory game in the wisdom cavern`}
                  imgStyle={{ objectFit: 'none' }}
                  iconPath={'data/Wisdom_Monument_x1'} /> : null}
              {alerts?.['World 5']?.hole?.theBell ?
                <Alert title={`One of your cavern bells is ready`}
                  iconPath={'etc/TheBell'} /> : null}
              {alerts?.['World 5']?.hole?.theHarp ?
                <Alert title={`Harp power has reached the threshold`}
                  iconPath={'etc/TheHarp'} /> : null}
              {alerts?.['World 5']?.hole?.hiveMaxed ?
                <Alert title={`You can break a layer in the hive cavern`}
                  iconPath={'etc/TheHive'} /> : null}
              {alerts?.['World 5']?.hole?.grotto ?
                <Alert title={`You can kill the monarch`}
                  iconPath={'etc/Grotto'} /> : null}
              {alerts?.['World 5']?.hole?.jars >= 0 ?
                <Alert title={`You can break ${alerts?.['World 5']?.hole?.jars} jars in the jars cavern`}
                  iconPath={'etc/Jar_0'} /> : null}
              {alerts?.['World 5']?.hole?.villagersLevelUp?.length > 0
                ? alerts?.['World 5']?.hole?.villagersLevelUp?.map(({ name, index }) => <Alert
                  key={name}
                  title={`${name} is ready to level up`}
                  iconPath={`etc/Villager_${index}`} />)
                : null}
              {alerts?.['World 5']?.hole?.studyLevelUp?.length > 0
                ? alerts?.['World 5']?.hole?.studyLevelUp?.map(({ name, index, location }) => <Alert
                  key={name + index}
                  title={`${cleanUnderscore(name)} study is ready to level up`}
                  iconPath={`etc/Study_Rate`} />)
                : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 6'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 6</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 6']?.sneaking?.lastLooted ?
                <Alert
                  title={`You haven't looted rewards from sneaking for ${Math.floor(account?.sneaking?.lastLooted / 60)} minutes`}
                  iconPath={'data/NjUpgI14'} /> : null}
              {alerts?.['World 6']?.summoning?.familiar ?
                <Alert
                  title={`Summoning familiar bonus isn't maxed (${alerts?.['World 6']?.summoning?.familiar.level}/${alerts?.['World 6']?.summoning?.familiar.maxLvl})`}
                  iconPath={'data/SumUpgIc2'} /> : null}
              {alerts?.['World 6']?.summoning?.battleAttempts ?
                <Alert
                  title={`You have ${alerts?.['World 6']?.summoning?.battleAttempts} summoning battle attempts`}
                  iconPath={'data/Heart'} /> : null}
              {alerts?.['World 6']?.farming?.missingPlots?.length > 0 ?
                <Alert
                  title={`You have ${alerts?.['World 6']?.farming?.missingPlots?.length} seeds available to be planted`}
                  iconPath={'data/FarmPlant1'} /> : null}
              {alerts?.['World 6']?.farming?.plots?.length > 0 ?
                <Alert
                  title={`${alerts?.['World 6']?.farming?.plots?.length} plots reached the threshold of ${alerts?.['World 6']?.farming?.plots?.[0]?.threshold} OGs (x${Math.min(1e9, Math.max(1, Math.pow(2, alerts?.['World 6']?.farming?.plots?.[0]?.threshold)))})`}
                  iconPath={'data/ClassIcons57'} /> : null}
              {alerts?.['World 6']?.farming?.totalCrops > 0 ?
                <Alert
                  title={`You have ${commaNotation(alerts?.['World 6']?.farming?.totalCrops)} crops ready to be collected`}
                  iconPath={'data/FarmPlant6'} /> : null}
              {alerts?.['World 6']?.farming?.beanTrade > 0 ?
                <Alert
                  title={`Your bean trade has reached ${numberWithCommas(Math.floor(alerts?.['World 6']?.farming?.beanTrade))}`}
                  iconPath={'data/Quest80_x1'} /> : null}
              {alerts?.['World 6']?.etc?.emperorAttempts > 0 ?
                <Alert
                  title={`You have reached ${alerts?.['World 6']?.etc?.emperorAttempts} emperor attempts`}
                  iconPath={'data/Boss6'} /> : null}
            </Stack>
          </Stack> : null}
        </Stack> : <Typography>There are no account alerts to display</Typography>}
      </CardContent>
    </Card>
  </>
};

const Alert = ({ title, iconPath, vial, atom, breedability, style = {}, imgStyle = {}, onError = () => { }, extra }) => {
  return <HtmlTooltip title={title}>
    <Stack sx={{ position: 'relative', ...style }}>
      <IconImg onError={onError} style={{ ...imgStyle }} vial={vial} src={`${prefix}${iconPath}.png`} alt="" />
      {atom || breedability ? <FloatingIcon vial={vial} src={`${prefix}etc/${atom ? 'Particle' : breedability
        ? 'PetHeart'
        : ''}.png`} alt="" /> : null}
      {vial ? <img key={`${vial?.name}`}
        onError={(e) => {
          e.target.src = `${prefix}data/aVials12.png`;
          e.target.style = 'opacity: 0;'
        }}
        src={`${prefix}data/aVials${vial?.level === 0 ? '1' : vial?.level}.png`}
        style={{ opacity: vial?.level === 0 ? .5 : 1, width: 35, height: 40 }}
        alt={'vial image missing'} /> : null}
      {extra}
    </Stack>
  </HtmlTooltip>
}

const RefineryTitle = ({ missingMats }) => {
  return <Stack alignItems={'center'}>
    Missing materials
    <Stack direction={'row'}>
      {missingMats.map(({ rawName }) =>
        <IconImg
          key={rawName}
          src={`${prefix}data/${rawName}.png`}
          alt="" />)}
    </Stack>
  </Stack>
}

const ShopTitle = ({ shop }) => {
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
    {shop?.map(({ amount, rawName }, index) => {
      return <Stack alignItems={'center'} key={rawName + index}>
        <IconImg key={'shop' + rawName} src={`${prefix}data/${rawName}.png`} />
        <Typography>{notateNumber(amount)}</Typography>
      </Stack>
    })}
  </Stack>
}

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
  ${({ vial }) => vial ? `top: 50%;left: 50%;transform:translate(-60%, -70%);` : ''}
  position: ${({ vial }) => vial ? 'absolute' : 'relative'};
`;

export default Account;
