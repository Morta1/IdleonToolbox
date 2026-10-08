import React, { useState } from 'react';
import { Button, Collapse, IconButton, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { IconChevronDown, IconChevronRight, IconChevronsDown, IconChevronsUp, IconInfoCircle } from '@tabler/icons-react';
import MetricCard from './MetricCard';
import { metaOf } from './format';
import { bestInSection, countAtMax } from './standing';

const AnonymousNotice = () => (
  <Stack direction="row" alignItems="center" gap={1.25} sx={{
    fontSize: 12, color: 'text.secondary', bgcolor: '#1C252E', border: 1, borderColor: 'divider', borderRadius: 2, px: 1.5, py: 1
  }}>
    <Box component={IconInfoCircle} aria-hidden size={16} sx={{ flexShrink: 0, color: 'text.disabled' }}/>
    Anonymous players hidden. Ranks still count everyone, so numbers can skip.
  </Stack>
);

const BulkButton = ({ icon: Icon, disabled, onClick, children }) => (
  <Button size="small" disabled={disabled} onClick={onClick} startIcon={<Icon size={14}/>}
          sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'none', minWidth: 0 }}>{children}</Button>
);

const CategoryTab = ({ category, index, lists, ranks, highlight, pinnedBase, onOpen, showAnonymous = true }) => {
  // Per visit: a collapsed section is not worth remembering across loads.
  const [collapsed, setCollapsed] = useState({});
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
          <BulkButton icon={IconChevronsDown} disabled={allOpen} onClick={() => setCollapsed({})}>Expand all</BulkButton>
          <BulkButton icon={IconChevronsUp} disabled={allClosed}
                      onClick={() => setCollapsed(Object.fromEntries(sections.map((section) => [section.name, true])))}>Collapse all</BulkButton>
        </Stack>
      ) : null}
      <Box>
        {sections.map((section, at) => {
          const open = !collapsed[section.name];
          const best = pinnedBase ? bestInSection(section.metrics, ranks) : null;
          const atMax = pinnedBase ? countAtMax(section.metrics, ranks, index) : 0;
          // Open sections breathe; a run of collapsed ones stays a tight list.
          const spaced = at > 0 && (open || !collapsed[sections[at - 1].name]);
          const sub = `${section.metrics.length} ${section.metrics.length === 1 ? 'board' : 'boards'}${best ? ` · ${bestLabel}: ${metaOf(index, best.key).label} #${best.r}` : ''}${atMax ? ` · ${atMax} at the max` : ''}`;
          return (
            <Box component="section" key={section.name || 'all'} sx={{ mt: spaced ? 2 : 0 }}>
              {showHeadings ? (
                <Stack direction="row" alignItems="center" gap={1.5} sx={open ? { mb: 2 } : { py: 1.5, borderTop: 1, borderColor: 'divider' }}>
                  <IconButton size="small" aria-label={`${open ? 'Collapse' : 'Expand'} ${section.name}`} aria-expanded={open}
                              onClick={() => setCollapsed({ ...collapsed, [section.name]: open })}
                              sx={{ width: 28, height: 28, color: 'text.secondary', borderRadius: 1 }}>
                    {open ? <IconChevronDown size={14} stroke={2.5}/> : <IconChevronRight size={14} stroke={2.5}/>}
                  </IconButton>
                  <Typography component="h2" sx={{ fontSize: 15, fontWeight: 700 }}>{section.name}</Typography>
                  <Typography color="text.disabled" sx={{ fontSize: 12 }}>{sub}</Typography>
                  {open ? <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider' }}/> : null}
                </Stack>
              ) : null}
              <Collapse in={open}>
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
