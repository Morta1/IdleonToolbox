import { describe, expect, it } from 'vitest';
import { items } from '@website-data';
import { CROWD_PACE, helloSpots, lastSpots, sampleCrew, stageUnit, walkIn } from '@components/common/WhatsNew/storyCrew';
import { loadoutFromCharacter } from '@utility/wardrobeQuery';

const WIDTH = 1366;
const HEIGHT = 768;

describe('the crowd walking in', () => {
  it.each([
    ['first slide, wide', helloSpots, false],
    ['last slide, wide', lastSpots, false],
    ['first slide, phone', helloSpots, true],
    ['last slide, phone', lastSpots, true]
  ])('%s: the sheets face right, so only those coming from the right are mirrored, and all start off stage', (_, spots, phone) => {
    const unit = stageUnit(WIDTH, HEIGHT, phone);
    for (const count of [1, 3, 5, 11, 12]) {
      for (const { side, mirrored, x, w, from } of walkIn(spots(count, phone), WIDTH, unit)) {
        const left = (x / 100) * WIDTH;
        expect(mirrored).toBe(side === 'right');
        expect(left + from + (side === 'left' ? w * unit : 0)).toBeCloseTo(side === 'left' ? 0 : WIDTH);
      }
    }
  });

  it('the feet keep up with the ground: every walker covers CROWD_PACE of its width each second', () => {
    const unit = stageUnit(WIDTH, HEIGHT, false);
    for (const { from, duration, w } of walkIn(helloSpots(11, false), WIDTH, unit)) {
      expect(Math.abs(from) / (duration / 1000)).toBeCloseTo(w * unit * CROWD_PACE);
    }
  });

  it('nobody crosses anybody: on each side, whoever has further to go leaves first', () => {
    const walkers = walkIn(lastSpots(11, false), WIDTH, stageUnit(WIDTH, HEIGHT, false));
    for (const side of ['left', 'right']) {
      const group = walkers.filter((walker) => walker.side === side).sort((a, b) => a.delay - b.delay);
      group.slice(1).forEach((walker, at) => expect(Math.abs(walker.from)).toBeLessThan(Math.abs(group[at].from)));
    }
  });
});

describe('who walks', () => {
  it('the no-save crew wears only gear that exists', () => {
    for (const { name, pose, companion, ...slots } of sampleCrew(items)) {
      expect(name).toBeTruthy();
      for (const item of Object.values(slots)) expect(Number.isFinite(item?.ID)).toBe(true);
    }
  });

  it('a character is dressed from its own equipment, with the premium hat over the normal one, and without a pet', () => {
    const equipment = [];
    equipment[0] = { rawName: 'EquipmentHats1' };
    equipment[1] = { rawName: 'EquipmentBows4' };
    expect(loadoutFromCharacter({ name: 'Some One!', equipment }, items)).toMatchObject({
      name: 'SomeOne', hat: items.EquipmentHats1, weapon: items.EquipmentBows4, cape: null, companion: null
    });
    equipment[8] = { rawName: 'EquipmentHats16' };
    expect(loadoutFromCharacter({ name: 'A', equipment }, items).hat).toEqual(items.EquipmentHats16);
    equipment[8] = { rawName: 'EquipmentHats38' };
    expect(loadoutFromCharacter({ name: 'A', equipment }, items).hat).toEqual(items.EquipmentHats1);
  });
});
