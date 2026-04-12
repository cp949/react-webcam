/** 좌우 반전 토글 버튼 컴포넌트다. */

import clsx from "clsx";
import type React from "react";
import { FlipCameraIcon } from "../icons/FlipCameraIcon.js";
import { IconButton } from "./primitives/IconButton.js";

/** 좌우 반전 버튼이 받는 props다. */
type FlipButtonProps = {
  /** 루트 요소에 합칠 클래스 이름 */
  className?: string;

  /** 현재 반전 상태. true이면 활성색으로 표시한다. */
  flipped?: boolean;

  /** 반전 상태 변경을 부모로 전달하는 콜백 */
  onChange: (flipped: boolean) => void;

  /** 루트 요소에 적용할 인라인 스타일 */
  style?: React.CSSProperties;

  /** 버튼 title / aria-label. 기본값: "미러" */
  label?: string;
};

/**
 * 카메라 미리보기의 좌우 반전 상태를 토글하는 버튼을 렌더링한다.
 * `flipped` 값에 따라 아이콘 강조색을 바꿔 현재 상태를 드러낸다.
 */
export function FlipButton(props: FlipButtonProps) {
  const { className, flipped = false, onChange, style, label = "미러" } = props;
  return (
    <span
      className={clsx("FlipButton-root", className)}
      style={{ color: flipped ? "#ff7600" : "#fff", ...style }}
    >
      <IconButton
        className='x_btn'
        title={label}
        aria-label={label}
        style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "inherit" }}
        onClick={() => {
          // 현재 상태를 반전해 부모가 최종 상태를 소유하도록 한다.
          onChange(!flipped);
        }}
      >
        <FlipCameraIcon size='1.2rem' />
      </IconButton>
    </span>
  );
}
