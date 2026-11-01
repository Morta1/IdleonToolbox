import React, { useRef, useState } from 'react';
import { useGoals } from '@components/goals/GoalsProvider';
import { notify } from '@components/common/Overlays/notify';
import { READ_ERROR } from '@components/dashboard/goals/ImportDialog';

// Remove goals with an Undo notice. Undo restores the removed goals as they were (ids and createdAt kept).
export const useGoalsUndo = () => {
  const { goals, removeMany, saveMany } = useGoals();

  const removeWithUndo = (ids, label) => {
    const wanted = new Set(ids);
    const removed = goals.filter(({ id }) => wanted.has(id));
    removeMany([...wanted]);
    notify(label, { undo: () => saveMany(removed) });
  };

  return { removeWithUndo };
};

// "idleon-goals-2026-10-21"
export const goalsFileName = (prefix) => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${prefix}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// A hidden file input and the text of the picked file; `text` stays null until a file is read
export const useGoalsFileImport = () => {
  const fileInput = useRef(null);
  const [text, setText] = useState(null);

  const onFile = (event) => {
    const [file] = event.target.files;
    // Cleared so picking the same file again still fires onChange
    event.target.value = '';
    if (!file) return;
    file.text().then(setText, () => setText(READ_ERROR));
  };

  const input = (
    <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFile} aria-label="Goals file"/>
  );

  return { input, pick: () => fileInput.current?.click(), text, close: () => setText(null) };
};
