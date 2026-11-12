import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatDuration, formatNum, gameLines, getCoinsArray, getTabs } from '@utility/helpers';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import {
  getDivinityPointsPerHour,
  getMinorDivinityBonus,
  getTotalBlessingLevels,
  getTotalDivinityLevel,
  GOD_SLOT,
  isKingDootActive
} from '@parsers/world-5/divinity';
import { bitsIcon, formatBits, formatGame, formatSystem, minorBonusText } from '@utility/gameNotation';
import { getBestActiveCharacter } from '@parsers/talents';
import { getNobisectBonus, NOBISECT_SCALING } from '@parsers/efficiency';
import { getMaxDamage } from '@parsers/damage';
import CoinDisplay from '../../../components/common/CoinDisplay';
import { getKrukBubbles, getKrukBubblesDaily } from '@parsers/world-2/alchemy';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import CoralKidUpgrades, { CORAL_KID_SETTINGS, CoralKidSettings } from '@components/account/Worlds/World7/CoralReef/CoralKidUpgrades';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import DivinityStyles from '@components/account/Worlds/World5/DivinityStyles';
import PageSummary, { SummaryFailed } from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { createBreakdown } from '@parsers/breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import GameIcon from '@components/common/GameIcon';

// The game's markup: '@' breaks a line, '#' draws the Kattlekruk bubble icons, '$' is the daily bubble levels
const majorBonus = (text, account) => gameLines(String(text ?? '').replace('$', getKrukBubblesDaily(account)?.value ?? 0))
  .map((line, index) => line === '#'
    ? <CardGrid key={index} size={'icon'}>
      {getKrukBubbles(account).map(({ rawName, bubbleName }) => <IconTile key={rawName} icon={`data/${rawName}.png`}
                                                                          alt={cleanUnderscore(bubbleName)}
                                                                          details={cleanUnderscore(bubbleName)}/>)}
    </CardGrid>
    : <ItemCard.Desc key={index} text={[line]}/>);

