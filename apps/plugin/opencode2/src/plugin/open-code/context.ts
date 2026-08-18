import { Plugin } from "@opencode-ai/plugin";
export type OpenCodeContext = Parameters<ReturnType<(typeof Plugin)["define"]>["setup"]>[0];
