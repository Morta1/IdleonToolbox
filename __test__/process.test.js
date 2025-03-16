import '../polyfills';
import 'core-js/modules/web.structured-clone';
import { parseData } from '@parsers/index';
import first from './fixtures/first.json';
import second from './fixtures/first.json';
import third from './fixtures/first.json';
import fourth from './fixtures/first.json';

describe('Check different configuration processing', () => {
  it('Checks first json', () => {
    const { data, charNames, companion, guildData, serverVars } = first;
    const result = parseData(data, charNames, companion, guildData, serverVars);
    expect(result).toBeDefined();
  })
  it('Checks second json', () => {
    const { data, charNames, companion, guildData, serverVars } = second;
    const result = parseData(data, charNames, companion, guildData, serverVars);
    expect(result).toBeDefined();
  })
  it('Checks third json', () => {
    const { data, charNames, companion, guildData, serverVars } = third;
    const result = parseData(data, charNames, companion, guildData, serverVars);
    expect(result).toBeDefined();
  })
  it('Checks fourth json', () => {
    const { data, charNames, companion, guildData, serverVars } = fourth;
    const result = parseData(data, charNames, companion, guildData, serverVars);
    expect(result).toBeDefined();
  })
})