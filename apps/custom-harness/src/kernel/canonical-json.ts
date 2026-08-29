import {
  canonicalJson as portableCanonicalJson,
  PortableAuthorityError,
} from "@curiosity/authority";
import { InputRejected } from "./errors.js";

export const canonicalJson = (value: unknown): string => {
  try {
    return portableCanonicalJson(value);
  } catch (error) {
    if (
      error instanceof PortableAuthorityError &&
      error.code === "COMMAND_JSON_CANONICALIZATION_FAILED"
    )
      throw new InputRejected({
        message: "COMMAND_JSON_CANONICALIZATION_FAILED",
      });
    throw error;
  }
};
