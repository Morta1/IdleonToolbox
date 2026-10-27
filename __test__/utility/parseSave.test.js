import '../../polyfills';
import { parseData } from '@parsers/index';
import { parseSave } from '@utility/parseSave';

describe('parseSave', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });
  afterAll(() => vi.useRealTimers());

  it('parses on the main thread where Worker does not exist', async () => {
    expect(typeof Worker).toBe('undefined');
    expect(await parseSave(undefined, [], null, null, undefined, undefined, null))
      .toEqual(parseData(undefined, [], null, null, undefined, undefined, null));
  });
});
