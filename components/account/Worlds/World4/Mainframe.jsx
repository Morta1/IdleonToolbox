import React from 'react'
import { Typography } from '@mui/material';
import { cleanUnderscore, formatNum, gameLines } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { GOD_INDEX, isMajorDivinityActive } from '@parsers/world-5/divinity';
import { getBestActiveCharacter } from '@parsers/talents';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import Notice from '@components/common/Notice';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { titleCase } from './Chips';

// A jewel's effect filled the game's way, each "@" a line. Some effects hardcode the "1." of a multiplier ("1.}x more
// damage"), which breaks once the multiplied bonus isn't whole (16 * 1.6 = 25.6 read "1.25.6x"). A line with a { the
// page has no number for ("Total Bonus: {% speed") is left out.
export const jewelText = ({ effect, bonus, multiplier = 1 } = {}) => {
  const value = (bonus ?? 0) * multiplier;
  const filled = effect?.includes('1.}')
    ? effect.replace(/1\.}/g, formatNum(1 + value / 100, 'amount', { precise: true }))
    : effect?.replace(/}/g, formatNum(value, 'amount', { precise: true }));
  return gameLines(filled, { sentences: true }).filter((line) => !line.includes('{'));
};

// A lab bonus's description, each "@" a line; its "@_-_@" total line only when the page knows the total
export const labBonusText = ({ description, bonusDesc, extraData } = {}) => {
  const text = extraData ? description?.replace(/\+[0-9]+%/, `+${extraData}%`) : description;
  const [main, total] = String(text ?? '').split('@_-_@');
  const lines = gameLines(main, { sentences: true });
  return total !== undefined && typeof bonusDesc === 'number'
    ? [...lines, cleanUnderscore(total.replace('{', formatNum(bonusDesc, 'amount', { precise: true }))).trim()]
    : lines;
};

const Mainframe = ({ characters, jewels, labBonuses, playersCords, account, sectionFailed }) => {
  const loggedInCharacter = getBestActiveCharacter(characters);
  const players = (playersCords ?? []).flatMap((playerCord, index) => {
    const character = characters?.[index];
    const connectedByGod = isMajorDivinityActive(character, account, GOD_INDEX.Arctis, loggedInCharacter);
    const isUploaded = character?.afkTarget === 'Laboratory' || connectedByGod;
    return isUploaded ? [{ playerCord, index, character, connectedByGod }] : [];
  });
  const bonusesOn = (labBonuses ?? []).filter(({ active }) => active).length;
  const jewelsFound = (jewels ?? []).filter(({ acquired }) => acquired).length;
  const jewelsOn = (jewels ?? []).filter(({ acquired, active }) => acquired && active).length;
  const range = (playerCord, name) => {
    const text = `${formatGame(playerCord?.lineWidth ?? 0, 'Labb.Dist')}px`;
    return playerCord?.lineWidthBreakdown
      ? <Breakdown asValue title={`${name} range`} data={{ ...playerCord.lineWidthBreakdown, totalValue: text }}>{text}</Breakdown>
      : text;
  };
  return (
    <>
      {sectionFailed ? null : <PageSummary>
        <StatTile label={'Lab bonuses on'} value={`${formatNum(bonusesOn)} / ${formatNum(labBonuses?.length ?? 0)}`}/>
        <StatTile label={'Jewels on'} value={`${formatNum(jewelsOn)} / ${formatNum(jewelsFound)}`}
                  sub={`${formatNum(jewelsFound)} of ${formatNum(jewels?.length ?? 0)} found`}/>
      </PageSummary>}
      {players.length ? <>
        <Typography variant={'sectionTitle'} component={'h2'} sx={{ mb: 1 }}>Players in the lab</Typography>
        <CardGrid size={'s'}>
          {players.map(({ playerCord, index, character, connectedByGod }) => <ItemCard
            key={`${playerCord?.x}${playerCord?.y}-${index}`} icon={`data/ClassIcons${character?.classIndex}.png`}
            iconAlt={''} title={cleanUnderscore(character?.name)}
            meta={[connectedByGod ? 'Linked by Arctis' : null, playerCord?.soupedUp ? 'Souped up' : null].filter(Boolean).join(' · ') || undefined}>
            <ItemCard.Facts rows={[
              ['Range', range(playerCord, cleanUnderscore(character?.name))],
              ['Position', `${formatNum(playerCord?.x ?? 0)}, ${formatNum(playerCord?.y ?? 0)}`]
            ]}/>
          </ItemCard>)}
        </CardGrid>
      </> : sectionFailed ? null : <Notice tone={'info'}>Characters show here once one is in the lab.</Notice>}
      {labBonuses?.length ? <Typography variant={'sectionTitle'} component={'h2'} sx={{ mt: 4, mb: 1 }}>Lab bonuses</Typography> : null}
      <CardGrid size={'icon'}>
        {labBonuses?.map((labBonus, index) => <IconTile key={`bonus-${labBonus?.name}-${index}`}
                                                        icon={`data/LabBonus${labBonus?.index}.png`}
                                                        alt={titleCase(labBonus?.name)}
                                                        status={labBonus?.active ? 'active' : undefined}
                                                        details={<ItemCard.Desc text={[`${titleCase(labBonus?.name)}${labBonus?.active ? ': Active' : ''}`,
                                                          ...labBonusText(labBonus)]}/>}/>)}
      </CardGrid>
      {jewels?.length ? <Typography variant={'sectionTitle'} component={'h2'} sx={{ mt: 4, mb: 1 }}>Jewels</Typography> : null}
      <CardGrid size={'icon'}>
        {jewels?.map((jewel, index) => <IconTile key={`${jewel?.name}-${index}`}
                                                 icon={`data/${jewel?.rawName}.png`}
                                                 alt={titleCase(jewel?.name)}
                                                 status={!jewel?.acquired ? 'missing' : jewel?.active ? 'active' : undefined}
                                                 details={<ItemCard.Desc text={[`${titleCase(jewel?.name)}: ${!jewel?.acquired ? 'Not found' : jewel?.active ? 'Active' : 'Found'}`,
                                                   ...jewelText(jewel)]}/>}/>)}
      </CardGrid>
    </>
  );
};

export default Mainframe;
