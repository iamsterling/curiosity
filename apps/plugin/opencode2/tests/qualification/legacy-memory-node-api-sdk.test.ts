import { expect, test } from "bun:test";

import { openQualificationSdk } from "./legacy-memory-node-api-sdk.js";

test.skipIf(process.env.CURIOSITY_NODE_API_ACCEPTANCE !== "1")(
  "future approval-gated addon verifier harness",
  async () => {
    const path = process.env.CURIOSITY_NODE_API_ADDON_PATH!;
    const digest = process.env.CURIOSITY_NODE_API_ADDON_SHA256!;
    const sdk = await openQualificationSdk(path, digest);
    expect(sdk.qualificationInfo()).toBeInstanceOf(Uint8Array);
    await sdk.close();
    await expect(sdk.execute(new Uint8Array())).rejects.toMatchObject({
      code: "SDK_QUALIFICATION_CLOSED",
    });
  },
);
