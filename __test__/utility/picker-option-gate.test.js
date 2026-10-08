import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getGeneralAlerts, getOptions } from '../../utility/dashboard/account';

// The settings window shows a checkbox on picker options; it must turn the alert off, not only the items.
const tasksSection = (checked) => ({
  tasks: { checked: true, options: [{ name: 'tasks', checked, type: 'array', props: { value: { 1: true, 2: true } } }] }
});
const account = { tasksDescriptions: [Array(9).fill({ level: 0 }), Array(9).fill({ level: 0 })] };
const tasksAlert = (checked) => {
  const section = tasksSection(checked);
  return getGeneralAlerts(account, section, getOptions(section), [])?.tasks;
};

describe('picker option checkbox', () => {
  it('Daily tasks alert follows its option checkbox', () => {
    expect(tasksAlert(true)).toEqual([0, 1]);
    expect(tasksAlert(false)).toBeUndefined();
  });
});
