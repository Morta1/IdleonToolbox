import React, { useState } from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import InfoBox from './InfoBox';
import { cleanUnderscore, growth } from '@utility/helpers';

// A talent's description carries `{` and `}` where its two values go, and both depend on the
// talent's level. A page with no save has no level to read, so the page asks for one.
//
// This was a fixed ladder of Lv 1/25/50/100 first. Four rows of right-aligned prose is a bad read -
// "10% chance to wake the sleeper agent worm within the fish" wraps three lines in a value column -
// and it still answered only the four levels somebody happened to pick. One field answers any.
const DEFAULT_LEVEL = 1;
// Talents cap around 100 by themselves and go far past it with books and bonuses, so the ceiling
// here is only a guard against a number that would render as gibberish, not a game rule.
const MAX_LEVEL = 10000;

// "txt" and "_" are the game's way of saying this half of the talent has no number: growth still
// answers 0 for them, which would print a zero in the middle of a sentence. No shipped talent has
// a `}` without a real funcY, so this only guards the shape rather than a live case.
const NO_VALUE = new Set(['txt', '_', undefined, null]);

const at = (func, level, a, b) => {
  if (NO_VALUE.has(func)) return null;
  const value = growth(func, level, a, b, false);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
};

// `{` takes the x value and `}` the y value.
export const talentEffect = (node, level) => {
  if (!node?.description) return null;
  const x = at(node.funcX, level, node.x1, node.x2);
  const y = at(node.funcY, level, node.y1, node.y2);
  let text = String(node.description);
  if (x !== null) text = text.replace(/{/g, String(x));
  if (y !== null) text = text.replace(/}/g, String(y));
  return cleanUnderscore(text);
};

// Anything that is not a whole number in range reads as level 1 rather than as NaN, so clearing the
// field to type a new number leaves the sentence intact instead of blanking it.
export const readLevel = (value) => {
  const level = Math.floor(Number(value));
  if (!Number.isFinite(level) || level < 1) return DEFAULT_LEVEL;
  return Math.min(level, MAX_LEVEL);
};

const LevelledEffect = ({ node }) => {
  const [input, setInput] = useState(String(DEFAULT_LEVEL));

  return <Stack gap={1}>
    <TextField
      size={'small'}
      type={'number'}
      value={input}
      onChange={(event) => setInput(event.target.value)}
      label={'Talent level'}
      inputProps={{ min: 1, max: MAX_LEVEL }}
      sx={{ width: 140 }}
    />
    <Typography variant={'body2'}>{talentEffect(node, readLevel(input))}</Typography>
  </Stack>;
};

const TalentInfo = ({ node }) => {
  if (node?.kind !== 'talent') return null;

  const groups = [];
  // Full-width content rather than a label/value row: the effect is a sentence, and the row layout
  // right-aligns it into a ragged column three lines deep.
  if (node.funcX) groups.push({ title: 'Effect', content: <LevelledEffect node={node}/> });

  // 91 of the 376 talents are attacks; the rest are passives and have none of this.
  const cost = [];
  if (node.manaCost > 0) cost.push({ label: 'Mana', value: node.manaCost.toLocaleString('en-US') });
  if (node.cooldown > 0) cost.push({ label: 'Cooldown', value: `${node.cooldown}s` });
  if (node.castTime > 0) cost.push({ label: 'Cast time', value: `${node.castTime}s` });
  if (cost.length) groups.push({ title: 'Attack', rows: cost });

  // No Classes box: the class pages link here through `teaches`, so the panel renders that as a
  // section of real links rather than a list of tab names that go nowhere.

  return <InfoBox groups={groups}/>;
};

export default TalentInfo;
