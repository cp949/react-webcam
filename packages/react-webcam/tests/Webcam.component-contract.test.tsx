/**
 * Webcam 컴포넌트의 공개 계약과 버튼 노출 조건을 검증하는 테스트 파일이다.
 */

import { existsSync } from "node:fs";
import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AspectRatioButton } from "../src/components/AspectRatioButton.js";
import { FacingModeButton } from "../src/components/FacingModeButton.js";
import { BrowserMediaDevices } from "../src/utils/media-devices.js";
import type { WebcamHandle } from "../src/Webcam.js";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { advanceToStreamLoad, markVideoReady } from "./webcam-test-helpers.js";

// ---------------------------------------------------------------------------
// rootWidth가 즉시 800으로 잡히도록 useResizeObserver를 목 처리한다.
// 이 설정이 없으면 rootWidth가 0에 머물러 비디오 요소가 렌더링되지 않는다.
// ---------------------------------------------------------------------------
vi.mock("../src/hooks/useResizeObserver.js", () => ({
  useResizeObserver: () =>
    [
      (_el: HTMLElement | null) => {},
      { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800 },
    ] as const,
}));

/** 테스트 컨테이너에서 비디오 요소를 찾는다. */
function getVideoElement(container: HTMLElement): HTMLVideoElement | null {
  return container.querySelector("video");
}

// ---------------------------------------------------------------------------
// Webcam 공개 컴포넌트 계약
// 스트림 요청, prop 전달, flipped·fitMode 반영, cleanup을 확인한다.
// ---------------------------------------------------------------------------

