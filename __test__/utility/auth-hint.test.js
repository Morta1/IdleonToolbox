// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_HINT_KEY, readAuthHint, writeAuthHint } from '@utility/auth-hint';

describe('auth hint', () => {
  beforeEach(() => localStorage.clear());

  it('is absent until written', () => {
    expect(readAuthHint()).toBeNull();
  });

  it('round-trips yes and no under the documented key', () => {
    writeAuthHint('yes');
    expect(readAuthHint()).toBe('yes');
    writeAuthHint('no');
    expect(localStorage.getItem(AUTH_HINT_KEY)).toBe('no');
  });

  it('treats blocked storage as absent rather than throwing', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readAuthHint()).toBeNull();
    spy.mockRestore();
  });
});
