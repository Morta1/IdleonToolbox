import React, { useState } from 'react';
import { Collapse, IconButton, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import MetricCard from './MetricCard';
import { metaOf } from './format';
import { bestInSection } from './standing';

const CategoryTab = ({ category, index, lists, ranks, highlight, pinnedBase, onOpen }) => {
  // Per visit: a collapsed section is not worth remembering across loads.
  const [collapsed, setCollapsed] = useState({});
  const sections = index.categories[category]?.sections ?? [{ name: '', metrics: Object.keys(lists ?? {}) }];
  const showHeadings = sections.length > 1;
  const bestLabel = pinnedBase?.kind === 'logged' ? 'your best' : 'best';
  return (
    <Stack gap={3}>
      {sections.map((section) => {
        const open = !collapsed[section.name];
        const best = pinnedBase ? bestInSection(section.metrics, ranks) : null;
        return (
          <Box component="section" key={section.name || 'all'}>
            {showHeadings ? (
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                <IconButton size="small" aria-label={`${open ? 'Collapse' : 'Expand'} ${section.name}`} aria-expanded={open}
                            onClick={() => setCollapsed({ ...collapsed, [section.name]: open })}>
                  {open ? <IconChevronDown size={16}/> : <IconChevronRight size={16}/>}
                </IconButton>
                <Typography variant="h6" component="h2">{section.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {`${section.metrics.length} ${section.metrics.length === 1 ? 'board' : 'boards'}${best ? ` · ${bestLabel}: ${metaOf(index, best.key).label} #${best.r}` : ''}`}
                </Typography>
              </Stack>
            ) : null}
            <Collapse in={open}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: 2 }}>
                {section.metrics.map((key) => (
                  <MetricCard key={key} meta={metaOf(index, key)} entries={lists?.[key]} highlight={highlight}
                              pinned={pinnedBase ? { ...pinnedBase, entry: ranks?.[key] } : null} onOpen={onOpen}/>
                ))}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  );
};

export default CategoryTab;
