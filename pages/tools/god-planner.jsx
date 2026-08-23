import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../components/common/context/AppProvider';
import { Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix, tryToParse } from '@utility/helpers';
import { getBubbleBonus } from '@parsers/world-2/alchemy';
import { NextSeo } from 'next-seo';
import StructuredData, { createHowToData } from '@components/common/StructuredData';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Tooltip from '../../components/Tooltip';
import MinorBonusCalculator from '@components/tools/god-planner/MinorBonusCalculator';
import {
  ARCTIS_GOD_SLOT,
  getGodMinorBonusMultiplier,
  getMinorDivinityBonusCap,
  getMinorDivinityBonusValue,
  getRequiredDivinityLevel
} from '@parsers/world-5/divinity';
import { getCoralKidUpgBonus } from '@parsers/world-7/coralReef';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { gods } from '@website-data';

const godSlotOf = (godName) => Number(String(godName)?.replace('DivGod', ''));

// A plan is only useful next to what you have linked right now, so every entry is matched against
// the character's current links: the ones already linked, and which link each swap would spend.
const getPlanDetails = (build, characters, account, getBonus) => {
  const remainingLinks = {};
  const matched = (build ?? []).map((entry) => {
    const charIndex = characters?.findIndex(({ name }) => name === entry?.charName);
    const character = characters?.[charIndex];
    const godSlot = godSlotOf(entry?.godName);
    if (!remainingLinks[entry?.charName]) {
      remainingLinks[entry.charName] = [account?.divinity?.linkedDeities?.[charIndex],
        character?.secondLinkedDeityIndex]
        .filter((slot) => slot != null && slot !== -1);
    }
    const links = remainingLinks[entry?.charName];
    const isLinked = links.includes(godSlot);
    // A god that is already linked claims that link, so a swap in the same plan cannot spend it too.
    if (isLinked) links.splice(links.indexOf(godSlot), 1);
    return { entry, character, godSlot, isLinked };
  });

  return matched.map(({ entry, character, godSlot, isLinked }) => {
    const deity = account?.divinity?.deities?.[godSlot] ?? gods?.[godSlot];
    const links = remainingLinks[entry?.charName];
    const replacedSlot = isLinked || !links?.length ? null : links.shift();
    const replaced = account?.divinity?.deities?.[replacedSlot] ?? gods?.[replacedSlot];
    return {
      ...entry,
      godLabel: deity?.name,
      bonusLabel: formatMinorBonus(getBonus(character, godSlot), godSlot, deity?.minorBonus),
      isLinked,
      status: isLinked
        ? 'already linked'
        : replaced
          ? `swap out ${replaced?.name}`
          : 'new link'
    };
  });
}

// The bonus means nothing as a bare number, and each god words it differently: Arctis counts whole
// talent levels, the rest are percentages.
const formatMinorBonus = (bonus, godSlot, template) => {
  if (godSlot === ARCTIS_GOD_SLOT) return `+${numberWithCommas(Math.ceil(bonus))} talent LV`;
  return template?.includes('{%') ? `+${bonus.toFixed(2)}%` : `+${bonus.toFixed(2)}`;
}

