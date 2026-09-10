// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { render } from '@testing-library/react';
import useHydrated from '@hooks/useHydrated';

const Probe = () => <span>{String(useHydrated())}</span>;

describe('useHydrated', () => {
  it('is false in the export', () => {
    expect(renderToString(<Probe/>)).toContain('false');
  });

  it('is true once rendered on the client', () => {
    const { container } = render(<Probe/>);
    expect(container.textContent).toBe('true');
  });
});
