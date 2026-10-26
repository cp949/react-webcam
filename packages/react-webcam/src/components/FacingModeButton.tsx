/** 카메라 방향 토글 버튼 컴포넌트다. */

import React from "react";
import { CameraSwitchIcon } from "../icons/CameraSwitchIcon.js";
import { classNames } from "../utils/class-names.js";
import { IconButton } from "./primitives/IconButton.js";

/** 카메라 방향 버튼의 현재 방향 라벨 재정의 옵션이다. */
type FacingModeStateLabels = {
  /** 후면 카메라 라벨 */
  back?: string;

  /** 전면 카메라 라벨 */
  front?: string;
};

/** 카메라 방향 버튼이 받는 props다. */
type FacingModeButtonProps = {
  /** 루트 요소에 적용할 인라인 스타일 */
  style?: React.CSSProperties;

  /** 루트 요소에 합칠 클래스 이름 */
  className?: string;

  /** 현재 카메라 방향. `undefined`는 브라우저 기본 방향이며 전면으로 취급한다. */
  facingMode?: "user" | "environment";

  /** 토글 결과 방향을 부모로 전달하는 콜백 */
  onChange: (mode: "user" | "environment") => void;

  /** 버튼 title / aria-label 접두. 기본값: "전면/후면 카메라" */
  label?: string;

  /** 현재 방향 라벨 재정의 */
  stateLabels?: FacingModeStateLabels;
};

/**
 * 전면·후면 카메라를 번갈아 선택하는 토글 버튼을 렌더링한다.
 * 누르면 현재와 반대 방향을 `onChange`로 전달한다.
 */
export function FacingModeButton(props: FacingModeButtonProps) {
  const { style, className, facingMode, onChange, label = "전면/후면 카메라", stateLabels } = props;
  const isRear = facingMode === "environment";
  // 현재 방향을 이름에 넣어 스크린리더와 tooltip이 상태를 알려 주도록 한다.
  const currentLabel = isRear ? (stateLabels?.back ?? "후면") : (stateLabels?.front ?? "전면");
  const name = `${label}: ${currentLabel}`;

  return (
    <span className={classNames("FacingModeButton-root", className)} style={style}>
      <IconButton
        className='x_btn'
        title={name}
        aria-label={name}
        style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}
        onClick={() => onChange(isRear ? "user" : "environment")}
      >
        <CameraSwitchIcon size='1.2rem' />
      </IconButton>
    </span>
  );
}
