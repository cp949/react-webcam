/** 미디어 장치 오류와 비디오 이벤트를 콘솔에 기록하기 위한 디버그 유틸이다. */

/** `getUserMedia` 실패 원인을 사람이 읽기 쉬운 로그로 출력한다. */
export async function debugUserMediaError(err: unknown) {
  const errname =
    err != null && typeof err === "object" && "name" in err && typeof err.name === "string"
      ? err.name
      : undefined;

  switch (errname) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      console.log("Error: Permission denied for media devices.");
      break;
    case "NotFoundError":
    case "DevicesNotFoundError":
      console.log("Error: No media devices found.");
      break;
    case "NotReadableError":
    case "TrackStartError":
      console.log("Error: Media device is currently in use or not readable.");
      break;
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      console.log("Error: The requested media device does not meet the specified constraints.");
      console.log("Constraint:", (err as OverconstrainedError).constraint);
      break;
    case "TypeError":
      console.log("Error: Invalid constraints or options provided.");
      break;
    case "AbortError":
      console.log("Error: The operation was aborted.");
      break;
    case "SecurityError":
      console.log("Error: Security error, check HTTPS connection.");
      break;
    case "InvalidStateError":
      console.log("Error: Media device is in an invalid state.");
      break;
    default:
      console.log("Unknown error occurred:", err);
  }
}

/** 비디오 요소의 주요 이벤트를 콘솔에 기록하고 정리 함수를 반환한다. */
export function startDebugVideoEventListener(videoElem: HTMLVideoElement): VoidFunction {
  // 재생 상태 추적에 도움이 되는 주요 이벤트만 추려서 구독한다.
  const videoEvents: string[] = [
    "loadstart",
    "loadedmetadata",
    "loadeddata",
    "progress",
    "canplay",
    "canplaythrough",
    "play",
    "playing",
    "pause",
    "ended",
    // 'timeupdate',
    "seeked",
    "seeking",
    "volumechange",
    "error",
    "abort",
    "stalled",
    "waiting",
    "ratechange",
    "durationchange",
    "fullscreenchange",
  ];

  const closables = [] as VoidFunction[];
  // 각 이벤트 리스너를 등록하고 해제 함수를 함께 수집한다.
  videoEvents.forEach((eventName) => {
    const onEvent = (event: Event) => {
      console.log(`Event: ${eventName}`, event);
    };
    videoElem.addEventListener(eventName, onEvent);
    closables.push(() => {
      videoElem.removeEventListener(eventName, onEvent);
    });
  });

  return () => {
    closables.forEach((fn) => {
      fn();
    });
  };
}
