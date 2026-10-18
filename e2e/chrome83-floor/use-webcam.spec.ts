/**
 * Chrome 83에서 외부 video용 useWebcam 훅을 실브라우저로 검증한다.
 *
 * - 숨긴 video에서 isFrameReady와 언마운트 시 트랙 종료
 * - 교차 origin iframe의 카메라 정책 차단(policy-blocked)과 allow="camera" 대조군
 * - track-ended 이후 retry() 복구
 * - muted를 빠뜨렸을 때의 autoplay 동작 실측
 *
 * Playwright 1.64의 locator 가시성 검사는 Chrome 83에 없는 checkVisibility를 호출한다.
 * 모든 확인은 page/frame.evaluate와 poll로 한다.
 */
import { expect, test, type Frame, type Page } from "@playwright/test";

type Snapshot = {
  phase: string;
  errorCode: string | undefined;
  isFrameReady: boolean;
  streamId: string | undefined;
};

/** 카메라를 다시 받으면 새 스트림이 생기는지 보려고 트랙 정지 호출을 센다. */
async function countTrackStops(page: Page) {
  await page.addInitScript(() => {
    const target = window as unknown as { __trackStopCalls: number };
    target.__trackStopCalls = 0;
    const originalStop = MediaStreamTrack.prototype.stop;
    MediaStreamTrack.prototype.stop = function stop(this: MediaStreamTrack) {
      target.__trackStopCalls += 1;
      return originalStop.call(this);
    };
  });
}

/** harness가 노출한 훅 상태를 읽는다. 아직 렌더 전이면 undefined다. */
function readState(frame: Page | Frame): Promise<Snapshot | undefined> {
  return frame.evaluate(() => {
    const state = (window as unknown as { __harness?: Snapshot & { retry: () => void } }).__harness;
    if (!state) return undefined;
    const { phase, errorCode, isFrameReady, streamId } = state;
    return { phase, errorCode, isFrameReady, streamId };
  });
}

/** 상태가 조건을 만족할 때까지 기다리고 마지막 상태를 돌려준다. */
async function waitForState(
  frame: Page | Frame,
  predicate: (state: Snapshot) => boolean,
  timeout = 15_000,
): Promise<Snapshot> {
  let last: Snapshot | undefined;
  await expect
    .poll(
      async () => {
        last = await readState(frame);
        return !!last && predicate(last);
      },
      { timeout, message: () => `마지막 상태: ${JSON.stringify(last)}` },
    )
    .toBe(true);
  return last as Snapshot;
}

/** host(127.0.0.1)와 다른 origin이라 allow 속성이 없으면 카메라 정책이 막는다. */
const FRAME_ORIGIN = "http://localhost:4501";

async function openIframeHost(page: Page, allow: string | undefined) {
  const src = `${FRAME_ORIGIN}/hook.html`;
  const query = new URLSearchParams({ src });
  if (allow) query.set("allow", allow);
  await page.goto(`/iframe-host.html?${query.toString()}`);
  await expect.poll(() => page.frames().some((f) => f.url().startsWith(src))).toBe(true);
  return page.frames().find((f) => f.url().startsWith(src)) as Frame;
}

