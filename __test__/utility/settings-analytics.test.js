import '../../polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { resolveTrackers } from '@utility/dashboard/trackerStore';
import { buildModel } from '@utility/dashboard/settingsModel';
import { resetScope, trackSettingsEvent } from '@utility/dashboard/settingsAnalytics';

const model = buildModel(resolveTrackers(baseTrackers, {}), baseTrackers, {});

describe('trackSettingsEvent', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('does nothing without gtag', () => {
    expect(() => trackSettingsEvent('alert_settings_opened', { source: 'button' })).not.toThrow();
  });

  it('sends the event under the dashboard category', () => {
    const gtag = vi.fn();
    globalThis.window = { gtag };
    trackSettingsEvent('alert_settings_opened', { source: 'alert' });
    expect(gtag).toHaveBeenCalledWith('event', 'alert_settings_opened', { event_category: 'dashboard', source: 'alert' });
  });
});

describe('resetScope', () => {
  it('names what a reset prefix covers', () => {
    expect(resetScope(model, null)).toBe('all');
    expect(resetScope(model, 'account.World 3')).toBe('section');
    expect(resetScope(model, 'characters')).toBe('section');
    expect(resetScope(model, 'account.World 3.construction')).toBe('tracker');
    expect(resetScope(model, 'account.World 3.construction.materials')).toBe('option');
  });
});
