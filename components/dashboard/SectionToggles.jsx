import React from 'react';
import { Stack } from '@mui/material';
import { closestCenter, DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';
import { moveSection } from '@utility/dashboard/sectionOrder';
import { FilterPill } from '@components/common/Toolbar';

export const SECTION_LABELS = { goals: 'Goals', account: 'Account', characters: 'Characters', timers: 'Timers' };

const KEY_STEPS = { ArrowLeft: -1, ArrowRight: 1 };

// A Filter pill that also drags. dnd-kit's attributes (sortable role description, drag instructions) are left off: the
// button stays a plain toggle, Enter/Space toggle it and Alt+Arrow reorders it.
const SortableToggle = ({ value, label, on, onToggle, onMove }) => {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: value });
  const handleKeyDown = (event) => {
    const step = KEY_STEPS[event.key];
    if (!event.altKey || !step) return;
    event.preventDefault();
    const group = event.currentTarget.parentElement;
    onMove(value, step);
    // Moving a focused button in the DOM can drop its focus
    requestAnimationFrame(() => group?.querySelector(`button[value="${value}"]`)?.focus());
  };
  return <FilterPill ref={setNodeRef} value={value} on={on} label={label} onToggle={onToggle} {...listeners} onKeyDown={handleKeyDown}
                     aria-keyshortcuts={'Alt+ArrowLeft Alt+ArrowRight'}
                     sx={{
                       // A phone's row fits the four pills on one line at 384
                       px: { xs: 0.75, sm: 1.75 },
                       gap: { xs: 0.5, sm: 0.75 },
                       fontSize: { xs: 13, sm: 14 },
                       position: 'relative',
                       touchAction: 'manipulation',
                       transform: CSS.Translate.toString(transform),
                       transition,
                       opacity: isDragging ? 0.5 : 1,
                       zIndex: isDragging ? 1 : 'auto',
                       // In the pill's left padding, so showing it moves nothing. No grip on a phone: a long press still drags
                       '& .grip': { display: { xs: 'none', sm: 'block' }, position: 'absolute', left: 1, top: 'calc(50% - 6px)', opacity: 0, transition: 'opacity 0.15s' },
                       '&:hover .grip, &:focus-visible .grip': { opacity: 0.8 }
                     }}>
    <IconGripVertical className="grip" size={12}/>
  </FilterPill>;
};

// Mouse rather than pointer: a pointer sensor claims touches too, and the browser's pan then cancels them
const SectionToggles = ({ order, filters, onFilters, onReorder }) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(order, order.indexOf(active.id), order.indexOf(over.id)));
  };

  const handleMove = (id, step) => {
    const next = moveSection(order, id, step);
    if (next !== order) onReorder(next);
  };

  const toggle = (event, id) => onFilters(event, filters.includes(id) ? filters.filter((filter) => filter !== id) : [...filters, id]);

  return <DndContext id={'dashboard-sections'} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <SortableContext items={order} strategy={horizontalListSortingStrategy}>
      <Stack role={'group'} aria-label={'Sections to show'} direction={'row'} gap={{ xs: 0.5, sm: '10px' }} flexWrap={'wrap'}>
        {order.map((id) => <SortableToggle key={id} value={id} label={SECTION_LABELS[id]} on={filters.includes(id)}
                                           onToggle={(event) => toggle(event, id)} onMove={handleMove}/>)}
      </Stack>
    </SortableContext>
  </DndContext>;
};

export default SectionToggles;
