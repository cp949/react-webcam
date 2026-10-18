/**
 * 개별 제어 버튼 컴포넌트의 DOM 계약을 검증하는 테스트 파일이다.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AspectRatioButton } from "../src/components/AspectRatioButton.js";
import { FacingModeButton } from "../src/components/FacingModeButton.js";
import { FlipButton } from "../src/components/FlipButton.js";
import { SnapshotButton } from "../src/components/SnapshotButton.js";

// ---------------------------------------------------------------------------
// AspectRatioButton DOM 계약
// ---------------------------------------------------------------------------

describe("AspectRatioButton – DOM interactions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("clicking the button opens a menu", async () => {
    const { container } = render(<AspectRatioButton onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    const items = container.querySelectorAll('[role="menuitem"]');
    expect(items.length).toBeGreaterThan(0);
  });

  it("selecting a menu item calls onChange and closes the menu", async () => {
    const onChange = vi.fn();
    const { container } = render(<AspectRatioButton onChange={onChange} />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    const item4x3 = Array.from(container.querySelectorAll('[role="menuitem"]')).find(
      (el) => el.textContent === "4:3",
    ) as HTMLElement;
    expect(item4x3).toBeTruthy();
    await act(async () => {
      item4x3.click();
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ label: "4:3" }));
    // 선택 뒤에는 메뉴가 닫혀야 한다.
    expect(container.querySelectorAll('[role="menuitem"]').length).toBe(0);
  });

  it("button has accessible title/aria-label", () => {
    const { container } = render(<AspectRatioButton onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    const label = btn.getAttribute("title") ?? btn.getAttribute("aria-label");
    expect(label).toBeTruthy();
  });

  it("메뉴는 버튼 오른쪽 끝에 맞춰 왼쪽으로 열려 오른쪽 경계를 넘지 않는다", async () => {
    const { container } = render(<AspectRatioButton onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    const menu = container.querySelector('[role="menu"]') as HTMLElement;
    expect(menu.style.right).toBe("0px");
  });

  it("closes the menu when focus moves outside", async () => {
    const { container } = render(
      <>
        <AspectRatioButton onChange={() => {}} />
        <button type='button'>outside</button>
      </>,
    );

    const btn = container.querySelector(".AspectRatioButton-root button") as HTMLButtonElement;
    const outside = Array.from(container.querySelectorAll("button")).find(
      (element) => element !== btn,
    )!;

    await act(async () => {
      btn.click();
    });
    expect(container.querySelectorAll('[role="menuitem"]').length).toBeGreaterThan(0);

    await act(async () => {
      outside.focus();
      await Promise.resolve();
    });

    expect(container.querySelectorAll('[role="menuitem"]').length).toBe(0);
  });

  it("uses a unique menu id per instance", async () => {
    const { container } = render(
      <>
        <AspectRatioButton onChange={() => {}} />
        <AspectRatioButton onChange={() => {}} />
      </>,
    );

    const buttons = Array.from(
      container.querySelectorAll(".AspectRatioButton-root button"),
    ) as HTMLButtonElement[];

    await act(async () => {
      buttons[0]!.click();
      buttons[1]!.click();
    });

    expect(buttons[0]!.getAttribute("aria-controls")).toBeTruthy();
    expect(buttons[1]!.getAttribute("aria-controls")).toBeTruthy();
    expect(buttons[0]!.getAttribute("aria-controls")).not.toBe(
      buttons[1]!.getAttribute("aria-controls"),
    );
  });
});

// ---------------------------------------------------------------------------
// FacingModeButton DOM 계약
// ---------------------------------------------------------------------------

describe("FacingModeButton – DOM interactions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("clicking the button opens a menu", async () => {
    const { container } = render(<FacingModeButton onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    const items = container.querySelectorAll('[role="menuitem"]');
    expect(items.length).toBeGreaterThan(0);
  });

  it("메뉴는 버튼 오른쪽 끝에 맞춰 왼쪽으로 열려 오른쪽 경계를 넘지 않는다", async () => {
    const { container } = render(<FacingModeButton onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    const menu = container.querySelector('[role="menu"]') as HTMLElement;
    expect(menu.style.right).toBe("0px");
  });

  it('selecting 전면 calls onChange with "user" and closes the menu', async () => {
    const onChange = vi.fn();
    const { container } = render(<FacingModeButton onChange={onChange} />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    const itemFront = Array.from(container.querySelectorAll('[role="menuitem"]')).find(
      (el) => el.textContent === "전면",
    ) as HTMLElement;
    expect(itemFront).toBeTruthy();
    await act(async () => {
      itemFront.click();
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(onChange).toHaveBeenCalledWith("user");
    expect(container.querySelectorAll('[role="menuitem"]').length).toBe(0);
  });

  it("closes the menu when focus moves outside", async () => {
    const { container } = render(
      <>
        <FacingModeButton onChange={() => {}} />
        <button type='button'>outside</button>
      </>,
    );

    const btn = container.querySelector(".FacingModeButton-root button") as HTMLButtonElement;
    const outside = Array.from(container.querySelectorAll("button")).find(
      (element) => element !== btn,
    )!;

    await act(async () => {
      btn.click();
    });
    expect(container.querySelectorAll('[role="menuitem"]').length).toBeGreaterThan(0);

    await act(async () => {
      outside.focus();
      await Promise.resolve();
    });

    expect(container.querySelectorAll('[role="menuitem"]').length).toBe(0);
  });

  it("uses a unique menu id per instance", async () => {
    const { container } = render(
      <>
        <FacingModeButton onChange={() => {}} />
        <FacingModeButton onChange={() => {}} />
      </>,
    );

    const buttons = Array.from(
      container.querySelectorAll(".FacingModeButton-root button"),
    ) as HTMLButtonElement[];

    await act(async () => {
      buttons[0]!.click();
      buttons[1]!.click();
    });

    expect(buttons[0]!.getAttribute("aria-controls")).toBeTruthy();
    expect(buttons[1]!.getAttribute("aria-controls")).toBeTruthy();
    expect(buttons[0]!.getAttribute("aria-controls")).not.toBe(
      buttons[1]!.getAttribute("aria-controls"),
    );
  });
});

// ---------------------------------------------------------------------------
// FlipButton DOM 계약
// ---------------------------------------------------------------------------

describe("FlipButton – DOM interactions", () => {
  it("clicking calls onChange with toggled value", async () => {
    const onChange = vi.fn();
    const { container } = render(<FlipButton flipped={false} onChange={onChange} />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("button has accessible title/aria-label", () => {
    const { container } = render(<FlipButton flipped={false} onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    const label = btn.getAttribute("title") ?? btn.getAttribute("aria-label");
    expect(label).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// SnapshotButton DOM 계약
// ---------------------------------------------------------------------------

describe("SnapshotButton – DOM interactions", () => {
  it("clicking calls onClick", async () => {
    const onClick = vi.fn();
    const { container } = render(<SnapshotButton onClick={onClick} />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("button has accessible title/aria-label", () => {
    const { container } = render(<SnapshotButton onClick={() => {}} />);
    const btn = container.querySelector("button")!;
    const label = btn.getAttribute("title") ?? btn.getAttribute("aria-label");
    expect(label).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 메뉴 버튼 접근성 계약 (ARIA, 포커스 복귀, 키보드 조작)
// ---------------------------------------------------------------------------

describe.each([
  { name: "AspectRatioButton", Button: AspectRatioButton, rootClass: ".AspectRatioButton-root" },
  { name: "FacingModeButton", Button: FacingModeButton, rootClass: ".FacingModeButton-root" },
])("$name – 메뉴 접근성", ({ Button, rootClass }) => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  function renderButton() {
    const { container } = render(<Button onChange={() => {}} />);
    const trigger = container.querySelector(`${rootClass} button`) as HTMLButtonElement;
    const menuItems = () =>
      Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    return { trigger, menuItems };
  }

  it("트리거는 aria-haspopup='menu'이고 aria-expanded가 열림 상태를 항상 나타낸다", async () => {
    const { trigger } = renderButton();
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    await act(async () => {
      trigger.click();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await act(async () => {
      trigger.click();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("Escape로 닫으면 포커스가 트리거로 돌아온다", async () => {
    const { trigger, menuItems } = renderButton();
    await act(async () => {
      trigger.click();
    });
    expect(document.activeElement).toBe(menuItems()[0]);

    await act(async () => {
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    });
    expect(menuItems().length).toBe(0);
    expect(document.activeElement).toBe(trigger);
  });

  it("항목을 선택해 닫으면 포커스가 트리거로 돌아온다", async () => {
    const { trigger, menuItems } = renderButton();
    await act(async () => {
      trigger.click();
    });
    await act(async () => {
      menuItems()[1]!.click();
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(menuItems().length).toBe(0);
    expect(document.activeElement).toBe(trigger);
  });

  it("바깥 클릭으로 닫으면 포커스를 트리거로 돌리지 않는다", async () => {
    const { trigger, menuItems } = renderButton();
    await act(async () => {
      trigger.click();
    });
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    expect(menuItems().length).toBe(0);
    expect(document.activeElement).not.toBe(trigger);
  });

  it("트리거에서 ArrowDown을 누르면 메뉴가 열리고 첫 항목에 포커스가 간다", async () => {
    const { trigger, menuItems } = renderButton();
    trigger.focus();
    await act(async () => {
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
    });
    expect(menuItems().length).toBeGreaterThan(0);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(menuItems()[0]);
  });

  it("Home/End로 첫 항목과 마지막 항목으로 이동한다", async () => {
    const { trigger, menuItems } = renderButton();
    await act(async () => {
      trigger.click();
    });
    const items = menuItems();

    await act(async () => {
      fireEvent.keyDown(document.activeElement!, { key: "End" });
    });
    expect(document.activeElement).toBe(items[items.length - 1]);

    await act(async () => {
      fireEvent.keyDown(document.activeElement!, { key: "Home" });
    });
    expect(document.activeElement).toBe(items[0]);
  });
});
