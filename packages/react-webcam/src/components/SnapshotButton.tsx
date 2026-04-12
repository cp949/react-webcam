/** 스냅샷 촬영 버튼 컴포넌트다. */

import clsx from "clsx";
import React from "react";
import { CameraIcon } from "../icons/CameraIcon.js";
import { IconButton } from "./primitives/IconButton.js";

/** 스냅샷 버튼이 받는 표시 옵션과 클릭 핸들러다. */
type SnapshotButtonProps = {
  /** 루트 요소에 합칠 클래스 이름 */
  className?: string;

  /** 루트 요소에 적용할 인라인 스타일 */
  style?: React.CSSProperties;

  /** 클릭 가능 여부 */
  disabled?: boolean;

  /** 스냅샷 요청 클릭 핸들러 */
  onClick: React.MouseEventHandler;

  /** 버튼 title / aria-label. 기본값: "스냅샷" */
  label?: string;
};

/**
 * 스냅샷 촬영 버튼을 렌더링한다.
 * 호버와 비활성 상태를 함께 표현해 촬영 가능 여부를 드러낸다.
 */
export function SnapshotButton(props: SnapshotButtonProps) {
  const { style, className, disabled = false, onClick, label = "스냅샷" } = props;
  // 호버 상태를 별도로 두어 아이콘 강조색만 가볍게 바꾼다.
  const [hovered, setHovered] = React.useState(false);
  return (
    <span
      className={clsx("SnapshotButton-root", className)}
      style={{ color: hovered ? "#1976d2" : "#fff", ...style }}
    >
      <IconButton
        className='x_btn'
        title={label}
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ padding: "2px", backgroundColor: "rgba(0,0,0,0.1)", color: "inherit" }}
      >
        <CameraIcon size='2rem' />
      </IconButton>
    </span>
  );
}
