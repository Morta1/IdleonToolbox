// Every field a descriptor or a metric may set; the design spec's "Descriptor fields" says what each one means
export const DESCRIPTOR_FIELDS = ['system', 'label', 'entryLabel', 'scope', 'route', 'groups', 'list', 'key', 'name', 'icon',
  'metrics', 'iconRows', 'entryTag', 'allOnly', 'totals', 'entryOnly', 'wikiId'];

export const METRIC_FIELDS = ['label', 'noun', 'value', 'max', 'percentOfMax', 'steps', 'tiers', 'boolean', 'verb', 'cost',
  'allIcon', 'nextStep', 'threshold'];
