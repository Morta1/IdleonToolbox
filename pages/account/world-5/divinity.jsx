import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack } from '@mui/material';
import { cleanUnderscore, gameLines, getCoinsArray, getTabs } from '@utility/helpers';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import {
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
import CoralKidUpgrades from '@components/account/Worlds/World7/CoralReef/CoralKidUpgrades';
import DivinityStyles from '@components/account/Worlds/World5/DivinityStyles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import GameIcon from '@components/common/GameIcon';
import Notice from '@components/common/Notice';

// The game's markup: '@' breaks a line, '#' draws the Kattlekruk bubble icons, '$' is the daily bubble levels
const majorBonus = (text, account) => gameLines(String(text ?? '').replace('$', getKrukBubblesDaily(account)?.value ?? 0))
  .map((line, index) => line === '#'
    ? <CardGrid key={index} size={'icon'}>
      {getKrukBubbles(account).map(({ rawName, bubbleName }) => <IconTile key={rawName} icon={`data/${rawName}.png`}
                                                                          alt={cleanUnderscore(bubbleName)}
                                                                          details={cleanUnderscore(bubbleName)}/>)}
    </CardGrid>
    : <ItemCard.Desc key={index} text={[line]}/>);

// What a god's next level costs against what the account owns, in the currency's own rule
const CURRENCIES = {
  bits: { icon: bitsIcon, alt: 'Bits', format: formatBits, perAmount: true },
  sailingGold: { icon: () => 'data/SailT0.png', alt: 'Gold bars', format: (value) => formatSystem(value, 'amount', 'Sailing') },
  particles: { icon: () => 'etc/Particle.png', alt: 'Particles', format: (value) => formatGame(value, 'Big') }
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
  // Companions(0) checks the logged-in character's divinity level
  const activeCharacter = getBestActiveCharacter(state?.characters);
  const hasKingDoot = sectionFailed ? false : isKingDootActive(activeCharacter, state?.account);
  // Nobisect's blessing scales with a character's skill efficiency, so it reads for the active character; the
  // divinity section a failed parse leaves empty is not re-read
  const nobisectBlessing = activeCharacter && !sectionFailed
    ? getNobisectBonus(activeCharacter, state?.account, state?.characters, getMaxDamage(activeCharacter, state?.characters, state?.account))
    : null;
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
    return [{ name, classIndex, bonus: String(minorBonus ?? '').replace(/{/g, bonus) }];
  });

  return <>
    <NextSeo
      title="Divinity | Idleon Toolbox"
      description="Keep track of your characters' gods connections and upgrades"
    />
    {sectionFailed ? <MissingData name={'Divinity'} failed/>
      : divinity?.unlocked === false ? <Notice tone={'locked'} sx={{ mb: 2 }}>Your account hasn&apos;t reached Divinity yet.</Notice> : null}
    <PageSummary>
      <StatTile label={'God rank'} value={godRank || 1} kind={'amount'}/>
      <StatTile label={'Total Divinity LV'} value={getTotalDivinityLevel(state?.characters)} kind={'amount'}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 5'].categories, 'divinity')}>
      <div>
        <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
          <StatTile label={'Total blessing levels'} value={getTotalBlessingLevels(deities)} kind={'amount'}/>
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
              {linked.length ? <ItemCard.Section label={'Linked'}>
                <ItemCard.Facts rows={linked.map(({ name: charName, classIndex, bonus }) => [
                  <Stack key={charName} component={'span'} direction={'row'} gap={1} alignItems={'center'}>
                    <GameIcon src={`data/ClassIcons${classIndex}.png`} size={24} alt={''}/>{charName}
                  </Stack>,
                  cleanUnderscore(bonus)
                ])}/>
              </ItemCard.Section> : null}
            </ItemCard>;
          })}
        </CardGrid>
      </div>
      <CoralKidUpgrades coralKidUpgrades={coralKidUpgrades}/>
      <DivinityStyles characters={state?.characters}/>
    </Tabber>
  </>;
};

export default Divinity;
