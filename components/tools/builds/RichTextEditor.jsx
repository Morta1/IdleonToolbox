import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import { Box, Stack, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import ItemDisplay from '@components/common/ItemDisplay';
import { items, itemsArray, talents as talentsData } from '@website-data';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { filterRefsForQuery, flattenTalents, formatTalentName } from '@utility/builds/itemRefs';
import { docToText, textToDoc } from '@utility/builds/tiptapDoc';
import MentionMenu from './MentionMenu';
import EditorToolbar from './EditorToolbar';
import { CHIP_SX, MISSING_CHIP_SX, TalentTooltipBody } from './chipCommon';

// Module-level lookups built once. Flatten talents into a searchable array
// and a skillIndex → talent map so the mention NodeView can hydrate without
// walking the nested talents object on every render.
const TALENTS_ARRAY = flattenTalents(talentsData);
const TALENT_BY_SKILL_INDEX = new Map(
  TALENTS_ARRAY.map((t) => [Number(t.skillIndex), t])
);

// Parse the mention node's `attrs.id` string (format: "type:id"). Legacy bare
// ids (no prefix) are treated as items so builds authored before the talent
// mention feature keep rendering correctly.
const parseMentionId = (id) => {
  if (!id) return { type: 'item', bareId: '' };
  const idx = id.indexOf(':');
  if (idx <= 0) return { type: 'item', bareId: id };
  const prefix = id.slice(0, idx);
  const rest = id.slice(idx + 1);
  if (prefix === 'item' || prefix === 'talent') return { type: prefix, bareId: rest };
  return { type: 'item', bareId: id };
};

// WYSIWYG description editor backed by TipTap 3.
//
// Design notes (why this is shaped like it is):
//
// 1. TipTap's React integration re-renders the wrapping component on every
//    transaction by default. With `shouldRerenderOnTransaction: false` the
//    React tree no longer re-renders on every keystroke — only the editor's
//    own ProseMirror DOM updates.
//
// 2. `onUpdate` still fires on every edit, but we debounce the serialization +
//    parent onChange. That means the parent form re-renders at most every
//    ~200ms while the user types, not on every keystroke.
//
// 3. The editor's `extensions` array is memoized once so useEditor keeps the
//    same editor instance across renders (passing a new array each render
//    would make TipTap see a config change).
//
// 4. The outer component is *not* fully controlled by the parent's value.
//    The editor owns its state. We sync parent -> editor only when the
//    external value comes from somewhere that isn't the editor itself
//    (template preload, draft restore, form reset). A `lastEmittedRef`
//    gate prevents our own debounced emissions from bouncing back in.

const DEBOUNCE_MS = 200;

// React NodeView for `mention` nodes — branches on the mention's type prefix.
// For items, renders the item's icon + displayName with ItemDisplay in a
// tooltip. For talents, renders the skill icon + talent name with a computed
// description in a tooltip. Unknown ids fall through to a muted italic chip
// so nothing blows up if a build references data that was removed later.
const MentionChip = ({ node }) => {
  const { type, bareId } = parseMentionId(node.attrs?.id || '');

  if (type === 'talent') {
    const skillIndex = Number(bareId);
    const talent = Number.isFinite(skillIndex) ? TALENT_BY_SKILL_INDEX.get(skillIndex) : null;
    const chipBody = (
      <Box component="span" sx={talent ? CHIP_SX : MISSING_CHIP_SX}>
        {talent ? (
          <img
            src={`${prefix}data/UISkillIcon${skillIndex}.png`}
            alt=""
            width={16}
            height={16}
            style={{ objectFit: 'contain', flexShrink: 0 }}
          />
        ) : null}
        <Box component="span">
          {talent ? formatTalentName(talent.name) : `talent:${bareId}`}
        </Box>
      </Box>
    );
    return (
      <NodeViewWrapper as="span" style={{ display: 'inline-block' }} contentEditable={false}>
        {talent ? (
          <Tooltip title={<TalentTooltipBody talent={talent}/>}>{chipBody}</Tooltip>
        ) : (
          chipBody
        )}
      </NodeViewWrapper>
    );
  }

  // Default: item mention.
  const item = bareId ? items?.[bareId] : null;
  const label = item?.displayName ? cleanUnderscore(item.displayName) : bareId || '?';
  const chipBody = (
    <Box component="span" sx={item ? CHIP_SX : MISSING_CHIP_SX}>
      {item ? (
        <img
          src={`${prefix}data/${bareId}.png`}
          alt=""
          width={16}
          height={16}
          style={{ objectFit: 'contain', flexShrink: 0 }}
        />
      ) : null}
      <Box component="span">{label}</Box>
    </Box>
  );
  return (
    <NodeViewWrapper as="span" style={{ display: 'inline-block' }} contentEditable={false}>
      {item ? (
        <Tooltip title={<ItemDisplay {...item} showRawName/>}>{chipBody}</Tooltip>
      ) : (
        chipBody
      )}
    </NodeViewWrapper>
  );
};

// Mention subclass that plugs the React NodeView in.
const ItemMention = Mention.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MentionChip);
  }
});

