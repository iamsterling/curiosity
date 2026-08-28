import React, { useEffect, useState } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFoundationDocument } from "../../../../packages/editor/src/kernel/index.js";
import { EditorSelectionActions } from "../../../../packages/editor/src/ui/editor-primitives/selection-actions.js";
import { EditorProvider, useEditor, useEditorSelector } from "../../../../packages/editor/src/ui/editor/editor-context.js";
import { StagePositioningProvider, useStagePositioning } from "../../../../packages/editor/src/ui/editor/stage-positioning.js";

class TestElement extends EventTarget {
  readonly nodeType = 1;
  readonly namespaceURI = "http://www.w3.org/1999/xhtml";
  readonly childNodes: Array<TestElement | TestText> = [];
  readonly attributes = new Map<string, string>();
  readonly style: Record<string, string> = {};
  parentNode: TestElement | null = null;
  ownerDocument: TestDocument;
  textContent = "";
  onclick: (() => void) | null = null;
  offsetWidth = 96;
  offsetHeight = 40;

  constructor(readonly tagName: string, document: TestDocument) {
    super();
    this.ownerDocument = document;
  }

  get nodeName(): string { return this.tagName.toUpperCase(); }
  get parentElement(): TestElement | null { return this.parentNode; }
  appendChild(child: TestElement | TestText): TestElement | TestText {
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }
  insertBefore(child: TestElement | TestText, before: TestElement | TestText | null): TestElement | TestText {
    child.parentNode = this;
    const index = before ? this.childNodes.indexOf(before) : -1;
    this.childNodes.splice(index < 0 ? this.childNodes.length : index, 0, child);
    return child;
  }
  removeChild(child: TestElement | TestText): TestElement | TestText {
    const index = this.childNodes.indexOf(child);
    if (index >= 0) this.childNodes.splice(index, 1);
    child.parentNode = null;
    return child;
  }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  setAttributeNS(_namespace: string | null, name: string, value: string): void { this.setAttribute(name, value); }
  removeAttribute(name: string): void { this.attributes.delete(name); }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  hasAttribute(name: string): boolean { return this.attributes.has(name); }
  focus(): void { this.ownerDocument.activeElement = this; }
  closest(selector: string): TestElement | null {
    let current: TestElement | null = this;
    while (current) {
      if (matches(current, selector)) return current;
      current = current.parentNode;
    }
    return null;
  }
  querySelector(selector: string): TestElement | null {
    return queryAll(this, selector)[0] ?? null;
  }
  querySelectorAll(selector: string): TestElement[] { return queryAll(this, selector); }
}

class TestText {
  readonly nodeType = 3;
  parentNode: TestElement | null = null;
  constructor(public nodeValue: string, readonly ownerDocument: TestDocument) {}
}

class TestDocument extends EventTarget {
  readonly nodeType = 9;
  readonly documentElement = new TestElement("html", this);
  readonly body = new TestElement("body", this);
  activeElement: TestElement | null = null;
  defaultView!: typeof globalThis;
  constructor() {
    super();
    this.documentElement.appendChild(this.body);
  }
  createElement(tagName: string): TestElement { return new TestElement(tagName, this); }
  createElementNS(_namespace: string, tagName: string): TestElement { return this.createElement(tagName); }
  createTextNode(value: string): TestText { return new TestText(value, this); }
  getElementById(id: string): TestElement | null { return this.body.querySelector(`#${id}`); }
  querySelector(selector: string): TestElement | null { return this.body.querySelector(selector); }
  querySelectorAll(selector: string): TestElement[] { return this.body.querySelectorAll(selector); }
}

const matches = (element: TestElement, selector: string): boolean => {
  if (selector.startsWith(".")) return (element.getAttribute("class") ?? "").split(" ").includes(selector.slice(1));
  if (selector.startsWith("#")) return element.getAttribute("id") === selector.slice(1);
  const attribute = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(selector);
  if (attribute) return attribute[2] === undefined
    ? element.hasAttribute(attribute[1]!)
    : element.getAttribute(attribute[1]!) === attribute[2];
  return element.tagName.toLowerCase() === selector.toLowerCase();
};

const queryAll = (root: TestElement, selector: string): TestElement[] => {
  const found: TestElement[] = [];
  const visit = (element: TestElement): void => {
    for (const child of element.childNodes) {
      if (!(child instanceof TestElement)) continue;
      if (matches(child, selector)) found.push(child);
      visit(child);
    }
  };
  visit(root);
  return found;
};

class TestMouseEvent extends Event {
  constructor(type: string, init?: EventInit) { super(type, init); }
}

const click = (element: TestElement): void => {
  const props = Object.values(element).find((value): value is Record<string, unknown> =>
    !!value && typeof value === "object" && "onClick" in value,
  );
  const onClick = props?.onClick;
  if (typeof onClick === "function") onClick({ currentTarget: element });
  else element.dispatchEvent(new TestMouseEvent("click", { bubbles: true }));
};

const flush = async (): Promise<void> => {
  await act(async () => { await Promise.resolve(); });
};

let documentStub: TestDocument;
let root: Root | undefined;
let container: TestElement;

beforeEach(() => {
  documentStub = new TestDocument();
  container = documentStub.createElement("div");
  documentStub.body.appendChild(container);
  const windowStub = {
    document: documentStub,
    Node: TestElement,
    HTMLElement: TestElement,
    HTMLIFrameElement: class {},
    MouseEvent: TestMouseEvent,
    PointerEvent: TestMouseEvent,
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
  } as unknown as typeof globalThis;
  documentStub.defaultView = windowStub;
  vi.stubGlobal("document", documentStub);
  vi.stubGlobal("window", windowStub);
  vi.stubGlobal("Node", TestElement);
  vi.stubGlobal("HTMLElement", TestElement);
  vi.stubGlobal("HTMLIFrameElement", class {});
  vi.stubGlobal("MouseEvent", TestMouseEvent);
  vi.stubGlobal("PointerEvent", TestMouseEvent);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  vi.unstubAllGlobals();
});

