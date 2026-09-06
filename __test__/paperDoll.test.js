import { describe, expect, it } from 'vitest';
import { attackPoseForType, CANVAS, COMPANION_DX, COMPANION_SCALE, drawOrder, frameAt, OUTFIT_POSES, PLAYER_REACH_LEFT, PLAYER_REACH_UP, POSES, resolveLayers, GAME_SCALE, HAT_OFFSET, MAX_FRAME_MS, playbackDurations, scaledOffset } from '../utility/paperDoll';
import { nameLabelOps } from '../utility/nameLabel';
import realManifest from '../data/player-sprites-manifest.json';

const sheet = (file, numFrames, across, frameW = 94, frameH = 50, durations) => ({
  file, across, down: Math.ceil(numFrames / across), numFrames, frameW, frameH,
  originX: Math.round(frameW / 2), originY: frameH, durations: durations ?? Array(numFrames).fill(100)
});

// Mirrors the shape Task 2 writes, sized like the synthetic z-processing fixture.
const manifest = {
  version: 'x', frameW: 94, frameH: 50, hatFrameOffset: 2,
  weaponTypeOffsets: { FISTICUFF: 0, SPEAR: 2, BOW: 4, WAND: 5 },
  // One hardcoded base per body animation, exactly as the game's shirt actor carries them.
  // 'hold' deliberately has none, so a pose the game never dresses is reported unsupported.
  costumeFrameBase: { '0': 0, '1': 5, '2a': 11, '2b': 22, '2c': 35, '2_': 48, '4': 65 },
  // Per-frame hat nudges, straight out of the game's AnimationOffsets table (see
  // reference_player_render_layers.md). Pose '0' deliberately carries none, so it must fall back
  // to just the own-origin anchor + HAT_OFFSET.
  hatOffsets: { '1': { x: [0, 2, 3, 2, 0, 0], y: [0, -1, -2, -1, 0, 0] } },
  // The weapon actor sits at the body's top-left plus a flat per-animation offset (N.js's weapon
  // chain); idle ('0') carries no entry, only the hardcoded frame bob.
  weaponOffsets: { '2a': { dx: -28, dy: -40 }, '2_': { dx: 14, dy: 11 } },
  // CustomMaps.XYoffsetCape: x/y per BODY frame, added to the body's top-left.
  capeOffsets: { '0': { x: [0, 0, 0, 0, 0], y: [1, 0, 0, 1, 1] } },
  layers: {
    body: { '0': sheet('body/0.png', 5, 3), '1': sheet('body/1.png', 6, 3), '2a': sheet('body/2a.png', 11, 4),
            '2b': sheet('body/2b.png', 13, 4), '2c': sheet('body/2c.png', 13, 4), '2_': sheet('body/2_.png', 17, 5),
            '4': sheet('body/4.png', 4, 2), '5': sheet('body/5.png', 12, 4),
            // Real sheets carry 5000-10000ms hold frames the game jumps over; this fixture mirrors
            // that shape for the MAX_FRAME_MS clamp test.
            hold: sheet('body/hold.png', 3, 3, 94, 50, [100, 10000, 100]) },
    hat: { '1': sheet('hat/1.png', 8, 4, 30, 50), '4': sheet('hat/4.png', 8, 4, 30, 50) },

    weapon: { '0': sheet('weapon/0.png', 7, 8), '1': sheet('weapon/1.png', 7, 8),
              '2a': sheet('weapon/2a.png', 22, 14, 152, 110), '2b': sheet('weapon/2b.png', 13, 13),
              '2c': sheet('weapon/2c.png', 13, 13), '2_': sheet('weapon/2_.png', 51, 15),
              // Climb reads its own sheet, laid out like the idle one (type offset + ID).
              '4': sheet('weapon/4.png', 7, 8) },
    // Cape sheets share the body's frame size and origin in the real manifest; '2' mirrors the
    // handful that are taller, so the scale-2 pivot is exercised on a differing origin too.
    cape: { '1': sheet('cape/1.png', 6, 3), '2': sheet('cape/2.png', 6, 3, 94, 74) },
    costume: { '1': sheet('costume/1.png', 66, 13) },
    // Companion strips are one row wide, drawn at half size and mirrored around their own origin
    // (ram: 90x70 frames, origin 45/70). 'nobounds' mirrors a manifest generated before the strips
    // carried bounds, which placement no longer reads.
    companion: {
      ram: { file: 'companion/ram.png', across: 5, down: 1, numFrames: 5, frameW: 90, frameH: 70, originX: 45, originY: 70, durations: [400, 110, 200, 110, 110], bounds: { left: 15, right: 69, top: 25, bottom: 69 } },
      nobounds: { file: 'companion/nobounds.png', across: 1, down: 1, numFrames: 1, frameW: 40, frameH: 40, originX: 20, originY: 40, durations: [100] }
    }
  }
};