const GodPlanner = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account } = state;
  const [build, setBuild] = useState([]);
  const [bigP, setBigP] = useState(true);

  useEffect(() => {
    if (state?.godPlanner) {
      setBuild(tryToParse(state?.godPlanner));
    }
  }, []);

  const handleClick = ({ charName, playerId, godName, maxGods }) => {
    const buildCopy = [...build];
    const playerObject = { charName, playerId, godName };
    const alreadyPlanned = buildCopy?.findIndex((player) => player?.charName === charName && player?.godName === godName);
    if (alreadyPlanned !== -1) {
      // Clicking a god that is already planned takes it back off the list.
      buildCopy.splice(alreadyPlanned, 1);
    }
    else {
      const charGods = buildCopy?.filter((player) => player?.charName === charName);
      // An Elemental Sorcerer links two gods, so its plan holds two before the oldest gives way.
      if (charGods?.length >= maxGods) {
        buildCopy.splice(buildCopy.indexOf(charGods[0]), 1);
      }
      buildCopy.push(playerObject);
    }
    buildCopy.sort((a, b) => a?.playerId - b?.playerId);
    dispatch({ type: 'godPlanner', data: buildCopy })
    setBuild(buildCopy);
  }

  const handleDelete = (index) => {
    const buildCopy = [...build]?.filter((_, ind) => ind !== index);
    dispatch({ type: 'godPlanner', data: buildCopy });
    setBuild(buildCopy)
  }

  const bubbleBonus = getBubbleBonus(account, 'BIG_P', false);
  const coralKidUpgBonus = getCoralKidUpgBonus(account, 3);
  const getBonus = (character, godSlot) => getMinorDivinityBonusValue({
    divinityLevel: character?.skillsInfo?.divinity?.level ?? 0,
    bigPBubble: bigP ? bubbleBonus : 1,
    multiplier: getGodMinorBonusMultiplier(godSlot),
    coralKidUpgBonus
  });
  const planDetails = getPlanDetails(build, characters, account, getBonus);
  const swaps = planDetails?.filter(({ isLinked }) => !isLinked)?.length;

  return <>
    <NextSeo
      title="God Planner | Idleon Toolbox"
      description="Plan and optimize your characters' divinity god links and minor bonuses in Legends of Idleon"
    />
    <StructuredData data={createHowToData(
      'How to plan god links in Legends of Idleon',
      'Use the God Planner to optimize which gods each character is linked to for maximum bonuses.',
      [
        'View all available gods and their minor link bonuses',
        'Click a god for each character to assign their divinity link',
        'Review the combined minor bonuses across all your characters',
        'Save your planned build for future reference'
      ]
    )}/>
    <Typography variant={'h2'} mb={1}>God Planner</Typography>
    <Typography variant={'body2'} sx={{ maxWidth: 600 }} mb={3}>
      Compare every god on every character before spending an unlink.
    </Typography>
    <Typography variant={'h6'}>Bonus calculator</Typography>
    <Typography variant={'body2'} sx={{ maxWidth: 600 }} mb={1}>
      What a god is worth now, and what a target costs.
    </Typography>
    <MinorBonusCalculator characters={characters} account={account}/>
    <Divider sx={{ my: 4 }}></Divider>
    <Typography variant={'h6'}>Planned links</Typography>
    <Typography variant={'body2'} sx={{ maxWidth: 600 }}>
      The loadout you intend to link. Click a god below to plan it, click again to drop it.
      An Elemental Sorcerer holds two. Saved on this device, changes nothing in game.
    </Typography>
    {swaps > 0 ? <Typography variant={'body2'} mt={1} color={'warning.main'}>
      {numberWithCommas(swaps)} of {numberWithCommas(planDetails?.length)} planned {planDetails?.length === 1
      ? 'link is'
      : 'links are'} not linked yet.
    </Typography> : null}
    <Stack direction={'row'} sx={{ gap: { xs: 1, sm: 2 }, minHeight: 80 }} my={2} flexWrap={'wrap'}
           alignItems={'stretch'}>
      {planDetails?.length > 0 ? null : <Typography variant={'body2'} color={'text.secondary'}>
        Nothing planned yet.
      </Typography>}
      {planDetails?.map(({ charName, godName, godLabel, bonusLabel, isLinked, status }, index) => {
        return <Card key={charName + godName + index}
                     sx={{ overflow: 'visible', position: 'relative', minWidth: 170 }}>
          <CardContent>
            <IconButton sx={{ position: 'absolute', top: 0, right: 0, transform: 'translate(50%, -50%)' }}
                        size={'small'}
                        onClick={() => handleDelete(index)}>
              <CloseIcon/>
            </IconButton>
            <Stack key={charName} alignItems={'center'} justifyContent={'center'} gap={0.5}>
              <Typography variant={'body2'}>{charName}</Typography>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <img width={24} height={24} src={`${prefix}data/${godName}.png`} alt="god-icon"/>
                <Typography>{godLabel}</Typography>
              </Stack>
              <Typography variant={'body2'} sx={{ fontWeight: 'bold' }}>{bonusLabel}</Typography>
              <Typography variant={'caption'} color={isLinked ? 'success.main' : 'warning.main'}>
                {status}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Typography variant={'h6'} mt={4}>Minor Link Bonus per character</Typography>
    <Typography variant={'body2'} sx={{ maxWidth: 600 }}>
      Green border: linked in game. Dashed blue: planned. Hover for details.
    </Typography>
    <FormControlLabel
      control={<Checkbox name={'mini'} checked={bigP}
                         size={'small'}
                         onChange={() => setBigP(!bigP)}/>}
      label={'Include the BIG P bubble bonus'}/>
    <Stack gap={1} sx={{ width: 'fit-content' }}>
      <Stack direction={'row'} gap={2} sx={{ display: { xs: 'none', md: 'flex' }, pl: '162px' }}>
        {account?.divinity?.deities?.map(({ name, rawName }) => <Stack key={rawName} sx={{ width: 80 }}
                                                                       alignItems={'center'}>
          <img width={20} height={20} src={`${prefix}data/${rawName}.png`} alt=""/>
          <Typography variant={'caption'} align={'center'}>{name}</Typography>
        </Stack>)}
      </Stack>
      {characters?.map(({
                          classIndex, name: charName, deityMinorBonus = 0, divStyle,
                          secondLinkedDeityIndex, secondDeityMinorBonus = 0,
                          playerId,
                          class: charClass,
                          skillsInfo
                        }, charIndex) => {
        const divinityLevel = skillsInfo?.divinity?.level ?? 0;
        // Polytheism lets an Elemental Sorcerer hold a second link, so its plan holds two gods.
        const maxGods = checkCharClass(charClass, CLASSES.Elemental_Sorcerer) ? 2 : 1;
        const classIcon = classIndex !== undefined ? `data/ClassIcons${classIndex}.png` : 'afk_targets/Nothing.png'
        return (
          (<Card key={charName}>
            <CardContent>
              <Stack direction={'row'} gap={2} alignItems={'center'} flexWrap={'wrap'}>
                <Stack sx={{ width: 130 }} direction={'column'} alignItems={'center'}>
                  <img src={`${prefix}${classIcon}`}
                       alt="player-icon"/>
                  <Typography>{charName}</Typography>
                </Stack>
                {account?.divinity?.deities?.map(({
                                                    name,
                                                    rawName,
                                                    majorBonus,
                                                    minorBonus,
                                                    blessing,
                                                    blessingMultiplier,
                                                    blessingBonus,
                                                    minorBonusMultiplier
                                                  }, godIndex) => {
                  const isLinked = account?.divinity?.linkedDeities?.[charIndex] === godIndex;
                  const isSecondLinked = secondLinkedDeityIndex === godIndex;
                  const isPlanned = build?.some((player) => player?.charName === charName && player?.godName === rawName);
                  const bonusInputs = {
                    divinityLevel,
                    bigPBubble: bigP ? bubbleBonus : 1,
                    multiplier: getGodMinorBonusMultiplier(godIndex),
                    coralKidUpgBonus
                  };
                  const bonus = getMinorDivinityBonusValue(bonusInputs);
                  const bonusDesc = minorBonus.replace(/{/g, bonus.toFixed(2));
                  // Only Arctis is ceiled into whole talent levels, so only it has steps to aim for.
                  const nextStepLevel = godIndex === ARCTIS_GOD_SLOT
                    ? getRequiredDivinityLevel({ ...bonusInputs, targetBonus: Math.ceil(bonus) })
                    : null;
                  return <Tooltip key={rawName} title={<CharDeityDetails
                    name={name}
                    bonus={bonusDesc}
                    cap={getMinorDivinityBonusCap(bonusInputs)}
                    talentLevels={godIndex === ARCTIS_GOD_SLOT ? Math.ceil(bonus) : null}
                    nextStepLevel={nextStepLevel}
                    divinityLevel={divinityLevel}
                  />}>
                    <Card variant={'outlined'}
                          onClick={() => handleClick({ charName, playerId, godName: rawName, maxGods })}
                          sx={{
                            width: 80,
                            cursor: 'pointer',
                            border: isPlanned
                              ? '1px dashed #64b5f6'
                              : isLinked || isSecondLinked ? '1px solid #81c784' : ''
                          }}>
                      <CardContent sx={{ '&:last-child': { padding: 1 } }}>
                        <Stack alignItems={'center'} justifyContent={'center'}>
                          <img width={24} height={24} src={`${prefix}data/${rawName}.png`} alt="god-icon"/>
                          {bonus.toFixed(2)}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Tooltip>
                })}
              </Stack>
            </CardContent>
          </Card>)
        );
      })}
    </Stack>
  </>;
};

const CharDeityDetails = ({ name, bonus, cap, talentLevels, nextStepLevel, divinityLevel }) => {
  return <>
    <Typography sx={{ fontWeight: 'bold' }}>{name}</Typography>
    <Typography>{cleanUnderscore(bonus)}</Typography>
    <Typography variant={'caption'} component={'div'}>Divinity levels alone top out
      at {cap?.toFixed(2)}</Typography>
    {talentLevels !== null ? <Typography variant={'caption'} component={'div'}>
      +{numberWithCommas(talentLevels)} talent LV{nextStepLevel !== null
      ? ` · +${numberWithCommas(talentLevels + 1)} at divinity level ${numberWithCommas(nextStepLevel)} (+${numberWithCommas(Math.max(0, nextStepLevel - divinityLevel))})`
      : ' · the next level is out of reach at this BIG P and Coral Kid level'}
    </Typography> : null}
  </>
}

export default GodPlanner;
