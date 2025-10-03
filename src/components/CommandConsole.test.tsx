import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CommandConsole } from './CommandConsole';

describe('CommandConsole', () => {
  it('queues suggestion text into the input before submission', () => {
    const handler = vi.fn();
    render(
      <CommandConsole
        onSubmit={handler}
        suggestions={['start fluids']}
        ambientEnabled={false}
        onToggleAmbient={vi.fn()}
      />,
    );

    const suggestion = screen.getByRole('button', { name: /start fluids/i });
    fireEvent.click(suggestion);

    const input = screen.getByRole('textbox');
    expect((input as HTMLInputElement).value).toBe('start fluids');

    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(handler).toHaveBeenCalledWith('start fluids');
  });
});