const spear = { rawName: 'EquipmentSword2', ID: 2, Type: 'SPEAR' };
const bow = { rawName: 'EquipmentBows1', ID: 1, Type: 'BOW' };
const fists = { rawName: 'EquipmentPunching1', ID: 1, Type: 'FISTICUFF' };
const hat = { rawName: 'EquipmentHats2', ID: 1, Type: 'PREMIUM_HELMET' };
const cape = { rawName: 'EquipmentCape0', ID: 1, Type: 'CAPE' };
const tallCape = { rawName: 'EquipmentCape2', ID: 2, Type: 'CAPE' };
const costume = { rawName: 'EquipmentGown0', ID: 1, Type: 'ATTIRE' };
const base = { pose: '0', hat: null, weapon: null, cape: null, costume: null, companion: null };
const ram = { rawName: 'ram', displayName: 'Dedotated_Ram' };
const byFile = (layers, prefix) => layers.find((l) => l.file.startsWith(prefix));

describe('frameAt', () => {
  it('walks durations and loops', () => {
    expect(frameAt([100, 100, 100], 0)).toBe(0);
    expect(frameAt([100, 100, 100], 250)).toBe(2);
    expect(frameAt([100, 100, 100], 320)).toBe(0);
  });
  it('returns null after a non-looping run ends', () => {
    expect(frameAt([50, 50], 99, false)).toBe(1);
    expect(frameAt([50, 50], 100, false)).toBe(null);
  });
});

describe('attackPoseForType', () => {
  it('picks the sheet by weapon type, falling back to the fists swing when unarmed', () => {
    expect(attackPoseForType('SPEAR')).toBe('2a');
    expect(attackPoseForType('BOW')).toBe('2b');
    expect(attackPoseForType('WAND')).toBe('2c');
    expect(attackPoseForType('FISTICUFF')).toBe('2_');
    expect(attackPoseForType(null)).toBe('2_');
    expect(attackPoseForType(undefined)).toBe('2_');
  });
});

describe('POSES', () => {
  it('every pose names a body sheet the shipped manifest has', () => {
    // 'attack' is virtual: the page resolves it to 2a/2b/2c/2_ by weapon type.
    for (const pose of POSES.filter((p) => p.id !== 'attack')) expect(realManifest.layers.body[pose.id], pose.id).toBeDefined();
  });
  it('labels the skilling poses the way the game controller picks them (map connection type / target type / node id)', () => {
    expect(Object.fromEntries(POSES.map((pose) => [pose.id, pose.label]))).toMatchObject({
      3: 'Jump', 4: 'Climb', 5: 'Mining', 6: 'Choppin', 7: 'Fishing', 8: 'Catching', 9: 'Divinity'
    });
  });
});

describe('OUTFIT_POSES', () => {
  it('is Idle, Walk and Attack, in that order', () => {
    expect(OUTFIT_POSES.map(({ id }) => id)).toEqual(['0', '1', 'attack']);
    expect(OUTFIT_POSES.map(({ label }) => label)).toEqual(['Idle', 'Walk', 'Attack']);
  });
  it('takes its labels from POSES rather than repeating them', () => {
    const labelById = Object.fromEntries(POSES.map((pose) => [pose.id, pose.label]));
    for (const pose of OUTFIT_POSES) expect(pose.label).toBe(labelById[pose.id]);
  });
});

