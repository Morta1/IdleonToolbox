import React from 'react';
import { Box, Link as MuiLink, Typography } from '@mui/material';
import { marked } from 'marked';
import Tooltip from '@components/Tooltip';
import ItemDisplay from '@components/common/ItemDisplay';
import { items, talents as talentsData } from '@website-data';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { flattenTalents, formatTalentName, parseItemRefs } from '@utility/builds/itemRefs';
import { CHIP_SX, MISSING_CHIP_SX, TalentTooltipBody } from './chipCommon';

// Module-level lookup: skillIndex -> flattened talent record. Used by the
// talent chip to hydrate a mention at render time without walking the nested
// talents structure on every render.
const TALENT_BY_SKILL_INDEX = new Map(
  flattenTalents(talentsData).map((t) => [Number(t.skillIndex), t])
);

// Renders a build's description / tab note. The storage format is a small
// Markdown subset (see utility/builds/tiptapDoc.js for the contract) plus
// `[[rawName]]` markers for item mentions. This component walks marked's
// token tree and turns it into MUI JSX, intercepting text nodes so item
// markers become inline chips with the same ItemDisplay tooltip used
// throughout the app.
//
// Backwards compat: builds predating the rich editor store plain text with
// `\n` as paragraph separator. tiptapDoc.textToDoc already handles that on
// the editor side; here we mirror it so old builds render as paragraphs.

marked.setOptions({ gfm: true, breaks: false, pedantic: false });

// Whitelist for link href schemes. Anything else (javascript:, data:, vbscript:
// …) degrades to plain text in the renderer. http(s), mailto, tel, root-
// relative, and hash-only are the legitimate shapes a build description needs.
const SAFE_HREF_RE = /^(https?:|mailto:|tel:|\/|#)/i;

// ---- Talent chip -----------------------------------------------------------

const TalentRefChip = ({ skillIndex }) => {
  const idx = Number(skillIndex);
  const talent = Number.isFinite(idx) ? TALENT_BY_SKILL_INDEX.get(idx) : null;
  if (!talent) {
    return (
      <Typography component="span" sx={MISSING_CHIP_SX}>
        talent:{skillIndex}
      </Typography>
    );
  }
  return (
    <Tooltip title={<TalentTooltipBody talent={talent}/>}>
      <Typography component="span" sx={CHIP_SX}>
        <img
          src={`${prefix}data/UISkillIcon${idx}.png`}
          alt=""
          width={18}
          height={18}
          style={{ objectFit: 'contain', flexShrink: 0 }}
        />
        {formatTalentName(talent.name)}
      </Typography>
    </Tooltip>
  );
};

// ---- Item chip -------------------------------------------------------------

const ItemRefChip = ({ rawName }) => {
  const item = items?.[rawName];
  if (!item) {
    return (
      <Typography component="span" sx={MISSING_CHIP_SX}>
        {rawName}
      </Typography>
    );
  }
  return (
    <Tooltip title={<ItemDisplay {...item} showRawName/>}>
      <Typography component="span" sx={CHIP_SX}>
        <img
          src={`${prefix}data/${rawName}.png`}
          alt=""
          width={18}
          height={18}
          style={{ objectFit: 'contain', flexShrink: 0 }}
        />
        {cleanUnderscore(item.displayName || rawName)}
      </Typography>
    </Tooltip>
  );
};

// ---- Inline token rendering ------------------------------------------------

// Walk marked's inline tokens, converting to JSX. Text segments are further
// split by parseItemRefs so `[[marker]]` becomes a chip anywhere it appears.
const renderInlineTokens = (tokens, keyPrefix = 'i') => {
  if (!Array.isArray(tokens)) return null;
  return tokens.map((tok, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!tok) return null;
    switch (tok.type) {
      case 'text':
      case 'escape': {
        const raw = tok.text ?? tok.raw ?? '';
        const segs = parseItemRefs(raw);
        if (segs.length === 0 && raw) {
          return <React.Fragment key={key}>{raw}</React.Fragment>;
        }
        return (
          <React.Fragment key={key}>
            {segs.map((seg, i) => {
              const segKey = `${key}-${i}`;
              if (seg.type === 'item') return <ItemRefChip key={segKey} rawName={seg.rawName}/>;
              if (seg.type === 'talent') return <TalentRefChip key={segKey} skillIndex={seg.skillIndex}/>;
              return <React.Fragment key={segKey}>{seg.value}</React.Fragment>;
            })}
          </React.Fragment>
        );
      }
      case 'strong':
        return <strong key={key}>{renderInlineTokens(tok.tokens, key)}</strong>;
      case 'em':
        return <em key={key}>{renderInlineTokens(tok.tokens, key)}</em>;
      case 'codespan':
        // Code marks aren't enabled in the editor; render as inline text.
        return <React.Fragment key={key}>{tok.text}</React.Fragment>;
      case 'link': {
        // Guard against javascript:/data:/vbscript: URLs. The editor blocks
        // these at input time but storage is plain markdown — a direct POST
        // or an edit with an older client can smuggle `[x](javascript:…)`
        // through. Fall back to plain text when the scheme isn't safelisted.
        const href = String(tok.href || '').trim();
        if (!SAFE_HREF_RE.test(href)) {
          return <React.Fragment key={key}>{renderInlineTokens(tok.tokens, key)}</React.Fragment>;
        }
        return (
          <MuiLink
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            sx={{ color: '#5ea9ff' }}
          >
            {renderInlineTokens(tok.tokens, key)}
          </MuiLink>
        );
      }
      case 'br':
        return <br key={key}/>;
      case 'del':
        return <s key={key}>{renderInlineTokens(tok.tokens, key)}</s>;
      case 'html':
        // Ignore raw HTML for safety; surface its text content.
        return <React.Fragment key={key}>{tok.text || ''}</React.Fragment>;
      default:
        return tok.raw ? <React.Fragment key={key}>{tok.raw}</React.Fragment> : null;
    }
  });
};

