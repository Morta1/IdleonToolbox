import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getSpelunkingChapterName } from '@parsers/world-7/spelunking';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

// The game fills a chapter's { with its bonus in Small (Spelunk.ChapterBonus) and } with the same bonus in MultiplierInfo
const bonusText = (value, isMulti) => (isMulti ? formatNum(value, 'mult', { bare: true }) : formatGame(value, 'Spelunk.ChapterBonus'));

const chapterCard = (chapter, index) => {
  const isMulti = Boolean(chapter?.name?.includes('}'));
  const unit = chapter?.name?.match(/[{}](x|%)/)?.[1] ?? '';
  const title = cleanUnderscore(chapter?.name).replace('|', ' ')
    .replace(/{/g, bonusText(chapter?.bonus, false)).replace(/}/g, bonusText(chapter?.bonus, true));
  const next = chapter?.milestones?.find(({ reached }) => !reached);
  // Info 5: the levels to each share of the cap, a table inside a hover note before, open as a list from the next one
  const milestones = chapter?.milestones ? createBreakdown('Levels to reach % of cap', `Lv ${formatNum(chapter?.level ?? 0)}`,
    flatLines(chapter.milestones.map(({ percent, level, bonus, reached }) => ({
      name: `${percent}% of cap`,
      value: level,
      formatted: `Lv ${formatNum(level)} · ${bonusText(bonus, isMulti)}${unit}${reached ? ' · reached' : ''}`
    }))), { combine: 'list' }) : null;
  return <ItemCard key={chapter?.name || index} title={title} level={{ value: chapter?.level ?? 0 }} dimmed={chapter?.level === 0}>
    {chapter?.maxBonus != null
      ? <ItemCard.Progress label={'Bonus'} value={`${bonusText(chapter.bonus, isMulti)}${unit}`}
                           max={`${bonusText(chapter.maxBonus, isMulti)}${unit} cap`} percent={chapter?.progression ?? 0}/>
      : <ItemCard.Desc>{`+${formatGame(chapter?.scalingValue ?? 0, 'Spelunk.ChapterBonus')}${unit} per level`}</ItemCard.Desc>}
    <ItemCard.Facts rows={[
      milestones ? ['Next milestone', <Breakdown key={'milestones'} asValue data={milestones}>
        {next ? `${next.percent}% at Lv ${formatNum(next.level)}` : 'All reached'}</Breakdown>] : null,
      ['Required pages', chapter?.requiredPages ?? 0, 'amount']
    ]}/>
  </ItemCard>;
};

// Decision 4: each chapter group is its heading (the group's sprite and name) over one card per chapter
const Chapters = ({ chapters }) => <Stack gap={3}>
  {chapters?.map((chapterGroup, groupIndex) => (chapterGroup?.length ? <Stack key={groupIndex} gap={1}>
    <Stack direction={'row'} gap={1} alignItems={'center'}>
      <GameIcon src={`data/Spelunking${groupIndex}.png`} size={32} alt={''}/>
      <Typography variant={'sectionTitle'} component={'h2'}>{getSpelunkingChapterName(groupIndex)}</Typography>
    </Stack>
    <CardGrid size={'m'}>{chapterGroup.map(chapterCard)}</CardGrid>
  </Stack> : null))}
</Stack>;

export default Chapters;