describe('resolveLayers', () => {
  it('draws the body alone anchored at its origin', () => {
    const { layers, unsupported } = resolveLayers(manifest, base, 0);
    expect(unsupported).toEqual([]);
    expect(layers).toEqual([{ file: 'body/0.png', sx: 0, sy: 0, w: 94, h: 50, dx: -47, dy: -50 }]);
  });
  it('advances the body frame with time using the sheet grid', () => {
    const { layers } = resolveLayers(manifest, base, 350); // frame 3 of a 3-across sheet: row 1 col 0
    expect(byFile(layers, 'body')).toMatchObject({ sx: 0, sy: 50 });
  });
  it('hat uses sheet 1, frame ID + 2, at the hat offset', () => {
    const { layers } = resolveLayers(manifest, { ...base, hat }, 0);
    const op = byFile(layers, 'hat');
    expect(op).toMatchObject({ file: 'hat/1.png', sx: 3 * 30, sy: 0, w: 30, h: 50, dx: -15 + HAT_OFFSET.x, dy: -50 + HAT_OFFSET.y });
  });
  it('hat switches to sheet 4 while the body plays 4', () => {
    const { layers } = resolveLayers(manifest, { ...base, hat, pose: '4' }, 0);
    expect(byFile(layers, 'hat').file).toBe('hat/4.png');
  });
  it('nudges the hat per body frame using manifest.hatOffsets for the current pose', () => {
    // pose '1' at tick 250 -> body frame 2 (6 frames, 100ms each): hatOffsets['1'].x[2] = 3, y[2] = -2.
    const { layers } = resolveLayers(manifest, { ...base, hat, pose: '1' }, 250);
    const op = byFile(layers, 'hat');
    expect(op).toMatchObject({ dx: -15 + 3 + HAT_OFFSET.x, dy: -50 - 2 + HAT_OFFSET.y });
  });
  it('leaves the hat at its own-origin anchor when the pose has no offsets', () => {
    // pose '0' has no entry in manifest.hatOffsets: the nudge must fall back to 0, not throw.
    const { layers } = resolveLayers(manifest, { ...base, hat, pose: '0' }, 0);
    const op = byFile(layers, 'hat');
    expect(op).toMatchObject({ dx: -15 + HAT_OFFSET.x, dy: -50 + HAT_OFFSET.y });
  });
  it('idle weapon frame = type offset + ID', () => {
    const { layers } = resolveLayers(manifest, { ...base, weapon: bow }, 0); // 4 + 1 = 5 -> col 5
    expect(byFile(layers, 'weapon')).toMatchObject({ file: 'weapon/0.png', sx: 5 * 94, sy: 0 });
  });
  it('attack weapon frame = body frame + block * body frames, block = ID - 1 for spears', () => {
    const { layers } = resolveLayers(manifest, { ...base, weapon: spear, pose: '2a' }, 250); // body frame 2, block 1 -> 2 + 11 = 13 -> row 0 col 13
    expect(byFile(layers, 'weapon')).toMatchObject({ file: 'weapon/2a.png', sx: 13 * 152, sy: 0 });
  });
  it('attack weapon sits at the body top-left plus the pose weapon offset, pivoted for scale 2', () => {
    // same spear/pose/tick as above: frame 13 -> row 0 col 13, unchanged since across (14) is unchanged.
    // Raw (-28, -40) world px on a 152x110 origin (76, 110) sheet -> (-28.5, -50) sprite px.
    const { layers } = resolveLayers(manifest, { ...base, weapon: spear, pose: '2a' }, 250);
    expect(byFile(layers, 'weapon')).toMatchObject({
      file: 'weapon/2a.png', sx: 13 * 152, sy: 0, w: 152, h: 110, dx: -47 + -28.5, dy: -50 + -50
    });
  });
  it('idle weapon bobs with the body on frames 0, 3 and 4 (+2 world px = +1 sprite px)', () => {
    const at = (tick) => byFile(resolveLayers(manifest, { ...base, weapon: bow }, tick).layers, 'weapon');
    expect(at(0)).toMatchObject({ dx: -47, dy: -50 + 1 });   // body frame 0
    expect(at(150)).toMatchObject({ dx: -47, dy: -50 });     // body frame 1
    expect(at(350)).toMatchObject({ dx: -47, dy: -50 + 1 }); // body frame 3
  });
  it('fists bob on frames 0, 1 and 4 instead', () => {
    const at = (tick) => byFile(resolveLayers(manifest, { ...base, weapon: fists }, tick).layers, 'weapon');
    expect(at(0)).toMatchObject({ dy: -50 + 1 });   // body frame 0
    expect(at(150)).toMatchObject({ dy: -50 + 1 }); // body frame 1: bobs for fists, not for the rest
    expect(at(250)).toMatchObject({ dy: -50 });     // body frame 2
  });
  it('walk draws the idle weapon sheet, raised by the game\'s walk bob', () => {
    const at = (tick) => byFile(resolveLayers(manifest, { ...base, weapon: spear, pose: '1' }, tick).layers, 'weapon');
    // pose '1' is 6 frames of 100ms; the walk bob is -4 world px below body frame 2, -2 on it, 0 after.
    expect(at(0)).toMatchObject({ file: 'weapon/0.png', sx: (2 + 2) * 94, sy: 0, dx: -47, dy: -50 - 2 });
    expect(at(250)).toMatchObject({ dy: -50 - 1 }); // body frame 2
    expect(at(350)).toMatchObject({ dy: -50 });     // body frame 3
  });
  it('walk hides fists instead of reporting them unsupported', () => {
    const { layers, unsupported } = resolveLayers(manifest, { ...base, weapon: fists, pose: '1' }, 0);
    expect(byFile(layers, 'weapon')).toBeUndefined();
    expect(unsupported).toEqual([]);
  });
  it('climb draws the weapon from its own sheet at the body top-left', () => {
    const { layers } = resolveLayers(manifest, { ...base, weapon: spear, pose: '4' }, 0);
    expect(byFile(layers, 'weapon')).toMatchObject({ file: 'weapon/4.png', sx: (2 + 2) * 94, sy: 0, dx: -47, dy: -50 });
  });
  it('fists use block = ID', () => {
    const { layers } = resolveLayers(manifest, { ...base, weapon: fists, pose: '2_' }, 0); // 0 + 1 * 17 = 17 -> row 1 col 2
    expect(byFile(layers, 'weapon')).toMatchObject({ file: 'weapon/2_.png', sx: 2 * 94, sy: 50 });
  });
  it('weapon is hidden, not unsupported, in the skilling poses that carry a tool', () => {
    const { layers, unsupported } = resolveLayers(manifest, { ...base, weapon: spear, pose: '5' }, 0);
    expect(byFile(layers, 'weapon')).toBeUndefined();
    expect(unsupported).toEqual([]);
  });
  it('cape draws first, on its own loop, at the body top-left plus XYoffsetCape for the body frame', () => {
    // capeOffsets['0'].y[0] = 1 world px -> 0.5 sprite px at scale 2.
    const { layers } = resolveLayers(manifest, { ...base, cape, hat }, 0);
    expect(layers[0]).toMatchObject({ file: 'cape/1.png', w: 94, h: 50, dx: -47 + 0, dy: -50 + 0.5 });
  });
  it('a cape sheet taller than the body pivots around its own origin at scale 2', () => {
    // origin (47, 74) vs the body's (47, 50): dy = (1 - 24) / 2 = -11.5.
    const { layers } = resolveLayers(manifest, { ...base, cape: tallCape }, 0);
    expect(layers[0]).toMatchObject({ file: 'cape/2.png', dx: -47, dy: -50 - 11.5 });
  });
  it('cape offset follows the BODY frame, not its own loop frame', () => {
    // tick 350 -> body frame 3 (5 frames): capeOffsets['0'].y[3] = 1, and the cape's own 6-frame
    // loop is on frame 3 too, but it is the body frame that picks the offset.
    const { layers } = resolveLayers(manifest, { ...base, cape }, 350);
    expect(layers[0]).toMatchObject({ dx: -47 + 0, dy: -50 + 0.5 });
  });
  it('cape falls back to no offset for a pose XYoffsetCape has no row for', () => {
    const { layers } = resolveLayers(manifest, { ...base, cape, pose: '2b' }, 0);
    expect(layers[0]).toMatchObject({ dx: -47, dy: -50 });
  });
  it('costume frame = the pose\'s hardcoded base + body frame', () => {
    // pose '2a' base 11, body frame 0 -> 11 -> row 0 col 11
    const { layers } = resolveLayers(manifest, { ...base, costume, pose: '2a' }, 0);
    expect(byFile(layers, 'costume')).toMatchObject({ file: 'costume/1.png', sx: 11 * 94, sy: 0 });
  });
  it('costume is unsupported for a pose the game has no base for', () => {
    const { layers, unsupported } = resolveLayers(manifest, { ...base, costume, pose: 'hold' }, 0);
    expect(byFile(layers, 'costume')).toBeUndefined();
    expect(unsupported).toEqual(['EquipmentGown0']);
  });
  it('idle with a non-fist weapon puts the weapon behind the body (game: weapon z = body - 1)', () => {
    const { layers } = resolveLayers(manifest, { ...base, cape, costume, weapon: spear, hat }, 0);
    expect(layers.map((l) => l.file.split('/')[0])).toEqual(['cape', 'weapon', 'body', 'hat', 'costume']);
  });
  it('every other pose draws the weapon in front (game: weapon z = body + 1)', () => {
    const { layers } = resolveLayers(manifest, { ...base, cape, costume, weapon: spear, hat, pose: '2a' }, 0);
    expect(layers.map((l) => l.file.split('/')[0])).toEqual(['cape', 'body', 'hat', 'costume', 'weapon']);
  });
  it('idle with fists keeps the weapon in front (game: FISTICUFF is the idle exception)', () => {
    const { layers } = resolveLayers(manifest, { ...base, cape, costume, weapon: fists, hat }, 0);
    expect(layers.map((l) => l.file.split('/')[0])).toEqual(['cape', 'body', 'hat', 'costume', 'weapon']);
  });
  it('climb (pose 4) moves the cape in front of everything (game: cape z = max + 1)', () => {
    const { layers } = resolveLayers(manifest, { ...base, cape, costume, weapon: spear, hat, pose: '4' }, 0);
    expect(layers.map((l) => l.file.split('/')[0])).toEqual(['body', 'hat', 'weapon', 'costume', 'cape']);
  });
  it('walk with non-fist weapon puts the weapon behind the body (sheet 0, same as idle)', () => {
    const { layers } = resolveLayers(manifest, { ...base, cape, costume, weapon: spear, hat, pose: '1' }, 0);
    expect(layers.map((l) => l.file.split('/')[0])).toEqual(['cape', 'weapon', 'body', 'hat', 'costume']);
  });
  it('reports items with no art and skips them', () => {
    const tallHat = { rawName: 'EquipmentHats99', ID: 40, Type: 'HELMET' };
    const { layers, unsupported } = resolveLayers(manifest, { ...base, hat: tallHat, cape: { rawName: 'EquipmentCape9', ID: 9, Type: 'CAPE' } }, 0);
    expect(unsupported).toEqual(['EquipmentCape9', 'EquipmentHats99']); // draw order: cape is resolved first
    expect(layers).toHaveLength(1);
  });
  it('falls back to idle when the pose has no body sheet', () => {
    const { layers } = resolveLayers(manifest, { ...base, pose: 'Zz' }, 0);
    expect(layers[0].file).toBe('body/0.png');
  });
  it('returns no layers instead of throwing when the body layer has neither the pose nor "0"', () => {
    const bareManifest = { ...manifest, layers: { ...manifest.layers, body: {} } };
    expect(resolveLayers(bareManifest, { ...base, pose: 'Zz' }, 0)).toEqual({ layers: [], unsupported: [] });
  });
  it('clamps a hold frame so the body advances instead of freezing on it', () => {
    // durations [100, 10000, 100] clamped to [100, 500, 100]: at tick 650 (100 + 500 + 50) frame 2
    // is playing, not still stuck on frame 1's 10s hold.
    const { layers } = resolveLayers(manifest, { ...base, pose: 'hold' }, 650);
    expect(byFile(layers, 'body')).toMatchObject({ file: 'body/hold.png', sx: 2 * 94, sy: 0 });
  });
});

