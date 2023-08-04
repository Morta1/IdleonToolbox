import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import {
  cleanUnderscore,
  getNumberWithOrdinal,
  notateNumber,
  pascalCase,
  prefix,
  randomFloatBetween
} from '../../utility/helpers';
import HtmlTooltip from '../Tooltip';
import {
  alchemyAlerts,
  arcadeAlerts,
  atomColliderAlerts,
  breedingAlerts,
  constructionAlerts,
  cookingAlerts,
  etcAlerts,
  gamingAlerts,
  guildAlerts,
  postOfficeAlerts,
  printerAlerts,
  sailingAlerts,
  shopsAlerts
} from '../../utility/dashboard/account';
import useAlerts from '../hooks/useAlerts';

const alertsMap = {
  atomCollider: atomColliderAlerts,
  arcade: arcadeAlerts,
  alchemy: alchemyAlerts,
  gaming: gamingAlerts,
  guild: guildAlerts,
  sailing: sailingAlerts,
  breeding: breedingAlerts,
  printer: printerAlerts,
  shops: shopsAlerts,
  construction: constructionAlerts,
  postOffice: postOfficeAlerts,
  etc: etcAlerts,
  cooking: cookingAlerts
}

const Account = ({ account, trackers }) => {
  const alerts = useAlerts({ alertsMap, data: account, trackers });
  return <>
    <Card sx={{ width: 'fit-content' }}>
      <CardContent>
        {alerts ? <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
          {trackers?.atomCollider && alerts?.atomCollider?.stampReducer ?
            <Alert title={'Stamp reducer is maxed (90%)!'} iconPath={'data/Atom0'}/> : null}
          {trackers?.construction && alerts?.construction?.flags?.length > 0 ?
            <Alert title={`There are ${alerts?.construction?.flags?.length} flags finished in construction board`}
                   iconPath={'data/CogFLflag'}/> : null}
          {trackers?.alchemy && alerts?.alchemy?.bargainTag ?
            <Alert title={'You haven\'t use bargain tag even once today!'} iconPath={'data/aShopItems10'}/> : null}
          {trackers?.etc && alerts?.etc?.randomEvents ?
            <Alert title={'You haven\'t done a random event today!'} iconPath={'etc/Mega_Grumblo'}/> : null}
          {trackers?.cooking && alerts?.cooking?.spices > 0 ?
            <Alert title={`You have ${alerts?.cooking?.spices} spice clicks left!`}
                   iconPath={'data/CookingSpice0'}/> : null}
          {trackers?.arcade && alerts?.arcade?.balls ?
            <Alert title={'Max ball capacity has reached!'} iconPath={'data/PachiBall0'}/> : null}
          {trackers?.gaming && alerts?.gaming?.sprouts ?
            <Alert title={`Max sprouts capacity has reached (${alerts?.gaming?.sprouts})`}
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
          {trackers?.etc && alerts?.etc?.gildedStamps > 0 ?
            <Alert title={`You have ${alerts?.etc?.gildedStamps} available gilded stamps`}
                   iconPath={'data/GildedStamp'}/> : null}
          {trackers?.etc && alerts?.etc?.miniBosses?.length > 0
            ?
            alerts?.etc?.miniBosses?.map(({ rawName, name, currentCount }) => <Alert key={rawName}
                                                                                     title={`You can kill ${currentCount} ${cleanUnderscore(name)}s`}
                                                                                     iconPath={`etc/${rawName}`}/>)
            : null}
          {trackers?.alchemy && alerts?.alchemy?.sigils?.length > 0 ?
            alerts?.alchemy?.sigils?.map(({ name, index }) => <Alert key={name}
                                                                     title={`${cleanUnderscore(pascalCase(name))} is already unlocked!`}
                                                                     iconPath={`data/aSiga${index}`}/>) : null}
          {trackers?.alchemy && alerts?.alchemy?.liquids?.length > 0 ?
            alerts?.alchemy?.liquids?.map(({ index }) => <Alert key={'liq' + index}
                                                                title={`${getNumberWithOrdinal(index + 1)} liquid is full!`}
                                                                iconPath={`data/Liquid${index + 1}_x1`}/>) : null}
          {trackers?.sailing && alerts?.sailing?.captains?.length > 0 ?
            alerts?.sailing?.captains?.map(({ captain, bonus, badCaptains }) => <Alert
              key={'captain' + captain?.captainIndex}
              title={<Stack>
                <Typography sx={{ mb: 1 }}>Captain <Typography
                  component={'span'}
                  sx={{ fontWeight: 'bold' }}>{captain?.captainIndex}</Typography> with {cleanUnderscore((captain?.firstBonusValue + captain?.secondBonusValue) + bonus)} from
                  the shop is better
                  than {badCaptains.length} of
                  your captains</Typography>
                <Stack>
                  {badCaptains?.map(({ captainIndex, sum }) =>
                    <Typography><Typography
                      component={'span'}
                      sx={{ fontWeight: 'bold' }}>{captainIndex}</Typography>: {cleanUnderscore(sum + bonus)}</Typography>)}
                </Stack>
              </Stack>}
              iconPath={`etc/Captain_${captain?.captainType}`}/>) : null}
          {trackers?.construction && alerts?.construction?.materials?.length > 0
            ?
            alerts?.construction?.materials?.map(({ rawName, missingMats }) => <Alert key={rawName}
                                                                                      title={<RefineryTitle
                                                                                        missingMats={missingMats}/>}
                                                                                      iconPath={`data/${rawName}`}/>)
            : null}
          {trackers?.construction && alerts?.construction?.rankUp?.length > 0 ?
            alerts?.construction?.rankUp?.map(({ rawName, saltName }) => <Alert key={rawName}
                                                                                title={`${cleanUnderscore(saltName)} is ready to rank up!`}
                                                                                iconPath={`data/${rawName}`}/>) : null}
          {trackers?.construction && alerts?.construction?.buildings?.length > 0
            ?
            alerts?.construction?.buildings?.map(({ name, index }) => <Alert key={name}
                                                                             title={`${cleanUnderscore(pascalCase(name))} is ready to be built!`}
                                                                             iconPath={`data/ConTower${index}`}/>)
            : null}
          {trackers?.etc && alerts?.etc?.keys?.length > 0 ?
            alerts?.etc?.keys?.map(({ rawName, totalAmount }, index) => <Alert key={rawName + '' + index}
                                                                               title={`${totalAmount} of ${cleanUnderscore(pascalCase(name))} keys are ready!`}
                                                                               iconPath={`data/${rawName}`}/>) : null}
          {trackers?.postOffice && alerts?.postOffice?.shipments?.length > 0 ?
            alerts?.postOffice?.shipments?.map(({ index }) => <Alert key={'shipment' + index}
                                                                     title={`Order streak for shipment #${index} is 0!`}
                                                                     iconPath={`data/UIlilbox`}/>) : null}
          {trackers?.breeding && alerts?.breeding?.shinies?.pets?.length > 0 ?
            alerts?.breeding?.shinies?.pets?.map(({ monsterName, monsterRawName, shinyLevel, icon }, index) => {
              const missingIcon = icon === 'Mface23' && monsterRawName !== 'shovelR';
              return <Alert
                key={monsterName + index}
                imgStyle={{ filter: `hue-rotate(${randomFloatBetween(45, 180)}deg)` }}
                title={`${cleanUnderscore(monsterName)} has surpassed the shiny level threshold (${alerts?.breeding?.shinies?.threshold})`}
                iconPath={missingIcon ? `afk_targets/${monsterName}` : `data/${icon}`}/>
            }) : null}
          {trackers?.printer?.checked && alerts?.printer?.atoms?.length > 0 ?
            alerts?.printer?.atoms?.map(({ name, rawName }) => <Alert key={'printer-atoms-' + rawName}
                                                                      title={`Printing is at capacity for ${cleanUnderscore(name)}`}
                                                                      atom
                                                                      iconPath={`data/${rawName}`}/>) : null}
          {trackers?.alchemy && alerts?.alchemy?.vials?.length > 0 ?
            alerts?.alchemy?.vials?.map((vial) => <Alert key={vial?.mainItem}
                                                         vial={vial}
                                                         title={`You have enough materials to upgrade ${cleanUnderscore(vial?.name)} vial!`}
                                                         iconPath={`data/${vial?.mainItem}`}/>) : null}
          {trackers?.shops && alerts?.shops?.items?.length > 0 ?
            alerts?.shops?.items?.map((shop, index) => shop?.length > 0 ?
              <Alert key={'shop' + index + shop?.[0]?.rawName}
                     title={<ShopTitle shop={shop}/>}
                     iconPath={`data/ShopEZ${index}`}/> : null) : null}
          {trackers?.guild && alerts?.guild?.daily ?
            <Alert title={`You have ${alerts?.guild?.daily} uncompleted daily tasks`} iconPath={`etc/GP`}
                   imgStyle={{ filter: 'sepia(1) hue-rotate(46deg) saturate(1)' }}/> : null}
          {trackers?.guild && alerts?.guild?.weekly ?
            <Alert title={`You have ${alerts?.guild?.weekly} uncompleted weekly tasks`} iconPath={`etc/GP`}
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
  width: ${({ vial }) => vial ? '20px' : '30px'};
  height: ${({ vial }) => vial ? '20px' : '30px'};
  object-fit: contain;
  ${({ vial }) => vial ? `top: 50%;left: 50%;transform:translate(-60%, -70%);` : ''}
  position: ${({ vial }) => vial ? 'absolute' : 'relative'};
`;

export default Account;
