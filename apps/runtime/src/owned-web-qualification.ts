import { dlopen, FFIType, ptr, suffix } from "bun:ffi";
import { isAbsolute, join } from "node:path";

const libraryPath = join(
  import.meta.dir,
  `../native/target/debug/libcuriosity_runtime_native.${suffix}`,
);

export const qualifyOwnedWebFixture = (
  qualificationRoot: string,
  fixturePath: string,
  proofPath: string,
): void => {
  if (
    !isAbsolute(qualificationRoot) ||
    !isAbsolute(fixturePath) ||
    !isAbsolute(proofPath)
  ) {
    throw new Error("OWNED_WEB_QUALIFICATION_PATH_INVALID");
  }
  const library = dlopen(libraryPath, {
    curiosity_runtime_owned_web_qualification_v1: {
      args: [
        FFIType.ptr,
        FFIType.u64,
        FFIType.ptr,
        FFIType.u64,
        FFIType.ptr,
        FFIType.u64,
      ],
      returns: FFIType.i32,
    },
  });
  try {
    const root = Buffer.from(qualificationRoot);
    const fixture = Buffer.from(fixturePath);
    const proof = Buffer.from(proofPath);
    const status = library.symbols.curiosity_runtime_owned_web_qualification_v1(
      ptr(root),
      root.length,
      ptr(fixture),
      fixture.length,
      ptr(proof),
      proof.length,
    );
    if (status !== 0) throw new Error("OWNED_WEB_QUALIFICATION_REJECTED");
  } finally {
    library.close();
  }
};
