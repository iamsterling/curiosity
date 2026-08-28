import type { ConversationMode } from "./workspace-types.ts";
import {
  CuriosityApiError,
  readCuriosityResponse,
  responseRecord,
} from "./curiosity-response.ts";
export {
  CuriosityApiError,
  presentCuriosityError,
} from "./curiosity-response.ts";

export interface CuriosityThread {
  readonly sequence: number;
  readonly threadId: string;
  readonly title: string;
}

export interface CuriosityMessage {
  readonly messageId: string;
  readonly role: "assistant" | "user";
  readonly text: string;
}

export interface CuriositySession {
  readonly messages: readonly CuriosityMessage[];
  readonly threads: readonly CuriosityThread[];
}

export interface CuriosityTurn {
  readonly assistantMessageId: string;
  readonly text: string;
  readonly threadId: string;
  readonly threads: readonly CuriosityThread[];
}

const parseThreads = (value: unknown): readonly CuriosityThread[] => {
  if (!Array.isArray(value))
    throw new CuriosityApiError("MOBILE_RESPONSE_INVALID");
  return value.map((candidate) => {
    const thread = responseRecord(candidate);
    if (
      typeof thread?.sequence !== "number" ||
      typeof thread.threadId !== "string" ||
      typeof thread.title !== "string"
    )
      throw new CuriosityApiError("MOBILE_RESPONSE_INVALID");
    return Object.freeze({
      sequence: thread.sequence,
      threadId: thread.threadId,
      title: thread.title,
    });
  });
};

const parseMessages = (value: unknown): readonly CuriosityMessage[] => {
  if (!Array.isArray(value))
    throw new CuriosityApiError("MOBILE_RESPONSE_INVALID");
  return value.map((candidate) => {
    const message = responseRecord(candidate);
    if (
      typeof message?.messageId !== "string" ||
      (message.role !== "assistant" && message.role !== "user") ||
      typeof message.text !== "string"
    )
      throw new CuriosityApiError("MOBILE_RESPONSE_INVALID");
    return Object.freeze({
      messageId: message.messageId,
      role: message.role,
      text: message.text,
    });
  });
};

export const commandText = (mode: ConversationMode, text: string): string => {
  if (mode === "research") return `/research ${text}`;
  if (mode === "build") return `/task ${text}`;
  return text;
};

export const normalizeCuriosityUrl = (value: string): string => {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new CuriosityApiError("MOBILE_SERVER_URL_INVALID");
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new CuriosityApiError("MOBILE_SERVER_URL_INVALID");
  url.pathname = `${url.pathname.replace(/\/+$/u, "")}/`;
  return url.toString().replace(/\/$/u, "");
};

const endpoint = (baseUrl: string, path: string): string =>
  `${normalizeCuriosityUrl(baseUrl)}${path}`;

export const createCuriosityApi = (
  baseUrl: string,
  fetchImplementation: typeof fetch = fetch,
  timeoutMilliseconds = 30_000,
) => {
  const request = async (
    input: string,
    init?: RequestInit,
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMilliseconds);
    try {
      return await fetchImplementation(input, {
        ...init,
        signal: controller.signal,
      });
    } catch {
      throw new CuriosityApiError(
        controller.signal.aborted
          ? "MOBILE_REQUEST_TIMEOUT"
          : "MOBILE_NETWORK_UNAVAILABLE",
      );
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    session: async (threadId?: string): Promise<CuriositySession> => {
      const query = threadId
        ? `?threadId=${encodeURIComponent(threadId)}`
        : "";
      const body = await readCuriosityResponse(
        await request(endpoint(baseUrl, `/api/curiosity/session${query}`), {
          headers: { accept: "application/json" },
        }),
      );
      return Object.freeze({
        messages: parseMessages(body.messages),
        threads: parseThreads(body.threads),
      });
    },
    submit: async (input: {
      readonly mode: ConversationMode;
      readonly text: string;
      readonly threadId?: string;
    }): Promise<CuriosityTurn> => {
      const response = await request(
        endpoint(baseUrl, "/api/curiosity/chat"),
        {
          body: JSON.stringify({
            text: commandText(input.mode, input.text),
            ...(input.threadId ? { threadId: input.threadId } : {}),
          }),
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          method: "POST",
        },
      );
      const body = await readCuriosityResponse(response);
      if (
        typeof body.assistantMessageId !== "string" ||
        typeof body.text !== "string" ||
        typeof body.threadId !== "string"
      )
        throw new CuriosityApiError("MOBILE_RESPONSE_INVALID", response.status);
      return Object.freeze({
        assistantMessageId: body.assistantMessageId,
        text: body.text,
        threadId: body.threadId,
        threads: parseThreads(body.threads),
      });
    },
  };
};

export type CuriosityApi = ReturnType<typeof createCuriosityApi>;
