import { describe, expect, it } from 'vitest';
import { atlasFor, islandFor } from '../../utility/wiki/map-atlas.mjs';
import { PLATE_OFFSET, pinDistance, pinsTouch, placePins } from '../../utility/wiki/map-pins.mjs';
import { staticGraph, staticNeighbourhood } from '../../utility/wiki/static-graph.mjs';

const { graph } = staticGraph();
const pageOf = (id) => atlasFor(graph, id, staticNeighbourhood(id));
const maps = Object.keys(graph.nodes).filter((id) => id.startsWith('map:')).map((id) => [id, pageOf(id)]).filter(([, page]) => page);
const rows = ({ slice }, rel) => slice.edges.filter((edge) => edge.rel === rel)
  .map(({ to, meta }) => [slice.nodes[to].name, meta.number, meta.need]);

describe('map atlas', () => {
  it('lists every way out once, with its requirement, and gives a secret passage no number', () => {
    expect(rows(pageOf('map:9'), 'connectsTo')).toEqual([['Rats_Nest', 2, undefined], ["Meel's_Crypt", undefined, 'Always open']]);
    expect(rows(pageOf('map:27'), 'connectsTo').map(([name, , need]) => [name, need]))
      .toEqual([['Tucked_Away', '4,200 kills'], ['Forest_Outskirts', undefined], ['End_Of_The_Road', undefined]]);
  });

  it('leaves the shared graph slice as it was', () => {
    const before = JSON.stringify(staticNeighbourhood('map:0'));
    pageOf('map:0');
    expect(JSON.stringify(staticNeighbourhood('map:0'))).toBe(before);
  });

  // The desktop and phone pictures' largest sizes (MapAtlas.jsx). Shimmerfin Grove is 352 by 124 on a phone, with its marks
  // a few px apart: two of their numbers have no room nearer their own, and the enlarged map is there for them.
  it('puts every number nearest its own mark, and none on another', () => {
    const breaks = [[644, 300], [352, 400]].flatMap(([roomW, roomH]) => maps.flatMap(([id, { atlas }]) => {
      const scale = Math.min(roomW / atlas.width, roomH / atlas.height, 1);
      const boxes = atlas.pins.map(({ box }) => box);
      const drawn = boxes.map((box) => box.map((n) => n * scale));
      const pins = placePins(boxes, atlas.width, atlas.height, scale);
      return pins.flatMap((pin, i) => [
        ...(drawn.some((box, j) => j !== i && pinDistance(pin, box) < pinDistance(pin, drawn[i])) ? [`${id} #${i + 1} nearer another at ${roomW}`] : []),
        ...(pins.some((other, j) => j < i && pinsTouch(pin, other)) ? [`${id} #${i + 1} touches another at ${roomW}`] : [])
      ]);
    }));
    expect(breaks).toEqual(['map:300 #5 nearer another at 352', 'map:300 #12 nearer another at 352']);
    expect(maps.length).toBeGreaterThan(100);
  });

  it('puts every area the island draws on it, none on another, and leaves a hidden one unnumbered', () => {
    const islands = Object.keys(graph.nodes).filter((id) => id.startsWith('world:'))
      .map((id) => [id, islandFor(graph, id, staticNeighbourhood(id))]).filter(([, island]) => island);
    expect(islands).toHaveLength(7);
    const plate = ({ at: [x, y], below }) => [x, y + (below ? 1 : -1) * PLATE_OFFSET];
    const touching = islands.flatMap(([id, { atlas }]) => atlas.pins
      .flatMap((pin, i) => (atlas.pins.some((other, j) => j < i && pinsTouch(plate(pin), plate(other))) ? [`${id} #${pin.number}`] : [])));
    expect(touching).toEqual([]);
    const [, hills] = islands.find(([id]) => id === 'world:1');
    expect(hills.atlas.pins[0]).toMatchObject({ number: 1, at: [502, 153], town: true, name: 'Blunder Hills' });
    expect(hills.slice.edges.find(({ to }) => to === 'map:29').meta.number).toBeUndefined();
  });
});
