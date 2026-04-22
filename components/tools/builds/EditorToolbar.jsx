import React, { useEffect, useRef, useState } from 'react';
import { useEditorState } from '@tiptap/react';
import {
  Button,
  IconButton,
  Popover,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import Tooltip from '@components/Tooltip';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

// Small, icon-only formatting toolbar for RichTextEditor. TipTap is headless,
// so we provide the buttons ourselves — `editor.chain().focus().<cmd>().run()`
// is the entry point, and the toolbar's active state is driven by
// `useEditorState`.
//
// Why useEditorState (not a manual on('update') + isActive):
//   TipTap 3's `editor.isActive(...)` doesn't always reflect selection-only
//   changes when paired with `shouldRerenderOnTransaction: false`. Re-reading
//   isActive in response to a manual update subscription has a well-known
//   lag (ueberdosis/tiptap#6673). useEditorState is the official hook: it
//   subscribes to every editor event and re-renders only when the selector's
//   return value changes (shallow-equal).
const EditorToolbar = ({ editor }) => {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return null;
      return {
        isBold: ed.isActive('bold'),
        isItalic: ed.isActive('italic'),
        isBulletList: ed.isActive('bulletList'),
        isOrderedList: ed.isActive('orderedList'),
        isLink: ed.isActive('link'),
        headingLevel: ed.isActive('heading')
          ? (ed.getAttributes('heading').level ?? null)
          : null,
        canUndo: ed.can().undo(),
        canRedo: ed.can().redo()
      };
    }
  });

  const [linkAnchor, setLinkAnchor] = useState(null);
  // Snapshot the selection + current href when the popover opens, so typing
  // in the TextField (which steals focus from the editor) doesn't collapse
  // the range the user is about to wrap in a link. Selection lives in a ref
  // (only read at commit time); the href + "has link" flag live in state so
  // they can be consumed during render without the concurrent-mode footgun
  // of reading mutable refs inside the component body.
  const pendingSelectionRef = useRef(null);
  const [existingHref, setExistingHref] = useState('');

  if (!editor || !state) return null;

  const openLinkPopover = (e) => {
    const href = editor.getAttributes('link')?.href || '';
    pendingSelectionRef.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
      existingHref: href
    };
    setExistingHref(href);
    setLinkAnchor(e.currentTarget);
  };

  const closeLinkPopover = () => {
    setLinkAnchor(null);
    setExistingHref('');
    pendingSelectionRef.current = null;
  };

  const applyLink = (rawUrl) => {
    const snap = pendingSelectionRef.current;
    if (!snap) return;
    const { from, to, existingHref } = snap;
    const url = normalizeUrl((rawUrl || '').trim());
    const base = editor.chain().focus().setTextSelection({ from, to });

    if (!url) {
      // Empty input: remove the link if there is one, otherwise no-op.
      if (existingHref) base.extendMarkRange('link').unsetLink().run();
    } else if (from === to && !existingHref) {
      // Collapsed selection + brand-new link: insert the URL as the link text.
      base
        .insertContent({
          type: 'text',
          text: url,
          marks: [{ type: 'link', attrs: { href: url } }]
        })
        .run();
    } else {
      // Text selected, or caret inside an existing link: wrap / update.
      base.extendMarkRange('link').setLink({ href: url }).run();
    }
    closeLinkPopover();
  };

  const unsetLink = () => applyLink('');

  const run = (fn) => () => fn(editor.chain().focus()).run();

  // Button renderer. onMouseDown.preventDefault keeps the editor focused —
  // without it, clicks transfer focus to the button, leaving the editor's
  // visible "selected" ring stuck on the button itself. aria-label is the
  // plain action word so screen readers don't miss the button's purpose.
  const tb = (label, shortcut, active, onClick, IconEl, value, disabled = false) => (
    <Tooltip title={shortcut ? `${label} (${shortcut})` : label}>
      <ToggleButton
        aria-label={label}
        value={value ?? label}
        size="small"
        selected={!!active}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        sx={TB_SX}
      >
        <IconEl fontSize="small"/>
      </ToggleButton>
    </Tooltip>
  );

  return (
    <Stack
      direction="row"
      gap={0.25}
      alignItems="center"
      sx={{
        flexWrap: 'wrap',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 1,
        p: 0.5,
        background: 'rgba(255,255,255,0.02)'
      }}
    >
      <ToggleButtonGroup size="small" sx={{ gap: 0.25 }}>
        {tb('Bold', 'Ctrl+B', state.isBold, run((c) => c.toggleBold()), FormatBoldIcon, 'bold')}
        {tb('Italic', 'Ctrl+I', state.isItalic, run((c) => c.toggleItalic()), FormatItalicIcon, 'italic')}
      </ToggleButtonGroup>

      <ToolbarDivider/>

      <ToggleButtonGroup size="small" sx={{ gap: 0.25 }}>
        {[1, 2, 3, 4, 5, 6].map((level) => {
          const active = state.headingLevel === level;
          return (
            <Tooltip key={level} title={`Heading ${level} (Ctrl+Alt+${level})`}>
              <ToggleButton
                aria-label={`Heading ${level}`}
                value={`h${level}`}
                size="small"
                selected={active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const chain = editor.chain().focus();
                  // Explicit set/clear is more deterministic than toggleHeading
                  // for cross-level switches (e.g. H3 → H1).
                  if (active) chain.setParagraph().run();
                  else chain.setHeading({ level }).run();
                }}
                sx={H_TB_SX}
              >
                H{level}
              </ToggleButton>
            </Tooltip>
          );
        })}
      </ToggleButtonGroup>

      <ToolbarDivider/>

      <ToggleButtonGroup size="small" sx={{ gap: 0.25 }}>
        {tb('Bullet list', 'Ctrl+Shift+8', state.isBulletList, run((c) => c.toggleBulletList()), FormatListBulletedIcon, 'ul')}
        {tb('Numbered list', 'Ctrl+Shift+7', state.isOrderedList, run((c) => c.toggleOrderedList()), FormatListNumberedIcon, 'ol')}
      </ToggleButtonGroup>

      <ToolbarDivider/>

      <ToggleButtonGroup size="small" sx={{ gap: 0.25 }}>
        <Tooltip title="Link (Ctrl+K)">
          <ToggleButton
            aria-label="Link"
            value="link"
            size="small"
            selected={state.isLink}
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLinkPopover}
            sx={TB_SX}
          >
            <InsertLinkIcon fontSize="small"/>
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      <LinkPopover
        anchorEl={linkAnchor}
        initialUrl={existingHref}
        hasExistingLink={!!existingHref}
        onClose={closeLinkPopover}
        onSave={applyLink}
        onRemove={unsetLink}
      />

      <ToolbarDivider/>

      <ToggleButtonGroup size="small" sx={{ gap: 0.25 }}>
        {tb('Undo', 'Ctrl+Z', false, run((c) => c.undo()), UndoIcon, 'undo', !state.canUndo)}
        {tb('Redo', 'Ctrl+Y', false, run((c) => c.redo()), RedoIcon, 'redo', !state.canRedo)}
      </ToggleButtonGroup>
    </Stack>
  );
};

