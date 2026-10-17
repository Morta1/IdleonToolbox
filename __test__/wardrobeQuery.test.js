import { describe, expect, it } from 'vitest';
import { decodeLoadout, DEFAULT_NAME, encodeLoadout, sanitiseName } from '../utility/wardrobeQuery';

const items = {
  EquipmentHats1: { rawName: 'EquipmentHats1', ID: 4, Type: 'HELMET' },
  EquipmentBows1: { rawName: 'EquipmentBows1', ID: 1, Type: 'BOW' },
  EquipmentCape0: { rawName: 'EquipmentCape0', ID: 1, Type: 'CAPE' },
  EquipmentGown0: { rawName: 'EquipmentGown0', ID: 1, Type: 'ATTIRE' },
  EquipmentShirts1: { rawName: 'EquipmentShirts1', ID: 3, Type: 'SHIRT' },
  Trophy6: { rawName: 'Trophy6', ID: 6, Type: 'TROPHY' },
  TrophyReplica6: { rawName: 'TrophyReplica6', ID: 6, Type: 'REPLICA_TROPHY' },
  EquipmentNametag1: { rawName: 'EquipmentNametag1', ID: 1, Type: 'NAMETAG' },
  EquipmentNametagReplica43: { rawName: 'EquipmentNametagReplica43', ID: 43, Type: 'REPLICA_NAMETAG' }
};
const emptySlots = { hat: null, weapon: null, cape: null, costume: null, trophy: null, nametag: null, companion: null };
const companions = [
  { name: 'Dedotated_Ram', rawName: 'ram', bonus: 1 },
  { name: 'Rift_Slug', rawName: 'rift2', bonus: 25 }
];

describe('encodeLoadout', () => {
  it('writes only the set slots plus the pose', () => {
    expect(encodeLoadout({ ...emptySlots, pose: '2b', hat: items.EquipmentHats1 }))
      .toEqual({ pose: '2b', hat: 'EquipmentHats1' });
  });
  it('writes the trophy and the nametag alongside the drawn slots', () => {
    expect(encodeLoadout({ ...emptySlots, pose: '0', trophy: items.TrophyReplica6, nametag: items.EquipmentNametag1, name: 'mortastr' }))
      .toEqual({ trophy: 'TrophyReplica6', nametag: 'EquipmentNametag1', name: 'mortastr' });
  });
  // An untouched loadout encodes to an empty query, so the page skips the mirror replace.
  it.each([
    ['an empty name', { name: '' }],
    ['the default idle pose', {}],
    ['the default name', { name: DEFAULT_NAME }]
  ])('omits %s', (_label, extra) => {
    expect(encodeLoadout({ ...emptySlots, pose: '0', ...extra })).toEqual({});
  });
  it('keeps the virtual attack pose so a shared link round-trips', () => {
    expect(encodeLoadout({ ...emptySlots, pose: 'attack' }).pose).toBe('attack');
  });
  it('never writes a class: the loadout does not carry one any more', () => {
    expect(encodeLoadout({ ...emptySlots, className: 'Archer', pose: '0' })).toEqual({});
    expect('class' in encodeLoadout({ ...emptySlots, className: 'Archer', pose: 'attack', hat: items.EquipmentHats1 })).toBe(false);
  });
  it('keeps a custom name', () => {
    expect(encodeLoadout({ ...emptySlots, name: 'Mortastr', pose: '0' })).toEqual({ name: 'Mortastr' });
  });
});

describe('the companion slot', () => {
  it('round trips through the query by monster raw name', () => {
    const loadout = decodeLoadout({ companion: 'ram' }, items, companions);
    expect(loadout.companion).toMatchObject({ rawName: 'ram', displayName: 'Dedotated_Ram' });
    expect(encodeLoadout({ ...emptySlots, pose: '0', companion: loadout.companion })).toEqual({ companion: 'ram' });
  });
  it('resolves an unknown raw name, and a missing param, to null', () => {
    expect(decodeLoadout({ companion: 'notACompanion' }, items, companions).companion).toBe(null);
    expect(decodeLoadout({}, items, companions).companion).toBe(null);
  });
  it('is null when the page has no companion list to resolve against', () => {
    expect(decodeLoadout({ companion: 'ram' }, items).companion).toBe(null);
  });
});

describe('sanitiseName', () => {
  it('keeps alphanumerics only, capped at 16, and never returns null', () => {
    expect(sanitiseName('Mor 123_!')).toBe('Mor123');
    expect(sanitiseName('aaaaaaaaaaaaaaaaaaaa')).toBe('aaaaaaaaaaaaaaaa');
    expect(sanitiseName(undefined)).toBe('');
  });
});

describe('decodeLoadout', () => {
  it('resolves raw names to items and validates the slot type', () => {
    const loadout = decodeLoadout({ hat: 'EquipmentHats1', weapon: 'EquipmentBows1', cape: 'EquipmentCape0', costume: 'EquipmentGown0', trophy: 'Trophy6', nametag: 'EquipmentNametag1', name: 'mortastr', pose: '1' }, items);
    expect(loadout).toEqual({
      pose: '1', name: 'mortastr',
      hat: items.EquipmentHats1, weapon: items.EquipmentBows1, cape: items.EquipmentCape0, costume: items.EquipmentGown0,
      trophy: items.Trophy6, nametag: items.EquipmentNametag1, companion: null
    });
  });
  it('drops unknown names, wrong-slot items and bad poses', () => {
    const loadout = decodeLoadout({ hat: 'EquipmentShirts1', weapon: 'Missing', trophy: 'EquipmentCape0', pose: 'zzz' }, items);
    expect(loadout).toEqual({ ...emptySlots, pose: '0', name: DEFAULT_NAME });
  });
  it('never returns a class, even when the URL still carries one', () => {
    expect('className' in decodeLoadout({ class: 'Archer' }, items)).toBe(false);
  });
  it.each([
    ['trophy', 'TrophyReplica6'],
    ['nametag', 'EquipmentNametagReplica43']
  ])('accepts a replica in the %s slot', (slot, rawName) => {
    expect(decodeLoadout({ [slot]: rawName }, items)[slot]).toBe(items[rawName]);
  });
  it('strips anything a name cannot hold, caps it at 16 and falls back to the default', () => {
    expect(decodeLoadout({ name: 'mor tastr!<b>' }, items).name).toBe('mortastrb');
    expect(decodeLoadout({ name: 'abcdefghijklmnopqrstuvwxyz' }, items).name).toBe('abcdefghijklmnop');
    expect(decodeLoadout({ name: '???' }, items).name).toBe(DEFAULT_NAME);
    expect(decodeLoadout({}, items).name).toBe(DEFAULT_NAME);
  });
  it('accepts only the three poses the page offers, the virtual attack pose included', () => {
    expect(decodeLoadout({ pose: 'attack' }, items).pose).toBe('attack');
    expect(decodeLoadout({ pose: '1' }, items).pose).toBe('1');
    // A skilling pose the page does not offer falls back to idle rather than stranding it on a
    // pose with no button.
    expect(decodeLoadout({ pose: '5' }, items).pose).toBe('0');
    expect(decodeLoadout({ pose: '2b' }, items).pose).toBe('0');
  });
  it('takes the first value when Next hands an array', () => {
    expect(decodeLoadout({ name: ['Mortastr', 'Other'] }, items).name).toBe('Mortastr');
  });
});
