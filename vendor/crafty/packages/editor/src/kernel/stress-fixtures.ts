import { createFoundationDocument, type DocumentNode, type EditorDocument } from "./document.js";

export const createTenThousandNodeDocument = (): EditorDocument => {
  const document = createFoundationDocument();
  const root = document.nodes["page-root-home"]!;
  const nodes: Record<string, DocumentNode> = { ...document.nodes };
  const children = [...root.childIds];
  for (let index = 0; index < 10_000; index += 1) {
    const id = `stress-rectangle-${index}`;
    children.push(id);
    nodes[id] = { id, kind: "rectangle", name: `Stress rectangle ${index}`, parentId: root.id, childIds: [], bounds: { x: (index % 100) * 140, y: Math.floor(index / 100) * 80, width: 100, height: 52 }, transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, visible: true, locked: false, opacity: 1, fill: index % 2 === 0 ? "#40d6c7" : "#818cf8", stroke: "#ffffff", cornerRadius: 8, zIndex: index + 1 };
  }
  return { ...document, nodes: { ...nodes, [root.id]: { ...root, childIds: children } } };
};
