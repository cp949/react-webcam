/**
 * 개별 제어 버튼 컴포넌트의 DOM 계약을 검증하는 테스트 파일이다.
 */
import { act, render } from "@testing-library/react";
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
