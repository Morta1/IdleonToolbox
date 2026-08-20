// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyBlob, copyText } from '@utility/clipboard';

const setClipboard = (value) => {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true, writable: true });
};

afterEach(() => {
  setClipboard(undefined);
  delete document.execCommand;
  delete globalThis.ClipboardItem;
  vi.restoreAllMocks();
});

describe('copyText', () => {
  it('uses the async Clipboard API when it works', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    document.execCommand = vi.fn();

    expect(await copyText('hello')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  // The reported failure mode: writeText rejects and the user is told nothing.
  it('falls back to execCommand when writeText rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) });
    document.execCommand = vi.fn().mockReturnValue(true);

    expect(await copyText('hello')).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('falls back to execCommand when the Clipboard API is missing', async () => {
    document.execCommand = vi.fn().mockReturnValue(true);

    expect(await copyText('hello')).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('reports failure when both paths fail', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('nope')) });
    document.execCommand = vi.fn().mockReturnValue(false);

    expect(await copyText('hello')).toBe(false);
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('reports failure without a value to copy', async () => {
    expect(await copyText(null)).toBe(false);
  });
});

describe('copyBlob', () => {
  it('writes the blob through the Clipboard API', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    setClipboard({ write });
    globalThis.ClipboardItem = class {
      constructor(items) {
        this.items = items;
      }
    };

    expect(await copyBlob(new Blob(['x'], { type: 'image/png' }))).toBe(true);
    expect(write).toHaveBeenCalled();
  });

  it('reports failure when ClipboardItem is unsupported', async () => {
    setClipboard({ write: vi.fn() });

    expect(await copyBlob(new Blob(['x'], { type: 'image/png' }))).toBe(false);
  });

  it('reports failure when the write rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    setClipboard({ write: vi.fn().mockRejectedValue(new Error('NotAllowedError')) });
    globalThis.ClipboardItem = class {};

    expect(await copyBlob(new Blob(['x'], { type: 'image/png' }))).toBe(false);
  });

  it('reports failure without a blob', async () => {
    expect(await copyBlob(null)).toBe(false);
  });
});