describe("Webcam", () => {
  let fakeStream: MediaStream;
  let getUserMediaMock: ReturnType<typeof vi.fn>;
  let stopSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fakeStream = createFakeMediaStream();
    getUserMediaMock = mockGetUserMedia(fakeStream);
    stopSpy = vi.spyOn(BrowserMediaDevices, "stopStream");
  });

  it("requests a media stream when video and computed constraints are ready", async () => {
    render(<Webcam webcamOptions={{ audioEnabled: false }} />);

    await advanceToStreamLoad();

    expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    expect(getUserMediaMock).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
  });

  it("calls onStateChange with live state on success", async () => {
    const onStateChange = vi.fn();

    render(<Webcam webcamOptions={{ audioEnabled: false }} onStateChange={onStateChange} />);

    await advanceToStreamLoad();

    const liveCalls = onStateChange.mock.calls.filter(([s]) => s.phase === "live");
    expect(liveCalls.length).toBe(1);
    expect(liveCalls[0][0]).toMatchObject({ phase: "live", mediaStream: fakeStream });
  });

  it("applies flipped style — flipped=true sets scaleX(-1)", async () => {
    const { container } = render(<Webcam webcamOptions={{ audioEnabled: false }} flipped />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    const video = getVideoElement(container)!;
    expect(video.style.transform).toBe("scaleX(-1)");
  });

  it("applies flipped style — rerender updates transform when flipped prop changes", async () => {
    const { container, rerender } = render(
      <Webcam webcamOptions={{ audioEnabled: false }} flipped={false} />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(getVideoElement(container)!.style.transform).toBe("none");

    rerender(<Webcam webcamOptions={{ audioEnabled: false }} flipped={true} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(getVideoElement(container)!.style.transform).toBe("scaleX(-1)");
  });

  it("applies fitMode as object-fit on the video element", async () => {
    const { container } = render(
      <Webcam webcamOptions={{ audioEnabled: false }} fitMode='cover' />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    const video = getVideoElement(container)!;
    expect(video.style.objectFit).toBe("cover");
  });

  it("rebuilds the media stream when webcamOptions meaningfully change", async () => {
    const { rerender } = render(
      <Webcam webcamOptions={{ audioEnabled: false, facingMode: "user" }} />,
    );

    await advanceToStreamLoad();
    expect(getUserMediaMock).toHaveBeenCalledTimes(1);

    rerender(<Webcam webcamOptions={{ audioEnabled: false, facingMode: "environment" }} />);

    await advanceToStreamLoad();
    expect(getUserMediaMock).toHaveBeenCalledTimes(2);
  });

  it("cleans up the media stream on unmount", async () => {
    const { unmount } = render(<Webcam webcamOptions={{ audioEnabled: false }} />);

    await advanceToStreamLoad();

    unmount();

    expect(stopSpy).toHaveBeenCalledWith(fakeStream);
  });
});

// ---------------------------------------------------------------------------
// Webcam 프레임워크 독립 공개 surface
// className, style, 버튼 노출과 상호작용을 확인한다.
// ---------------------------------------------------------------------------

describe("Webcam – framework-agnostic public surface", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  it("renders a video element (root renders at all)", () => {
    const { container } = render(<Webcam />);
    expect(container.querySelector("video")).not.toBeNull();
  });

  it("className is forwarded to the root element", () => {
    const { container } = render(<Webcam className='my-custom-class' />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("my-custom-class")).toBe(true);
  });

  it("style is forwarded to the root element as inline style", () => {
    const { container } = render(
      <Webcam style={{ backgroundColor: "rgb(255, 0, 0)", borderRadius: "8px" }} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.backgroundColor).toBe("rgb(255, 0, 0)");
    expect(root.style.borderRadius).toBe("8px");
  });

  it("FlipButton renders when visibleFlipButton=true and webcam is loaded", async () => {
    render(<Webcam webcamOptions={{ audioEnabled: false }} visibleFlipButton />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    // FlipButton이 실제 DOM에 나타나야 한다.
    const flipBtn = document.querySelector(".FlipButton-root");
    expect(flipBtn).not.toBeNull();
  });

  it("FlipButton click toggles flipped state (button is interactive)", async () => {
    const ref = { current: null as WebcamHandle | null };
    const { container } = render(
      <Webcam ref={ref} webcamOptions={{ audioEnabled: false }} visibleFlipButton />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);
    expect(container.querySelector("video")!.style.transform).toBe("none");

    // FlipButton 내부 실제 버튼을 찾아 클릭한다.
    const btn = document.querySelector(".FlipButton-root button") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();

    await act(async () => {
      btn!.click();
      await Promise.resolve();
    });

    expect(ref.current).toBeTruthy();
    expect(container.querySelector("video")!.style.transform).toBe("scaleX(-1)");
  });

  it("FacingModeButton renders when visibleCameraDirectionButton=true and webcam is loaded", async () => {
    render(<Webcam webcamOptions={{ audioEnabled: false }} visibleCameraDirectionButton />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    const facingBtn = document.querySelector(".FacingModeButton-root");
    expect(facingBtn).not.toBeNull();
  });

  it("FacingModeButton opens a dropdown when clicked", async () => {
    render(<Webcam webcamOptions={{ audioEnabled: false }} visibleCameraDirectionButton />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    const btn = document.querySelector(".FacingModeButton-root button") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();

    await act(async () => {
      btn!.click();
    });

    // 클릭 후 카메라 방향 목록을 담은 메뉴가 열려야 한다.
    const menu = document.getElementById(btn!.getAttribute("aria-controls") ?? "");
    expect(menu).not.toBeNull();
  });

  it("FacingModeButton menu item click calls onChange with correct facingMode", async () => {
    const onChange = vi.fn();
    render(<FacingModeButton onChange={onChange} />);

    const btn = document.querySelector(".FacingModeButton-root button") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();

    // 메뉴를 연다.
    await act(async () => {
      btn!.click();
    });

    // `전면` 메뉴 항목을 클릭한다.
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    const userItem = Array.from(menuItems).find((el) => el.textContent?.includes("전면")) as
      | HTMLElement
      | undefined;
    expect(userItem).not.toBeUndefined();

    await act(async () => {
      userItem!.click();
      // FacingModeButton은 setTimeout(0) 안에서 onChange를 호출한다.
      await vi.runAllTimersAsync();
    });

    expect(onChange).toHaveBeenCalledWith("user");
  });

  it('FacingModeButton "기본" resets deviceId so browser default selection can resume', async () => {
    const ref = createRef<WebcamHandle>();
    const onWebcamOptionsChange = vi.fn();

    render(
      <Webcam
        ref={ref}
        webcamOptions={{ audioEnabled: false, deviceId: "camera-1" }}
        onWebcamOptionsChange={onWebcamOptionsChange}
        visibleCameraDirectionButton
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    const btn = document.querySelector(".FacingModeButton-root button") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();

    await act(async () => {
      btn!.click();
    });

    const menuItems = document.querySelectorAll('[role="menuitem"]');
    const defaultItem = Array.from(menuItems).find((el) => el.textContent?.includes("기본")) as
      | HTMLElement
      | undefined;
    expect(defaultItem).not.toBeUndefined();

    await act(async () => {
      defaultItem!.click();
      await vi.runAllTimersAsync();
    });

    expect(onWebcamOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        facingMode: undefined,
        deviceId: undefined,
      }),
    );
  });

  it("AspectRatioButton menu item click calls onChange with correct aspectRatio", async () => {
    const onChange = vi.fn();
    render(<AspectRatioButton onChange={onChange} />);

    const btn = document.querySelector(
      ".AspectRatioButton-root button",
    ) as HTMLButtonElement | null;
    expect(btn).not.toBeNull();

    // 메뉴를 연다.
    await act(async () => {
      btn!.click();
    });

    // `4:3` 메뉴 항목을 클릭한다.
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    const item43 = Array.from(menuItems).find((el) => el.textContent?.includes("4:3")) as
      | HTMLElement
      | undefined;
    expect(item43).not.toBeUndefined();

    await act(async () => {
      item43!.click();
      // AspectRatioButton은 setTimeout(0) 안에서 onChange를 호출한다.
      await vi.runAllTimersAsync();
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ label: "4:3", value: expect.any(Number) }),
    );
  });

  it("AspectRatioButton renders when visibleAspectRatioButton=true and webcam is loaded", async () => {
    render(<Webcam webcamOptions={{ audioEnabled: false }} visibleAspectRatioButton />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    const arBtn = document.querySelector(".AspectRatioButton-root");
    expect(arBtn).not.toBeNull();
  });

  it("AspectRatioButton opens a dropdown when clicked", async () => {
    render(<Webcam webcamOptions={{ audioEnabled: false }} visibleAspectRatioButton />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    const btn = document.querySelector(
      ".AspectRatioButton-root button",
    ) as HTMLButtonElement | null;
    expect(btn).not.toBeNull();

    await act(async () => {
      btn!.click();
    });

    const menu = document.getElementById(btn!.getAttribute("aria-controls") ?? "");
    expect(menu).not.toBeNull();
  });

  it("SnapshotButton renders when visibleSnapshotButton=true and webcam is loaded", async () => {
    render(<Webcam webcamOptions={{ audioEnabled: false }} visibleSnapshotButton />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    const snapBtn = document.querySelector(".SnapshotButton-root");
    expect(snapBtn).not.toBeNull();
  });

  it('SnapshotButton 클릭 시 canvas.toDataURL을 "image/png" MIME 타입으로 호출한다', async () => {
    // happy-dom에서 getContext('2d')가 null을 반환할 수 있으므로 mock한다.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      setTransform: vi.fn(),
      imageSmoothingEnabled: true,
      drawImage: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const toDataURLSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/png;base64,mock");

    render(<Webcam webcamOptions={{ audioEnabled: false }} visibleSnapshotButton />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    const snapBtn = document.querySelector(
      ".SnapshotButton-root button",
    ) as HTMLButtonElement | null;
    expect(snapBtn).not.toBeNull();

    await act(async () => {
      snapBtn!.click();
    });

    expect(toDataURLSpy).toHaveBeenCalledWith("image/png");
  });
});

// ---------------------------------------------------------------------------
// 버튼 UI 없이도 핵심 웹캠 기능이 동작해야 한다.
// ---------------------------------------------------------------------------

describe("core webcam works without button UI", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  it("Webcam renders and requests stream with no button props set", async () => {
    const onStateChange = vi.fn();
    render(<Webcam webcamOptions={{ audioEnabled: false }} onStateChange={onStateChange} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(onStateChange).toHaveBeenCalledWith(expect.objectContaining({ phase: "live" }));
    expect(document.querySelector(".FlipButton-root")).toBeNull();
    expect(document.querySelector(".FacingModeButton-root")).toBeNull();
    expect(document.querySelector(".AspectRatioButton-root")).toBeNull();
    expect(document.querySelector(".SnapshotButton-root")).toBeNull();
  });

  it("download-image.ts does not exist in the source tree", () => {
    const filePath = new URL("../src/utils/download-image.ts", import.meta.url);
    expect(existsSync(filePath)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Controlled / Uncontrolled 상태 소유권 계약
// flipped과 webcamOptions prop의 제어/비제어 경계를 검증한다.
// ---------------------------------------------------------------------------

describe("Webcam – controlled/uncontrolled state ownership", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  // -------------------------------------------------------------------------
  // flipped 제어/비제어 계약
  // -------------------------------------------------------------------------

  it("flipped (controlled, no onFlippedChange) — FlipButton click does NOT change transform", async () => {
    // read-only controlled: prop이 있지만 onChange가 없으므로 버튼 클릭이 무시돼야 한다.
    const { container } = render(
      <Webcam webcamOptions={{ audioEnabled: false }} flipped={false} visibleFlipButton />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    expect(container.querySelector("video")!.style.transform).toBe("none");

    const btn = document.querySelector(".FlipButton-root button") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();

    await act(async () => {
      btn!.click();
      await Promise.resolve();
    });

    // controlled prop이 false이므로 클릭 후에도 transform이 바뀌지 않아야 한다.
    expect(container.querySelector("video")!.style.transform).toBe("none");
  });

  it("flipped + onFlippedChange (fully controlled) — FlipButton click calls onFlippedChange, not state", async () => {
    // 완전 controlled: 클릭 시 onFlippedChange 콜백만 호출돼야 하고 직접 상태를 변경하면 안 된다.
    const onFlippedChange = vi.fn();
    const { container } = render(
      <Webcam
        webcamOptions={{ audioEnabled: false }}
        flipped={false}
        onFlippedChange={onFlippedChange}
        visibleFlipButton
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    expect(container.querySelector("video")!.style.transform).toBe("none");

    const btn = document.querySelector(".FlipButton-root button") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();

    await act(async () => {
      btn!.click();
      await Promise.resolve();
    });

    // onFlippedChange가 호출돼야 한다.
    expect(onFlippedChange).toHaveBeenCalledWith(true);
    // prop이 false로 유지되므로 직접 transform이 바뀌면 안 된다.
    expect(container.querySelector("video")!.style.transform).toBe("none");
  });

  it("defaultFlipped (uncontrolled) — FlipButton click DOES change transform", async () => {
    // 비제어 모드: flipped prop 없이 defaultFlipped만 사용 시 내부 상태가 변경돼야 한다.
    const { container } = render(
      <Webcam webcamOptions={{ audioEnabled: false }} defaultFlipped={false} visibleFlipButton />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const video = document.querySelector("video")!;
    await markVideoReady(video);

    expect(container.querySelector("video")!.style.transform).toBe("none");

    const btn = document.querySelector(".FlipButton-root button") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();

    await act(async () => {
      btn!.click();
      await Promise.resolve();
    });

    // 비제어 모드이므로 클릭 후 transform이 바뀌어야 한다.
    expect(container.querySelector("video")!.style.transform).toBe("scaleX(-1)");
  });

  it("flipped + defaultFlipped both provided — controlled (flipped) wins", async () => {
    // 제어 prop이 비제어 초기값보다 우선해야 한다.
    const { container } = render(
      <Webcam webcamOptions={{ audioEnabled: false }} flipped={true} defaultFlipped={false} />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    const video = getVideoElement(container)!;
    // controlled flipped=true가 defaultFlipped=false를 이겨야 한다.
    expect(video.style.transform).toBe("scaleX(-1)");
  });

  // -------------------------------------------------------------------------
  // webcamOptions 제어/비제어 계약
  // -------------------------------------------------------------------------

  it("webcamOptions (controlled, no onWebcamOptionsChange) — ref setWebcamOptions is ignored", async () => {
    // read-only controlled: ref handle을 통한 setWebcamOptions 호출이 무시돼야 한다.
    const ref = createRef<WebcamHandle>();
    const fakeStream = createFakeMediaStream();
    const getUserMediaMock = mockGetUserMedia(fakeStream);

    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false, facingMode: "user" }} />);

    await advanceToStreamLoad();

    const callCountBefore = getUserMediaMock.mock.calls.length;

    // In controlled mode (no onWebcamOptionsChange), setWebcamOptions should be ignored
    await act(async () => {
      ref.current?.setWebcamOptions({ audioEnabled: false, facingMode: "environment" });
      await vi.advanceTimersByTimeAsync(300);
    });

    // Should NOT trigger a new stream request — webcamOptions prop owns the state
    expect(getUserMediaMock.mock.calls.length).toBe(callCountBefore);
  });

  it("defaultWebcamOptions (uncontrolled) — ref setWebcamOptions DOES update options", async () => {
    // 비제어 모드: defaultWebcamOptions 사용 시 ref를 통한 갱신이 적용돼야 한다.
    const ref = createRef<WebcamHandle>();
    const onStateChange = vi.fn();
    render(
      <Webcam
        ref={ref}
        defaultWebcamOptions={{ audioEnabled: false, facingMode: "user" }}
        onStateChange={onStateChange}
      />,
    );

    await advanceToStreamLoad();

    // 비제어 초기값으로 스트림이 요청됐을 것이다.
    const callsBefore = onStateChange.mock.calls.filter(([s]) => s.phase === "live").length;

    act(() => {
      ref.current?.setWebcamOptions({ audioEnabled: false, facingMode: "environment" });
    });

    await advanceToStreamLoad();

    // 비제어 모드이므로 옵션 변경이 적용돼 스트림이 재요청돼야 한다.
    // 현재 구현에는 defaultWebcamOptions 지원이 없으므로 이 테스트는 FAIL이 예상된다.
    const callsAfter = onStateChange.mock.calls.filter(([s]) => s.phase === "live").length;
    expect(callsAfter).toBeGreaterThan(callsBefore);
  });
});

// ---------------------------------------------------------------------------
// WebcamHandle ref 공개 surface 계약
// ---------------------------------------------------------------------------

describe("WebcamHandle ref", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("ref로 snapshotToCanvas, setFlipped, setWebcamOptions에 접근할 수 있다", async () => {
    mockGetUserMedia(createFakeMediaStream());
    const ref = createRef<WebcamHandle>();

    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);

    await advanceToStreamLoad();

    expect(typeof ref.current?.snapshotToCanvas).toBe("function");
    expect(typeof ref.current?.setFlipped).toBe("function");
    expect(typeof ref.current?.setWebcamOptions).toBe("function");
    expect(typeof ref.current?.getPlayingVideoDeviceId).toBe("function");
    expect(typeof ref.current?.getPlayingAudioDeviceId).toBe("function");
  });

  it("ref handle에 video / mediaStream 직접 노출이 없다", async () => {
    mockGetUserMedia(createFakeMediaStream());
    const ref = createRef<WebcamHandle>();

    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);

    await advanceToStreamLoad();

    expect((ref.current as Record<string, unknown>)?.["video"]).toBeUndefined();
    expect((ref.current as Record<string, unknown>)?.["mediaStream"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// WebcamHandle – pausePlayback / resumePlayback ref 기반 호출 계약
// ---------------------------------------------------------------------------

describe("WebcamHandle – pausePlayback / resumePlayback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("ref를 통해 pausePlayback을 호출하면 video.pause()가 호출된다", async () => {
    // stream 없이도 video 요소가 있으면 pause()는 호출되어야 한다.
    mockGetUserMedia(createFakeMediaStream());
    const webcamRef = { current: null as WebcamHandle | null };

    const { container } = render(
      <Webcam ref={webcamRef} webcamOptions={{ audioEnabled: false }} />,
    );

    // video 요소가 렌더링될 때까지 대기한다.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    const video = container.querySelector("video")!;
    expect(video).not.toBeNull();

    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause");

    act(() => {
      webcamRef.current?.pausePlayback();
    });

    expect(pauseSpy).toHaveBeenCalledOnce();
  });

  it("ref를 통해 resumePlayback을 호출하면 video.play()가 호출된다", async () => {
    // resumePlayback은 stream이 있어야 play()를 호출한다.
    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);
    const webcamRef = { current: null as WebcamHandle | null };

    render(<Webcam ref={webcamRef} webcamOptions={{ audioEnabled: false }} />);

    // stream lifecycle을 완료시킨다.
    await advanceToStreamLoad();

    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    act(() => {
      webcamRef.current?.resumePlayback();
    });

    expect(playSpy).toHaveBeenCalled();
  });

  it("videoElement가 없을 때 pausePlayback은 no-op이다", async () => {
    // ref가 연결된 직후(스트림 요청 전)에 pausePlayback을 호출해도 에러가 없어야 한다.
    mockGetUserMedia(createFakeMediaStream());
    const webcamRef = { current: null as WebcamHandle | null };

    render(<Webcam ref={webcamRef} />);

    // 에러 없이 조용히 종료되어야 한다.
    expect(() => {
      act(() => {
        webcamRef.current?.pausePlayback();
      });
    }).not.toThrow();
  });
});
