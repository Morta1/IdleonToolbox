// Every field a descriptor or a metric may set; the design spec's "Descriptor fields" says what each one means
export const DESCRIPTOR_FIELDS = ['system', 'label', 'entryLabel', 'scope', 'route', 'groups', 'list', 'key', 'name', 'icon', 'systemIcon',
  'metrics', 'iconRows', 'entryTag', 'allOnly', 'totals', 'entryOnly', 'single', 'wikiId'];

export const METRIC_FIELDS = ['maxIsGoal', 'label', 'noun', 'value', 'max', 'percentOfMax', 'levelForPercent', 'steps', 'tiers', 'boolean', 'verb', 'cost',
  'allIcon', 'nextStep', 'threshold', 'tierAmount'];
