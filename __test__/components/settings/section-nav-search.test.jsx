// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { buildModel, searchModel } from '@utility/dashboard/settingsModel';
import SectionPane from '@components/dashboard/settings/SectionPane';
import SettingsNav from '@components/dashboard/settings/SettingsNav';
import SearchResults from '@components/dashboard/settings/SearchResults';

const modelFor = (edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return buildModel(config, baseTrackers, diffTrackers(baseTrackers, config));
};
const renderIn = (node) => render(<ThemeProvider theme={darkTheme}>{node}</ThemeProvider>).container;
const world3 = (model) => model[0].sections.find(({ section }) => section === 'World 3');

describe('SectionPane', () => {
  it('lists the section, counts and bulk actions', () => {
    const onBulk = vi.fn();
    const section = world3(modelFor());
    const container = renderIn(<SectionPane section={section} filter="all" expanded={{}} onToggleExpanded={() => {}} onAction={() => {}} onBulk={onBulk} onShowAll={() => {}}/>);
    expect(container.textContent).toContain(`${section.total} alerts · ${section.onCount} on`);
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Turn all off'));
    expect(onBulk).toHaveBeenCalledWith(`${section.label} alerts turned off`, 'setSectionOn', section, false);
  });

  it('shows an empty state when the filter hides every alert', () => {
    const onShowAll = vi.fn();
    const container = renderIn(<SectionPane section={world3(modelFor())} filter="off" expanded={{}} onToggleExpanded={() => {}} onAction={() => {}} onBulk={() => {}} onShowAll={onShowAll}/>);
    expect(container.textContent).toContain('alert is on');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Show all alerts'));
    expect(onShowAll).toHaveBeenCalled();
  });
});

describe('SettingsNav', () => {
  it('shows a letter badge where a section has no icon', () => {
    const model = modelFor();
    const container = renderIn(<SettingsNav model={model} tabIndex={0} onTabChange={() => {}} sectionKey="account.General" onSectionChange={() => {}} onTrackerJump={() => {}}/>);
    const badges = [...container.querySelectorAll('[data-letter-badge]')].map((badge) => badge.textContent);
    expect(badges).toEqual(['G', '1', '2', '3', '4', '5', '6', '7']);
  });

  it('marks edited tabs and sections and switches section', () => {
    const onSectionChange = vi.fn();
    const model = modelFor({ 'account.World 3.library.books': { value: 30 } });
    const container = renderIn(<SettingsNav model={model} tabIndex={0} onTabChange={() => {}} sectionKey="account.General" onSectionChange={onSectionChange} onTrackerJump={() => {}}/>);
    expect(container.textContent).toContain('has edits');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent.includes(world3(model).label)));
    expect(onSectionChange).toHaveBeenCalledWith('account.World 3');
  });
});

describe('SearchResults', () => {
  it('groups results and offers Show in section', () => {
    const onShow = vi.fn();
    const model = modelFor();
    const results = searchModel(model, 'salt');
    const container = renderIn(<SearchResults results={results} query="salt" onAction={() => {}} onShow={onShow}/>);
    expect(container.textContent).toContain('Account · World 3');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent.startsWith('Show in')));
    expect(onShow).toHaveBeenCalledWith(results[0]);
  });

  it('locks a dependent option in the results while its parent is off', () => {
    const model = modelFor({ 'account.World 7.royalGuardian.overkillWorkers': { checked: false } });
    const results = searchModel(model, 'royal guardian').filter(({ option }) => option?.name === 'overkillBeforeReset');
    expect(results).toHaveLength(1);
    const container = renderIn(<SearchResults results={results} query="royal guardian" onAction={() => {}} onShow={() => {}}/>);
    expect(container.querySelector(`input[aria-label="${results[0].option.label}"]`).disabled).toBe(true);
    expect(container.textContent).toContain('to use this.');
  });

  it('says so when nothing matches', () => {
    const container = renderIn(<SearchResults results={[]} query="bubbel" onAction={() => {}} onShow={() => {}}/>);
    expect(container.textContent).toContain('No alerts match "bubbel"');
  });
});