test.describe("useWebcam (Chrome 83)", () => {
  test("display:none video에서 isFrameReady가 true가 되고 언마운트하면 트랙이 종료된다", async ({
    page,
  }) => {
    await countTrackStops(page);
    await page.goto("/hook.html");

    await waitForState(page, (s) => s.phase === "live" && s.isFrameReady);
    const video = await page.evaluate(() => {
      const el = (window as unknown as { __video: HTMLVideoElement }).__video;
      const stream = el.srcObject as MediaStream;
      return {
        display: getComputedStyle(el).display,
        readyState: el.readyState,
        videoWidth: el.videoWidth,
        liveTracks: stream.getTracks().filter((t) => t.readyState === "live").length,
      };
    });
    expect(video.display).toBe("none");
    expect(video.readyState).toBeGreaterThanOrEqual(2);
    expect(video.videoWidth).toBeGreaterThan(0);
    expect(video.liveTracks).toBeGreaterThan(0);

    // 언마운트 후에는 같은 스트림의 트랙이 모두 ended여야 한다.
    await page.evaluate(() => {
      const target = window as unknown as { __stream?: MediaStream; __video: HTMLVideoElement };
      target.__stream = target.__video.srcObject as MediaStream;
    });
    await page.evaluate(() => document.getElementById("harness-unmount")?.click());
    await expect
      .poll(() =>
        page.evaluate(() => {
          const target = window as unknown as { __stream: MediaStream; __video: HTMLVideoElement };
          return {
            allEnded: target.__stream.getTracks().every((t) => t.readyState === "ended"),
            detached: target.__video.srcObject === null,
          };
        }),
      )
      .toEqual({ allEnded: true, detached: true });
  });

  test("allow 속성이 없는 교차 origin iframe은 policy-blocked / denied가 된다", async ({
    page,
  }) => {
    const frame = await openIframeHost(page, undefined);
    const state = await waitForState(frame, (s) => s.phase !== "idle" && s.phase !== "requesting");
    expect(state).toMatchObject({ phase: "denied", errorCode: "policy-blocked" });
    expect(state.isFrameReady).toBe(false);

    // Chrome 83에는 permissionsPolicy가 없고 featurePolicy 경로가 이 판정을 만든다.
    const api = await frame.evaluate(() => ({
      permissionsPolicy: "permissionsPolicy" in document,
      featurePolicy: "featurePolicy" in document,
      cameraAllowed: (
        document as unknown as { featurePolicy: { allowsFeature(f: string): boolean } }
      ).featurePolicy.allowsFeature("camera"),
    }));
    expect(api).toEqual({ permissionsPolicy: false, featurePolicy: true, cameraAllowed: false });
  });

  test('allow="camera" iframe은 live가 되고 isFrameReady가 true다 (대조군)', async ({ page }) => {
    const frame = await openIframeHost(page, "camera");
    const state = await waitForState(frame, (s) => s.phase === "live" && s.isFrameReady);
    expect(state.errorCode).toBeUndefined();
  });

  test("track-ended 이후 retry()로 live와 isFrameReady가 복구된다", async ({ page }) => {
    await page.goto("/hook.html");
    const first = await waitForState(page, (s) => s.phase === "live" && s.isFrameReady);

    // track.stop()은 ended 이벤트를 발생시키지 않는다(스펙). 카메라 분리를 흉내 내려고
    // 트랙을 멈춘 뒤 ended를 직접 발생시킨다.
    await page.evaluate(() => {
      const video = (window as unknown as { __video: HTMLVideoElement }).__video;
      const track = (video.srcObject as MediaStream).getVideoTracks()[0]!;
      track.stop();
      track.dispatchEvent(new Event("ended"));
    });
    const failed = await waitForState(page, (s) => s.phase === "error");
    expect(failed).toMatchObject({ errorCode: "track-ended", isFrameReady: false });

    await page.evaluate(() =>
      (window as unknown as { __harness: { retry: () => void } }).__harness.retry(),
    );
    const recovered = await waitForState(
      page,
      (s) => s.phase === "live" && s.isFrameReady && s.streamId !== first.streamId,
    );
    expect(recovered.errorCode).toBeUndefined();
  });

  test.describe("muted를 설정하지 않은 호출자", () => {
    // 한계: 이 환경은 autoplay 차단을 재현하지 못한다. 카메라를 쓰지 않는 빈 페이지에서
    // 소리 있는 비스트림 video.play()가 --autoplay-policy=user-gesture-required와
    // document-user-activation-required 양쪽에서 모두 성공했다(2026-10-18 실측).
    // 아래 결과는 "Chrome 83 headless에서 막히지 않았다"는 기록일 뿐
    // muted가 불필요하다는 증거가 아니다. 근거는 docs/adr/0002를 본다.
    for (const audio of ["0", "1"]) {
      test(`audioEnabled=${audio === "1"}: muted가 없어도 getUserMedia 스트림은 재생된다`, async ({
        page,
      }) => {
        await page.goto(`/hook.html?muted=0&audio=${audio}`);
        const state = await waitForState(
          page,
          (s) => s.phase === "live" || s.phase === "playback-error",
        );
        expect(state).toMatchObject({ phase: "live", isFrameReady: true });
      });
    }
  });
});
