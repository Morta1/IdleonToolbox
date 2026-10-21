import React, { useRef, useState } from 'react';
import { useGoals } from '@components/goals/GoalsProvider';
import UndoSnackbar from '@components/dashboard/settings/UndoSnackbar';
import { READ_ERROR } from '@components/dashboard/goals/ImportDialog';

// Never null: React Compiler reads the fields a callback uses while memoizing it, before any null check runs
const NO_UNDO = { label: '', goals: [] };

// Remove goals with an Undo snackbar. Undo restores the removed goals as they were (ids and createdAt kept).
// `undoSnackbar` is null while there is nothing to undo; its own key restarts its timer on each removal only.
export const useGoalsUndo = () => {
  const { goals, removeMany, saveMany } = useGoals();
  const [undo, setUndo] = useState(NO_UNDO);
  const [undoCount, setUndoCount] = useState(0);

  const removeWithUndo = (ids, label) => {
    const removed = new Set(ids);
    removeMany([...removed]);
    setUndo({ label, goals: goals.filter(({ id }) => removed.has(id)) });
    setUndoCount(undoCount + 1);
  };

  const onUndo = () => {
    saveMany(undo.goals);
    setUndo(NO_UNDO);
  };

  const undoSnackbar = undo.goals.length ? (
    <UndoSnackbar key={undoCount} label={undo.label} onUndo={onUndo} onClose={() => setUndo(NO_UNDO)} stacked/>
  ) : null;

  return { removeWithUndo, undoSnackbar };
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
