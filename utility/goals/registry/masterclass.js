import { cleanUpgradeName } from './names';
import { MASTERCLASS_PLACEHOLDER, realCap } from '../caps';

// Grimoire, compass and tesseract share one upgrade shape; only the list, route and icon differ.
export const masterclassDescriptor = ({ system, label, route, list, icon }) => ({
  system,
  label,
  entryLabel: 'upgrade',
  scope: 'account',
  route,
  list,
  key: (row) => String(row.index),
  name: (row) => cleanUpgradeName(row.name),
  icon,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level,
      max: (row) => realCap(row.x4, MASTERCLASS_PLACEHOLDER),
      steps: [5, 10]
    }
  }
});