describe('the companion', () => {
  it('stands COMPANION_DX to the right at half size, mirrored, on the same ground line, drawn behind every player layer', () => {
    const { layers, unsupported } = resolveLayers(manifest, { ...base, companion: ram, cape, weapon: spear }, 0);
    expect(unsupported).toEqual([]);
    // Mirrored, so the origin's 45px gap to the frame's right edge becomes its gap to the left one:
    // top-left = 56 - 45 * 0.5, feet on the anchor line = -70 * 0.5.
    expect(layers[0]).toEqual({
      file: 'companion/ram.png', sx: 0, sy: 0, w: 90, h: 70,
      dx: 33.5, dy: -35, drawScale: COMPANION_SCALE, flip: true
    });
    // Everything the player is wearing draws on top of it.
    expect(layers.slice(1).map((op) => op.file))
      .toEqual(['cape/1.png', 'weapon/0.png', 'body/0.png']);
  });
  it('runs on its own clock, not the body frame', () => {
    // 450ms into [400, 110, 200, 110, 110] is frame 1; the body sheet is 5 x 100ms, so frame 4.
    const { layers } = resolveLayers(manifest, { ...base, companion: ram }, 450);
    expect(layers[0].sx).toBe(90);
    expect(byFile(layers, 'body').sx).toBe(94);
  });
  it('places a strip by its own origin, never by the opaque bounds', () => {
    const { layers } = resolveLayers(manifest, { ...base, companion: { rawName: 'nobounds' } }, 0);
    expect(layers[0]).toMatchObject({ file: 'companion/nobounds.png', dx: 46, dy: -20, drawScale: 0.5, flip: true });
  });
  it('reports a companion with no strip as unsupported and draws nothing for it', () => {
    const { layers, unsupported } = resolveLayers(manifest, { ...base, companion: { rawName: 'shovel' } }, 0);
    expect(unsupported).toEqual(['shovel']);
    expect(layers.map((op) => op.file)).toEqual(['body/0.png']);
  });
  // Canvas-fit coverage (companion strips, player reach, label) lives in the 'canvas fit' describe below.
});

