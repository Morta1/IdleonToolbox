import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';

export const SECTION_LABELS = { goals: 'Goals', account: 'Account', characters: 'Characters', timers: 'Timers' };

// ToggleButtonGroup injects selected/onChange/className into its children, so they pass through to the button.
const SortableToggle = ({ value, children, ...props }) => {
  // The button already has its own role and aria-pressed (the visibility toggle); keep dnd-kit's other attributes.
  const { attributes: { role, 'aria-pressed': pressed, ...attributes }, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: value });
  return <ToggleButton ref={setNodeRef} value={value} {...props} {...attributes} {...listeners}
                       sx={{
                         gap: 0.5,
                         touchAction: 'manipulation',
                         transform: CSS.Translate.toString(transform),
                         transition,
                         opacity: isDragging ? 0.5 : 1,
                         zIndex: isDragging ? 1 : 'auto',
                         '& .grip': { opacity: 0.25, transition: 'opacity 0.15s' },
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
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(order, order.indexOf(active.id), order.indexOf(over.id)));
  };

  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <SortableContext items={order} strategy={horizontalListSortingStrategy}>
      <ToggleButtonGroup value={filters} onChange={onFilters}>
        {order.map((id) => <SortableToggle key={id} value={id}>{SECTION_LABELS[id]}</SortableToggle>)}
      </ToggleButtonGroup>
    </SortableContext>
  </DndContext>;
};

export default SectionToggles;
