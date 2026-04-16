import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { createElement, useEffect, useState } from 'react';
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
    fitMode?: string;
    className?: string;
    children?: React.ReactNode;
    visibleVideoSizeDebug?: boolean;
    visibleConstraintsDebug?: boolean;
    webcamOptions?: Record<string, unknown>;
    defaultWebcamOptions?: Record<string, unknown>;
  }) {
    const [initialDefaultWebcamOptions] = useState(props.defaultWebcamOptions);

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

    return createElement(
      'div',
      {
        'data-testid': 'mock-webcam-live',
        className: props.className,
        'data-fit-mode': props.fitMode ?? '',
      },
      createElement(
        'div',
        { 'data-testid': 'mock-webcam-options' },
        JSON.stringify(props.webcamOptions ?? initialDefaultWebcamOptions ?? {}),
      ),
      props.visibleVideoSizeDebug
        ? createElement('div', { 'data-testid': 'mock-webcam-video-size-debug' }, '1280x720')
        : null,
      props.visibleConstraintsDebug
        ? createElement(
            'pre',
            { 'data-testid': 'mock-webcam-constraints-debug' },
            JSON.stringify(props.webcamOptions ?? initialDefaultWebcamOptions ?? {}, null, 2),
          )
        : null,
      props.children,
      'mock webcam live',
    );
  }

  return { Webcam };
});

describe('demo disabled sections', () => {
  function getExampleCard(title: string) {
    const heading = screen.getByText(title);
    const card = heading.closest('.MuiCard-root');

    if (!card) {
      throw new Error(`Could not find example card for title: ${title}`);
    }

    return card as HTMLElement;
  }

  it('registers disabled demo sections and code snippets', () => {
    expect(DEMO_SECTIONS.some((section) => section.id === 'disabled-state')).toBe(true);
    expect(DEMO_SECTIONS.some((section) => section.id === 'disabled-fallback')).toBe(true);
    expect(DEMO_SECTIONS.some((section) => section.id === 'visual-debug')).toBe(true);
    expect(CODE_SNIPPETS['disabled-state']).toContain('disabled={disabled}');
    expect(CODE_SNIPPETS['disabled-fallback']).toContain('disabledFallback');
    expect(CODE_SNIPPETS.controls).toContain('fitMode');
    expect(CODE_SNIPPETS.controls).toContain('defaultWebcamOptions');
    expect(CODE_SNIPPETS.controls).toContain('aspectRatio 없이 fitMode만');
    expect(CODE_SNIPPETS.controls).toContain('기본값 다시 적용');
    expect(CODE_SNIPPETS.controls).toContain('부모에서 facingMode 변경');
    expect(CODE_SNIPPETS['visual-debug']).toContain('visibleVideoSizeDebug');
    expect(CODE_SNIPPETS['visual-debug']).toContain('className=');
    expect(CODE_SNIPPETS['visual-debug']).toContain('.demo-visual-debug-webcam');
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

  it('separates fitMode from the shared controls panel and wires it only through the dedicated example', () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText('Common Controls')[0]!);

    const controlsPanel = getExampleCard('컨트롤 패널');
    expect(within(controlsPanel).queryByText('fitMode')).toBeNull();

    const fitModeCard = getExampleCard('fitMode 전용 예제 (aspectRatio 없음)');
    const fitModeWebcam = within(fitModeCard).getByTestId('mock-webcam-live');

    expect(within(fitModeCard).getByText('fitMode')).toBeTruthy();
    expect(within(fitModeCard).getByText('fitMode는 aspectRatio가 없을 때만 실제 레이아웃에 영향을 줍니다.')).toBeTruthy();
    expect(fitModeWebcam.getAttribute('data-fit-mode')).toBe('cover');
    expect(within(fitModeCard).getByTestId('mock-webcam-options').textContent).toBe('{"facingMode":"user"}');

    fireEvent.click(within(fitModeCard).getByRole('button', { name: 'contain' }));

    expect(within(fitModeCard).getByTestId('mock-webcam-live').getAttribute('data-fit-mode')).toBe('contain');
  });

  it('explains read-only controlled mode without contradicting the regular controlled pattern', () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText('Controlled State')[0]!);

    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes(
          '일반적인 controlled 패턴은 flipped와 onFlippedChange를 함께 전달하는 방식입니다.',
        ) ?? false,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes(
          '콜백을 생략하면 읽기 전용 controlled로도 쓸 수 있지만, 내부 토글은 부모가 반영해줘야 바뀝니다.',
        ) ?? false,
      ).length,
    ).toBeGreaterThan(0);
  });

  it('keeps defaultWebcamOptions frozen until the user remounts the example', () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText('Common Controls')[0]!);

    const defaultCard = getExampleCard('defaultWebcamOptions 초기값');
    const getOptionsText = () => within(defaultCard).getByTestId('mock-webcam-options').textContent;

    expect(getOptionsText()).toBe('{"aspectRatio":0.75,"facingMode":"environment"}');

    fireEvent.click(within(defaultCard).getByRole('button', { name: '정사각형 1:1' }));

    expect(getOptionsText()).toBe('{"aspectRatio":0.75,"facingMode":"environment"}');

    fireEvent.click(within(defaultCard).getByRole('button', { name: '기본값 다시 적용' }));

    expect(getOptionsText()).toBe('{"aspectRatio":1,"facingMode":"user"}');
  });

  it('shows the read-only controlled webcamOptions example as parent-driven only', () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText('Common Controls')[0]!);

    const readonlyCard = getExampleCard('읽기 전용 controlled webcamOptions');
    const getOptionsText = () => within(readonlyCard).getByTestId('mock-webcam-options').textContent;

    expect(getOptionsText()).toBe('{"facingMode":"user","aspectRatio":1.7777777777777777}');

    fireEvent.click(within(readonlyCard).getByRole('button', { name: '부모에서 facingMode 변경' }));

    expect(getOptionsText()).toBe('{"facingMode":"environment","aspectRatio":1.7777777777777777}');
  });

  it('renders the visual debug section with className, children, and debug overlays', () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText('Visual / Debug Props')[0]!);

    const webcam = screen.getByTestId('mock-webcam-live');
    expect(webcam.className).toContain('demo-visual-debug-webcam');
    expect(screen.getByText('Overlay badge child')).toBeTruthy();
    expect(screen.getByTestId('mock-webcam-video-size-debug')).toBeTruthy();
    expect(screen.getByTestId('mock-webcam-constraints-debug')).toBeTruthy();
  });
});
