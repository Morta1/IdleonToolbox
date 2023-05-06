import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { cleanUnderscore, pascalCase, prefix } from "../../utility/helpers";
import styled from "@emotion/styled";
import HtmlTooltip from "../Tooltip";
import {
  crystalCooldownSkillsReady,
  hasAvailableToolUpgrade,
  hasUnspentPoints,
  isAkfForMoreThanTenHours,
  isAnvilOverdue,
  isMissingEquippedBubble,
  isMissingStarSigns,
  isObolMissing,
  isProductionMissing,
  isTalentReady,
  isTrapMissing,
  isTrapOverdue,
  isWorshipOverdue
} from "../../utility/dashboard/characters";
import { getAllTools } from "../../parsers/items";

const Characters = ({ characters = [], account, lastUpdated, trackersOptions, trackers }) => {
  const rawTools = getAllTools();
  return <>
    <Stack gap={2} direction={'row'} flexWrap={'wrap'}>
      {characters?.map((character, characterIndex) => {
        const {
          name,
          tools,
          classIndex,
          afkTarget,
          worship,
          postOffice,
          equippedBubbles,
          afkTime
        } = character;
        const activity = afkTarget !== '_' ? afkTarget : 'Nothing';
        const productionHammersMissing = trackers?.anvil && isProductionMissing(equippedBubbles, account, characterIndex);
        const readyTalents = trackers?.talents && isTalentReady(character, trackersOptions);
        const missingObols = trackers?.obols && isObolMissing(account, character);
        const missingStarSigns = trackers?.starSigns && isMissingStarSigns(character, account);
        const fullAnvil = isAnvilOverdue(account, afkTime, characterIndex, trackersOptions);
        const ccdSkillsReady = crystalCooldownSkillsReady(character, account);
        const upgradeableTools = hasAvailableToolUpgrade(character, account, rawTools);
        return <Card key={name} sx={{ width: 345 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
              <Box sx={{ display: { sm: 'none', md: 'block' } }}><img src={`${prefix}data/ClassIcons${classIndex}.png`}
                                                                      alt=""/></Box>
              <Typography>{name}</Typography>
              <HtmlTooltip title={cleanUnderscore(activity)}>
                <IconImg src={`${prefix}afk_targets/${activity}.png`} alt="activity icon"
                         style={{ marginLeft: 'auto' }}/>
              </HtmlTooltip>
            </Stack>
            <Divider sx={{ my: 1 }}/>
            <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
              {trackers?.prayers && isAkfForMoreThanTenHours(character, lastUpdated) ?
                <Alert title={`${name} has unending energy prayer and is afk for more than 10 hours!`}
                       iconPath={'data/Prayer2'}/> : null}
              {trackers?.traps && isTrapOverdue(account, characterIndex) ?
                <Alert title={`${name} traps are overdue!`} iconPath={'data/TrapBoxSet1'}/> : null}
              {trackers?.traps && isTrapMissing(tools, account, characterIndex) ?
                <Alert title={`${name} is missing a trap!`} iconPath={'data/ClassIcons48'}/> : null}
              {trackers?.bubbles && isMissingEquippedBubble(character, account) ?
                <Alert title={`${name} is missing an active bubble!`} iconPath={'data/aJarB0'}/> : null}
              {trackers?.worship && isWorshipOverdue(account, worship) ?
                <Alert title={`${name} worship is full!`} iconPath={'data/ClassIcons50'}/> : null}
              {trackers?.obols && missingObols?.length > 0 ?
                <Alert title={`${name} has ${missingObols?.length} empty obol slots!`}
                       iconPath={'data/ObolLocked1'}/> : null}
              {trackers?.postOffice && hasUnspentPoints(account, postOffice, trackersOptions) ?
                <Alert title={`${name} has ${Math.floor(postOffice?.unspentPoints)} unspent points`}
                       iconPath={'data/UIboxUpg0'}/> : null}
              {trackers?.anvil && productionHammersMissing > 0 ?
                <Alert title={`${name} is missing ${productionHammersMissing} hammers`}
                       iconPath={'data/GemP1'}/> : null}
              {trackers?.anvil && fullAnvil?.length > 0 ?
                fullAnvil?.map(({ diff, name, rawName }) => {
                  const isFull = diff <= 0;
                  return <Alert key={`${name}-${characterIndex}`}
                                title={`${cleanUnderscore(name)} ${isFull ? 'production is full!' : `is ${diff} minutes away from being full!`}`}
                                iconPath={`data/${rawName}`}/>;
                }) : null}
              {trackers?.starSigns && missingStarSigns > 0 ?
                <Alert title={`${name} is missing ${missingStarSigns} star signs!`}
                       iconPath={'data/SignStar1b'}/> : null}
              {trackers?.talents && readyTalents?.length > 0 ? readyTalents?.map(({ name, skillIndex }, index) => (
                <Alert key={skillIndex + '-' + index} title={`${cleanUnderscore(pascalCase(name))} is ready!`}
                       iconPath={`data/UISkillIcon${skillIndex}`}/>
              )) : null}
              {trackers?.tools && upgradeableTools?.length > 0 ? upgradeableTools?.map(({
                                                                                          rawName,
                                                                                          displayName
                                                                                        }, index) => (
                <Alert key={`${character?.name}-${rawName}-${index}`}
                       title={`${character?.name} can equip ${cleanUnderscore(pascalCase(displayName))}`}
                       iconPath={`data/${rawName}`}/>
              )) : null}
              {trackers?.crystalCountdown && ccdSkillsReady?.length > 0 ? ccdSkillsReady?.map(({
                                                                                                 name,
                                                                                                 icon,
                                                                                                 crystalCountdown
                                                                                               }, index) => (
                <Alert key={icon + '-' + index + '-' + characterIndex}
                       style={{ border: '1px solid #fbb9b9', borderRadius: 5 }}
                       title={`Crystal Countdown is maxed for ${cleanUnderscore(pascalCase(name))} (${crystalCountdown.toFixed(2)}%)!`}
                       iconPath={`data/${icon}`}/>
              )) : null}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const Alert = ({ title, iconPath, style = {} }) => {
  return <HtmlTooltip title={title}>
    <IconImg style={style} src={`${prefix}${iconPath}.png`} alt=""/>
  </HtmlTooltip>
}

const IconImg = styled.img`
  width: 35px;
  height: 35px;
  object-fit: contain;
`;

export default Characters;
