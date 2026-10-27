import '../../polyfills';
import { parseData } from '@parsers/index';
import { parseSave } from '@utility/parseSave';

describe('parseSave', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });
  afterAll(() => vi.useRealTimers());

  const emptyArgs = [undefined, [], null, null, undefined, undefined, null];

  it('parses on the main thread where Worker does not exist', async () => {
    expect(typeof Worker).toBe('undefined');
    expect(await parseSave(...emptyArgs)).toEqual(parseData(...emptyArgs));
  });

  it('ignores a worker from another build and parses on the main thread', async () => {
    vi.stubEnv('NEXT_PUBLIC_WORKERS', JSON.stringify({ parse: { file: 'parse.aaa.js', version: 'aaa' } }));
    vi.stubGlobal('Worker', class {
      postMessage({ id }) {
        queueMicrotask(() => this.onmessage({ data: { id, version: 'bbb', result: 'from a stale worker' } }));
      }
      terminate() {}
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.resetModules();
    try {
      const { parseSave: withWorker } = await import('@utility/parseSave');
      expect(await withWorker(...emptyArgs)).toEqual(parseData(...emptyArgs));
      expect(consoleError).toHaveBeenCalledWith('[parseSave] parsing on the main thread:', 'worker version bbb, page expects aaa');
    } finally {
      consoleError.mockRestore();
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