const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = '',
  minRows = 3,
  ariaLabel,
  maxLength
}) => {
  // --- Refs that stay stable across renders so captured closures don't go stale.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const lastEmittedRef = useRef(value);
  const flushTimerRef = useRef(null);
  const pendingValueRef = useRef(null);

  // Debounced parent-emit. Buffers the latest serialized text; fires after
  // DEBOUNCE_MS of inactivity. Blur/destroy/unmount force an immediate flush.
  const flushNow = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (pendingValueRef.current === null) return;
    const next = pendingValueRef.current;
    pendingValueRef.current = null;
    if (next === lastEmittedRef.current) return;
    lastEmittedRef.current = next;
    onChangeRef.current?.(next);
  }, []);

  const schedule = useCallback((text) => {
    pendingValueRef.current = text;
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(flushNow, DEBOUNCE_MS);
  }, [flushNow]);

  // --- Mention popup state, held in React because it drives a MUI Popper.
  const [mentionState, setMentionState] = useState(null);
  const mentionStateRef = useRef(mentionState);
  useEffect(() => { mentionStateRef.current = mentionState; }, [mentionState]);

  // Refs mirror props so the extension closures can resolve the *current*
  // placeholder/maxLength at call time without the extensions array depending
  // on those props (which would recreate the editor on every prop change).
  const placeholderRef = useRef(placeholder);
  useEffect(() => { placeholderRef.current = placeholder; }, [placeholder]);
  // Capture maxLength at mount — CharacterCount's `limit` option is baked in
  // at extension init and has no runtime setter. If a caller needs to change
  // the cap live, they must remount the component.
  const initialMaxLengthRef = useRef(maxLength);

  // --- Stable extensions array. useEditor must not see a new identity per
  //     render, or it'll call setOptions / rebuild internal state unnecessarily.
  const extensions = useMemo(() => [
    StarterKit.configure({
      // Enabled for build descriptions: bold, italic, bullet/ordered lists,
      // headings H1..H6, paragraph, text, history, hardBreak.
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      strike: false,
      code: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false
    }),
    // Function form reads the latest placeholder from the ref so prop changes
    // propagate without rebuilding the editor.
    Placeholder.configure({ placeholder: () => placeholderRef.current || '' }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        rel: 'noopener noreferrer nofollow',
        target: '_blank'
      }
    }),
    // CharacterCount surfaces `editor.storage.characterCount.characters()` —
    // the character counter UI below the editor reads from there. `limit`
    // prevents typing past the cap at the DOM layer.
    CharacterCount.configure({ limit: initialMaxLengthRef.current }),
    ItemMention.configure({
      HTMLAttributes: { class: 'item-mention' },
      suggestion: {
        char: '@',
        allowSpaces: true,
        items: ({ query }) => filterRefsForQuery(itemsArray, TALENTS_ARRAY, query, 10),
        render: () => ({
          onStart: (props) => {
            const rect = props.clientRect?.();
            setMentionState({
              items: props.items,
              selectedIdx: 0,
              coords: rect ? { top: rect.bottom, left: rect.left, height: rect.height } : null,
              command: props.command
            });
          },
          onUpdate: (props) => {
            const rect = props.clientRect?.();
            setMentionState((prev) => {
              const base = {
                items: props.items,
                selectedIdx: Math.min(prev?.selectedIdx ?? 0, Math.max(0, props.items.length - 1)),
                coords: rect
                  ? { top: rect.bottom, left: rect.left, height: rect.height }
                  : prev?.coords ?? null,
                command: props.command
              };
              return prev ? { ...prev, ...base } : base;
            });
          },
          onKeyDown: ({ event }) => {
            const m = mentionStateRef.current;
            if (!m || !m.items?.length) return false;
            if (event.key === 'ArrowDown') {
              setMentionState((p) => p && { ...p, selectedIdx: (p.selectedIdx + 1) % m.items.length });
              return true;
            }
            if (event.key === 'ArrowUp') {
              setMentionState((p) => p && { ...p, selectedIdx: (p.selectedIdx - 1 + m.items.length) % m.items.length });
              return true;
            }
            if (event.key === 'Enter' || event.key === 'Tab') {
              const sel = m.items[m.selectedIdx];
              // filterRefsForQuery already produced a prefixed "type:id" key
              // on each entry — that's what we store in attrs.id.
              if (sel?.key) m.command({ id: sel.key });
              return true;
            }
            if (event.key === 'Escape') {
              setMentionState(null);
              return true;
            }
            return false;
          },
          onExit: () => setMentionState(null)
        })
      }
    })
  ], []);

  // --- The editor. Created once. No React re-render per transaction.
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions,
    content: textToDoc(value),
    onUpdate: ({ editor: ed }) => {
      // Serialize + debounce, don't hit parent state per keystroke.
      schedule(docToText(ed.getJSON()));
    },
    onBlur: () => flushNow(),
    onDestroy: () => flushNow()
  });

  // Clean up any pending flush on unmount.
  useEffect(() => () => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
  }, []);

  // Sync external `value` -> editor when the change didn't come from us (draft
  // restore, template preload, class change reset). `lastEmittedRef` catches
  // the echo of our own emissions.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedRef.current) return;
    editor.commands.setContent(textToDoc(value), { emitUpdate: false });
    lastEmittedRef.current = value;
  }, [value, editor]);

  const handleMentionSelect = (entry) => {
    const m = mentionStateRef.current;
    if (!m?.command || !entry?.key) return;
    m.command({ id: entry.key });
  };

  return (
    <Stack gap={0.5}>
      {/* Gate toolbar on editor readiness. `useEditorState` inside the
          toolbar captures its editor prop on first render and doesn't
          recover cleanly when that prop flips from null to an instance
          — so if we rendered the toolbar with `editor=null` at mount
          (which happens because useEditor defers creation under
          `immediatelyRender: false`), it stayed blank until an unrelated
          re-render. Waiting for a non-null editor keeps the hook stable. */}
      {editor && <EditorToolbar editor={editor}/>}
      <Box
        aria-label={ariaLabel}
        sx={{
          '& .ProseMirror': {
            minHeight: `${Math.max(1, minRows) * 24}px`,
            padding: '10.5px 14px',
            border: '1px solid rgba(255,255,255,0.23)',
            borderRadius: '4px',
            color: '#fff',
            fontSize: 14,
            outline: 'none',
            whiteSpace: 'pre-wrap'
          },
          '& .ProseMirror:hover': { borderColor: 'rgba(255,255,255,0.5)' },
          '& .ProseMirror.ProseMirror-focused': {
            borderColor: 'primary.main',
            borderWidth: '2px',
            padding: '9.5px 13px'
          },
          '& .ProseMirror p': { margin: 0 },
          '& .ProseMirror p + p': { marginTop: '0.25em' },
          '& .ProseMirror h1, & .ProseMirror h2, & .ProseMirror h3, & .ProseMirror h4, & .ProseMirror h5, & .ProseMirror h6': {
            margin: '0.6em 0 0.3em',
            lineHeight: 1.3,
            fontWeight: 700
          },
          '& .ProseMirror h1': { fontSize: '1.5em' },
          '& .ProseMirror h2': { fontSize: '1.3em' },
          '& .ProseMirror h3': { fontSize: '1.18em' },
          '& .ProseMirror h4': { fontSize: '1.08em' },
          '& .ProseMirror h5': { fontSize: '1em' },
          '& .ProseMirror h6': {
            fontSize: '0.92em',
            letterSpacing: 0.4
          },
          '& .ProseMirror ul, & .ProseMirror ol': {
            margin: '0.25em 0',
            paddingLeft: '1.5em'
          },
          '& .ProseMirror li > p': { margin: 0 },
          '& .ProseMirror a': {
            color: '#5ea9ff',
            textDecoration: 'underline'
          },
          // Placeholder extension adds `.is-editor-empty` on the first empty
          // child; the ::before pseudo shows the configured text.
          '& .ProseMirror p.is-editor-empty:first-of-type::before': {
            content: 'attr(data-placeholder)',
            float: 'left',
            color: 'rgba(255,255,255,0.35)',
            pointerEvents: 'none',
            height: 0
          }
        }}
      >
        <EditorContent editor={editor}/>
      </Box>

      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography variant="caption" color="text.secondary">
          Type <code>@</code> to mention an item or a talent
        </Typography>
        {maxLength && editor ? (
          <CharacterCountDisplay editor={editor} limit={maxLength}/>
        ) : null}
      </Stack>

      <MentionMenu
        open={!!mentionState}
        coords={mentionState?.coords}
        items={mentionState?.items || []}
        selectedIdx={mentionState?.selectedIdx ?? 0}
        onSelect={handleMentionSelect}
      />
    </Stack>
  );
};

// Reads the live character count from the editor's storage and renders it in
// the bottom-right. Uses an onUpdate-subscribed state instead of bouncing
// off the parent so it's cheap even while the parent doesn't re-render.
const CharacterCountDisplay = ({ editor, limit }) => {
  const [count, setCount] = useState(
    () => editor.storage.characterCount?.characters?.() ?? 0
  );
  useEffect(() => {
    const update = () => setCount(editor.storage.characterCount?.characters?.() ?? 0);
    editor.on('update', update);
    return () => {
      editor.off('update', update);
    };
  }, [editor]);
  const over = count >= limit;
  return (
    <Typography
      variant="caption"
      sx={{
        color: over ? 'warning.main' : 'text.secondary',
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0
      }}
    >
      {count.toLocaleString()} / {limit.toLocaleString()}
    </Typography>
  );
};

export default RichTextEditor;
