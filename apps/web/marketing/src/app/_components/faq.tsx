import { SectionHeading } from "./primitives";

const FAQ_ITEMS = [
  {
    question: "Is Crafty another design tool?",
    answer:
      "Crafty is a structured visual-authoring system with a renderer — not a canvas with features attached. Files, pages, frames, components and design systems are real document structures, and the Rust/WASM/WebGPU engine renders a resolved projection of them."
  },
  {
    question: "Does it execute my React or TSX components?",
    answer:
      "No. The browser slice models visual layers and states directly; it does not execute React/TSX components or mutate source files. What you author is a document with its own schema — which is what makes it durable, versioned, and renderer-independent."
  },
  {
    question: "What does WebGPU have to do with it?",
    answer:
      "The renderer is a custom Rust/WASM/WebGPU engine. It needs a secure origin — a loopback address in development, or HTTPS on your tailnet — and an iPad needs iPadOS 26 or newer. There is no fallback backend: if WebGPU is unavailable, that is a diagnostic, not a WebGL downgrade."
  },
  {
    question: "Can agents work in it?",
    answer:
      "Yes, and by design. Agents mutate the document through the same validated, invertible commands as humans — there is no separate agent-only mutation path. The session record shows every command, its validation, and its inverse."
  },
  {
    question: "How do I try it?",
    answer:
      "Clone the repository, bundle once, and run the desktop face — the design surface opens on a secure loopback origin in your browser. Files persist under ~/.crafty and survive restarts, so you can close and come back."
  }
];

export function FAQ(): React.JSX.Element {
  return (
    <section className="c-section">
      <div className="c-wrap">
        <SectionHeading
          index="03"
          align="center"
          eyebrow="Before you install"
          title="The useful answers, up front"
          description="A few honest answers about what Crafty is, where it fits, and how much of a toolchain it expects from you."
        />
        <div className="c-faq-list mx-auto mt-14 max-w-3xl">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="c-faq-item">
              <summary className="c-faq-summary">{item.question}</summary>
              <p className="c-faq-answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
