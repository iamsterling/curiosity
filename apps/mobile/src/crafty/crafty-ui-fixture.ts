import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import documentEntryAsset from "../../assets/crafty-kernel-portability.ui/document-1.ui";
import manifestAsset from "../../assets/crafty-kernel-portability.ui/manifest.ui";
import type { CraftyUiPackageBytes } from "./crafty-kernel-portability";

const readAsset = async (assetModule: number): Promise<string> => {
  const [asset] = await Asset.loadAsync(assetModule);
  if (!asset) throw new Error("CRAFTY_UI_ASSET_MISSING");
  return new File(asset.localUri ?? asset.uri).text();
};

export const loadCraftyKernelPortabilityFixture = async (): Promise<CraftyUiPackageBytes> => {
  const [manifest, documentEntry] = await Promise.all([
    readAsset(manifestAsset),
    readAsset(documentEntryAsset),
  ]);
  return { documentEntry, manifest };
};