const SelectFoundation = () => {
  const editor = useEditor();
  useEffect(() => editor.setSelection(["rectangle-foundation"]), [editor]);
  return null;
};

const PositioningHost = ({ visible }: { visible: boolean }) => {
  const { registerHost } = useStagePositioning();
  if (!visible) return null;
  return <div ref={registerHost} data-stage-positioning-host />;
};

const Fixture = ({ host = true, actions = true, onStagePointerDown }: {
  host?: boolean;
  actions?: boolean;
  onStagePointerDown?: () => void;
}) => (
  <EditorProvider initialDocument={createFoundationDocument()} initialRevision={0} initialConverted={false}>
    <StagePositioningProvider>
      <SelectFoundation />
      <section className="stage" onPointerDown={onStagePointerDown}>
        <canvas tabIndex={0} />
        <PositioningHost visible={host} />
      </section>
      {actions ? <EditorSelectionActions /> : null}
    </StagePositioningProvider>
  </EditorProvider>
);

describe("mounted selection actions", () => {
  it("renders safely on the server and without a positioning host", async () => {
    const savedWindow = globalThis.window;
    const savedDocument = globalThis.document;
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
    expect(() => renderToString(<Fixture />)).not.toThrow();
    vi.stubGlobal("window", savedWindow);
    vi.stubGlobal("document", savedDocument);

    root = createRoot(container as unknown as Element);
    await act(async () => root?.render(<Fixture host={false} />));
    await flush();
    expect(documentStub.querySelector('[role="toolbar"]')).toBeNull();
  });

  it("portals after the host appears and cleans up with either host or leaf", async () => {
    const Lifecycle = () => {
      const [host, setHost] = useState(false);
      const [actions, setActions] = useState(true);
      return <><button id="host" onClick={() => setHost((value) => !value)} /><button id="leaf" onClick={() => setActions(false)} /><Fixture host={host} actions={actions} /></>;
    };
    root = createRoot(container as unknown as Element);
    await act(async () => root?.render(<Lifecycle />));
    await flush();
    expect(documentStub.querySelector('[role="toolbar"]')).toBeNull();
    await act(async () => click(documentStub.getElementById("host")!));
    await flush();
    const toolbar = documentStub.querySelector('[role="toolbar"]')!;
    expect(toolbar.attributes.get("aria-label") ?? toolbar.getAttribute("aria-label")).toBe("Selection actions");
    await act(async () => click(documentStub.getElementById("host")!));
    expect(documentStub.querySelector('[role="toolbar"]')).toBeNull();
    await act(async () => click(documentStub.getElementById("host")!));
    await flush();
    await act(async () => click(documentStub.getElementById("leaf")!));
    expect(documentStub.querySelector('[role="toolbar"]')).toBeNull();
  });

  it("supports keyboard-equivalent clicks, isolates pointerdown, deletes immediately, and restores focus", async () => {
    const stagePointerDown = vi.fn();
    root = createRoot(container as unknown as Element);
    await act(async () => root?.render(<Fixture onStagePointerDown={stagePointerDown} />));
    await flush();
    const toolbar = documentStub.querySelector('[role="toolbar"]')!;
    const buttons = toolbar.querySelectorAll("button");
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(["Duplicate", "Delete (Del)"]);
    const props = Object.values(toolbar).find((value): value is Record<string, unknown> =>
      !!value && typeof value === "object" && "onPointerDown" in value,
    );
    const stopped = vi.fn();
    (props?.onPointerDown as ((event: { stopPropagation: () => void }) => void))({ stopPropagation: stopped });
    expect(stopped).toHaveBeenCalledOnce();
    expect(stagePointerDown).not.toHaveBeenCalled();
    await act(async () => click(buttons[0]!));
    expect(documentStub.querySelector('[role="toolbar"]')).not.toBeNull();
    buttons[1]!.focus();
    await act(async () => click(buttons[1]!));
    expect(documentStub.querySelector('[role="toolbar"]')).toBeNull();
    expect(documentStub.activeElement?.tagName).toBe("canvas");
  });

  it("does not steal focus during placement-only updates", async () => {
    root = createRoot(container as unknown as Element);
    await act(async () => root?.render(<Fixture />));
    await flush();
    const duplicate = documentStub.querySelector('[role="toolbar"]')!.querySelector("button")!;
    duplicate.focus();
    duplicate.style.transform = "translate3d(10px, 20px, 0)";
    expect(documentStub.activeElement).toBe(duplicate);
  });
});

describe("external-store render isolation", () => {
  it("keeps an unrelated selector consumer stable across pointer projection changes", async () => {
    let renders = 0;
    let editor: ReturnType<typeof useEditor> | undefined;
    const UnrelatedPanel = () => {
      useEditorSelector((projection) => projection.interaction.tool);
      renders += 1;
      return null;
    };
    const CaptureEditor = () => { editor = useEditor(); return null; };
    root = createRoot(container as unknown as Element);
    await act(async () => root?.render(
      <EditorProvider initialDocument={createFoundationDocument()} initialRevision={0} initialConverted={false}>
        <CaptureEditor /><UnrelatedPanel />
      </EditorProvider>,
    ));
    const baseline = renders;
    await act(async () => {
      editor!.handlePointerMove(1, { x: 300, y: 200 }, { altKey: false, shiftKey: false, ctrlKey: false });
      editor!.setSelection(["rectangle-foundation"]);
    });
    expect(renders).toBe(baseline);
  });
});
