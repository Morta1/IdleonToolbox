import React from 'react';
import { Divider, Link, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import InfoBox from './InfoBox';
import LevelledEffect from './LevelledEffect';
import CoinAmount from './CoinAmount';
import { fieldLinkTargets, linkSegments } from '@utility/wiki/field-links.mjs';

// A line naming a linked page: the page's name becomes the same anchor a relation row draws.
const linkedLine = (line, targets, { hrefFor, onNavigate }) => {
  if (!targets.length || typeof line !== 'string') return line;
  return linkSegments(line, targets).map((segment, at) => (segment.id
    ? <Link
      key={at}
      {...(hrefFor?.(segment.id) ? { href: hrefFor(segment.id) } : { component: 'button', type: 'button' })}
      underline={'hover'}
      onClick={(event) => {
        if (!onNavigate) return;
        event.preventDefault();
        onNavigate(segment.id);
      }}
    >
      {segment.text}
    </Link>
    : <React.Fragment key={at}>{segment.text}</React.Fragment>));
};

const fieldValue = ({ value, format, links }, ctx = {}) => {
  if (format === 'coins') return <CoinAmount amount={value}/>;
  const targets = fieldLinkTargets(links, ctx.index?.byId);
  // One entry per line, so a long entry wraps as a whole instead of splitting mid-option. Divs, not
  // paragraphs: the value already sits inside a div, and a <p> there would not be valid markup.
  if (Array.isArray(value)) return <Stack gap={0.5}>{value.map((entry, index) => <div key={index}>{linkedLine(entry, targets, ctx)}</div>)}</Stack>;
  return typeof value === 'number' ? value.toLocaleString('en-US') : linkedLine(value, targets, ctx);
};

// One sub-entry of a page (a merit, a trait): its art, its own level calculator or its sentence, and its fields.
const RegistryEntry = ({ entry, ctx }) => <Stack direction={'row'} gap={1} alignItems={'flex-start'}>
  {entry.icon ? <img
    // The icon is rooted at `/`, and a slash after the prefix would read as a protocol-relative URL.
    src={`${prefix}${entry.icon.replace(/^\//, '')}`}
    alt={''}
    width={32}
    height={32}
    style={{ objectFit: 'contain', flexShrink: 0 }}
  /> : null}
  <Stack gap={0.5} sx={{ minWidth: 0 }}>
    {entry.effect
      ? <LevelledEffect node={entry}/>
      : <Typography variant={'body2'}>{cleanUnderscore(entry.description)}</Typography>}
    {(entry.fields || []).map((field) => <Typography key={field.label} variant={'caption'} component={'div'} color={'text.secondary'}>
      {`${field.label}: `}{fieldValue(field, ctx)}
    </Typography>)}
  </Stack>
</Stack>;

// The page body for every registry kind: the level calculator when the entry has one, the row's
// extra fields, and its sub-entries. Any page carrying fields gets the Details box; the calculator stays
// registry-only because talents, vials and bubbles carry an effect of their own panels' making.
// A kind needing more than this gets its own component, not a branch here.
// The whole render condition, not the first guard: a registry page can carry the flag and nothing to
// draw. The panel asks the same question the box answers, so it cannot draw while the empty state shows.
export const registryInfoShows = (node) => Boolean((node?.registry && node.effect) || node?.fields?.length > 0 || node?.entries?.length > 0);

const RegistryInfo = ({ node, index, hrefFor, onNavigate }) => {
  if (!registryInfoShows(node)) return null;
  const ctx = { index, hrefFor, onNavigate };
  const groups = [];
  if (node.registry && node.effect) groups.push({ title: 'Effect', content: <LevelledEffect node={node}/>, rows: [] });
  if (node.fields?.length) {
    groups.push({ title: 'Details', rows: node.fields.map((field) => ({ label: field.label, value: fieldValue(field, ctx) })) });
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
