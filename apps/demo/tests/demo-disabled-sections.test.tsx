import { fireEvent, render, screen, within } from "@testing-library/react";
import { createElement, useEffect, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import DemoShell from "@/components/layout/DemoShell";
import { CODE_SNIPPETS } from "@/lib/code-snippets";
import { DEMO_SECTIONS } from "@/lib/demo-sections";

function normalizeColor(color: string) {
  const value = color.trim().toLowerCase();

  if (value.startsWith("#")) {
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
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

const mockRetry = vi.fn();

// toBlob만 흉내 낸 가짜 캔버스. 2048바이트 Blob을 돌려준다.
const mockSnapshotCanvas = {
  width: 1280,
  height: 720,
  toBlob: (callback: (blob: Blob | null) => void, type?: string) => {
    callback(new Blob([new Uint8Array(2048)], { type: type ?? "image/png" }));
  },
} as unknown as HTMLCanvasElement;

vi.mock("@cp949/react-webcam", () => {
  function Webcam(props: {
    disabled?: boolean;
    disabledFallback?: React.ReactNode;
    errorFallback?:
      | React.ReactNode
      | ((
          detail: { phase: string; errorCode: string },
          helpers: { retry: () => void },
        ) => React.ReactNode);
    onStateChange?: (detail: { phase: string; errorCode?: string }) => void;
    fitMode?: string;
    className?: string;
    children?: React.ReactNode;
    visibleVideoSizeDebug?: boolean;
    visibleConstraintsDebug?: boolean;
    visibleSnapshotButton?: boolean;
    onSnapshot?: (canvas: HTMLCanvasElement) => void;
    webcamOptions?: Record<string, unknown>;
    defaultWebcamOptions?: Record<string, unknown>;
  }) {
    const [initialDefaultWebcamOptions] = useState(props.defaultWebcamOptions);
    const shouldMockError = props.webcamOptions?.deviceId === "__missing_camera__";

    useEffect(() => {
      props.onStateChange?.(
        props.disabled
          ? { phase: "idle" }
          : shouldMockError
            ? { phase: "unavailable", errorCode: "device-not-found" }
            : { phase: "live" },
      );
    }, [props.disabled, props.onStateChange, shouldMockError]);

    if (props.disabled) {
      if (Object.hasOwn(props, "disabledFallback")) {
        return createElement(
          "div",
          { "data-testid": "mock-webcam-disabled-fallback" },
          props.disabledFallback,
        );
      }

      return createElement("div", { "data-testid": "webcam-disabled-placeholder" });
    }

    if (shouldMockError && Object.hasOwn(props, "errorFallback")) {
      const detail = { phase: "unavailable", errorCode: "device-not-found" };
      const fallback =
        typeof props.errorFallback === "function"
          ? props.errorFallback(detail, { retry: mockRetry })
          : props.errorFallback;

      return createElement("div", { "data-testid": "mock-webcam-error-fallback" }, fallback);
    }

    return createElement(
      "div",
      {
        "data-testid": "mock-webcam-live",
        className: props.className,
        "data-fit-mode": props.fitMode ?? "",
      },
      createElement(
        "div",
        { "data-testid": "mock-webcam-options" },
        JSON.stringify(props.webcamOptions ?? initialDefaultWebcamOptions ?? {}),
      ),
      props.visibleSnapshotButton
        ? createElement(
            "button",
            {
              "data-testid": "mock-webcam-snapshot-button",
              onClick: () => props.onSnapshot?.(mockSnapshotCanvas),
            },
            "snapshot",
          )
        : null,
      props.visibleVideoSizeDebug
        ? createElement("div", { "data-testid": "mock-webcam-video-size-debug" }, "1280x720")
        : null,
      props.visibleConstraintsDebug
        ? createElement(
            "pre",
            { "data-testid": "mock-webcam-constraints-debug" },
            JSON.stringify(props.webcamOptions ?? initialDefaultWebcamOptions ?? {}, null, 2),
          )
        : null,
      props.children,
      "mock webcam live",
    );
  }

  // 앱이 소유한 video 경로. video가 연결되면 live·프레임 준비 상태를 돌려준다.
  function useWebcam(options: { videoElement: HTMLVideoElement | null; disabled?: boolean }) {
    const live = !!options.videoElement && !options.disabled;
    return {
      detail: live ? { phase: "live" } : { phase: "idle" },
      isFrameReady: live,
      retry: () => {},
      pausePlayback: () => {},
      resumePlayback: () => {},
    };
  }

  return { Webcam, useWebcam };
});

describe("demo disabled sections", () => {
  function getExampleCard(title: string) {
    const heading = screen.getByText(title);
    const card = heading.closest(".MuiCard-root");

    if (!card) {
      throw new Error(`Could not find example card for title: ${title}`);
    }

    return card as HTMLElement;
  }

  it("registers disabled demo sections and code snippets", () => {
    expect(DEMO_SECTIONS.some((section) => section.id === "disabled-state")).toBe(true);
    expect(DEMO_SECTIONS.some((section) => section.id === "disabled-fallback")).toBe(true);
    expect(DEMO_SECTIONS.some((section) => section.id === "error-fallback")).toBe(true);
    expect(DEMO_SECTIONS.some((section) => section.id === "visual-debug")).toBe(true);
    expect(CODE_SNIPPETS["disabled-state"]).toContain("disabled={disabled}");
    expect(CODE_SNIPPETS["disabled-fallback"]).toContain("disabledFallback");
    expect(CODE_SNIPPETS["error-fallback"]).toContain("errorFallback");
    expect(CODE_SNIPPETS.controls).toContain("fitMode");
    expect(CODE_SNIPPETS.controls).toContain("defaultWebcamOptions");
    expect(CODE_SNIPPETS.controls).toContain("aspectRatio 없이 fitMode만");
    expect(CODE_SNIPPETS.controls).toContain("기본값 다시 적용");
    expect(CODE_SNIPPETS.controls).toContain("부모에서 facingMode 변경");
    expect(CODE_SNIPPETS["visual-debug"]).toContain("visibleVideoSizeDebug");
    expect(CODE_SNIPPETS["visual-debug"]).toContain("className=");
    expect(CODE_SNIPPETS["visual-debug"]).toContain(".demo-visual-debug-webcam");
  });

  it("renders the disabled state section from the sidebar", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Disabled State")[0]!);

    expect(screen.getByText("disabled=true이면 카메라 요청을 시작하지 않습니다")).toBeTruthy();
    expect(screen.getByRole("button", { name: "카메라 활성화" })).toBeTruthy();
    expect(screen.getByText("phase")).toBeTruthy();
  });

  it("keeps the disabled state demo viewport at a fixed aspect ratio", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Disabled State")[0]!);

    const viewport = screen.getByTestId("disabled-state-viewport");
    expect(window.getComputedStyle(viewport).aspectRatio).toBe("16 / 9");
  });

  it("uses a light viewport background while disabled and restores dark background when enabled", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Disabled State")[0]!);

    const viewport = screen.getByTestId("disabled-state-viewport");
    expect(normalizeColor(window.getComputedStyle(viewport).backgroundColor)).toBe("#f7f8fa");

    fireEvent.click(screen.getByRole("button", { name: "카메라 활성화" }));

    expect(normalizeColor(window.getComputedStyle(viewport).backgroundColor)).toBe("#212121");
  });

  it("renders the custom disabled fallback CTA and can enable the webcam", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Disabled Fallback")[0]!);

    expect(screen.getByText("Camera is disabled")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Enable camera" }));

    expect(screen.getByTestId("mock-webcam-live")).toBeTruthy();
  });

  it("keeps the disabled fallback demo viewport at a fixed aspect ratio", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Disabled Fallback")[0]!);

    const viewport = screen.getByTestId("disabled-fallback-viewport");
    expect(window.getComputedStyle(viewport).aspectRatio).toBe("16 / 9");
  });

  it("renders the custom error fallback example from the sidebar", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Error Fallback")[0]!);

    expect(screen.getByText("Camera is unavailable")).toBeTruthy();
    expect(screen.getAllByText("device-not-found").length).toBeGreaterThan(0);
    expect(
      screen.getByText("카메라가 없거나 선택한 장치를 사용할 수 없을 때 렌더링됩니다."),
    ).toBeTruthy();
    expect(screen.getByTestId("mock-webcam-error-fallback")).toBeTruthy();
  });

  it("calls retry and counts attempts when the error fallback Retry button is clicked", () => {
    mockRetry.mockClear();
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Error Fallback")[0]!);

    expect(screen.getByText("재시도 0회")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(mockRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText("재시도 1회")).toBeTruthy();
  });

  it("registers the snapshot demo section and shows the blob size from onSnapshot", () => {
    expect(DEMO_SECTIONS.some((section) => section.id === "snapshot")).toBe(true);
    expect(CODE_SNIPPETS["snapshot"]).toContain("onSnapshot");

    const createObjectURL = vi.fn(() => "blob:mock-snapshot");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));

    render(createElement(DemoShell));
    fireEvent.click(screen.getAllByText("Snapshot")[0]!);

    expect(screen.queryByText("캡처 결과")).toBeNull();
    fireEvent.click(screen.getByTestId("mock-webcam-snapshot-button"));

    expect(screen.getByText("캡처 결과")).toBeTruthy();
    expect(screen.getByText("2.0 KB")).toBeTruthy();
    expect(screen.getByText("1280x720")).toBeTruthy();
    expect(createObjectURL).toHaveBeenCalledTimes(1);

    // 다시 캡처하면 이전 object URL을 해제한다.
    fireEvent.click(screen.getByTestId("mock-webcam-snapshot-button"));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-snapshot");

    vi.unstubAllGlobals();
  });

  it("keeps the error fallback demo viewport at a fixed aspect ratio", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Error Fallback")[0]!);

    const viewport = screen.getByTestId("error-fallback-viewport");
    expect(window.getComputedStyle(viewport).aspectRatio).toBe("16 / 9");
  });

  it("separates fitMode from the shared controls panel and wires it only through the dedicated example", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Common Controls")[0]!);

    const controlsPanel = getExampleCard("컨트롤 패널");
    expect(within(controlsPanel).queryByText("fitMode")).toBeNull();

    const fitModeCard = getExampleCard("fitMode 전용 예제 (aspectRatio 없음)");
    const fitModeWebcam = within(fitModeCard).getByTestId("mock-webcam-live");

    expect(within(fitModeCard).getByText("fitMode")).toBeTruthy();
    expect(
      within(fitModeCard).getByText(
        "fitMode는 aspectRatio가 없을 때만 실제 레이아웃에 영향을 줍니다.",
      ),
    ).toBeTruthy();
    expect(fitModeWebcam.getAttribute("data-fit-mode")).toBe("cover");
    expect(within(fitModeCard).getByTestId("mock-webcam-options").textContent).toBe(
      '{"facingMode":"user"}',
    );

    fireEvent.click(within(fitModeCard).getByRole("button", { name: "contain" }));

    expect(within(fitModeCard).getByTestId("mock-webcam-live").getAttribute("data-fit-mode")).toBe(
      "contain",
    );
  });

  it("explains read-only controlled mode without contradicting the regular controlled pattern", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Controlled State")[0]!);

    expect(
      screen.getAllByText(
        (_, element) =>
          element?.textContent?.includes(
            "일반적인 controlled 패턴은 flipped와 onFlippedChange를 함께 전달하는 방식입니다.",
          ) ?? false,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        (_, element) =>
          element?.textContent?.includes(
            "콜백을 생략하면 읽기 전용 controlled로도 쓸 수 있지만, 내부 토글은 부모가 반영해줘야 바뀝니다.",
          ) ?? false,
      ).length,
    ).toBeGreaterThan(0);
  });

  it("keeps defaultWebcamOptions frozen until the user remounts the example", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Common Controls")[0]!);

    const defaultCard = getExampleCard("defaultWebcamOptions 초기값");
    const getOptionsText = () => within(defaultCard).getByTestId("mock-webcam-options").textContent;

    expect(getOptionsText()).toBe('{"aspectRatio":0.75,"facingMode":"environment"}');

    fireEvent.click(within(defaultCard).getByRole("button", { name: "정사각형 1:1" }));

    expect(getOptionsText()).toBe('{"aspectRatio":0.75,"facingMode":"environment"}');

    fireEvent.click(within(defaultCard).getByRole("button", { name: "기본값 다시 적용" }));

    expect(getOptionsText()).toBe('{"aspectRatio":1,"facingMode":"user"}');
  });

  it("shows the read-only controlled webcamOptions example as parent-driven only", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Common Controls")[0]!);

    const readonlyCard = getExampleCard("읽기 전용 controlled webcamOptions");
    const getOptionsText = () =>
      within(readonlyCard).getByTestId("mock-webcam-options").textContent;

    expect(getOptionsText()).toBe('{"facingMode":"user","aspectRatio":1.7777777777777777}');

    fireEvent.click(within(readonlyCard).getByRole("button", { name: "부모에서 facingMode 변경" }));

    expect(getOptionsText()).toBe('{"facingMode":"environment","aspectRatio":1.7777777777777777}');
  });

  it("renders the visual debug section with className, children, and debug overlays", () => {
    render(createElement(DemoShell));

    fireEvent.click(screen.getAllByText("Visual / Debug Props")[0]!);

    const webcam = screen.getByTestId("mock-webcam-live");
    expect(webcam.className).toContain("demo-visual-debug-webcam");
    expect(screen.getByText("Overlay badge child")).toBeTruthy();
    expect(screen.getByTestId("mock-webcam-video-size-debug")).toBeTruthy();
    expect(screen.getByTestId("mock-webcam-constraints-debug")).toBeTruthy();
  });

  it("registers the useWebcam demo section and shows hook state on an app-owned video", () => {
    expect(DEMO_SECTIONS.some((section) => section.id === "use-webcam")).toBe(true);
    expect(CODE_SNIPPETS["use-webcam"]).toContain("useWebcam({");
    expect(CODE_SNIPPETS["use-webcam"]).toContain("muted playsInline");

    const { container } = render(createElement(DemoShell));
    fireEvent.click(screen.getAllByText("useWebcam")[0]!);

    expect(screen.getByText("phase: live")).toBeTruthy();
    expect(screen.getByText("isFrameReady: true")).toBeTruthy();

    const video = container.querySelector("video")!;
    expect(video.style.display).toBe("block");
    fireEvent.click(screen.getByLabelText("video 숨기기 (display: none)"));
    expect(video.style.display).toBe("none");

    fireEvent.click(screen.getByLabelText("disabled"));
    expect(screen.getByText("phase: idle")).toBeTruthy();
    expect(screen.getByText("isFrameReady: false")).toBeTruthy();
  });
});
