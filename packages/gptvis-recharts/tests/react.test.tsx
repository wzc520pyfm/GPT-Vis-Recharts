import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GPTVisChart } from '../src/react.js';

const LINE = `
vis line
title Sales
data
  - time Jan
    value 10
  - time Feb
    value 20
`;

describe('GPTVisChart', () => {
  it('updates between chart types and reports ready status', async () => {
    const onStatus = vi.fn();
    const { container, rerender } = render(
      <GPTVisChart content={LINE} theme="light" onStatus={onStatus} />,
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeTruthy());
    await waitFor(() =>
      expect(onStatus).toHaveBeenCalledWith({ state: 'ready', message: '' }),
    );

    rerender(
      <GPTVisChart
        content={{
          type: 'pie',
          data: [
            { category: 'A', value: 1 },
            { category: 'B', value: 2 },
          ],
        }}
        theme="dark"
        onStatus={onStatus}
      />,
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeTruthy());
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('transitions from pending streaming input to a ready chart', async () => {
    const onStatus = vi.fn();
    const { container, rerender } = render(
      <GPTVisChart content={'vis line\ntitle Sales'} streaming onStatus={onStatus} />,
    );
    expect(screen.getByText(/Waiting for more chart data/)).toBeTruthy();
    expect(onStatus).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'pending' }),
    );

    rerender(<GPTVisChart content={LINE} streaming onStatus={onStatus} />);
    await waitFor(() => expect(container.querySelector('svg')).toBeTruthy());
    expect(onStatus).toHaveBeenCalledWith({ state: 'ready', message: '' });
  });

  it('shows unsupported and error states in the selected locale', () => {
    const { container, unmount } = render(
      <GPTVisChart content={{ type: 'heatmap', data: [] }} locale="zh-CN" />,
    );
    expect(container.textContent).toContain('不支持的图表类型');
    unmount();

    const error = render(
      <GPTVisChart
        content={{ type: 'line', data: Array.from({ length: 10_001 }, () => ({ time: 'A', value: 1 })) }}
        locale="en-US"
      />,
    );
    expect(error.container.querySelector('[role="alert"]')).toBeTruthy();
    expect(error.container.textContent).toContain('10000 row limit');
    error.unmount();
  });

  it('supports wrapper tabs, copy, and SVG-only download controls', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const { container, unmount } = render(
      <GPTVisChart content={LINE} wrapper locale="en-US" />,
    );
    expect(screen.getByRole('tab', { name: 'Chart' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Source' }));
    expect(screen.getByText(/vis line/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(LINE));
    unmount();

    const table = render(
      <GPTVisChart
        content={{ type: 'table', data: [{ Name: 'A', Value: 1 }] }}
        wrapper
      />,
    );
    expect(screen.queryByRole('button', { name: 'Download' })).toBeNull();
    table.unmount();
    writeText.mockRestore();
    void container;
  });
});
