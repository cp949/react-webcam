/** 순수 DOM 기반 팝업 메뉴 컴포넌트다. */
import type React from "react";
import { useEffect, useRef } from "react";

/** 팝업 메뉴의 단일 항목 */
export interface MenuPopupItem {
  /** 화면에 표시할 텍스트 */
  label: string;

  /** 호출자가 항목을 식별하기 위한 보조 값. MenuPopup 내부에서는 사용하지 않는다. */
  value?: unknown;

  /** 항목 선택 시 실행할 콜백 */
  onClick: () => void;
}

/** 팝업 메뉴가 받는 열림 상태와 항목 정보다. */
interface MenuPopupProps {
  /** 메뉴 DOM id */
  id?: string;

  /** 메뉴 열림 여부 */
  open: boolean;

  /** 메뉴를 닫는 콜백 */
  onClose: () => void;

  /** 렌더링할 메뉴 항목 목록 */
  items: MenuPopupItem[];

  /** 루트 메뉴 요소에 합칠 클래스 이름 */
  className?: string;

  /** 트리거 버튼 ref. mousedown 이벤트가 이 버튼에서 발생하면 메뉴를 닫지 않는다. */
  buttonRef?: React.RefObject<HTMLElement | null>;
}

/**
 * 버튼 근처에 뜨는 경량 팝업 메뉴를 렌더링한다.
 * 항목 선택, 외부 클릭, Escape 키, 포커스 이탈 시 자동으로 닫힌다.
 */
export function MenuPopup(props: MenuPopupProps) {
  const { id, open, onClose, items, className, buttonRef } = props;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // 키보드 사용자가 바로 탐색할 수 있도록 첫 항목으로 포커스를 옮긴다.
    const firstMenuItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    firstMenuItem?.focus();

    // 메뉴 자체나 트리거 버튼 안에서 발생한 이벤트는 닫기 대상으로 보지 않는다.
    function isInsideMenuOrButton(target: EventTarget | null) {
      if (!(target instanceof Node)) {
        return false;
      }

      return Boolean(menuRef.current?.contains(target) || buttonRef?.current?.contains(target));
    }

    // 버튼의 토글 로직과 충돌하지 않도록 외부 클릭만 닫기 조건으로 처리한다.
    function handleMouseDown(event: MouseEvent) {
      if (!isInsideMenuOrButton(event.target)) {
        onClose();
      }
    }

    // 포커스가 메뉴 영역을 벗어나면 열린 상태를 유지하지 않는다.
    function handleFocusIn(event: FocusEvent) {
      if (!isInsideMenuOrButton(event.target)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, buttonRef]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      id={id}
      role='menu'
      className={className}
      style={{
        position: "absolute",
        zIndex: 1300,
        margin: 0,
        padding: "4px 0",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        borderRadius: 4,
        minWidth: 80,
      }}
    >
      {items.map((item, index) => {
        // 메뉴를 먼저 닫아 포커스 정리를 끝낸 뒤, 실제 선택 콜백은 다음 틱에 실행한다.
        const handleClick = () => {
          onClose();
          setTimeout(() => {
            item.onClick();
          }, 0);
        };
        return (
          <button
            key={index}
            type='button'
            role='menuitem'
            onClick={handleClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                // 방향키 탐색은 마지막과 처음 항목 사이를 순환하도록 처리한다.
                e.preventDefault();
                const items = Array.from(
                  e.currentTarget.parentElement?.querySelectorAll<HTMLElement>(
                    '[role="menuitem"]',
                  ) ?? [],
                );
                const currentIndex = items.indexOf(e.currentTarget);
                if (currentIndex === -1) return;
                const nextIndex =
                  e.key === "ArrowDown"
                    ? (currentIndex + 1) % items.length
                    : (currentIndex - 1 + items.length) % items.length;
                items[nextIndex]?.focus();
              }
            }}
            style={{
              padding: "6px 16px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              color: "#000",
              fontSize: "0.875rem",
              display: "block",
              width: "100%",
              textAlign: "left",
              backgroundColor: "transparent",
              border: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "";
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
