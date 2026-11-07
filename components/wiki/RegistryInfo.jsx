import React from 'react';
import { Box, Divider, Link, Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import { cleanUnderscore } from '@utility/helpers';
import { notateAmount } from '@utility/wiki/notate';
import InfoBox from './InfoBox';
import LevelledEffect, { CostAmount } from './LevelledEffect';
import CoinAmount from './CoinAmount';
import { fieldLinkTargets, linkSegments } from '@utility/wiki/field-links.mjs';
import { formatAmount } from '@utility/wiki/effects.mjs';
import { linkProps, navigateOnPlainClick } from './links';
import { sneakFloorShows } from './SneakFloorInfo';

// A line naming a linked page: the page's name becomes the same anchor a relation row draws.
const linkedLine = (line, targets, { hrefFor, onNavigate }) => {
  if (!targets.length || typeof line !== 'string') return line;
  return linkSegments(line, targets).map((segment, at) => (segment.id
    ? <Link
      key={at}
      {...linkProps(hrefFor, segment.id)}
     
      onClick={navigateOnPlainClick(onNavigate, segment.id, Boolean(hrefFor?.(segment.id)))}
    >
      {segment.text}
    </Link>
    : <React.Fragment key={at}>{segment.text}</React.Fragment>));
};

const fieldValue = ({ value, format, links, currency, currencyIcon }, ctx = {}) => {
  if (format === 'coins') return <CoinAmount amount={value}/>;
  // A price in a currency with art (a superbit's bits): drawn the way a cost line draws it.
  if (format === 'cost') return <CostAmount amount={value} currency={currency} icon={currencyIcon}/>;
  // The value stays a number so a listing can sort it; the page still prints it the way the game's numbers read.
  if (format === 'amount') return formatAmount(value);
  const targets = fieldLinkTargets(links, ctx.index?.byId);
  // One entry per line, so a long entry wraps as a whole instead of splitting mid-option. Divs, not
  // paragraphs: the value already sits inside a div, and a <p> there would not be valid markup.
  if (Array.isArray(value)) return <Stack gap={0.5}>{value.map((entry, index) => <div key={index}>{linkedLine(entry, targets, ctx)}</div>)}</Stack>;
  return typeof value === 'number' ? notateAmount(value) : linkedLine(value, targets, ctx);
};

// A row's second value, its price or wait (a sigil tier's Sigil EXP), drawn under it the way a cost line draws one.
const withCost = (field, ctx) => (field.cost
  ? <>
    {fieldValue(field, ctx)}
    <Typography variant={'caption'} component={'div'} color={'text.secondary'}>
      <CostAmount amount={field.cost.value} currency={field.cost.currency} icon={field.cost.currencyIcon}/>
    </Typography>
  </>
  : fieldValue(field, ctx));

// One sub-entry of a page (a merit, a trait): its art, its own level calculator or its sentence, and its fields.
const RegistryEntry = ({ entry, ctx }) => <Stack direction={'row'} gap={1} alignItems={'flex-start'}>
  {/* The icon is rooted at /, GameIcon's src under public/. */}
  {entry.icon ? <GameIcon src={entry.icon.replace(/^\//, '')} size={32} alt={''}/> : null}
  <Stack gap={0.5} sx={{ minWidth: 0 }}>
    {entry.effect
      ? <LevelledEffect node={entry}/>
      : <Typography variant={'body2'}>{cleanUnderscore(entry.description)}</Typography>}
    {(entry.fields || []).map((field) => <Stack key={field.label} direction={'row'} justifyContent={'space-between'} gap={1.5}
                                                sx={{ typography: 'caption', color: 'text.secondary' }}>
      <span>{field.label}</span>
      <Box component={'span'} sx={{ textAlign: 'right' }}>{fieldValue(field, ctx)}</Box>
    </Stack>)}
  </Stack>
</Stack>;

// The whole render condition, not the first guard: a registry page can carry the flag and nothing to
// draw. The panel asks the same question the box answers, so it cannot draw while the empty state shows.
// A page with a `panel` has a component of its own that draws its effect and fields (SneakFloorInfo).
export const registryInfoShows = (node) => !sneakFloorShows(node)
  && Boolean((node?.registry && node.effect) || node?.fields?.length > 0 || node?.entries?.length > 0);

// The page body for every registry kind: the level calculator when the entry has one, the row's
// extra fields, and its sub-entries. Any page carrying fields gets the Details box; the calculator stays
// registry-only because talents, vials and bubbles carry an effect of their own panels' making.
// A kind needing more than this gets its own component, not a branch here.
const RegistryInfo = ({ node, index, hrefFor, onNavigate }) => {
  if (!registryInfoShows(node)) return null;
  const ctx = { index, hrefFor, onNavigate };
  const groups = [];
  if (node.registry && node.effect) groups.push({ title: 'Effect', content: <LevelledEffect node={node}/>, rows: [] });
  if (node.fields?.length) {
    groups.push({ title: node.fieldsLabel ?? 'Details', rows: node.fields.map((field) => ({ label: field.label, value: withCost(field, ctx) })) });
  }
  if (node.entries?.length) {
    groups.push({
      title: node.entriesLabel ?? 'Entries',
      content: <Stack gap={1.5} divider={<Divider flexItem/>}>
        {/* The key is unique across the graph, so moving between two pages with entries resets every typed level. */}
        {node.entries.map((entry) => <RegistryEntry key={entry.key} entry={entry} ctx={ctx}/>)}
      </Stack>
    });
  }
  return <InfoBox groups={groups}/>;
};

export default RegistryInfo;
