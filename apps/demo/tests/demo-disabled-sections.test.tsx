import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { createElement, useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import DemoShell from '@/components/layout/DemoShell';
import { CODE_SNIPPETS } from '@/lib/code-snippets';
import { DEMO_SECTIONS } from '@/lib/demo-sections';

function normalizeColor(color: string) {
  const value = color.trim().toLowerCase();

  if (value.startsWith('#')) {
    if (value.length === 4) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }

    return value;
  }

  const rgbMatch = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!rgbMatch) {
    return value;
  }

  return `#${rgbMatch
    .slice(1)
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

vi.mock('@cp949/react-webcam', () => {
  function Webcam(props: {
    disabled?: boolean;
    disabledFallback?: React.ReactNode;
    onStateChange?: (detail: { phase: string }) => void;
  }) {
    useEffect(() => {
      props.onStateChange?.({ phase: props.disabled ? 'idle' : 'live' });
    }, [props.disabled, props.onStateChange]);

    if (props.disabled) {
      if (Object.hasOwn(props, 'disabledFallback')) {
        return createElement(
          'div',
          { 'data-testid': 'mock-webcam-disabled-fallback' },
          props.disabledFallback,
        );
      }

      return createElement('div', { 'data-testid': 'webcam-disabled-placeholder' });
    }

    return createElement('div', { 'data-testid': 'mock-webcam-live' }, 'mock webcam live');
  }

  return { Webcam };
});

describe('demo disabled sections', () => {
  it('registers disabled demo sections and code snippets', () => {
    expect(DEMO_SECTIONS.some((section) => section.id === 'disabled-state')).toBe(true);
    expect(DEMO_SECTIONS.some((section) => section.id === 'disabled-fallback')).toBe(true);
    expect(CODE_SNIPPETS['disabled-state']).toContain('disabled={disabled}');
    expect(CODE_SNIPPETS['disabled-fallback']).toContain('disabledFallback');
  });

  it('renders the disabled state section from the sidebar', () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText('Disabled State')[0]!);

    expect(screen.getByText('disabled=true이면 카메라 요청을 시작하지 않습니다')).toBeTruthy();
    expect(screen.getByRole('button', { name: '카메라 활성화' })).toBeTruthy();
    expect(screen.getByText('phase')).toBeTruthy();
  });

  it('keeps the disabled state demo viewport at a fixed aspect ratio', () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText('Disabled State')[0]!);

    const viewport = screen.getByTestId('disabled-state-viewport');
    expect(window.getComputedStyle(viewport).aspectRatio).toBe('16 / 9');
  });

  it('uses a light viewport background while disabled and restores dark background when enabled', () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText('Disabled State')[0]!);

    const viewport = screen.getByTestId('disabled-state-viewport');
    expect(normalizeColor(window.getComputedStyle(viewport).backgroundColor)).toBe('#f7f8fa');

    fireEvent.click(screen.getByRole('button', { name: '카메라 활성화' }));

    expect(normalizeColor(window.getComputedStyle(viewport).backgroundColor)).toBe('#212121');
  });

  it('renders the custom disabled fallback CTA and can enable the webcam', () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText('Disabled Fallback')[0]!);

    expect(screen.getByText('Camera is disabled')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Enable camera' }));

    expect(screen.getByTestId('mock-webcam-live')).toBeTruthy();
  });

  it('keeps the disabled fallback demo viewport at a fixed aspect ratio', () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText('Disabled Fallback')[0]!);

    const viewport = screen.getByTestId('disabled-fallback-viewport');
    expect(window.getComputedStyle(viewport).aspectRatio).toBe('16 / 9');
  });
});
