import { readFileSync } from "node:fs";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(
  new URL("../src/app/editor/[slug]/layout.tsx", import.meta.url),
  "utf8",
);

const leafSource = readFileSync(
  new URL(
    "../../../../packages/editor/src/ui/editor-primitives/selection-color-control.tsx",
    import.meta.url,
  ),
  "utf8",
);
const creationLeafSource = readFileSync(
  new URL(
    "../../../../packages/editor/src/ui/editor-primitives/creation-color-control.tsx",
    import.meta.url,
  ),
  "utf8",
);
const selectionActionsSource = readFileSync(
  new URL(
    "../../../../packages/editor/src/ui/editor-primitives/selection-actions.tsx",
    import.meta.url,
  ),
  "utf8",
);

const parseTsx = (source: string): ts.SourceFile =>
  ts.createSourceFile("fixture.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

const isNamedJsxElement = (
  node: ts.JsxOpeningLikeElement,
  name: string,
): boolean => node.tagName.getText() === name;

const findJsxElements = (source: string, name: string): ts.JsxOpeningLikeElement[] => {
  const matches: ts.JsxOpeningLikeElement[] = [];
  const visit = (node: ts.Node): void => {
    if (
      (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
      isNamedJsxElement(node, name)
    ) {
      matches.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(parseTsx(source));
  return matches;
};

const attributesOf = (element: ts.JsxOpeningLikeElement): ts.JsxAttributeLike[] =>
  [...element.attributes.properties];

const hasOnlyExplicitAttributes = (
  element: ts.JsxOpeningLikeElement,
  names: readonly string[],
): boolean => {
  const attributes = attributesOf(element);
  return (
    attributes.every(ts.isJsxAttribute) &&
    attributes.map((attribute) => attribute.name.text).sort().join(",") ===
      [...names].sort().join(",")
  );
};

const hasEventHandler = (element: ts.JsxOpeningLikeElement): boolean =>
  attributesOf(element).some(
    (attribute) => ts.isJsxAttribute(attribute) && /^on[A-Z]/.test(attribute.name.text),
  );

const attributeExpressionText = (
  element: ts.JsxOpeningLikeElement,
  name: string,
): string | undefined => {
  const attribute = attributesOf(element).find(
    (candidate): candidate is ts.JsxAttribute =>
      ts.isJsxAttribute(candidate) && candidate.name.text === name,
  );
  return ts.isJsxExpression(attribute?.initializer)
    ? attribute.initializer.expression?.getText()
    : undefined;
};

const hasLeadingClientDirective = (source: string): boolean => {
  const firstStatement = parseTsx(source).statements[0];
  return (
    firstStatement !== undefined &&
    ts.isExpressionStatement(firstStatement) &&
    ts.isStringLiteral(firstStatement.expression) &&
    firstStatement.expression.text === "use client"
  );
};

const handlerEventParameter = (
  attribute: ts.JsxAttributeLike,
): ts.Identifier | undefined => {
  if (!ts.isJsxAttribute(attribute) || attribute.initializer === undefined) return undefined;
  const expression = ts.isJsxExpression(attribute.initializer)
    ? attribute.initializer.expression
    : undefined;
  if (expression === undefined) return undefined;
  if (!ts.isArrowFunction(expression) && !ts.isFunctionExpression(expression)) return undefined;
  if (expression.parameters.length !== 1) return undefined;
  const [parameter] = expression.parameters;
  return parameter !== undefined && ts.isIdentifier(parameter.name) ? parameter.name : undefined;
};

const isFunctionLike = (node: ts.Node): boolean =>
  ts.isArrowFunction(node) ||
  ts.isFunctionExpression(node) ||
  ts.isFunctionDeclaration(node) ||
  ts.isMethodDeclaration(node) ||
  ts.isGetAccessorDeclaration(node) ||
  ts.isSetAccessorDeclaration(node) ||
  ts.isConstructorDeclaration(node);

const handlerExpression = (attribute: ts.JsxAttributeLike): ts.Expression | undefined => {
  if (!ts.isJsxAttribute(attribute) || attribute.initializer === undefined) return undefined;
  return ts.isJsxExpression(attribute.initializer)
    ? attribute.initializer.expression
    : undefined;
};

const callsStopPropagation = (attribute: ts.JsxAttributeLike): boolean => {
  const eventParameter = handlerEventParameter(attribute);
  const handler = handlerExpression(attribute);
  if (eventParameter === undefined || handler === undefined) return false;

  // Match calls only in the handler's own lexical scope: inspect the root
  // handler body but never descend into a nested function-like node, whose
  // parameters may shadow the handler's with the same text.
  let found = false;
  const visit = (node: ts.Node): void => {
    if (
      !found &&
      ts.isCallExpression(node) &&
      node.arguments.length === 0 &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "stopPropagation" &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === eventParameter.text
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, (child) => {
      if (!isFunctionLike(child)) visit(child);
    });
  };
  visit(handler);
  return found;
};

describe("editor layout RSC boundary", () => {
  it("directly composes creation controls left of the tool nav and selection actions outside fixed top chrome", () => {
    const creationControls = findJsxElements(layoutSource, "CreationColorControl");
    expect(creationControls).toHaveLength(1);
    expect(hasOnlyExplicitAttributes(creationControls[0]!, ["key", "property"])).toBe(true);
    expect(layoutSource.indexOf("<CreationColorControl")).toBeLessThan(layoutSource.indexOf("<nav"));
    expect(layoutSource.indexOf('className="ml-auto"')).toBeLessThan(layoutSource.indexOf("<CreationColorControl"));
    expect(findJsxElements(layoutSource, "EditorSelectionActions")).toHaveLength(1);
    expect(layoutSource.indexOf("<EditorSelectionActions")).toBeGreaterThan(layoutSource.indexOf("</nav>"));
  });

  it("groups history and panel toggles in separate glass pills without reclaiming floating actions", () => {
    expect(layoutSource.match(/data-chrome-glass/gu)).toHaveLength(2);
    const historyIndex = layoutSource.indexOf("<EditorHistoryActions");
    const layersIndex = layoutSource.indexOf("<EditorLayersToggle");
    expect(historyIndex).toBeGreaterThan(-1);
    expect(layersIndex).toBeGreaterThan(historyIndex);
    expect(layoutSource.slice(historyIndex, layersIndex)).toContain("</div>");
    expect(layoutSource.slice(historyIndex, layersIndex)).not.toContain("<Separator");
    expect(layoutSource.indexOf("<EditorSelectionActions")).toBeGreaterThan(
      layoutSource.indexOf("</nav>"),
    );
  });

  it("keeps creation colors explicit and selection actions portal-safe and accessible", () => {
    expect(hasLeadingClientDirective(creationLeafSource)).toBe(true);
    expect(creationLeafSource).toContain("Creation fill color");
    expect(creationLeafSource).toContain("Creation stroke color");
    expect(selectionActionsSource).toContain('role="toolbar"');
    expect(selectionActionsSource).toContain('aria-label="Selection actions"');
    expect(selectionActionsSource).toContain("createPortal");
    expect(selectionActionsSource).toContain("useEffect");
    expect(selectionActionsSource).toContain("stopPropagation");
    expect(selectionActionsSource).not.toMatch(/document\.|window\./u);
  });

  it("keeps the handler-owning color control a leading Client Component", () => {
    expect(hasLeadingClientDirective(leafSource)).toBe(true);
    expect(hasLeadingClientDirective('import "./side-effect";\n"use client";')).toBe(false);
    expect(hasLeadingClientDirective("export {};\n")).toBe(false);

    const button = findJsxElements(leafSource, "Button");
    expect(button).toHaveLength(1);
    for (const eventName of ["onPointerDown", "onClick"]) {
      const handler = attributesOf(button[0]!).find(
        (attribute): attribute is ts.JsxAttribute =>
          ts.isJsxAttribute(attribute) && attribute.name.text === eventName,
      );
      expect(handler).toBeDefined();
      expect(callsStopPropagation(handler!)).toBe(true);
    }
  });

  it("composes each server-owned color control with exactly serializable props", () => {
    const controls = findJsxElements(layoutSource, "SelectionColorControl");
    expect(controls).toHaveLength(1);
    expect(hasOnlyExplicitAttributes(controls[0]!, ["key", "property"])).toBe(true);
    expect(attributeExpressionText(controls[0]!, "key")).toBe("property");
    expect(attributeExpressionText(controls[0]!, "property")).toBe("property");
    expect(hasEventHandler(controls[0]!)).toBe(false);
  });

  it("rejects formatted direct handlers and every spread expression structurally", () => {
    for (const source of [
      "<SelectionColorControl onClick = {handler} />",
      "<SelectionColorControl\n  onPointerDown\n  =\n  {handler}\n/>",
    ]) {
      const control = findJsxElements(source, "SelectionColorControl")[0]!;
      expect(hasEventHandler(control)).toBe(true);
      expect(hasOnlyExplicitAttributes(control, ["key", "property"])).toBe(false);
    }

    for (const spread of [
      "{...handlers}",
      "{...handlers.color}",
      "{...colorControlProps[property]}",
      "{...getProps()}",
    ]) {
      const control = findJsxElements(
        `<SelectionColorControl key={property} property={property} ${spread} />`,
        "SelectionColorControl",
      )[0]!;
      expect(hasOnlyExplicitAttributes(control, ["key", "property"])).toBe(false);
    }
  });

  it("rejects props hidden after a legal greater-than comment", () => {
    const control = findJsxElements(
      "<SelectionColorControl key={property} /* > */ {...handlers} onClick={handler} />",
      "SelectionColorControl",
    )[0]!;
    expect(hasOnlyExplicitAttributes(control, ["key", "property"])).toBe(false);
    expect(hasEventHandler(control)).toBe(true);
  });

  const handlerCallsStopPropagation = (handlerSource: string): boolean => {
    const button = findJsxElements(`<Button onClick={${handlerSource}} />`, "Button")[0];
    if (button === undefined) return false;
    const onClick = attributesOf(button).find(
      (attribute): attribute is ts.JsxAttribute =>
        ts.isJsxAttribute(attribute) && attribute.name.text === "onClick",
    );
    return onClick === undefined ? false : callsStopPropagation(onClick);
  };

  it("requires stopPropagation on the handler's own event parameter", () => {
    expect(handlerCallsStopPropagation("(event) => event.stopPropagation()")).toBe(true);
    expect(handlerCallsStopPropagation("function (event) { event.stopPropagation(); }")).toBe(
      true,
    );
    expect(handlerCallsStopPropagation("(event) => other.stopPropagation()")).toBe(false);
    expect(handlerCallsStopPropagation("(other) => event.stopPropagation()")).toBe(false);
    expect(handlerCallsStopPropagation("(event) => event.stopPropagation(true)")).toBe(false);
    expect(handlerCallsStopPropagation("(event) => event")).toBe(false);
    expect(handlerCallsStopPropagation("() => stopPropagation()")).toBe(false);
  });

  it("rejects stopPropagation calls on a nested parameter shadowing the handler's", () => {
    expect(
      handlerCallsStopPropagation(
        "(event) => { const inner = (event) => event.stopPropagation(); return inner(event); }",
      ),
    ).toBe(false);
    expect(
      handlerCallsStopPropagation(
        "(event) => { function inner(event) { event.stopPropagation(); } return inner(event); }",
      ),
    ).toBe(false);
  });

  it("rejects stopPropagation calls on a nested different-name receiver", () => {
    expect(
      handlerCallsStopPropagation(
        "(event) => { const inner = (ev) => ev.stopPropagation(); return inner(event); }",
      ),
    ).toBe(false);
  });

  it("accepts a direct stopPropagation call in the handler's own outer control flow", () => {
    expect(
      handlerCallsStopPropagation(`(event) => {
        if (event.type === "click") {
          event.stopPropagation();
        }
        return event;
      }`),
    ).toBe(true);
  });
});
