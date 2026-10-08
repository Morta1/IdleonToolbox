import React, { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button, ButtonBase, Collapse, Stack, Typography, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import { IconChevronDown, IconChevronRight, IconChevronsDown, IconChevronsUp, IconInfoCircle } from '@tabler/icons-react';
import MetricCard from './MetricCard';
import { metaOf, rankText } from './format';
import { bestInSection, countAtMax } from './standing';

const AnonymousNotice = () => (
  <Stack direction="row" alignItems="center" gap={1.25} sx={{
    fontSize: 12, color: 'text.secondary', bgcolor: '#1C252E', border: 1, borderColor: 'divider', borderRadius: 2, px: 1.5, py: 1
  }}>
    <Box component={IconInfoCircle} aria-hidden size={16} sx={{ flexShrink: 0, color: 'text.disabled' }}/>
    Anonymous players hidden. Ranks still count everyone, so numbers can skip.
  </Stack>
);

const BulkButton = ({ icon: Icon, disabled, onClick, buttonRef, children }) => (
  <Button ref={buttonRef} size="small" disabled={disabled} onClick={onClick} startIcon={<Icon size={14}/>}
          sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'none', minWidth: 0 }}>{children}</Button>
);

const CategoryTab = ({ category, index, lists, ranks, highlight, pinnedBase, onOpen, showAnonymous = true }) => {
  // Per visit: a collapsed section is not worth remembering across loads.
  const [collapsed, setCollapsed] = useState({});
  const baseId = useId();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const expandRef = useRef(null);
  const collapseRef = useRef(null);
  // The pressed button disables itself, which would drop keyboard focus on the page body: hand
  // focus to its opposite, which the same update enables.
  const setAll = (next, focusRef) => {
    flushSync(() => setCollapsed(next));
    focusRef.current?.focus();
  };
  const sections = index.categories[category]?.sections ?? [{ name: '', metrics: Object.keys(lists ?? {}) }];
  const showHeadings = sections.length > 1;
  const bestLabel = pinnedBase?.kind === 'logged' ? 'your best' : 'best';
  const allOpen = sections.every((section) => !collapsed[section.name]);
  const allClosed = sections.every((section) => collapsed[section.name]);
  return (
    <Stack gap={2}>
      {showAnonymous ? null : <AnonymousNotice/>}
      {showHeadings ? (
        <Stack direction="row" justifyContent="flex-end" gap={0.5}>
          <BulkButton icon={IconChevronsDown} disabled={allOpen} buttonRef={expandRef} onClick={() => setAll({}, collapseRef)}>Expand all</BulkButton>
          <BulkButton icon={IconChevronsUp} disabled={allClosed} buttonRef={collapseRef}
                      onClick={() => setAll(Object.fromEntries(sections.map((section) => [section.name, true])), expandRef)}>Collapse all</BulkButton>
        </Stack>
      ) : null}
      <Box>
        {sections.map((section, at) => {
          const open = !collapsed[section.name];
          const best = pinnedBase ? bestInSection(section.metrics, ranks) : null;
          const atMax = pinnedBase ? countAtMax(section.metrics, ranks, index) : 0;
          // Open sections breathe; a run of collapsed ones stays a tight list.
          const spaced = at > 0 && (open || !collapsed[sections[at - 1].name]);
          const sub = `${section.metrics.length} ${section.metrics.length === 1 ? 'board' : 'boards'}${best ? ` · ${bestLabel}: ${metaOf(index, best.key).label} ${rankText(best.r)}` : ''}${atMax ? ` · ${atMax} at the max` : ''}`;
          const panelId = `${baseId}-section-${at}`;
          const toggle = () => setCollapsed({ ...collapsed, [section.name]: open });
          return (
            <Box component="section" key={section.name || 'all'} sx={{ mt: spaced ? 2 : 0 }}>
              {showHeadings ? (
                // The whole row toggles on a click; the heading's button is the keyboard and screen
                // reader target, and its own click bubbles here, so a press toggles once.
                <Stack direction="row" alignItems="center" columnGap={1.5} rowGap={0.25} flexWrap="wrap" onClick={toggle}
                       sx={{ cursor: 'pointer', ...(open ? { mb: 2 } : { py: 1.5, borderTop: 1, borderColor: 'divider' }) }}>
                  <Typography component="h2" sx={{ fontSize: 15, fontWeight: 700, minWidth: 0 }}>
                    <ButtonBase aria-label={`${open ? 'Collapse' : 'Expand'} ${section.name}`} aria-expanded={open} aria-controls={panelId}
                                sx={{ gap: 1.5, font: 'inherit', textAlign: 'left', borderRadius: 1 }}>
                      <Box component="span" sx={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                        {open ? <IconChevronDown size={14} stroke={2.5}/> : <IconChevronRight size={14} stroke={2.5}/>}
                      </Box>
                      {section.name}
                    </ButtonBase>
                  </Typography>
                  {/* On a phone the summary drops under the title, lined up with it, rather than breaking it mid-phrase. */}
                  <Typography color="text.disabled" sx={{ fontSize: 12, flexBasis: { xs: '100%', sm: 'auto' }, pl: { xs: 5, sm: 0 } }}>{sub}</Typography>
                  {open ? <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider', display: { xs: 'none', sm: 'block' } }}/> : null}
                </Stack>
              ) : null}
              <Collapse in={open} id={panelId} timeout={reducedMotion ? 0 : 'auto'}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 22rem), 1fr))', gap: 2 }}>
                  {section.metrics.map((key) => (
                    <MetricCard key={key} meta={metaOf(index, key)} entries={lists?.[key]} highlight={highlight}
                                pinned={pinnedBase ? { ...pinnedBase, entry: ranks?.[key] } : null} onOpen={onOpen}/>
                  ))}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
};

export default CategoryTab;
