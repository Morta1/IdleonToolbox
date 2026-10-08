import { allTrackers } from './settingsModel';

export const trackSettingsEvent = (name, params = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, { event_category: 'dashboard', ...params });
};

export const resetScope = (model, prefix) => {
  if (!prefix) return 'all';
  if (model.some((tab) => tab.sections.some((section) => section.key === prefix))) return 'section';
  return allTrackers(model).some((tracker) => tracker.path === prefix) ? 'tracker' : 'option';
};
