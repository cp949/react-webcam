/** 카메라 방향 선택 버튼 컴포넌트다. */

import clsx from "clsx";
import React from "react";
import { CameraSwitchIcon } from "../icons/CameraSwitchIcon.js";
import { IconButton } from "./primitives/IconButton.js";
import { MenuPopup } from "./primitives/MenuPopup.js";

/** 카메라 방향 버튼의 라벨 재정의 옵션이다. */
type FacingModeMenuLabels = {
  /** 후면 카메라 항목 라벨 */
  back?: string;

  /** 전면 카메라 항목 라벨 */
  front?: string;

  /** 브라우저 기본값 항목 라벨 */
  default?: string;
};

/** 카메라 방향 버튼이 받는 props다. */
type FacingModeButtonProps = {
  /** 루트 요소에 적용할 인라인 스타일 */
  style?: React.CSSProperties;

  /** 루트 요소에 합칠 클래스 이름 */
  className?: string;

  /** 선택된 방향을 부모로 전달하는 콜백 */
  onChange: (mode: undefined | "user" | "environment") => void;

  /** 버튼 title / aria-label. 기본값: "전면/후면 카메라" */
  label?: string;

  /** 메뉴 항목 라벨 재정의 */
  menuLabels?: FacingModeMenuLabels;
};

/**
 * 전면·후면 카메라 전환 메뉴를 여는 버튼을 렌더링한다.
 * 선택 결과는 `onChange`로 전달하고, `undefined`는 브라우저 기본 방향을 뜻한다.
 */
export function FacingModeButton(props: FacingModeButtonProps) {
  const { style, className, onChange, label = "전면/후면 카메라", menuLabels } = props;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  // 접근성 속성 충돌을 막기 위해 인스턴스별 메뉴 id를 만든다.
  const menuId = `facing-mode-menu-${React.useId().replace(/:/g, "")}`;

  const handleCloseMenu = React.useCallback(() => {
    setMenuOpen(false);
  }, []);

  // 라벨과 선택 콜백을 한 배열로 묶어 MenuPopup에 전달한다.
  const menuItems = [
    {
      label: menuLabels?.back ?? "후면",
      onClick: () => onChange("environment"),
    },
    { label: menuLabels?.front ?? "전면", onClick: () => onChange("user") },
    {
      label: menuLabels?.default ?? "기본",
      onClick: () => onChange(undefined),
    },
  ];

  return (
    <div
      className={clsx("FacingModeButton-root", className)}
      style={{ position: "relative", ...style }}
    >
      <IconButton
        ref={buttonRef}
        className='x_btn'
        title={label}
        aria-label={label}
        aria-haspopup='true'
        aria-expanded={menuOpen ? "true" : undefined}
        aria-controls={menuId}
        style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <CameraSwitchIcon size='1.2rem' />
      </IconButton>
      <MenuPopup
        id={menuId}
        open={menuOpen}
        onClose={handleCloseMenu}
        items={menuItems}
        buttonRef={buttonRef}
      />
    </div>
  );
}