// A god's minor bonus sentence split at its fills (the game's "{", with the sign before it and the unit after): the words
// once, for the Linked section's label ("+{%_accuracy_and_+{%_defence": "accuracy and defence"), and each character's
// number in the fill's own sign and unit ("+12%"). A sentence with no fill (Bagur's) is all words.
const FILL = /([+-]?)\{(%?)/;
const linkedWording = (sentence) => cleanUnderscore(String(sentence ?? '').replace(new RegExp(FILL.source, 'g'), ''))
  .replace(/\s+/g, ' ').trim();
const fillText = (sentence, value) => {
  const [, sign = '', unit = ''] = String(sentence ?? '').match(FILL) ?? [];
  return `${sign}${value}${unit}`;
};

// The linked characters: the wording in the label and a name and a number a row, or one line when every character
// gets the same bonus ("All 11 linked characters: +68 Talent LV for all talents above Lv 1")
const linkedSection = (sentence, linked) => {
  const wording = linkedWording(sentence);
  const hasFill = FILL.test(String(sentence ?? ''));
  if (linked.length > 1 && linked.every(({ bonus }) => bonus === linked[0].bonus)) {
    return <ItemCard.Section label={'Linked'}>
      <ItemCard.Desc text={[`All ${formatNum(linked.length)} linked characters: ${cleanUnderscore(linked[0].bonus)}`]}/>
    </ItemCard.Section>;
  }
  return <ItemCard.Section label={hasFill && wording ? `Linked: ${wording}` : 'Linked'}>
    <ItemCard.Facts rows={linked.map(({ name, classIndex, value, bonus }) => [
      <Stack key={name} component={'span'} direction={'row'} gap={1} alignItems={'center'}>
        <GameIcon src={`data/ClassIcons${classIndex}.png`} size={24} alt={''}/>{name}
      </Stack>,
      hasFill ? fillText(sentence, value) : cleanUnderscore(bonus)
    ])}/>
  </ItemCard.Section>;
};

// What a god's next level costs against what the account owns, in the currency's own rule
const CURRENCIES = {
  bits: { icon: bitsIcon, alt: 'Bits', format: formatBits, perAmount: true },
  sailingGold: { icon: () => 'data/SailT0.png', alt: 'Gold bars', format: (value) => formatSystem(value, 'amount', 'Sailing') },
  particles: { icon: () => 'etc/Particle.png', alt: 'Particles', format: (value) => formatGame(value, 'Big', { whole: true }) }
};
const godCost = ({ type, cost, costToMax, currency } = {}) => {
  if (type === 'coins') {
    return <ItemCard.Facts rows={[['Next cost', <CoinDisplay key={'next'} dense money={getCoinsArray(cost)}/>],
      ['Cost to max', <CoinDisplay key={'max'} dense money={getCoinsArray(costToMax)}/>]]}/>;
  }
  const { icon, alt, format, perAmount } = CURRENCIES[type] ?? CURRENCIES.particles;
  // Gold bars arrive as the loot pile's entry, the others as a number
  const owned = typeof currency === 'object' ? currency?.amount : currency;
  // The cost to max beside its own sprite: a bits amount reads only with its tier's sprite (the notation divides by
  // 1e18 per tier)
  return <>
    <ItemCard.Cost icon={perAmount ? icon : icon(cost)} iconAlt={alt} need={cost ?? 0} have={owned ?? 0} format={format}/>
    <ItemCard.Facts rows={[['Cost to max', <Stack key={'max'} component={'span'} direction={'row'} gap={0.5}
                                                  alignItems={'center'} justifyContent={'flex-end'}>
      {format(costToMax ?? 0)}<GameIcon src={icon(costToMax)} size={16} alt={alt}/>
    </Stack>]]}/>
  </>;
};

const Divinity = () => {
  const { state } = useContext(AppContext);
  const divinity = state?.account?.divinity ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'divinity');
  const { deities, linkedDeities, godRank } = divinity;
  const { coralKidUpgrades } = state?.account?.coralReef || {};
  const [settings, setSettings, resetSettings] = usePageSettings('divinity', CORAL_KID_SETTINGS);
  // Companions(0) checks the logged-in character's divinity level
  const activeCharacter = getBestActiveCharacter(state?.characters);
  const hasKingDoot = sectionFailed ? false : isKingDootActive(activeCharacter, state?.account);
  // Nobisect's blessing scales with a character's skill efficiency, so it reads for the active character; the
  // divinity section a failed parse leaves empty is not re-read
  const nobisectBlessing = activeCharacter && !sectionFailed
    ? getNobisectBonus(activeCharacter, state?.account, state?.characters, getMaxDamage(activeCharacter, state?.characters, state?.account))
    : null;
  const pointsPerHour = sectionFailed ? null : getDivinityPointsPerHour(state?.account, state?.characters);
  const highestDivinityCharacter = state?.characters?.reduce((prev, curr) => {
    const prevBonus = prev?.skillsInfo?.divinity?.level;
    const currBonus = curr?.skillsInfo?.divinity?.level;
    return prevBonus > currBonus ? prev : curr;
  }, state?.characters?.[0]);

  // The characters linked to a god (King Doot links everyone; Purrmep takes one player), each with the minor bonus
  // filled as the game fills it
  const linkedTo = (godIndex, minorBonus, blessingBonus) => (state?.characters ?? []).flatMap((character, index) => {
    const { classIndex, name, secondLinkedDeityIndex, secondDeityMinorBonus = 0, playerId } = character;
    const compBonus = hasKingDoot && blessingBonus > 0;
    const isLinked = compBonus || linkedDeities?.[index] === godIndex;
    const isSecondLinked = compBonus || secondLinkedDeityIndex === godIndex;
    if (godIndex === GOD_SLOT.Purrmep && compBonus && highestDivinityCharacter?.playerId !== playerId) return [];
    if (!isLinked && !isSecondLinked) return [];
    const bonus = isLinked
      ? minorBonusText(getMinorDivinityBonus(character, state?.account, godIndex), godIndex === GOD_SLOT.Arctis)
      : minorBonusText(secondDeityMinorBonus, godIndex === GOD_SLOT.Arctis);
    return [{ name, classIndex, value: bonus, bonus: String(minorBonus ?? '').replace(/{/g, bonus) }];
  });

  return <SummaryFailed value={sectionFailed}>
    {coralKidUpgrades?.length ? <PageSettings state={settings} defaults={CORAL_KID_SETTINGS} onChange={setSettings}
                                              onReset={resetSettings}>
      <CoralKidSettings/>
    </PageSettings> : null}
    <NextSeo
      title="Divinity | Idleon Toolbox"
      description="Keep track of your characters' gods connections and upgrades"
    />
    {sectionFailed ? <MissingData name={'Divinity'} failed atZero={!isParseFailed(state?.account)}/>
      : <NotReached name={'Divinity'} reached={divinity?.unlocked !== false}/>}
    <PageSummary failed={sectionFailed}>
      {/* The game's rank is max(0, unlocked gods - 10), so a guest reads 0 */}
      <StatTile label={'God rank'} value={godRank ?? 0} kind={'amount'}/>
      <StatTile label={'Total Divinity LV'} value={getTotalDivinityLevel(state?.characters)} kind={'amount'} failed={isParseFailed(state?.account)}/>
      <StatTile label={'Divinity points'} value={sectionFailed ? '-' : formatGame(divinity?.divinityPoints ?? 0, 'Big', { whole: true })}/>
      <StatTile label={'Divinity PTS/hr'} value={pointsPerHour?.total ?? 0} kind={'rate'}
                breakdown={pointsPerHour ? createBreakdown('Divinity PTS/hr', pointsPerHour.total, pointsPerHour.tree) : undefined}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 5'].categories, 'divinity')}>
      <div>
        <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
          <StatTile label={'Total blessing levels'} value={getTotalBlessingLevels(deities)} kind={'amount'} failed={sectionFailed}/>
          {/* The game's two offerings for the next god: a likelier one costs more */}
          {sectionFailed ? null : (divinity?.offerings ?? []).map(({ chance, cost }, index) => {
            const left = cost - (divinity?.divinityPoints ?? 0);
            const perHour = pointsPerHour?.total ?? 0;
            const wait = left <= 0 ? 'Can afford now' : perHour > 0 ? `${formatDuration(left / perHour * 3600)} to afford` : null;
            return <StatTile key={index} label={`Offering ${index + 1}: ${formatNum(chance * 100, 'pct')} chance`}
                             value={`${formatGame(cost, 'Big', { whole: true })} pts`} sub={wait}/>;
          })}
        </Stack>
        <CardGrid size={'m'}>
          {deities?.map(({
                           name,
                           rawName,
                           majorBonus: major,
                           minorBonus,
                           blessing,
                           blessingBonus,
                           cost,
                           level,
                           unlocked,
                           maxLevel
                         }, godIndex) => {
            const linked = linkedTo(godIndex, minorBonus, blessingBonus);
            const blessingValue = godIndex === GOD_SLOT.Nobisect && nobisectBlessing !== null ? nobisectBlessing : blessingBonus;
            return <ItemCard key={rawName} icon={`data/${rawName}.png`} title={name} level={{ value: level ?? 0, max: maxLevel }}
                             status={!unlocked ? 'locked' : cost?.cost === 'MAX' ? 'maxed' : undefined}
                             footer={cost && cost?.cost !== 'MAX' ? godCost(cost) : null}>
              <ItemCard.Facts rows={[['Blessing', cleanUnderscore(String(blessing ?? '').replace(/{/g, formatGame(blessingValue ?? 0, 'Divinity.BlesssBonus')))]]}/>
              {godIndex === GOD_SLOT.Nobisect ? <ItemCard.Desc>
                {nobisectBlessing !== null ? `For ${cleanUnderscore(activeCharacter?.name)}. ` : 'Before skill efficiency scaling. '}
                Scales x{NOBISECT_SCALING.min} to x{NOBISECT_SCALING.max} with skill efficiency, higher for less efficient characters
              </ItemCard.Desc> : null}
              <ItemCard.Section label={'Major bonus'}>{majorBonus(major, state?.account)}</ItemCard.Section>
              {linked.length ? linkedSection(minorBonus, linked) : null}
            </ItemCard>;
          })}
        </CardGrid>
      </div>
      <CoralKidUpgrades coralKidUpgrades={coralKidUpgrades} levelsAhead={settings?.levelsAhead ?? 1}/>
      <DivinityStyles characters={state?.characters} pointsPerHour={pointsPerHour?.perCharacter}/>
    </Tabber>
  </SummaryFailed>;
};

export default Divinity;
