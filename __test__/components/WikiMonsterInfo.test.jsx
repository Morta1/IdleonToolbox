// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonsterInfo from '@components/wiki/MonsterInfo';

const valueOf = (label) => screen.getByText(label).nextElementSibling.textContent;

const renderInfo = (stats) => render(
  <MonsterInfo node={{ kind: 'monster', name: 'Test', stats, location: null }} index={{ byId: {} }}
               onNavigate={() => {}}/>
);

describe('MonsterInfo accuracy rows', () => {
  it('uses the monster curve for monsters', () => {
    renderInfo({ defence: 230, hitCurve: 'monster' });
    expect(valueOf('5% Accuracy')).toBe('116');
    expect(valueOf('100% Accuracy')).toBe('346');
  });

  it('uses the resource curve for ores, trees, fish and bugs', () => {
    renderInfo({ defence: 25, hitCurve: 'resource' });
    expect(valueOf('5% Accuracy')).toBe('7');
    expect(valueOf('100% Accuracy')).toBe('50');
  });

  it('falls back to the monster curve when the graph has no curve', () => {
    renderInfo({ defence: 230 });
    expect(valueOf('5% Accuracy')).toBe('116');
  });
});
