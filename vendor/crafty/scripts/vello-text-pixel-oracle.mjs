/**
 * ADR 0024 exact-RGBA browser oracle.
 *
 * Builds a feature-gated WASM artifact outside the workspace, serves a
 * standalone fixture, and compares compositor-captured production/reference
 * regions. The feature is absent from ordinary package builds.
 */
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join } from "node:path";
import { tmpdir } from "node:os";

const root = process.cwd();
const crate = join(root, "packages/scene-renderer/rust/Cargo.toml");
const temporary = mkdtempSync(join(tmpdir(), "crafty-vello-text-oracle-"));
const target = join(temporary, "target");
const site = join(temporary, "site");
const browserArgs = "--enable-unsafe-webgpu,--disable-software-rasterizer";
const keep = process.argv.includes("--keep");
const referenceShiftArgument = process.argv.find((argument) =>
  argument.startsWith("--reference-shift="),
);
const referenceShift = referenceShiftArgument
  ? Number(referenceShiftArgument.slice("--reference-shift=".length))
  : 0;
if (!Number.isFinite(referenceShift)) {
  throw new Error("PIXEL_ORACLE_REFERENCE_SHIFT_INVALID");
}

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} exited ${result.status}\n${result.stdout ?? ""}${result.stderr ?? ""}`,
    );
  }
  return (result.stdout ?? "").trim();
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
let server;
let browser;
let report;
try {
  run("cargo", [
    "build",
    "--manifest-path",
    crate,
    "--target",
    "wasm32-unknown-unknown",
    "--release",
    "--features",
    "pixel-oracle",
    "--target-dir",
    target,
  ]);
  run("wasm-bindgen", [
    join(target, "wasm32-unknown-unknown/release/crafty_renderer_wasm.wasm"),
    "--out-dir",
    site,
    "--target",
    "web",
  ]);

  const wasmPath = join(site, "crafty_renderer_wasm_bg.wasm");
  const wasmHash = sha256(readFileSync(wasmPath));
  const fontPath = join(
    root,
    "packages/scene-renderer/rust/fonts/Inter-Regular.ttf",
  );
  const fontHash = sha256(readFileSync(fontPath));
  const repositoryCommit = run("git", ["rev-parse", "HEAD"]);
  const repositoryDirty = run("git", ["status", "--short"]);

  writeFileSync(
    join(site, "index.html"),
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#000}canvas{display:block}</style><canvas id="gpu"></canvas><script type="module">
import init, { RendererCore } from "./crafty_renderer_wasm.js";
const hex = bytes => [...bytes].map(value => value.toString(16).padStart(2,"0")).join("");
const hash = async bytes => hex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
const regionBytes = (image, rect) => {
  const [x,y,width,height] = rect;
  const bytes = new Uint8Array(width*height*4);
  for(let row=0;row<height;row++) {
    const start=((y+row)*image.width+x)*4;
    bytes.set(image.data.subarray(start,start+width*4),row*width*4);
  }
  return bytes;
};
try {
  await init();
  const canvas=document.querySelector("#gpu");
  const core=new RendererCore();
  const diagnostics=[];
  core.set_error_callback(value=>diagnostics.push(String(value)));
  canvas.width=2048; canvas.height=1440; canvas.style.width="2048px"; canvas.style.height="1440px";
  await core.init_canvas(canvas);
  const adapter=JSON.parse(core.pixel_oracle_adapter_info());
  const fixture=JSON.parse(core.render_text_pixel_oracle("paired"));
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  window.__oracleFixture={adapter,diagnostics,fixture,ua:navigator.userAgent};
  window.__renderOracleMode=async mode=>{
    const width=mode==="paired"?2048:1024;
    canvas.width=width; canvas.style.width=width+"px";
    const result=JSON.parse(core.render_text_pixel_oracle(mode));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return result;
  };
  window.__compareOracleScreenshots=async (productionUrl,referenceUrl,comparisonFixture,referenceShift)=>{
    const load=async url=>{const element=new Image();element.src=url;await element.decode();return element;};
    const productionImage=await load(productionUrl); const referenceImage=await load(referenceUrl);
    const capture=document.createElement("canvas"); capture.width=comparisonFixture.canvas.deviceWidth; capture.height=comparisonFixture.canvas.deviceHeight;
    const context=capture.getContext("2d",{colorSpace:"srgb",willReadFrequently:true});
    context.drawImage(productionImage,0,0);
    const productionFrame=context.getImageData(0,0,capture.width,capture.height,{colorSpace:"srgb"});
    context.clearRect(0,0,capture.width,capture.height); context.drawImage(referenceImage,0,0);
    const referenceFrame=context.getImageData(0,0,capture.width,capture.height,{colorSpace:"srgb"});
    const matrix=[];
    for(const item of comparisonFixture.regions) {
      const production=regionBytes(productionFrame,item.production);
      const referenceRect=[item.reference[0]+referenceShift,item.reference[1],item.reference[2],item.reference[3]];
      const reference=regionBytes(referenceFrame,referenceRect);
      let differingBytes=0; let maximumDelta=0; const firstDiffs=[]; let nonUniform=false;
      for(let index=0;index<production.length;index++) {
        if(production[index]!==reference[index]) {
          differingBytes++;
          maximumDelta=Math.max(maximumDelta,Math.abs(production[index]-reference[index]));
          if(firstDiffs.length<16) firstDiffs.push({index,production:production[index],reference:reference[index]});
        }
        if(index>=4&&production[index]!==production[index%4]) nonUniform=true;
      }
      matrix.push({...item,productionHash:await hash(production),referenceHash:await hash(reference),differingBytes,maximumDelta,nonUniform,firstDiffs});
    }
    const exact=matrix.every(item=>item.differingBytes===0&&item.productionHash===item.referenceHash);
    const visible=matrix.every(item=>item.nonUniform);
    return {status:exact&&visible&&diagnostics.length===0?"pixels-passed":"failed",exact,visible,adapter,diagnostics,fixture:comparisonFixture,matrix,ua:navigator.userAgent};
  };
} catch(error) {
  window.__oracleResult={status:"error",error:String(error),stack:error?.stack??null};
}
</script>`,
  );

  server = createServer((request, response) => {
    const name = basename(new URL(request.url, "http://localhost").pathname) || "index.html";
    const path = join(site, name);
    try {
      const content = readFileSync(path);
      const type = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".wasm": "application/wasm",
      }[extname(path)] ?? "application/octet-stream";
      response.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      response.end(content);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/`;
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const profile = join(temporary, "chrome-profile");
  browser = spawn(chrome, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-background-networking",
    "--window-size=2048,1440",
    "--force-device-scale-factor=1",
    ...browserArgs.split(","),
    url,
  ], { stdio: "ignore" });
  const activePort = join(profile, "DevToolsActivePort");
  const portDeadline = Date.now() + 30_000;
  while (Date.now() < portDeadline) {
    try { readFileSync(activePort); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  const [debugPort] = readFileSync(activePort, "utf8").trim().split("\n");
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  const page = targets.find(target => target.type === "page");
  if (!page) throw new Error("CHROME_PAGE_TARGET_MISSING");
  const connect = async url => {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    let sequence = 0;
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const listener = event => {
        const message = JSON.parse(event.data);
        if (message.id !== id) return;
        socket.removeEventListener("message", listener);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
      };
      socket.addEventListener("message", listener);
      socket.send(JSON.stringify({ id, method, params }));
    });
    return { socket, call };
  };
  const pageCdp = await connect(page.webSocketDebuggerUrl);
  const browserTarget = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
  const browserCdp = await connect(browserTarget.webSocketDebuggerUrl);
  const systemInfo = await browserCdp.call("SystemInfo.getInfo");
  const deadline = Date.now() + 120_000;
  let fixtureReady;
  do {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const evaluation = await pageCdp.call("Runtime.evaluate", {
      expression: "JSON.stringify(window.__oracleFixture??window.__oracleResult??null)",
      returnByValue: true,
    });
    fixtureReady = JSON.parse(evaluation.result.value);
    if (fixtureReady) break;
  } while (Date.now() < deadline);
  let browserResult;
  if (!fixtureReady) {
    browserResult = { status: "blocked", blocker: "ORACLE_TIMEOUT" };
  } else if (fixtureReady.status === "error") {
    browserResult = fixtureReady;
  } else {
    const pairedScreenshot = await pageCdp.call("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
    });
    const productionFixture = await pageCdp.call("Runtime.evaluate", {
      expression: "window.__renderOracleMode('production')",
      awaitPromise: true,
      returnByValue: true,
    });
    const productionScreenshot = await pageCdp.call("Page.captureScreenshot", {
      format: "png", fromSurface: true, captureBeyondViewport: true,
    });
    await pageCdp.call("Runtime.evaluate", {
      expression: "window.__renderOracleMode('reference')",
      awaitPromise: true,
      returnByValue: true,
    });
    const referenceScreenshot = await pageCdp.call("Page.captureScreenshot", {
      format: "png", fromSurface: true, captureBeyondViewport: true,
    });
    const comparison = await pageCdp.call("Runtime.evaluate", {
      expression: `window.__compareOracleScreenshots(${JSON.stringify(`data:image/png;base64,${productionScreenshot.data}`)},${JSON.stringify(`data:image/png;base64,${referenceScreenshot.data}`)},${JSON.stringify(productionFixture.result.value)},${JSON.stringify(referenceShift)})`,
      awaitPromise: true,
      returnByValue: true,
    });
    browserResult = comparison.result.value;
    browserResult.pairedCompositorPngHash = sha256(Buffer.from(pairedScreenshot.data, "base64"));
    browserResult.productionCompositorPngHash = sha256(Buffer.from(productionScreenshot.data, "base64"));
    browserResult.referenceCompositorPngHash = sha256(Buffer.from(referenceScreenshot.data, "base64"));
  }
  pageCdp.socket.close();
  browserCdp.socket.close();
  const gpuDevices = systemInfo.gpu?.devices ?? [];
  const gpuIdentity = gpuDevices.map(device => ({
    vendorId: device.vendorId,
    deviceId: device.deviceId,
    vendorString: device.vendorString,
    deviceString: device.deviceString,
    driverVendor: device.driverVendor,
    driverVersion: device.driverVersion,
  }));
  const software = /swiftshader|software|llvmpipe|cpu/i.test(JSON.stringify({ gpuIdentity, adapter: browserResult.adapter }));
  const identityPresent = browserResult.adapter?.backend === "BrowserWebGpu" && gpuIdentity.some(device => device.deviceString || device.vendorString);
  browserResult.software = software;
  browserResult.identityPresent = identityPresent;
  browserResult.status = browserResult.status === "pixels-passed" && !software && identityPresent ? "passed" : "failed";

  report = {
    ...browserResult,
    environment: {
      repositoryCommit,
      repositoryDirty,
      fontPath,
      fontHash,
      wasmHash,
      rustTarget: "wasm32-unknown-unknown",
      rustProfile: "release+pixel-oracle",
      vello: "0.9.0",
      wgpu: "29.0.4",
      ttfParser: "0.24.1",
      browserHarness: run(chrome, ["--version"]),
      browserArgs,
      referenceShift,
      moduleAdapter: browserResult.adapter ?? null,
      chromiumGpuDevices: gpuIdentity,
      chromiumAuxAttributes: systemInfo.gpu?.auxAttributes ?? null,
      os: run("sw_vers", []).replaceAll("\n", "; "),
      architecture: run("uname", ["-m"]),
      hardware: run("system_profiler", ["SPDisplaysDataType"]),
      temporaryArtifact: temporary,
    },
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  report = { status: "error", error: String(error), temporaryArtifact: temporary };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (browser && browser.exitCode === null) browser.kill("SIGTERM");
  if (!keep) rmSync(temporary, { recursive: true, force: true });
}
process.exit(report?.status === "passed" ? 0 : 2);
