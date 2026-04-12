/** 화면 비율 선택 버튼 컴포넌트다. */

import clsx from "clsx";
import React from "react";
import type { AspectRatioOption } from "../aspect-ratio-option.js";
import { AspectRatioIcon } from "../icons/AspectRatioIcon.js";
import { roundTo3Decimals } from "../utils/round-to-3-decimals.js";
import { IconButton } from "./primitives/IconButton.js";
import { MenuPopup } from "./primitives/MenuPopup.js";

/** 선택 가능한 화면 비율 목록 */
const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { label: "4:3", value: roundTo3Decimals(4 / 3) },
  { label: "16:9", value: roundTo3Decimals(16 / 9) },
  { label: "2:1", value: roundTo3Decimals(2 / 1) },
  { label: "1:1", value: 1 },
];

/** 화면 비율 버튼이 받는 props다. */
type AspectRatioButtonProps = {
  /** 루트 요소에 적용할 인라인 스타일 */
  style?: React.CSSProperties;

  /** 루트 요소에 합칠 클래스 이름 */
  className?: string;

  /** 선택된 비율을 부모로 전달하는 콜백 */
  onChange: (aspectRatio: undefined | { label: string; value: number }) => void;

  /** 버튼 title / aria-label. 기본값: "크기 비율" */
  label?: string;

  /** 자동(비율 없음) 메뉴 항목 라벨. 기본값: "자동" */
  autoLabel?: string;
};

/**
 * 화면 비율 목록을 여는 버튼을 렌더링한다.
 * 비율을 선택하지 않은 상태는 `undefined`로 전달해 자동 비율을 뜻하게 한다.
 */
export function AspectRatioButton(props: AspectRatioButtonProps) {
  const { style, className, onChange, label = "크기 비율", autoLabel = "자동" } = props;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  // 접근성 속성 충돌을 막기 위해 인스턴스별 메뉴 id를 만든다.
  const menuId = `aspect-ratio-menu-${React.useId().replace(/:/g, "")}`;

  const handleCloseMenu = React.useCallback(() => {
    setMenuOpen(false);
  }, []);

  // 자동 항목과 고정 비율 항목을 한 번에 묶어 팝업 메뉴에 넘긴다.
  const menuItems = [
    { label: autoLabel, onClick: () => onChange(undefined) },
    ...ASPECT_RATIO_OPTIONS.map((it) => ({
      label: it.label,
      onClick: () => onChange(it),
    })),
  ];

  return (
    <div
      className={clsx("AspectRatioButton-root", className)}
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
        <AspectRatioIcon size='1.2rem' />
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