describe('canvas fit', () => {
  it('keeps every op inside [0, width] x [0, height] across every pose/weapon/cape/costume/hat the page can select', () => {
    // Each layer's op depends only on pose + its own equipped item + tick (see resolveLayers: cape
    // reads capeOffsets[pose], weapon reads weaponOffsets[pose] + its own type/ID, costume reads
    // costumeFrameBase[pose], hat reads hatOffsets[pose] - never on what else is equipped), so
    // sweeping one slot at a time against every pose covers the same ground as a full cross
    // product without the combinatorial blowup (10 poses x 5 weapons x 25 capes x 11 costumes x 2
    // hats x ~25 ticks was 119s and counting; this is under a second).
    const weaponTypes = Object.keys(realManifest.weaponTypeOffsets ?? {});
    const weapons = [null, ...weaponTypes.map((type) => ({ rawName: `w-${type}`, ID: 1, Type: type }))];
    const capes = [null, ...Object.keys(realManifest.layers.cape ?? {}).map((id) => ({ rawName: `cape-${id}`, ID: Number(id) }))];
    const costumes = [null, ...Object.keys(realManifest.layers.costume ?? {}).map((id) => ({ rawName: `costume-${id}`, ID: Number(id) }))];
    const hats = [null, ...Object.keys(realManifest.layers.hat ?? {}).map(() => ({ rawName: 'hat-1', ID: 1 }))];
    const poseIds = POSES.map((p) => p.id); // exactly what the page's pose bar can select

    const violations = [];
    let checked = 0;
    const check = (op, tag) => {
      checked++;
      if (op.dx < -CANVAS.anchorX) violations.push(`${tag} ${op.file} left edge ${op.dx}`);
      if (op.dx + op.w > CANVAS.width - CANVAS.anchorX) violations.push(`${tag} ${op.file} right edge ${op.dx + op.w}`);
      if (op.dy < -CANVAS.anchorY) violations.push(`${tag} ${op.file} top edge ${op.dy}`);
      if (op.dy + op.h > CANVAS.height - CANVAS.anchorY) violations.push(`${tag} ${op.file} bottom edge ${op.dy + op.h}`);
    };
    const sweepTicks = (pose, state, tag) => {
      const bodySheet = realManifest.layers.body[pose];
      if (!bodySheet) return;
      const totalDur = bodySheet.durations.reduce((sum, d) => sum + Math.min(d, MAX_FRAME_MS), 0) || 100;
      for (let t = 0; t < totalDur; t += 20) {
        const { layers } = resolveLayers(realManifest, { ...state, pose }, t);
        for (const op of layers) check(op, tag);
      }
    };

    for (const poseId of poseIds) {
      const base = { hat: null, weapon: null, cape: null, costume: null, companion: null };
      for (const weapon of weapons) {
        // 'attack' is virtual: resolve to the real body sheet the way the page does.
        const pose = poseId === 'attack' ? attackPoseForType(weapon?.Type) : poseId;
        sweepTicks(pose, { ...base, weapon }, `pose=${pose} weapon=${weapon?.Type}`);
      }
      const pose = poseId === 'attack' ? '2_' : poseId; // fists swing, just to exercise a real attack sheet
      for (const cape of capes) sweepTicks(pose, { ...base, cape }, `pose=${pose} cape=${cape?.ID}`);
      for (const costume of costumes) sweepTicks(pose, { ...base, costume }, `pose=${pose} costume=${costume?.ID}`);
      for (const hat of hats) sweepTicks(pose, { ...base, hat }, `pose=${pose} hat=${hat?.ID}`);
    }
    expect(checked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  it('fits every companion strip in the shipped manifest', () => {
    const strips = Object.values(realManifest.layers.companion);
    expect(strips.length).toBeGreaterThanOrEqual(150);
    // The anchor is off-centre, so left and right are checked against different things: the
    // player's own swing on the left, every companion's placed art on the right.
    expect(CANVAS.anchorX - PLAYER_REACH_LEFT).toBeGreaterThanOrEqual(0);
    for (const strip of strips) {
      // Mirrored and halved, the frame reaches originX * COMPANION_SCALE right of its origin.
      expect(CANVAS.anchorX + COMPANION_DX + strip.originX * COMPANION_SCALE).toBeLessThanOrEqual(CANVAS.width);
      // The whole frame has to fit vertically: a strip is drawn at -originY * COMPANION_SCALE.
      expect(CANVAS.anchorY - strip.originY * COMPANION_SCALE).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps the player attack swing inside the canvas at PLAYER_REACH_UP', () => {
    expect(CANVAS.anchorY - PLAYER_REACH_UP).toBeGreaterThanOrEqual(0);
  });

  it('fits the name label\'s lowest point (trophy) below the feet', () => {
    // Trophy top sits 20 world px below the feet (+10 sprite px, TROPHY_Y - ORIGIN_Y in
    // nameLabel.js), and the tallest trophy in the manifest is 28 world px -> 14 sprite px below
    // that: about 24 sprite px below anchorY, well within the height's 30px label margin.
    expect(nameLabelOps({ name: 'mortastr', trophyId: 6, sizes: {} }).length).toBeGreaterThan(0);
    expect(CANVAS.anchorY + 24).toBeLessThanOrEqual(CANVAS.height);
  });
});

describe('drawOrder', () => {
  it('names the per-pose z order the game produces', () => {
    expect(drawOrder('0', spear)).toEqual(['cape', 'weapon', 'body', 'hat', 'costume']);
    expect(drawOrder('0', fists)).toEqual(['cape', 'body', 'hat', 'costume', 'weapon']);
    expect(drawOrder('0', null)).toEqual(['cape', 'body', 'hat', 'costume', 'weapon']);
    expect(drawOrder('2a', spear)).toEqual(['cape', 'body', 'hat', 'costume', 'weapon']);
    expect(drawOrder('4', spear)).toEqual(['body', 'hat', 'weapon', 'costume', 'cape']);
  });
});

describe('scaledOffset', () => {
  it('converts a world-pixel offset to sprite pixels around each actor\'s own origin', () => {
    expect(GAME_SCALE).toBe(2);
    const body = sheet('body/0.png', 5, 3);
    // Live 2.3.528 measurement: body 94x50 origin (47, 50) at (859, 674), weapon 152x110 origin
    // (76, 110) at (831, 634) -> raw (-28, -40) renders as (-28.5, -50) sprite px.
    expect(scaledOffset(-28, -40, sheet('weapon/2a.png', 22, 14, 152, 110), body)).toEqual({ dx: -28.5, dy: -50 });
    // A layer with the body's own geometry is just raw / 2.
    expect(scaledOffset(0, 2, body, body)).toEqual({ dx: 0, dy: 1 });
  });
});

describe('playbackDurations', () => {
  it('clamps every duration to MAX_FRAME_MS, leaving shorter ones untouched', () => {
    expect(playbackDurations([100, 10000, 5000, 400])).toEqual([100, MAX_FRAME_MS, MAX_FRAME_MS, 400]);
  });
});
