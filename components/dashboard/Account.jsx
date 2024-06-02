import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import {
  cleanUnderscore,
  getNumberWithOrdinal,
  notateNumber,
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
  getWorld6Alerts
} from '@utility/dashboard/account';
import useAlerts from '../hooks/useAlerts';

const alertsMap = {
  General: getGeneralAlerts,
  ['World 1']: getWorld1Alerts,
  ['World 2']: getWorld2Alerts,
  ['World 3']: getWorld3Alerts,
  ['World 4']: getWorld4Alerts,
  ['World 5']: getWorld5Alerts,
  ['World 6']: getWorld6Alerts
}

const Account = ({ account, characters, trackers }) => {
  const { alerts, emptyAlertRows } = useAlerts({ alertsMap, data: account, extraData: characters, trackers });
  return <>
    <Card sx={{ width: 'fit-content' }}>
      <CardContent>
        {alerts ? <Stack divider={<Divider/>} gap={1.5}>
          {!emptyAlertRows?.General ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>General</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.General?.gemsFromBosses ?
                <Alert title={`You can kill ${300 - account?.accountOptions?.[195]} more bosses for gems`}
                       iconPath={'data/PremiumGem'}/> : null}
              {alerts?.General?.etc?.newCharacters ?
                <Alert
                  title={`You can create ${alerts?.General?.etc?.newCharacters} new character${alerts?.General?.etc?.newCharacters > 1
                    ? 's'
                    : ''}`} iconPath={'etc/CharFam0'}/> : null}
              {alerts?.General?.etc?.randomEvents ?
                <Alert title={'You haven\'t done a random event today'} iconPath={'etc/Mega_Grumblo'}/> : null}
              {alerts?.General?.etc?.miniBosses?.length > 0
                ?
                alerts?.General?.etc?.miniBosses?.map(({ rawName, name, current }) => <Alert key={rawName}
                                                                                             title={`You can kill ${current} ${cleanUnderscore(name)}s`}
                                                                                             iconPath={`etc/${rawName}`}/>)
                : null}
              {alerts?.General?.tasks?.length > 0 ?
                alerts?.General?.tasks?.map((world) => <Alert key={'task' + world}
                                                              title={`Daily task in world ${world + 1} not done yet`}
                                                              iconPath={`etc/Merit_${world}`}/>) : null}
              {alerts?.General?.etc?.keys?.length > 0
                ?
                alerts?.General?.etc?.keys?.map(({ rawName, totalAmount }, index) => <Alert key={rawName + '' + index}
                                                                                            title={`${totalAmount} of ${cleanUnderscore(pascalCase(name))} ${rawName.includes('Tix')
                                                                                              ? 'tickets'
                                                                                              : 'keys'} are ready`}
                                                                                            iconPath={`data/${rawName}`}/>)
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
                    iconPath={`data/${item?.rawName}`}/>)
                : null}
              {alerts?.General?.etc?.dungeonTraits?.length > 0
                ?
                alerts?.General?.etc?.dungeonTraits?.map((traitName, index) => <Alert key={'dungeonTraits' + index}
                                                                                      title={`You haven't selected a trait for ${traitName}`}
                                                                                      iconPath={`data/DungTraitB0`}/>)
                : null}
              {alerts?.General?.shops?.items?.length > 0 ?
                alerts?.General?.shops?.items?.map((shop, index) => shop?.length > 0 ?
                  <Alert key={'shop' + index + shop?.[0]?.rawName}
                         title={<ShopTitle shop={shop}/>}
                         iconPath={index === 7 ? `etc/ShopEZ${index}` : `data/ShopEZ${index}`}/> : null) : null}
              {alerts?.General?.guild?.daily ?
                <Alert title={`You have ${alerts?.General?.guild?.daily} uncompleted daily tasks`} iconPath={`etc/GP`}
                       imgStyle={{ filter: 'sepia(1) hue-rotate(46deg) saturate(1)' }}/> : null}
              {alerts?.General?.guild?.weekly ?
                <Alert title={`You have ${alerts?.General?.guild?.weekly} uncompleted weekly tasks`} iconPath={`etc/GP`}
                       imgStyle={{ filter: 'sepia(1) hue-rotate(140deg) saturate(1)' }}/> : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 1'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 1</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 1']?.stamps?.gildedStamps > 0 ?
                <Alert title={`You have ${alerts?.['World 1']?.stamps?.gildedStamps} available gilded stamps`}
                       iconPath={'data/GildedStamp'}/> : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 2'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 2</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 2']?.islands?.unclaimedDays ?
                <Alert
                  title={`You haven't claimed your islands' content in ${alerts?.['World 2']?.islands?.unclaimedDays} days`}
                  iconPath={'data/Island1'}/> : null}
              {alerts?.['World 2']?.islands?.shimmerIsland ?
                <Alert
                  title={'You haven\'t claimed your shimmer\'s trial reward this week'}
                  iconPath={'etc/Shimmer_Currency'}/> : null}
              {alerts?.['World 2']?.alchemy?.bargainTag ?
                <Alert title={'You haven\'t use bargain tag even once today'} iconPath={'data/aShopItems10'}/> : null}
              {alerts?.['World 2']?.weeklyBosses
                ?
                <Alert title={'You haven\'t done a weekly (W2) boss fight this week'} iconPath={'data/Trophie'}/>
                : null}
              {alerts?.['World 2']?.killRoy
                ?
                <Alert
                  title={alerts?.['World 2']?.killRoy === 0
                    ? `You haven't done a killroy this week (${account?.killroy?.killRoyClasses.join(', ')})` :
                    alerts?.['World 2']?.killRoy > 0 && account?.accountOptions?.[113] < (account?.killroy?.rooms === 3
                      ? 321
                      : 21) && account?.finishedWorlds?.World3
                      ? `You haven\'t done a killroy this week (${account?.killroy?.killRoyClasses.join(', ')})`
                      : ''} iconPath={'etc/Killroy'}/>
                : null}
              {alerts?.['World 2']?.arcade?.balls ?
                <Alert title={'Max ball capacity has been reached'} iconPath={'data/PachiBall0'}/> : null}
              {alerts?.['World 2']?.alchemy?.sigils?.length > 0
                ?
                alerts?.['World 2']?.alchemy?.sigils?.map(({ name, index }) => <Alert key={name}
                                                                                      title={`${cleanUnderscore(pascalCase(name))} is already unlocked`}
                                                                                      iconPath={`data/aSiga${index}`}/>)
                : null}
              {alerts?.['World 2']?.alchemy?.liquids?.length > 0
                ?
                alerts?.['World 2']?.alchemy?.liquids?.map(({ index }) => <Alert key={'liq' + index}
                                                                                 title={`${getNumberWithOrdinal(index + 1)} liquid is full`}
                                                                                 iconPath={`data/Liquid${index + 1}_x1`}/>)
                : null}
              {/*{alerts?.['World 2']?.postOffice?.shipments?.length > 0*/}
              {/*  ?*/}
              {/*  alerts?.['World 2']?.postOffice?.shipments?.map(({ index }) => <Alert key={'shipment' + index}*/}
              {/*                                                                        title={`Order streak for shipment #${index + 1} is 0`}*/}
              {/*                                                                        iconPath={`data/UIlilbox`}/>)*/}
              {/*  : null}*/}
              {alerts?.['World 2']?.postOffice?.dailyShipments?.length > 0
                ?
                alerts?.['World 2']?.postOffice?.dailyShipments?.map(({ index }) => <Alert key={'shipment' + index}
                                                                                           title={`You haven't completed an order for shipment #${index + 1} today`}
                                                                                           iconPath={`data/UIlilbox`}/>)
                : null}
              {alerts?.['World 2']?.alchemy?.vialsAttempts ? <Alert key={'vialsAttempts'}
                                                                    title={`You have available vial attempts`}
                                                                    iconPath={`data/aVials1`}/> : null}
              {alerts?.['World 2']?.alchemy?.vials?.length > 0 ?
                alerts?.['World 2']?.alchemy?.vials?.map((vial) => <Alert key={vial?.mainItem}
                                                                          vial={vial}
                                                                          title={`You have enough materials to upgrade ${cleanUnderscore(vial?.name)} vial`}
                                                                          iconPath={`data/${vial?.mainItem}`}/>) : null}

            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 3'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 3</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 3']?.library?.books ?
                <Alert
                  title={`Library has ${account?.libraryTimes?.bookCount} books ready`}
                  iconPath={'data/Libz'}/> : null}
              {alerts?.['World 3']?.atomCollider?.stampReducer ?
                <Alert
                  title={`Stamp reducer has reached your threshold (${alerts?.['World 3']?.atomCollider?.stampReducerValue}%)`}
                  iconPath={'data/Atom0'}/> : null}
              {alerts?.['World 3']?.construction?.flags?.length > 0 ?
                <Alert
                  title={`There are ${alerts?.['World 3']?.construction?.flags?.length} flags finished in construction board`}
                  iconPath={'data/CogFLflag'}/> : null}
              {alerts?.['World 3']?.equinox?.bar ?
                <Alert title={`Your Equinox bar is full`} iconPath={'data/Quest78'}/> : null}
              {alerts?.['World 3']?.equinox?.challenges > 0 ?
                <Alert title={`You have ${alerts?.['World 3']?.equinox?.challenges} challenges to validate`}
                       iconPath={'data/Quest78'}/> : null}
              {alerts?.['World 3']?.equinox?.foodLust ?
                <Alert title={`Food Lust is maxed`} iconPath={'etc/Dream_Upgrade_10'}/> : null}
              {alerts?.['World 3']?.construction?.materials?.length > 0
                ?
                alerts?.['World 3']?.construction?.materials?.map(({ rawName, missingMats }) => <Alert key={rawName}
                                                                                                       title={
                                                                                                         <RefineryTitle
                                                                                                           missingMats={missingMats}/>}
                                                                                                       imgStyle={{
                                                                                                         border: '1px solid',
                                                                                                         borderColor: '#833b3b'
                                                                                                       }}
                                                                                                       iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 3']?.construction?.rankUp?.length > 0
                ?
                alerts?.['World 3']?.construction?.rankUp?.map(({ rawName, saltName }) => <Alert key={rawName}
                                                                                                 title={`${cleanUnderscore(saltName)} is ready to rank up (2% margin of error)`}
                                                                                                 iconPath={`data/${rawName}`}/>)
                : null}
              {alerts?.['World 3']?.construction?.buildings?.length > 0
                ?
                alerts?.['World 3']?.construction?.buildings?.map(({ name, index }) => <Alert key={name}
                                                                                              title={`${cleanUnderscore(pascalCase(name))} is ready to be built`}
                                                                                              iconPath={`data/ConTower${index}`}/>)
                : null}
              {alerts?.['World 3']?.printer?.atoms?.length > 0
                ?
                alerts?.['World 3']?.printer?.atoms?.map(({ name, rawName }) => <Alert key={'printer-atoms-' + rawName}
                                                                                       title={`Printing is at maximum (storage) capacity for ${cleanUnderscore(name)}`}
                                                                                       atom
                                                                                       iconPath={`data/${rawName}`}/>)
                : null}

            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 4'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 4</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 4']?.cooking?.spices > 0 ?
                <Alert title={`You have ${alerts?.['World 4']?.cooking?.spices} spice clicks left`}
                       iconPath={'data/CookingSpice0'}/> : null}
              {alerts?.['World 4']?.breeding?.eggs ? <Alert key={'breeding-eggs'}
                                                            title={`Eggs are at full capacity`}
                                                            iconPath={`data/PetEgg1`}/> : null}
              {alerts?.['World 4']?.breeding?.eggsRarity
                ? <Alert key={'breeding-eggsRarity'}
                         title={`You have reached your desired rarity level of ${alerts?.['World 4']?.breeding?.eggsRarity} with at least one egg`}
                         iconPath={`data/PetEgg${alerts?.['World 4']?.breeding?.eggsRarity}`}/>
                : null}
              {alerts?.['World 4']?.breeding?.shinies?.pets?.length > 0 ?
                alerts?.['World 4']?.breeding?.shinies?.pets?.map(({
                                                                     monsterName,
                                                                     monsterRawName,
                                                                     shinyLevel,
                                                                     icon
                                                                   }, index) => {
                  const missingIcon = (icon === 'Mface23' && monsterRawName !== 'shovelR') || (icon === 'Mface21' && monsterRawName === 'potatoB');
                  return <Alert
                    key={monsterName + index}
                    imgStyle={{ filter: `hue-rotate(${randomFloatBetween(45, 180)}deg)` }}
                    title={`${cleanUnderscore(monsterName)} has surpassed the shiny level threshold (${alerts?.['World 4']?.breeding?.shinies?.threshold})`}
                    iconPath={missingIcon ? `afk_targets/${monsterName}` : `data/${icon}`}/>
                }) : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 5'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 5</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 5']?.gaming?.sprouts ?
                <Alert title={`Max sprouts capacity has reached (${alerts?.['World 5']?.gaming?.sprouts})`}
                       imgStyle={{ objectFit: 'none' }}
                       iconPath={'etc/Sprouts'}/> : null}
              {alerts?.['World 5']?.gaming?.drops ?
                <Alert title={`Sprinkler drops has reached it's capacity (${alerts?.['World 5']?.gaming?.drops})`}
                       iconPath={'data/GamingItem0b'}/> : null}
              {alerts?.['World 5']?.gaming?.squirrel >= 1 ?
                <Alert
                  title={`${alerts?.['World 5']?.gaming?.squirrel} hours has passed since you've clicked the squirrel`}
                  iconPath={'data/GamingItem2'}/> : null}
              {alerts?.['World 5']?.gaming?.shovel >= 1 ?
                <Alert
                  title={`${alerts?.['World 5']?.gaming?.shovel} hours has passed since you've clicked the shovel`}
                  iconPath={'data/GamingItem1'}/> : null}

              {alerts?.['World 5']?.sailing?.chests > 0 ? <Alert key={'sailing-chest-alert'}
                                                                 title={`You've reached the maximum capacity of chests`}
                                                                 iconPath={'npcs/Chesty'}/> : null}
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
                    iconPath={`etc/Captain_${captain?.captainType}`}/>
                }) : null}
            </Stack>
          </Stack> : null}
          {!emptyAlertRows?.['World 6'] ? <Stack direction={'row'} gap={4}>
            <Typography sx={{ flexShrink: 0 }} color={'text.secondary'}>World 6</Typography>
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {alerts?.['World 6']?.sneaking?.lastLooted ?
                <Alert
                  title={`You haven't looted rewards from sneaking for ${Math.floor(account?.sneaking?.lastLooted / 60)} minutes`}
                  iconPath={'data/NjUpgI14'}/> : null}
              {alerts?.['World 6']?.summoning?.familiar ?
                <Alert
                  title={`Summoning familiar bonus isn't maxed (${alerts?.['World 6']?.summoning?.familiar.level}/${alerts?.['World 6']?.summoning?.familiar.maxLvl})`}
                  iconPath={'data/SumUpgIc2'}/> : null}
              {alerts?.['World 6']?.farming?.missingPlots?.length > 0 ?
                <Alert
                  title={`You have ${alerts?.['World 6']?.farming?.missingPlots?.length} seeds available to be planted`}
                  iconPath={'data/FarmPlant1'}/> : null}
              {alerts?.['World 6']?.farming?.plots?.length > 0 ?
                <Alert
                  title={`${alerts?.['World 6']?.farming?.plots?.length} plots reached the threshold of ${alerts?.['World 6']?.farming?.plots?.[0]?.threshold} OGs (x${Math.min(1e9, Math.max(1, Math.pow(2, alerts?.['World 6']?.farming?.plots?.[0]?.threshold)))})`}
                  iconPath={'data/ClassIcons57'}/> : null}
              {alerts?.['World 6']?.farming?.totalCrops > 0 ?
                <Alert
                  title={`You have ${alerts?.farming?.totalCrops} crops ready to be collected`}
                  iconPath={'data/FarmPlant6'}/> : null}

            </Stack>
          </Stack> : null}
        </Stack> : <Typography>There are no account alerts to display</Typography>}
      </CardContent>
    </Card>
  </>
};

