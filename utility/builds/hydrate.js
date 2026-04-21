// Hydrate a stored compact build into the shape BuildTab.jsx expects.
//
// Derives tab order from `talentPagesMap` in parsers/talents.ts and talent
// metadata from `talents` in @website-data — no intermediate reference file.
//
// compactBuild shape:
//   {
//     class, subclass, title, description, tags, isAnonymous, ownerName,
//     payload: {
//       v: 1,
//       tabs: [ null | { note, talents: { [skillIndex]: number | string } } ]
//     }
//   }

import { talents } from '@website-data';
import { talentPagesMap } from '@parsers/talents';

export const normalizeTalent = (v) => {
  if (v == null) return 0;
  return v; // number or string ("*1", "*2") pass through
};

const emptyPayload = () => ({ v: 1, tabs: [] });

const toTalent = (talentDef) => ({
  name: talentDef.name,
  skillIndex: talentDef.skillIndex,
  description: talentDef.description ?? '',
  x1: talentDef.x1 ?? null,
  x2: talentDef.x2 ?? null,
  funcX: talentDef.funcX ?? 'txt',
  y1: talentDef.y1 ?? null,
  y2: talentDef.y2 ?? null,
  funcY: talentDef.funcY ?? 'txt',
  lvlUpText: talentDef.lvlUpText ?? ''
});

export const hydrate = (compactBuild) => {
  const key = compactBuild?.subclass || compactBuild?.class;
  const tabNames = talentPagesMap?.[key] || [];
  if (!tabNames.length) {
    return {
      title: compactBuild?.title || '',
      notes: compactBuild?.description || '',
      class: compactBuild?.class,
      subclass: compactBuild?.subclass,
      tabs: []
    };
  }

  const payload = compactBuild?.payload || emptyPayload();
  const tabs = tabNames.map((tabName, tabIndex) => {
    const userTab = payload.tabs?.[tabIndex] || null;
    const userTalents = userTab?.talents || {};
    const classTalents = talents?.[tabName] || {};
    return {
      name: tabName,
      note: userTab?.note || '',
      talents: Object.values(classTalents).map((talentDef) => {
        const meta = toTalent(talentDef);
        return {
          ...meta,
          level: normalizeTalent(userTalents[String(meta.skillIndex)]),
          note: ''
        };
      })
    };
  });

  return {
    title: compactBuild?.title || '',
    notes: compactBuild?.description || '',
    class: compactBuild?.class,
    subclass: compactBuild?.subclass,
    tabs
  };
};

// Blank canvas for a given class — used when the user picks a class in the
// create form before filling anything in.
export const hydrateEmpty = (className, subclass) => {
  return hydrate({
    class: className,
    subclass,
    title: '',
    description: '',
    payload: emptyPayload()
  });
};
