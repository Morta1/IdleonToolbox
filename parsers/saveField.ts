import { tryToParse } from '@utility/helpers';

// Many save fields are JSON strings read by several parsers (Spelunk alone by 13), and the parse
// loop runs every parser three times. Decode each field once per save object instead.
const cache = new WeakMap<object, Map<string, unknown>>();

export const saveField = (idleonData: any, key: string): any => {
  if (!idleonData || typeof idleonData !== 'object') return tryToParse(idleonData?.[key]);
  let fields = cache.get(idleonData);
  if (!fields) {
    fields = new Map();
    cache.set(idleonData, fields);
  }
  if (!fields.has(key)) fields.set(key, tryToParse(idleonData[key]));
  return fields.get(key);
};

// parseData starts from a clean slate, so a parser that mutates a decoded field can never leak that
// change into a later parse of the same save object.
export const resetSaveFields = (idleonData: any) => {
  if (idleonData && typeof idleonData === 'object') cache.delete(idleonData);
};