const Alert = ({ title, iconPath, vial, atom, style = {}, imgStyle = {}, onError = () => {} }) => {
  return <HtmlTooltip title={title}>
    <Stack sx={{ position: 'relative', ...style }}>
      <IconImg onError={onError} style={{ ...imgStyle }} vial={vial} src={`${prefix}${iconPath}.png`} alt=""/>
      {atom ? <AtomIcon vial={vial} src={`${prefix}etc/Particle.png`} alt=""/> : null}
      {vial ? <img key={`${vial?.name}`}
                   onError={(e) => {
                     e.target.src = `${prefix}data/aVials12.png`;
                     e.target.style = 'opacity: 0;'
                   }}
                   src={`${prefix}data/aVials${vial?.level === 0 ? '1' : vial?.level}.png`}
                   style={{ opacity: vial?.level === 0 ? .5 : 1, width: 35, height: 40 }}
                   alt={'vial image missing'}/> : null}
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
          alt=""/>)}
    </Stack>
  </Stack>
}

const ShopTitle = ({ shop }) => {
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
    {shop?.map(({ amount, rawName }, index) => {
      return <Stack alignItems={'center'} key={rawName + index}>
        <IconImg key={'shop' + rawName} src={`${prefix}data/${rawName}.png`}/>
        <Typography>{notateNumber(amount)}</Typography>
      </Stack>
    })}
  </Stack>
}

const AtomIcon = styled.img`
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