// ---- Block token rendering -------------------------------------------------

const renderListItem = (item, keyPrefix) => {
  const inner = Array.isArray(item.tokens) && item.tokens.length
    ? item.tokens.map((t, i) => renderBlockToken(t, `${keyPrefix}-${i}`))
    : item.text
      ? [renderBlockToken({ type: 'text', tokens: [{ type: 'text', text: item.text }] }, `${keyPrefix}-t`)]
      : null;
  return <li key={keyPrefix}>{inner}</li>;
};

const renderBlockToken = (tok, key) => {
  if (!tok) return null;
  switch (tok.type) {
    case 'paragraph':
      return (
        <Typography key={key} sx={{ whiteSpace: 'pre-wrap', my: 0.5 }}>
          {renderInlineTokens(tok.tokens, key)}
        </Typography>
      );
    case 'heading': {
      const level = Math.min(Math.max(tok.depth || 1, 1), 6);
      // Render as real <h1>..<h6> semantically, with font sizes scaled for
      // in-content headings (MUI's h1 default is too large for body copy).
      const sizeEm = { 1: '1.5em', 2: '1.3em', 3: '1.18em', 4: '1.08em', 5: '1em', 6: '0.92em' }[level];
      const extra = level === 6
        ? { textTransform: 'uppercase', letterSpacing: 0.4 }
        : {};
      return (
        <Typography
          key={key}
          component={`h${level}`}
          sx={{ fontWeight: 700, fontSize: sizeEm, lineHeight: 1.3, mt: 1.25, mb: 0.5, ...extra }}
        >
          {renderInlineTokens(tok.tokens, key)}
        </Typography>
      );
    }
    case 'list': {
      const Tag = tok.ordered ? 'ol' : 'ul';
      return (
        <Box key={key} component={Tag} sx={{ pl: 3, my: 0.5 }}>
          {(tok.items || []).map((it, i) => renderListItem(it, `${key}-${i}`))}
        </Box>
      );
    }
    case 'text':
      // Loose inline text at block level (e.g. inside a list item).
      return (
        <Typography key={key} component="span" sx={{ whiteSpace: 'pre-wrap' }}>
          {renderInlineTokens(tok.tokens || [{ type: 'text', text: tok.text || tok.raw || '' }], key)}
        </Typography>
      );
    case 'space':
      return null;
    default:
      // code / blockquote / hr / html / table / image aren't emitted by the
      // editor; show raw content so nothing disappears silently.
      return tok.raw ? (
        <Typography key={key} sx={{ whiteSpace: 'pre-wrap', my: 0.5 }}>
          {tok.raw}
        </Typography>
      ) : null;
  }
};

// ---- Entry point -----------------------------------------------------------

const ItemRefRenderer = ({ text, sx }) => {
  if (!text) return null;
  // Backwards compat: legacy builds stored prose as plain text with a single
  // `\n` per paragraph break. Promote every lone `\n` to `\n\n` so marked
  // treats it as a paragraph separator, while leaving runs of 2+ newlines
  // alone. The earlier all-or-nothing check (`if any blank line exists,
  // skip promotion entirely`) corrupted mixed content like
  // "Line 1\nLine 2\n\nNew para" by keeping Line 1/Line 2 in the same paragraph.
  const normalized = text.replace(/\n+/g, (run) => (run.length === 1 ? '\n\n' : run));
  const tokens = marked.lexer(normalized);
  return (
    <Box sx={sx}>
      {tokens.map((t, i) => renderBlockToken(t, `b-${i}`))}
    </Box>
  );
};

export default ItemRefRenderer;
