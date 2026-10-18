/**
 * 키보드 포커스가 호버와 같은 시각 효과를 갖는지 검증하는 테스트 파일이다.
 * 마우스 클릭으로 생긴 포커스는 강조하지 않는다.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MenuPopup } from "../src/components/primitives/MenuPopup.js";
import { SnapshotButton } from "../src/components/SnapshotButton.js";

const ACCENT = "var(--webcam-accent, #1976d2)";
const MENU_HOVER = "var(--webcam-menu-hover-bg, #f5f5f5)";

/** 브라우저가 포커스를 키보드 유래로 보는지 여부를 흉내 낸다. */
function mockFocusVisible(visible: boolean) {
  const original = Element.prototype.matches;
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    return selector === ":focus-visible" ? visible : original.call(this, selector);
  });
}

describe("SnapshotButton 포커스 효과", () => {
  afterEach(() => vi.restoreAllMocks());

  it("키보드 포커스를 받으면 호버와 같은 강조색을 쓰고 blur되면 되돌린다", () => {
    const { container } = render(<SnapshotButton onClick={() => {}} />);
    const root = container.firstElementChild as HTMLElement;
    const button = container.querySelector("button")!;

    act(() => button.focus());
    expect(root.style.color).toBe(ACCENT);

    act(() => button.blur());
    expect(root.style.color).toBe("#fff");
  });

  it("마우스로 생긴 포커스는 강조하지 않는다", () => {
    mockFocusVisible(false);
    const { container } = render(<SnapshotButton onClick={() => {}} />);
    const root = container.firstElementChild as HTMLElement;

    act(() => container.querySelector("button")!.focus());

    expect(root.style.color).toBe("#fff");
  });

  it(":focus-visible을 모르는 브라우저에서는 포커스를 강조한다", () => {
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (
      this: Element,
      selector: string,
    ) {
      if (selector === ":focus-visible") throw new DOMException("invalid", "SyntaxError");
      return false;
    });
    const { container } = render(<SnapshotButton onClick={() => {}} />);
    const root = container.firstElementChild as HTMLElement;

    act(() => container.querySelector("button")!.focus());

    expect(root.style.color).toBe(ACCENT);
  });

  it("포커스를 잃어도 마우스가 위에 있으면 강조를 유지한다", () => {
    const { container } = render(<SnapshotButton onClick={() => {}} />);
    const root = container.firstElementChild as HTMLElement;
    const button = container.querySelector("button")!;

    fireEvent.mouseEnter(button);
    act(() => button.focus());
    act(() => button.blur());

    expect(root.style.color).toBe(ACCENT);
  });
});

describe("MenuPopup 항목 포커스 효과", () => {
  afterEach(() => vi.restoreAllMocks());

  function renderMenu() {
    const view = render(
      <MenuPopup
        open
        onClose={() => {}}
        items={[
          { label: "A", onClick: () => {} },
          { label: "B", onClick: () => {} },
        ]}
      />,
    );
    return { ...view, items: view.getAllByRole("menuitem") };
  }

  it("항목이 키보드 포커스를 받으면 호버 배경을 쓰고 blur되면 지운다", () => {
    const { items } = renderMenu();
    const second = items[1]!;

    act(() => second.focus());
    expect(second.style.backgroundColor).toBe(MENU_HOVER);

    act(() => second.blur());
    expect(second.style.backgroundColor).not.toBe(MENU_HOVER);
  });

  it("마우스로 생긴 포커스는 배경을 바꾸지 않는다", () => {
    mockFocusVisible(false);
    const { items } = renderMenu();
    const second = items[1]!;

    act(() => second.focus());

    expect(second.style.backgroundColor).not.toBe(MENU_HOVER);
  });

  it("포커스된 항목에서 마우스가 나가도 배경을 유지한다", () => {
    const { items } = renderMenu();
    const second = items[1]!;

    act(() => second.focus());
    fireEvent.mouseEnter(second);
    fireEvent.mouseLeave(second);

    expect(second.style.backgroundColor).toBe(MENU_HOVER);
  });

  it("포커스가 없는 항목에서 마우스가 나가면 배경을 지운다", () => {
    const { items } = renderMenu();
    const second = items[1]!;

    fireEvent.mouseEnter(second);
    expect(second.style.backgroundColor).toBe(MENU_HOVER);
    fireEvent.mouseLeave(second);

    expect(second.style.backgroundColor).not.toBe(MENU_HOVER);
  });
});
