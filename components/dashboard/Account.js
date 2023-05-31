import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import styled from "@emotion/styled";
import {
  cleanUnderscore,
  getNumberWithOrdinal,
  notateNumber,
  pascalCase,
  prefix,
  randomFloatBetween
} from "../../utility/helpers";
import HtmlTooltip from "../Tooltip";
import {
  alchemyAlerts,
  areKeysOverdue,
  areSigilsOverdue,
  areTowersOverdue,
  areVialsReady,
  canKillBosses,
  gamingAlerts,
  guildTasks,
  hasAvailableSpiceClicks,
  hasItemsInShop,
  isBallsOverdue,
  isStampReducerMaxed,
  overflowingPrinter, overflowingShinies,
  refineryAlerts,
  riftAlerts,
  sailingAlerts,
  zeroBargainTag, zeroRandomEvents
} from "../../utility/dashboard/account";

const alertsMapping = {
  stampReducer: isStampReducerMaxed,
  sigils: areSigilsOverdue,
  refinery: refineryAlerts,
  towers: areTowersOverdue,
  keys: areKeysOverdue,
  arcadeBalls: isBallsOverdue,
  vials: areVialsReady,
  cooking: hasAvailableSpiceClicks,
  miniBosses: canKillBosses,
  bargainTag: zeroBargainTag,
  gaming: gamingAlerts,
  guildTasks: guildTasks,
  rift: riftAlerts,
  sailing: sailingAlerts,
  alchemy: alchemyAlerts,
  shops: hasItemsInShop,
  printerAtoms: overflowingPrinter,
  shinies: overflowingShinies,
  randomEvents: zeroRandomEvents
}

