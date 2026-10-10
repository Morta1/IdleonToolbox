import { notateNumber } from '@utility/helpers';

// Shapes read by components/common/Breakdown/Breakdown.tsx.
export interface BreakdownSource {
  name: string;
  value: number;
  // Shown verbatim instead of the notated value
  formatted?: string;
}

export interface BreakdownSubSection {
  name: string;
  sources: BreakdownSource[];
}

export interface BreakdownCategory {
  name: string;
  sources?: BreakdownSource[];
  subSections?: BreakdownSubSection[];
}

export interface StatBreakdown {
  statName: string;
  totalValue: number | string;
  categories: BreakdownCategory[];
}

type BreakdownEntry = BreakdownSource | BreakdownSubSection;

const isSubSection = (entry: BreakdownEntry): entry is BreakdownSubSection => 'sources' in entry;

// "×", not "x": sub-section titles render uppercase
const withFactor = (name: string, factor: number) => `${name} (×${notateNumber(factor, 'MultiplierInfo')})`;

const withSum = (name: string, sum: number) => `${name} (+${notateNumber(sum, 'MultiplierInfo')})`;

const sumSources = (sources: BreakdownSource[]) => sources.reduce((total, { value }) => total + (Number(value) || 0), 0);

/**
 * Groups sources and sub-sections (e.g. getStatsFromGear's newBreakdown) into one category.
 * With `additive`, entries are fractions summed into one (1 + sum) factor, shown in the name.
 */
export const breakdownCategory = (name: string, entries: BreakdownEntry[], { additive = false } = {}): BreakdownCategory => {
  const sources = entries.filter((entry): entry is BreakdownSource => !isSubSection(entry));
  const subSections = entries.filter(isSubSection).filter((subSection) => subSection.sources.length);
  if (!additive) return { name, sources, subSections };
  const sum = sumSources([...sources, ...subSections.flatMap((subSection) => subSection.sources)]);
  return { name: withFactor(name, 1 + sum), sources, subSections };
}

/**
 * A collapsible group of lines that act as one entry in its category. The sub-section header shows no
 * value, so its total goes in the name: the product of `multiplicative` factors, else the sum it adds.
 */
export const breakdownSubSection = (name: string, sources: BreakdownSource[], { multiplicative = false } = {}): BreakdownSubSection => {
  const label = multiplicative
    ? withFactor(name, sources.reduce((total, { value }) => total * value, 1))
    : withSum(name, sumSources(sources));
  return { name: label, sources };
}

export const createBreakdown = (statName: string, totalValue: number | string, categories: BreakdownCategory[]): StatBreakdown => ({
  statName,
  totalValue,
  categories: categories.filter(({ sources, subSections }) => sources?.length || subSections?.length)
});

// Percent values (25 = +25%) to the fractions additive categories use.
export const toFractions = (subSection: BreakdownSubSection): BreakdownSubSection => ({
  ...subSection,
  sources: subSection.sources.map((source) => ({ ...source, value: source.value / 100 }))
});
