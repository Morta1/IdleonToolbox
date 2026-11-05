import React, { useContext, useRef } from 'react';
import { AppContext } from '../../components/common/context/AppProvider';
import { Box, Button, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, tryToParse } from '@utility/helpers';
import { minorBonusText } from '@utility/gameNotation';
import { getBubbleBonus } from '@parsers/world-2/alchemy';
import { NextSeo } from 'next-seo';
import StructuredData, { createHowToData } from '@components/common/StructuredData';
import MinorBonusCalculator from '@components/tools/god-planner/MinorBonusCalculator';
import {
  GOD_SLOT,
  getGodMinorBonusMultiplier,
  getMinorDivinityBonusCap,
  getMinorDivinityBonusValue,
  getRequiredDivinityLevel
} from '@parsers/world-5/divinity';
import { getCoralKidUpgBonus } from '@parsers/world-7/coralReef';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { gods } from '@website-data';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import StatusText from '@components/common/StatusText';
import { MissingSections } from '@components/common/styles';

const PLANNER_SETTINGS = { countBigP: true };
const SECTION_NAMES = { divinity: 'Divinity', alchemy: 'Alchemy', coralReef: 'Coral Reef' };

const godSlotOf = (godName) => Number(String(godName)?.replace('DivGod', ''));

// The bonus means nothing as a bare number, and each god words it differently: Arctis counts whole
// talent levels, the rest are percentages.
const formatMinorBonus = (bonus, godSlot, template) => {
  if (godSlot === GOD_SLOT.Arctis) return `+${formatNum(Math.ceil(bonus), 'whole')} talent LV`;
  return template?.includes('{%') ? `+${minorBonusText(bonus, false)}%` : `+${minorBonusText(bonus, false)}`;
};

// Only Arctis is ceiled into whole talent levels, so only it has steps to aim for.
const nextTalentLine = (bonus, inputs) => {
  const nextStepLevel = getRequiredDivinityLevel({ ...inputs, targetBonus: Math.ceil(bonus) });
  return nextStepLevel === null
    ? 'Out of reach at this BIG P and Coral Kid level'
    : `+${formatNum(Math.ceil(bonus) + 1, 'whole')} at divinity level ${formatNum(nextStepLevel, 'whole')} (+${formatNum(Math.max(0, nextStepLevel - inputs.divinityLevel), 'whole')})`;
};

// A plan is only useful next to what you have linked right now, so every entry is matched against
// the character's current links: the ones already linked, and which link each swap would spend.
const getPlanDetails = (build, characters, account, getInputs) => {
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
    const inputs = getInputs(character, godSlot);
    const bonus = getMinorDivinityBonusValue(inputs);
    const isArctis = godSlot === GOD_SLOT.Arctis;
    return {
      ...entry,
      godLabel: deity?.name,
      bonusLabel: formatMinorBonus(bonus, godSlot, deity?.minorBonus),
      sentence: cleanUnderscore(deity?.minorBonus?.replace(/{/g, minorBonusText(bonus, isArctis)) ?? ''),
      cap: getMinorDivinityBonusCap(inputs),
      nextTalent: isArctis ? nextTalentLine(bonus, inputs) : null,
      isLinked,
      status: replaced ? `Swaps out ${replaced?.name}` : 'New link'
    };
  });
};