const Account = ({ account, trackers, trackersOptions }) => {
  const [alerts, setAlerts] = useState();

  useEffect(() => {
    const anyTracker = trackers && Object.values(trackers).some((tracker) => tracker);
    if (anyTracker) {
      const tempAlerts = Object.entries(trackers || {}).reduce((res, [trackerName, val]) => {
        if (val) {
          if (alertsMapping?.[trackerName]) {
            res[trackerName] = alertsMapping?.[trackerName](account, trackersOptions?.[trackerName]);
          }
        }
        return res;
      }, {});
      const anythingToShow = Object.values(tempAlerts).some((alert) => Array.isArray(alert) ? alert.length > 0 : alert)
      setAlerts(anythingToShow ? tempAlerts : null);
    } else {
      setAlerts(null)
    }
  }, [account, trackers, trackersOptions]);

  return <>
    <Card>
      <CardContent>
        {alerts ? <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
          {trackers?.stampReducer && alerts?.stampReducer ?
            <Alert title={'Stamp reducer is maxed (90%)!'} iconPath={'data/Atom0'}/> : null}
          {trackers?.bargainTag && alerts?.bargainTag ?
            <Alert title={'You haven\'t use bargain tag even once today!'} iconPath={'data/aShopItems10'}/> : null}
          {trackers?.randomEvents && alerts?.randomEvents ?
            <Alert title={'You haven\'t done a random event today!'} iconPath={'etc/Mega_Grumblo'}/> : null}
          {trackers?.cooking && alerts?.cooking > 0 ?
            <Alert title={`You have ${alerts?.cooking} spice clicks left!`} iconPath={'data/CookingSpice0'}/> : null}
          {trackers?.arcadeBalls && alerts?.arcadeBalls ?
            <Alert title={'Max ball capacity has reached!'} iconPath={'data/PachiBall0'}/> : null}
          {trackers?.gaming && alerts?.gaming?.maxSprouts ?
            <Alert title={`Max sprouts capacity has reached (${alerts?.gaming?.maxSprouts})`}
                   imgStyle={{ objectFit: 'none' }}
                   iconPath={'etc/Sprouts'}/> : null}
          {trackers?.gaming && alerts?.gaming?.drops ?
            <Alert title={`Sprinkler drops has reached it's capacity (${alerts?.gaming?.drops})`}
                   iconPath={'data/GamingItem0b'}/> : null}
          {trackers?.gaming && alerts?.gaming?.squirrel?.hours >= 1 ?
            <Alert title={`${alerts?.gaming?.squirrel?.hours} hours has passed since you've clicked the squirrel!`}
                   iconPath={'data/GamingItem2'}/> : null}
          {trackers?.gaming && alerts?.gaming?.shovel?.hours >= 1 ?
            <Alert title={`${alerts?.gaming?.shovel?.hours} hours has passed since you've clicked the shovel!`}
                   iconPath={'data/GamingItem1'}/> : null}
          {trackers?.rift && alerts?.rift?.gildedStamps > 0 ?
            <Alert title={`You have ${alerts?.rift?.gildedStamps} available gilded stamps`}
                   iconPath={'data/GildedStamp'}/> : null}
          {trackers?.miniBosses && alerts?.miniBosses?.length > 0 ?
            alerts?.miniBosses?.map(({ rawName, name, currentCount }) => <Alert key={rawName}
                                                                                title={`You can kill ${currentCount} ${cleanUnderscore(name)}s`}
                                                                                iconPath={`etc/${rawName}`}/>) : null}
          {trackers?.sigils && alerts?.sigils?.length > 0 ?
            alerts?.sigils?.map(({ name, index }) => <Alert key={name}
                                                            title={`${cleanUnderscore(pascalCase(name))} is already unlocked!`}
                                                            iconPath={`data/aSiga${index}`}/>) : null}
          {trackers?.alchemy && alerts?.alchemy?.liquids?.length > 0 ?
            alerts?.alchemy?.liquids?.map(({ index }) => <Alert key={'liq' + index}
                                                                title={`${getNumberWithOrdinal(index + 1)} liquid is full!`}
                                                                iconPath={`data/Liquid${index + 1}_x1`}/>) : null}
          {trackers?.sailing && alerts?.sailing?.captains?.length > 0 ?
            alerts?.sailing?.captains?.map(({ captain, badCaptains, bonuses }) => <Alert
              key={'captain' + captain?.captainIndex}
              title={<Stack>
                <Typography sx={{ mb: 1 }}>A captain ({captain?.captainIndex}) from the shop is better
                  than {badCaptains.length} of
                  your captains ({badCaptains.join(',')})</Typography>
                {bonuses?.length > 0 ? <>
                  <Typography sx={{ fontWeight: 'bold' }}>Bonuses</Typography>
                  {bonuses?.map((bonus, index) => <Typography
                    key={captain + index}>{cleanUnderscore(bonus)}</Typography>)}
                </> : null}
              </Stack>}
              iconPath={`etc/Captain_${captain?.captainType}`}/>) : null}
          {trackers?.refinery && alerts?.refinery?.materials?.length > 0 ?
            alerts?.refinery?.materials?.map(({ rawName, missingMats }) => <Alert key={rawName}
                                                                                  title={<RefineryTitle
                                                                                    missingMats={missingMats}/>}
                                                                                  iconPath={`data/${rawName}`}/>) : null}
          {trackers?.refinery && alerts?.refinery?.rankUp?.length > 0 ?
            alerts?.refinery?.rankUp?.map(({ rawName, saltName }) => <Alert key={rawName}
                                                                            title={`${cleanUnderscore(saltName)} is ready to rank up!`}
                                                                            iconPath={`data/${rawName}`}/>) : null}
          {trackers?.towers && alerts?.towers?.length > 0 ?
            alerts?.towers?.map(({ name, index }) => <Alert key={name}
                                                            title={`${cleanUnderscore(pascalCase(name))} is ready to be built!`}
                                                            iconPath={`data/ConTower${index}`}/>) : null}
          {trackers?.keys && alerts?.keys?.length > 0 ?
            alerts?.keys?.map(({ rawName, totalAmount }, index) => <Alert key={rawName + '' + index}
                                                                          title={`${totalAmount} of ${cleanUnderscore(pascalCase(name))} keys are ready!`}
                                                                          iconPath={`data/${rawName}`}/>) : null}
          {trackers?.shinies && alerts?.shinies?.length > 0 ?
            alerts?.shinies?.map(({ monsterName, monsterRawName, shinyLevel, icon }, index) => {
              const missingIcon = icon === 'Mface23' && monsterRawName !== 'shovelR';
              return <Alert
                key={monsterName + index}
                imgStyle={{ filter: `hue-rotate(${randomFloatBetween(45, 180)}deg)` }}
                title={`${cleanUnderscore(monsterName)} has surpassed the shiny level threshold (${trackersOptions?.['shinies']?.['input']?.['value']})`}
                iconPath={missingIcon ? `afk_targets/${monsterName}` : `data/${icon}`}/>
            }) : null}
          {trackers?.printerAtoms && alerts?.printerAtoms?.length > 0 ?
            alerts?.printerAtoms?.map(({ name, rawName }) => <Alert key={'printer-atoms-' + rawName}
                                                                    title={`Printing is at capacity for ${cleanUnderscore(name)}`}
                                                                    atom
                                                                    iconPath={`data/${rawName}`}/>) : null}
          {trackers?.vials && alerts?.vials?.length > 0 ?
            alerts?.vials?.map((vial) => <Alert key={vial?.mainItem}
                                                vial={vial}
                                                title={`You have enough materials to upgrade ${cleanUnderscore(vial?.name)} vial!`}
                                                iconPath={`data/${vial?.mainItem}`}/>) : null}
          {trackers?.shops && alerts?.shops?.length > 0 ?
            alerts?.shops?.map((shop, index) => shop?.length > 0 ? <Alert key={'shop' + index + shop?.[0]?.rawName}
                                                                          title={<ShopTitle shop={shop}/>}
                                                                          iconPath={`data/ShopEZ${index}`}/> : null) : null}
          {trackers?.guildTasks && alerts?.guildTasks?.daily ?
            <Alert title={`You have ${alerts?.guildTasks?.daily} uncompleted daily tasks`} iconPath={`etc/GP`}
                   imgStyle={{ filter: 'sepia(1) hue-rotate(46deg) saturate(1)' }}/> : null}
          {trackers?.guildTasks && alerts?.guildTasks?.weekly ?
            <Alert title={`You have ${alerts?.guildTasks?.weekly} uncompleted weekly tasks`} iconPath={`etc/GP`}
                   imgStyle={{ filter: 'sepia(1) hue-rotate(140deg) saturate(1)' }}/> : null}
        </Stack> : <Typography>There are no account alerts to display</Typography>}
      </CardContent>
    </Card>
  </>
};

const Alert = ({ title, iconPath, vial, atom, imgStyle = {} }) => {
  return <HtmlTooltip title={title}>
    <Box sx={{ position: 'relative' }}>
      <IconImg style={{ ...imgStyle }} vial={vial} src={`${prefix}${iconPath}.png`} alt=""/>
      {atom ? <AtomIcon vial={vial} src={`${prefix}etc/Particle.png`} alt=""/> : null}
      {vial ? <img key={`${vial?.name}`}
                   onError={(e) => {
                     e.target.src = `${prefix}data/aVials12.png`;
                     e.target.style = 'opacity: 0;'
                   }}
                   src={`${prefix}data/aVials${vial?.level === 0 ? '1' : vial?.level}.png`}
                   style={{ opacity: vial?.level === 0 ? .5 : 1, width: 35, height: 40 }}
                   alt={'vial image missing'}/> : null}
    </Box>
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
  width: ${({ vial }) => vial ? '25px' : '35px'};
  height: ${({ vial }) => vial ? '25px' : '35px'};
  object-fit: contain;
  ${({ vial }) => vial ? `top: 50%;left: 50%;transform:translate(-60%, -70%);` : ''}
  position: ${({ vial }) => vial ? 'absolute' : 'relative'};
`;

export default Account;
