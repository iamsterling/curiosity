type CraftyRuntimeScope = {
  crypto?: { randomUUID?: () => string };
  expo?: { uuidv4?: () => string };
  structuredClone?: <T>(value: T) => T;
};

const cloneJsonValue = <T>(value: T): T => {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("CRAFTY_RUNTIME_CLONE_UNSUPPORTED");
  }
  return JSON.parse(serialized) as T;
};

export const installCraftyRuntimeAdapters = (): void => {
  const runtime = globalThis as unknown as CraftyRuntimeScope;

  if (!runtime.structuredClone) {
    Object.defineProperty(runtime, "structuredClone", {
      configurable: true,
      value: cloneJsonValue,
      writable: true,
    });
  }

  if (runtime.crypto?.randomUUID) return;

  const randomUUID = runtime.expo?.uuidv4;
  if (!randomUUID) {
    throw new Error("CRAFTY_RUNTIME_UUID_UNAVAILABLE");
  }

  if (!runtime.crypto) {
    Object.defineProperty(runtime, "crypto", {
      configurable: true,
      value: { randomUUID },
      writable: true,
    });
    return;
  }

  Object.defineProperty(runtime.crypto, "randomUUID", {
    configurable: true,
    value: randomUUID,
    writable: true,
  });
};
