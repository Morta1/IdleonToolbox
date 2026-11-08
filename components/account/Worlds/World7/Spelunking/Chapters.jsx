import React from 'react';
import { Box, LinearProgress, Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getSpelunkingChapterName } from '@parsers/world-7/spelunking';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import { DIM } from '@components/common/cards/tokens';

// The game fills a chapter's { with its bonus in Small (Spelunk.ChapterBonus) and } with the same bonus in MultiplierInfo
const bonusText = (value, isMulti) => (isMulti ? formatNum(value, 'mult', { bare: true }) : formatGame(value, 'Spelunk.ChapterBonus'));

const LINE_SX = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 };
// On a phone the pages and the milestone take a line each, never a word apart
const META_SX = { ...LINE_SX, flexWrap: 'wrap', rowGap: 0.5, '& > *': { whiteSpace: 'nowrap' } };
const BAR_SX = { flex: 1, height: 6, borderRadius: 3, bgcolor: 'divider' };
// The level sits level with the chapter's name, not in the middle of its three lines
const ROW_SX = { alignItems: 'flex-start' };
const UNREAD_SX = { alignItems: 'flex-start', opacity: DIM };

// A chapter in three lines, as the old page had it: its bonus and level; the bar toward the cap (the name holds the
// bonus, so the bar names only the cap) or the bonus a level gives; the pages it needs and its next milestone
const chapterRow = (chapter, index) => {
  const isMulti = Boolean(chapter?.name?.includes('}'));
  const unit = chapter?.name?.match(/[{}](x|%)/)?.[1] ?? '';
  const title = cleanUnderscore(chapter?.name).replace('|', ' ')
    .replace(/{/g, bonusText(chapter?.bonus, false)).replace(/}/g, bonusText(chapter?.bonus, true));
  const next = chapter?.milestones?.find(({ reached }) => !reached);
  const nextText = next ? `${next.percent}% at Lv ${formatNum(next.level)}` : 'All reached';
  // Info 5: the levels to each share of the cap, a table inside a hover note before, open as a list from the next one.
  // The drawer is named after the chapter and totals the trigger's text.
  const milestones = chapter?.milestones ? createBreakdown('Levels to reach % of cap', nextText,
    flatLines(chapter.milestones.map(({ percent, level, bonus, reached }) => ({
      name: `${percent}% of cap`,
      value: level,
      formatted: `Lv ${formatNum(level)} · ${bonusText(bonus, isMulti)}${unit}${reached ? ' · reached' : ''}`
    }))), { combine: 'list' }) : null;
  const percent = chapter?.progression ?? 0;
  return <Panel.Row key={chapter?.name || index} name={title} value={formatNum(chapter?.level ?? 0, 'level')}
                    sx={chapter?.level === 0 ? UNREAD_SX : ROW_SX}
                    sub={<Stack component={'span'} gap={0.5} sx={{ mt: 0.5 }}>
                      {chapter?.maxBonus != null
                        ? <Box component={'span'} sx={LINE_SX}>
                          <LinearProgress variant={'determinate'} value={Math.min(100, Math.max(0, percent))}
                                          color={percent >= 100 ? 'success' : 'primary'} aria-label={`${title}: share of the cap`}
                                          sx={BAR_SX}/>
                          <Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>
                            {`${bonusText(chapter.maxBonus, isMulti)}${unit} cap`}
                          </Box>
                        </Box>
                        : <span>{`+${formatGame(chapter?.scalingValue ?? 0, 'Spelunk.ChapterBonus')}${unit} per level`}</span>}
                      <Box component={'span'} sx={META_SX}>
                        <span>{`${formatNum(chapter?.requiredPages ?? 0)} pages required`}</span>
                        {milestones ? <span><Breakdown asValue data={milestones} title={`${title}: milestones`}>
                          {next ? `Next: ${nextText}` : nextText}</Breakdown></span> : null}
                      </Box>
                    </Stack>}/>;
};

// Each chapter group is a Panel of its chapters, the groups side by side (3 across at 1920, 2 at 1366), as the old page
// laid them out: one group a row, each chapter a card, took a full screen more to scroll
const Chapters = ({ chapters }) => <CardGrid size={'l'}>
  {chapters?.map((chapterGroup, groupIndex) => (chapterGroup?.length
    ? <Panel key={groupIndex} icon={`data/Spelunking${groupIndex}.png`} title={getSpelunkingChapterName(groupIndex)}>
      {chapterGroup.map(chapterRow)}
    </Panel> : null))}
</CardGrid>;

export default Chapters;
