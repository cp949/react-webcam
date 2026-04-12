/** 아이콘 버튼의 공통 DOM 래퍼를 제공하는 파일이다. */
import React from "react";

/** 아이콘 버튼 래퍼가 받는 접근성 및 표시 옵션이다. */
interface IconButtonProps {
  /** 클릭 핸들러 */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;

  /** 마우스 진입 핸들러 */
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;

  /** 마우스 이탈 핸들러 */
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;

  /** 버튼 비활성화 여부 */
  disabled?: boolean;

  /** 네이티브 tooltip 텍스트. aria-label과 함께 접근성 레이블로도 활용된다. */
  title?: string;

  /** 스크린리더용 버튼 레이블 */
  "aria-label"?: string;

  /** 연결된 팝업의 종류 */
  "aria-haspopup"?: React.AriaAttributes["aria-haspopup"];

  /** 팝업 열림 상태 */
  "aria-expanded"?: React.AriaAttributes["aria-expanded"];

  /** 연결된 팝업 메뉴의 id */
  "aria-controls"?: string;

  /** 버튼에 합칠 클래스 이름 */
  className?: string;

  /** 버튼에 적용할 인라인 스타일 */
  style?: React.CSSProperties;

  /** 버튼 내부에 렌더링할 아이콘 또는 텍스트 */
  children?: React.ReactNode;
}

/**
 * 아이콘 중심 버튼을 공통 속성으로 감싼 네이티브 버튼 래퍼다.
 * 팝업 트리거로도 쓸 수 있도록 ref를 외부에 노출한다.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(props, ref) {
    const {
      onClick,
      onMouseEnter,
      onMouseLeave,
      disabled,
      title,
      className,
      style,
      children,
      "aria-label": ariaLabel,
      "aria-haspopup": ariaHasPopup,
      "aria-expanded": ariaExpanded,
      "aria-controls": ariaControls,
    } = props;

    return (
      <button
        ref={ref}
        type='button'
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        aria-haspopup={ariaHasPopup}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          cursor: disabled ? "default" : "pointer",
          padding: "4px",
          color: "inherit",
          ...style,
        }}
      >
        {children}
      </button>
    );
  },
);
