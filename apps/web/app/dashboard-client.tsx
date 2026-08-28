"use client";

import {
  ArrowUp,
  Blocks,
  Hammer,
  MessageSquareText,
  Search,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { ThreadProjectionView } from "./thread-projections";
import styles from "./page.module.css";

export type DashboardMode = "ask" | "build" | "overview" | "research";

type Message = {
  readonly id: string;
  readonly role: "assistant" | "user";
  readonly text: string;
};

const modeConfig = {
  ask: {
    description: "Talk directly to Curiosity with the full governed tool loop.",
    eyebrow: "Direct",
    icon: MessageSquareText,
    placeholder: "Ask Curiosity…",
    title: "Ask",
  },
  build: {
    description: "Pursue a bounded implementation in the active workspace.",
    eyebrow: "Execution",
    icon: Hammer,
    placeholder: "What should Curiosity build or fix?",
    title: "Build",
  },
  overview: {
    description: "One durable surface for every way you work with Curiosity.",
    eyebrow: "Control room",
    icon: MessageSquareText,
    placeholder: "Start with Curiosity…",
    title: "Overview",
  },
  research: {
    description:
      "Run bounded, source-custodied research with verified citations.",
    eyebrow: "Evidence",
    icon: Search,
    placeholder: "What decision needs evidence?",
    title: "Research",
  },
} as const;

const commandText = (mode: DashboardMode, text: string): string => {
  if (mode === "research") return `/research ${text}`;
  if (mode === "build") return `/task ${text}`;
  return text;
};

export const DashboardClient = ({
  mode,
  view,
}: {
  readonly mode: DashboardMode;
  readonly view: ThreadProjectionView;
}) => {
  const config = modeConfig[mode];
  const Icon = config.icon;
  const [activeThreadId, setActiveThreadId] = useState<string>();
  const [messages, setMessages] = useState<readonly Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const projectedStatus =
    view.status === "available"
      ? "Durable log online"
      : "Kernel starts on send";
  const threadCount = useMemo(() => view.threads.length, [view.threads]);

  const openThread = async (threadId: string) => {
    setActiveThreadId(threadId);
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch(
        `/api/curiosity/session?threadId=${encodeURIComponent(threadId)}`,
        { cache: "no-store" },
      );
      const body = (await response.json()) as {
        error?: { code?: string };
        messages?: readonly {
          messageId: string;
          role: "assistant" | "user";
          text: string;
        }[];
      };
      if (!response.ok)
        throw new Error(body.error?.code ?? "THREAD_LOAD_FAILED");
      setMessages(
        (body.messages ?? []).map((message) => ({
          id: message.messageId,
          role: message.role,
          text: message.text,
        })),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "THREAD_LOAD_FAILED");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = text.trim();
    if (!prompt || busy) return;
    const threadId = activeThreadId ?? crypto.randomUUID();
    setActiveThreadId(threadId);
    setText("");
    setError(undefined);
    setBusy(true);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text: prompt },
    ]);
    try {
      const response = await fetch("/api/curiosity/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: commandText(mode, prompt), threadId }),
      });
      const body = (await response.json()) as {
        assistantMessageId?: string;
        error?: { code?: string };
        text?: string;
      };
      if (!response.ok || !body.assistantMessageId || !body.text)
        throw new Error(body.error?.code ?? "DASHBOARD_TURN_FAILED");
      setMessages((current) => [
        ...current,
        { id: body.assistantMessageId!, role: "assistant", text: body.text! },
      ]);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "DASHBOARD_TURN_FAILED",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{config.eyebrow}</p>
          <h1>{config.title}</h1>
          <p className={styles.description}>{config.description}</p>
        </div>
        <p className={styles.status} data-status={view.status}>
          <span aria-hidden="true" />
          {projectedStatus}
        </p>
      </header>

      {mode === "overview" && messages.length === 0 ? (
        <section className={styles.modeList} aria-label="Ways to use Curiosity">
          <Link href="/?mode=ask">
            <MessageSquareText />
            <b>Ask</b>
            <span>Think, plan, troubleshoot</span>
          </Link>
          <Link href="/?mode=research">
            <Search />
            <b>Research</b>
            <span>Evidence and citations</span>
          </Link>
          <Link href="/?mode=build">
            <Hammer />
            <b>Build</b>
            <span>Change and verify code</span>
          </Link>
          <Link href="/editor">
            <Blocks />
            <b>Craft</b>
            <span>Work visually on canvas</span>
          </Link>
        </section>
      ) : null}

      <section
        className={styles.workspace}
        aria-label={`${config.title} workspace`}
      >
        <aside className={styles.threadPanel}>
          <div className={styles.panelHeader}>
            <h2>Threads</h2>
            <span>{threadCount}</span>
          </div>
          {view.threads.length > 0 ? (
            <ol className={styles.threadList}>
              {view.threads.map((thread) => (
                <li key={thread.threadId}>
                  <button
                    data-active={activeThreadId === thread.threadId}
                    onClick={() => void openThread(thread.threadId)}
                    type="button"
                  >
                    <strong>{thread.title}</strong>
                    <span>#{thread.sequence}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.emptyThreads}>No threads yet</p>
          )}
        </aside>

        <div className={styles.conversation}>
          <div className={styles.messages} aria-live="polite">
            {messages.length === 0 ? (
              <div className={styles.emptyConversation}>
                <Icon aria-hidden="true" size={20} />
                <p>Ready when you are.</p>
                <span>
                  Curiosity will preserve the objective and recover inline when
                  safe.
                </span>
              </div>
            ) : (
              messages.map((message) => (
                <article data-role={message.role} key={message.id}>
                  <span>
                    {message.role === "assistant" ? "Curiosity" : "You"}
                  </span>
                  <p>{message.text}</p>
                </article>
              ))
            )}
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
          <form className={styles.composer} onSubmit={submit}>
            <textarea
              aria-label={config.placeholder}
              disabled={busy}
              maxLength={65_536}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={config.placeholder}
              rows={2}
              value={text}
            />
            <div>
              <span>{busy ? "Working" : config.title}</span>
              <button
                aria-label="Send"
                disabled={busy || !text.trim()}
                type="submit"
              >
                <ArrowUp aria-hidden="true" size={16} />
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};
