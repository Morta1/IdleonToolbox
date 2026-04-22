import React, { useEffect, useMemo, useRef } from 'react';
import {
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  Typography
} from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { formatTalentName } from '@utility/builds/itemRefs';

// Inline @-mention menu. Anchored to a virtual element at the caret's pixel
// coordinates so the menu pops up right below the current character — not
// below the entire textarea.
//
// Click handlers use onMouseDown + preventDefault so clicking a row doesn't
// blur the textarea mid-selection; keyboard nav lives in the parent.
const MentionMenu = ({ open, coords, items, selectedIdx, onSelect }) => {
  const listRef = useRef(null);

  // Keep the highlighted item scrolled into view as the user arrows through.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-mention-idx="${selectedIdx}"]`);
    if (el?.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [open, selectedIdx]);

  // Virtual element for Popper — reads its bounding rect from `coords` each
  // time Popper queries it. Fresh object per render so Popper re-runs its
  // position calculation when the caret moves.
  const virtualAnchor = useMemo(() => {
    if (!coords) return null;
    return {
      getBoundingClientRect: () => ({
        top: coords.top,
        left: coords.left,
        bottom: coords.top + coords.height,
        right: coords.left,
        width: 0,
        height: coords.height,
        x: coords.left,
        y: coords.top,
        toJSON: () => ({})
      })
    };
  }, [coords?.top, coords?.left, coords?.height]);

  if (!open || !virtualAnchor) return null;

  return (
    <Popper
      open={open}
      anchorEl={virtualAnchor}
      placement="bottom-start"
      style={{ zIndex: 1300 }}
      modifiers={[
        { name: 'offset', options: { offset: [0, 4] } },
        { name: 'flip', options: { fallbackPlacements: ['top-start'] } }
      ]}
    >
      <Paper
        ref={listRef}
        elevation={6}
        sx={{
          maxHeight: 260,
          overflow: 'auto',
          minWidth: 280,
          maxWidth: 360,
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <MenuList dense disablePadding>
          {items.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No items match
              </Typography>
            </MenuItem>
          ) : (
            items.map((entry, idx) => {
              // Entries come from filterRefsForQuery with a `kind` flag and a
              // `key` used as the stable React key + the id we hand back to
              // the TipTap mention command.
              const isTalent = entry.kind === 'talent';
              const iconUrl = isTalent
                ? `${prefix}data/UISkillIcon${entry.skillIndex}.png`
                : `${prefix}data/${entry.rawName}.png`;
              const primary = isTalent ? entry.name : entry.displayName;
              const secondary = isTalent
                ? entry.tabName
                : entry.Type
                  ? String(entry.Type).toLowerCase().replace(/_/g, ' ')
                  : '';
              return (
                <MenuItem
                  key={entry.key || idx}
                  data-mention-idx={idx}
                  selected={idx === selectedIdx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(entry);
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1} sx={{ width: '100%' }}>
                    <img
                      src={iconUrl}
                      alt=""
                      width={22}
                      height={22}
                      style={{ objectFit: 'contain', flexShrink: 0 }}
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden';
                      }}
                    />
                    <Typography sx={{ flexGrow: 1, fontSize: 13 }} noWrap>
                      {isTalent ? formatTalentName(primary || '') : cleanUnderscore(primary || '')}
                    </Typography>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{
                        color: isTalent ? 'primary.light' : 'text.secondary',
                        textTransform: 'capitalize',
                        fontSize: 10
                      }}
                    >
                      {isTalent
                        ? `Talent · ${formatTalentName(secondary || '')}`
                        : cleanUnderscore(secondary || '')}
                    </Typography>
                  </Stack>
                </MenuItem>
              );
            })
          )}
        </MenuList>
      </Paper>
    </Popper>
  );
};

export default MentionMenu;
