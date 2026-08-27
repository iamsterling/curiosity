import type { Duplex } from "node:stream";
import {
  decodeTuiClientMessage,
  encodeTuiHostMessage,
  TUI_PROTOCOL_FRAME_LIMIT,
  type TuiClientMessage,
  type TuiHostMessage,
} from "./protocol.js";

export interface BubbleTeaConnection {
  readonly next: () => Promise<TuiClientMessage>;
  readonly send: (message: TuiHostMessage) => Promise<void>;
}

interface MessageWaiter {
  readonly reject: (error: Error) => void;
  readonly resolve: (message: TuiClientMessage) => void;
}

export class BubbleTeaSocketConnection implements BubbleTeaConnection {
  readonly #messages: TuiClientMessage[] = [];
  readonly #stream: Duplex;
  readonly #waiters: MessageWaiter[] = [];
  #buffer = Buffer.alloc(0);
  #failure: Error | undefined;
  #writes = Promise.resolve();

  constructor(stream: Duplex) {
    this.#stream = stream;
    stream.on("data", (chunk: Buffer | string) => this.#receive(chunk));
    stream.once("end", () => this.#fail(new Error("TUI_PROTOCOL_STREAM_ENDED")));
    stream.once("error", () => this.#fail(new Error("TUI_PROTOCOL_STREAM_FAILED")));
  }

  next(): Promise<TuiClientMessage> {
    const message = this.#messages.shift();
    if (message) return Promise.resolve(message);
    if (this.#failure) return Promise.reject(this.#failure);
    return new Promise((resolve, reject) => this.#waiters.push({ reject, resolve }));
  }

  send(message: TuiHostMessage): Promise<void> {
    const frame = encodeTuiHostMessage(message);
    this.#writes = this.#writes.then(
      () =>
        new Promise<void>((resolve, reject) => {
          this.#stream.write(frame, (error) => (error ? reject(error) : resolve()));
        }),
    );
    return this.#writes;
  }

  close(): void {
    this.#stream.destroy();
  }

  #receive(chunk: Buffer | string): void {
    if (this.#failure) return;
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    this.#buffer = Buffer.concat([this.#buffer, bytes]);
    while (!this.#failure) {
      const newline = this.#buffer.indexOf(0x0a);
      if (newline < 0) {
        if (this.#buffer.length > TUI_PROTOCOL_FRAME_LIMIT)
          this.#fail(new Error("TUI_PROTOCOL_FRAME_TOO_LARGE"));
        return;
      }
      if (newline > TUI_PROTOCOL_FRAME_LIMIT) {
        this.#fail(new Error("TUI_PROTOCOL_FRAME_TOO_LARGE"));
        return;
      }
      const frame = this.#buffer.subarray(0, newline).toString("utf8");
      this.#buffer = this.#buffer.subarray(newline + 1);
      try {
        this.#deliver(decodeTuiClientMessage(JSON.parse(frame) as unknown));
      } catch (error) {
        this.#fail(
          error instanceof Error ? error : new Error("TUI_PROTOCOL_FRAME_INVALID"),
        );
      }
    }
  }

  #deliver(message: TuiClientMessage): void {
    const waiter = this.#waiters.shift();
    if (waiter) waiter.resolve(message);
    else this.#messages.push(message);
  }

  #fail(error: Error): void {
    if (this.#failure) return;
    this.#failure = error;
    for (const waiter of this.#waiters.splice(0)) waiter.reject(error);
  }
}