const GodPlanner = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account } = state;
  const build = tryToParse(state?.godPlanner) ?? [];
  const [settings, setSettings, resetSettings] = usePageSettings('god-planner', PLANNER_SETTINGS);
  const plannedRef = useRef(null);

  const handleClick = ({ charName, playerId, godName, maxGods }) => {
    const buildCopy = [...build];
    const playerObject = { charName, playerId, godName };
    const alreadyPlanned = buildCopy?.findIndex((player) => player?.charName === charName && player?.godName === godName);
    if (alreadyPlanned !== -1) {
      // Tapping a god that is already planned takes it back off the list.
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
    dispatch({ type: 'godPlanner', data: buildCopy });
  };

  const handleDelete = (index) => {
    dispatch({ type: 'godPlanner', data: build.filter((_, ind) => ind !== index) });
    // The card goes with its button: the focus moves on to the next card's, or to the list when it was the last
    requestAnimationFrame(() => {
      const buttons = plannedRef.current?.querySelectorAll('[data-plan-remove]');
      (buttons?.[Math.min(index, (buttons?.length ?? 1) - 1)] ?? plannedRef.current)?.focus();
    });
  };

  const bubbleBonus = getBubbleBonus(account, 'BIG_P', false);
  const coralKidUpgBonus = getCoralKidUpgBonus(account, 3);
  const getInputs = (character, godSlot) => ({
    divinityLevel: character?.skillsInfo?.divinity?.level ?? 0,
    bigPBubble: settings.countBigP ? bubbleBonus : 1,
    multiplier: getGodMinorBonusMultiplier(godSlot),
    coralKidUpgBonus
  });
  const planDetails = getPlanDetails(build, characters, account, getInputs);
  const swaps = planDetails?.filter(({ isLinked }) => !isLinked)?.length;
  const deities = account?.divinity?.deities;

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
    <MissingSections account={account} names={SECTION_NAMES}/>
    {characters?.length ? <PageSettings state={settings} defaults={PLANNER_SETTINGS} onChange={setSettings} onReset={resetSettings}>
      <PageSettings.Toggle name={'countBigP'} label={'Count the BIG P bubble'}
                           help={'Multiplies every minor link bonus here by your BIG P bubble.'}/>
    </PageSettings> : null}
    <Stack gap={3}>
      <Typography variant={'body2'} color={'text.secondary'}>Compare every god on every character before spending an unlink.</Typography>
      <MinorBonusCalculator characters={characters} account={account}/>
      <Panel title={'Planned links'} meta={swaps > 0 ? `${formatNum(swaps, 'whole')} of ${formatNum(planDetails?.length, 'whole')} not linked yet` : undefined}>
        <Stack ref={plannedRef} tabIndex={-1} gap={2} sx={{ p: 2, outline: 'none' }}>
          <Typography variant={'body2'} color={'text.secondary'}>
            {planDetails?.length ? '' : 'Tap a god in a character\'s row to plan it. '}
            An Elemental Sorcerer holds two. Saved on this device, changes nothing in game.
          </Typography>
          {planDetails?.length ? <CardGrid size={'s'}>
            {planDetails.map(({ charName, godName, godLabel, bonusLabel, sentence, cap, nextTalent, isLinked, status }, index) => <ItemCard
              key={charName + godName + index}
              icon={`data/${godName}.png`} title={godLabel} meta={charName}
              status={isLinked ? 'active' : undefined} statusLabel={'Linked'}
              aside={isLinked ? null : <StatusText status={'info'} wrap>{status}</StatusText>}
              footer={<Box><Button size={'small'} data-plan-remove aria-label={`Remove ${godLabel} from ${charName}`}
                                   onClick={() => handleDelete(index)}>Remove</Button></Box>}>
              <ItemCard.Desc>{sentence}</ItemCard.Desc>
              <ItemCard.Facts rows={[
                ['Bonus', bonusLabel],
                ['Divinity levels alone top out at', formatNum(cap, 'amount', { precise: true })],
                nextTalent ? ['Next talent LV', nextTalent] : null
              ]}/>
            </ItemCard>)}
          </CardGrid> : null}
        </Stack>
      </Panel>
      {characters?.length && deities?.length ? <Stack gap={2}>
        <Stack gap={0.5}>
          <Typography variant={'sectionTitle'} component={'h2'}>Minor link bonus per character</Typography>
          <Typography variant={'body2'} color={'text.secondary'}>
            A tile's line: linked in game. Selected: planned. Tap a god to plan it or drop it.
          </Typography>
        </Stack>
        <Stack direction={'row'} flexWrap={'wrap'} columnGap={2} rowGap={0.5}>
          {deities.map(({ name, rawName }) => <Stack key={rawName} direction={'row'} alignItems={'center'} gap={0.5}>
            <GameIcon src={`data/${rawName}.png`} size={24} alt={''}/>
            <Typography variant={'body2'}>{name}</Typography>
          </Stack>)}
        </Stack>
        {characters.map(({ classIndex, name: charName, secondLinkedDeityIndex, playerId, class: charClass, skillsInfo }, charIndex) => {
          // Polytheism lets an Elemental Sorcerer hold a second link, so its plan holds two gods.
          const maxGods = checkCharClass(charClass, CLASSES.Elemental_Sorcerer) ? 2 : 1;
          const classIcon = classIndex !== undefined ? `data/ClassIcons${classIndex}.png` : 'afk_targets/Nothing.png';
          return <Panel key={charName} icon={<GameIcon src={classIcon} size={32} alt={''}/>} title={charName}
                        meta={`Divinity ${formatNum(skillsInfo?.divinity?.level ?? 0, 'level')}`}>
            <Box sx={{ p: 2 }}>
              <CardGrid size={'icon'} fill>
                {deities.map(({ name, rawName }, godIndex) => {
                  const linked = account?.divinity?.linkedDeities?.[charIndex] === godIndex || secondLinkedDeityIndex === godIndex;
                  const planned = build?.some((player) => player?.charName === charName && player?.godName === rawName);
                  const bonus = getMinorDivinityBonusValue(getInputs(characters[charIndex], godIndex));
                  return <IconTile key={rawName} icon={`data/${rawName}.png`} alt={`${name}${linked ? ', linked' : ''}`}
                                   value={minorBonusText(bonus, godIndex === GOD_SLOT.Arctis)}
                                   status={linked ? 'active' : undefined} selected={planned}
                                   onSelect={() => handleClick({ charName, playerId, godName: rawName, maxGods })}/>;
                })}
              </CardGrid>
            </Box>
          </Panel>;
        })}
      </Stack> : null}
    </Stack>
  </>;
};

export default GodPlanner;