const TB_SX = {
  border: 0,
  borderRadius: '4px !important', // override ToggleButtonGroup first/last-child overrides
  p: 0.5,
  minWidth: 30,
  height: 30,
  color: 'text.secondary',
  '&.Mui-selected': {
    background: 'rgba(255,255,255,0.1)',
    color: 'text.primary'
  },
  '&:hover': { background: 'rgba(255,255,255,0.06)' },
  '&.Mui-focusVisible': { background: 'transparent' },
  '&:focus:not(.Mui-selected)': { background: 'transparent' },
  // Disabled styling: keep the flat/borderless look. MUI's default adds a
  // subtle border + background that was showing through on the disabled
  // Redo button.
  '&.Mui-disabled': {
    border: 0,
    background: 'transparent',
    color: 'rgba(255,255,255,0.2)'
  }
};

const H_TB_SX = {
  ...TB_SX,
  minWidth: 28,
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1
};

// Light normalization: if the user types a bare host like "example.com", turn
// it into "https://example.com". Pass through anything with a safelisted
// scheme. Anything else with a scheme (javascript:, data:, vbscript:, …) is
// rejected — TipTap's default isAllowedUri already blocks these at the mark
// level, but we also reject here so a paste-and-save never stores them.
const SAFE_PASSTHROUGH_RE = /^(https?:\/\/|mailto:|tel:|\/|#)/i;
const UNSAFE_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const normalizeUrl = (url) => {
  if (!url) return '';
  if (SAFE_PASSTHROUGH_RE.test(url)) return url;
  if (UNSAFE_SCHEME_RE.test(url)) return ''; // strip any other scheme
  return `https://${url}`;
};

const ToolbarDivider = () => (
  <div
    style={{
      width: 1,
      height: 20,
      background: 'rgba(255,255,255,0.1)',
      margin: '0 2px'
    }}
  />
);

// Compact link editor popover — mirrors Mantine's RichTextEditor control
// behavior: small input beneath the toolbar button, Save on Enter, Cancel on
// Escape, Remove button when an existing link is being edited.
const LinkPopover = ({ anchorEl, initialUrl, hasExistingLink, onClose, onSave, onRemove }) => {
  const [url, setUrl] = useState(initialUrl || '');

  // Re-seed when opening on a different selection.
  useEffect(() => {
    if (anchorEl) setUrl(initialUrl || '');
  }, [anchorEl, initialUrl]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave((url || '').trim());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            mt: 0.5,
            p: 1,
            minWidth: 320,
            border: '1px solid rgba(255,255,255,0.08)'
          }
        }
      }}
    >
      <Stack direction="row" alignItems="center" gap={0.75}>
        <TextField
          size="small"
          autoFocus
          fullWidth
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://…"
          inputProps={{ spellCheck: false, autoComplete: 'off' }}
        />
        {hasExistingLink && (
          <Tooltip title="Remove link">
            <IconButton
              size="small"
              onClick={onRemove}
              onMouseDown={(e) => e.preventDefault()}
              sx={{ color: 'error.light' }}
            >
              <LinkOffIcon fontSize="small"/>
            </IconButton>
          </Tooltip>
        )}
        <Button
          size="small"
          variant="contained"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSave((url || '').trim())}
          sx={{ minWidth: 64 }}
        >
          Save
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        Enter to save · Esc to cancel
      </Typography>
    </Popover>
  );
};

export default EditorToolbar;
