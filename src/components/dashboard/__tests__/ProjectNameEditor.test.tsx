import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectNameEditor } from "../ProjectNameEditor";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function setup(
  overrides: {
    initialName?: string;
    onCommit?: (name: string) => Promise<void>;
    onCancel?: () => void;
  } = {}
) {
  const onCommit = overrides.onCommit ?? vi.fn().mockResolvedValue(undefined);
  const onCancel = overrides.onCancel ?? vi.fn();
  const initialName = overrides.initialName ?? "My Project";

  render(
    <ProjectNameEditor
      initialName={initialName}
      onCommit={onCommit}
      onCancel={onCancel}
    />
  );

  const input = screen.getByRole("textbox") as HTMLInputElement;
  return { input, onCommit, onCancel };
}

test("renders with initial name in the input", () => {
  const { input } = setup({ initialName: "Hello World" });
  expect(input.value).toBe("Hello World");
});

test("auto-focuses the input on mount", () => {
  const { input } = setup();
  expect(document.activeElement).toBe(input);
});

test("Enter key commits the current value", async () => {
  const onCommit = vi.fn().mockResolvedValue(undefined);
  const { input } = setup({ initialName: "Original", onCommit });

  await userEvent.clear(input);
  await userEvent.type(input, "New Name");
  fireEvent.keyDown(input, { key: "Enter" });

  await waitFor(() => expect(onCommit).toHaveBeenCalledWith("New Name"));
});

test("Enter key trims whitespace before committing", async () => {
  const onCommit = vi.fn().mockResolvedValue(undefined);
  const { input } = setup({ initialName: "Original", onCommit });

  await userEvent.clear(input);
  await userEvent.type(input, "  Padded  ");
  fireEvent.keyDown(input, { key: "Enter" });

  await waitFor(() => expect(onCommit).toHaveBeenCalledWith("Padded"));
});

test("Enter key with empty/whitespace-only value shows validation error, does not commit", async () => {
  const onCommit = vi.fn().mockResolvedValue(undefined);
  const { input } = setup({ initialName: "Original", onCommit });

  await userEvent.clear(input);
  fireEvent.keyDown(input, { key: "Enter" });

  expect(onCommit).not.toHaveBeenCalled();
  expect(screen.getByText(/1.+100/i)).toBeDefined();
});

test("Escape key calls onCancel", () => {
  const onCancel = vi.fn();
  const { input } = setup({ onCancel });

  fireEvent.keyDown(input, { key: "Escape" });

  expect(onCancel).toHaveBeenCalledOnce();
});

test("blur calls onCancel (not onCommit)", async () => {
  const onCommit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const { input } = setup({ onCommit, onCancel });

  fireEvent.blur(input);

  expect(onCancel).toHaveBeenCalledOnce();
  expect(onCommit).not.toHaveBeenCalled();
});

test("typing clears the validation error message", async () => {
  const onCommit = vi.fn().mockResolvedValue(undefined);
  const { input } = setup({ initialName: "x", onCommit });

  // Trigger validation error
  await userEvent.clear(input);
  fireEvent.keyDown(input, { key: "Enter" });
  expect(screen.getByText(/1.+100/i)).toBeDefined();

  // Start typing — error should disappear
  await userEvent.type(input, "a");
  expect(screen.queryByText(/1.+100/i)).toBeNull();
});

test("name longer than 100 chars shows error and does not commit", async () => {
  const onCommit = vi.fn().mockResolvedValue(undefined);
  const { input } = setup({ initialName: "x", onCommit });

  // maxLength attribute prevents typing more than 100 chars directly,
  // but we can set value programmatically to simulate the edge case
  fireEvent.change(input, { target: { value: "x".repeat(101) } });
  fireEvent.keyDown(input, { key: "Enter" });

  expect(onCommit).not.toHaveBeenCalled();
  expect(screen.getByText(/1.+100/i)).toBeDefined();
});

test("other keys do not trigger commit or cancel", () => {
  const onCommit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const { input } = setup({ onCommit, onCancel });

  fireEvent.keyDown(input, { key: "a" });
  fireEvent.keyDown(input, { key: "Tab" });
  fireEvent.keyDown(input, { key: "Shift" });

  expect(onCommit).not.toHaveBeenCalled();
  expect(onCancel).not.toHaveBeenCalled();
});
