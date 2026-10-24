import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { closestCenter, DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';
import { moveSection } from '@utility/dashboard/sectionOrder';

export const SECTION_LABELS = { goals: 'Goals', account: 'Account', characters: 'Characters', timers: 'Timers' };

const KEY_STEPS = { ArrowLeft: -1, ArrowRight: 1 };

// dnd-kit's attributes (sortable role description, drag instructions) are left off: the button stays a plain
// toggle, Enter/Space toggle it and Alt+Arrow reorders it.
const SortableToggle = ({ value, children, onMove }) => {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: value });
  const handleKeyDown = (event) => {
    const step = KEY_STEPS[event.key];
    if (!event.altKey || !step) return;
    event.preventDefault();
    const group = event.currentTarget.parentElement;
    onMove(value, step);
    // ToggleButtonGroup keys its children by index, so the moved button remounts and loses focus
    requestAnimationFrame(() => group?.querySelector(`button[value="${value}"]`)?.focus());
  };
  return <ToggleButton ref={setNodeRef} value={value} {...listeners} onKeyDown={handleKeyDown}
                       aria-keyshortcuts={'Alt+ArrowLeft Alt+ArrowRight'}
                       sx={{
                         gap: 0.5,
                         touchAction: 'manipulation',
                         transform: CSS.Translate.toString(transform),
                         transition,
                         opacity: isDragging ? 0.5 : 1,
                         zIndex: isDragging ? 1 : 'auto',
                         // Hidden on phones, where the group would overflow: a long press still drags
                         '& .grip': { display: { xs: 'none', sm: 'block' }, opacity: 0.25, transition: 'opacity 0.15s' },
                         '&:hover .grip, &:focus-visible .grip': { opacity: 0.8 }
                       }}>
    <IconGripVertical className="grip" size={16}/>
    {children}
  </ToggleButton>;
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

  return <DndContext id={'dashboard-sections'} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <SortableContext items={order} strategy={horizontalListSortingStrategy}>
      <ToggleButtonGroup value={filters} onChange={onFilters}>
        {order.map((id) => <SortableToggle key={id} value={id} onMove={handleMove}>{SECTION_LABELS[id]}</SortableToggle>)}
      </ToggleButtonGroup>
    </SortableContext>
  </DndContext>;
};

export default SectionToggles;
