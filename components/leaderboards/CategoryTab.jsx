import React, { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button, ButtonBase, Collapse, Stack, Typography, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import { IconChevronDown, IconChevronRight, IconChevronsDown, IconChevronsUp } from '@tabler/icons-react';
import CardGrid from '@components/common/cards/CardGrid';
import { formatNum } from '@utility/helpers';
import MetricCard from './MetricCard';
import { metaOf, rankText } from './format';
import { bestInSection, countAtMax } from './standing';
import Notice from '@components/common/Notice';

const BulkButton = ({ icon: Icon, disabled, onClick, buttonRef, children }) => (
  <Button ref={buttonRef} size="small" disabled={disabled} onClick={onClick} startIcon={<Icon size={14}/>}
          sx={{ color: 'text.secondary', minWidth: 0 }}>{children}</Button>
);

// revealMetric: the board open in the drawer. A board jumped to inside a collapsed section opens
// that section, so closing the drawer lands on the card instead of a hidden one.
// linkPlayer: the ?player= to keep in each card's href, for a middle click or a copied link.
const CategoryTab = ({ category, index, lists, ranks, highlight, pinnedBase, onOpen, showAnonymous = true, revealMetric = null, linkPlayer = null }) => {
  // Per visit: a collapsed section is not worth remembering across loads.
  const [collapsed, setCollapsed] = useState({});
  const baseId = useId();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const sections = index.categories[category]?.sections ?? [{ name: '', metrics: Object.keys(lists ?? {}) }];
  // A board newly in the drawer opens its section once; the player can still fold it after. Adjusted during render.
  const [revealed, setRevealed] = useState(null);
  if (revealMetric !== revealed) {
    setRevealed(revealMetric);
    const section = sections.find((entry) => entry.metrics.includes(revealMetric));
    if (section && collapsed[section.name]) setCollapsed({ ...collapsed, [section.name]: false });
  }
  const expandRef = useRef(null);
  const collapseRef = useRef(null);
  // The pressed button disables itself, which would drop keyboard focus on the page body: hand
  // focus to its opposite, which the same update enables.
  const setAll = (next, focusRef) => {
    flushSync(() => setCollapsed(next));
    focusRef.current?.focus();
  };
  // A tab the run left with no boards: a note in place of an empty grid.
  if (!sections.some((section) => section.metrics.length)) return <Notice>No boards in this tab yet.</Notice>;
  const showHeadings = sections.length > 1;
  const bestLabel = pinnedBase?.kind === 'logged' ? 'your best' : 'best';
  const allOpen = sections.every((section) => !collapsed[section.name]);
  const allClosed = sections.every((section) => collapsed[section.name]);
  return (
    <Stack gap={2}>
      {showAnonymous ? null : <Notice tone={'info'}>Anonymous players hidden. Ranks still count everyone, so numbers can skip.</Notice>}
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
          const sub = `${formatNum(section.metrics.length, 'whole')} ${section.metrics.length === 1 ? 'board' : 'boards'}${best ? ` · ${bestLabel}: ${metaOf(index, best.key).label} ${rankText(best.r)}` : ''}${atMax ? ` · ${formatNum(atMax, 'whole')} at the max` : ''}`;
          const panelId = `${baseId}-section-${at}`;
          const toggle = () => setCollapsed({ ...collapsed, [section.name]: open });
          return (
            <Box component="section" key={section.name || 'all'} sx={{ mt: spaced ? 2 : 0 }}>
              {showHeadings ? (
                // The whole row toggles on a click; the heading's button is the keyboard and screen
                // reader target, and its own click bubbles here, so a press toggles once.
                <Stack direction="row" alignItems="center" columnGap={1.5} rowGap={0.25} flexWrap="wrap" onClick={toggle}
                       sx={{ cursor: 'pointer', ...(open ? { mb: 2 } : { py: 1.5, borderTop: 1, borderColor: 'divider' }) }}>
                  <Typography variant="sectionTitle" component="h2" sx={{ minWidth: 0 }}>
                    <ButtonBase aria-label={`${open ? 'Collapse' : 'Expand'} ${section.name}`} aria-expanded={open} aria-controls={panelId}
                                sx={{ gap: 1.5, font: 'inherit', textAlign: 'left', borderRadius: 1 }}>
                      <Box component="span" sx={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                        {open ? <IconChevronDown size={14} stroke={2.5}/> : <IconChevronRight size={14} stroke={2.5}/>}
                      </Box>
                      {section.name}
                    </ButtonBase>
                  </Typography>
                  {/* On a phone the summary drops under the title, lined up with it, rather than breaking it mid-phrase. */}
                  <Typography variant="caption" color="text.muted" sx={{ flexBasis: { xs: '100%', sm: 'auto' }, pl: { xs: 5, sm: 0 } }}>{sub}</Typography>
                  {open ? <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider', display: { xs: 'none', sm: 'block' } }}/> : null}
                </Stack>
              ) : null}
              <Collapse in={open} id={panelId} timeout={reducedMotion ? 0 : 'auto'}>
                <CardGrid size="m">
                  {section.metrics.map((key) => (
                    <MetricCard key={key} meta={metaOf(index, key)} entries={lists?.[key]} highlight={highlight} linkPlayer={linkPlayer}
                                pinned={pinnedBase ? { ...pinnedBase, entry: ranks?.[key] } : null} onOpen={onOpen}/>
                  ))}
                </CardGrid>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
};

export default CategoryTab;
