import { build } from "esbuild";

const shared = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: true,
  banner: {
    js: `
import { createRequire as __createRequire } from "module";
const require = __createRequire(import.meta.url);
`.trim(),
  },
};

await build({
  ...shared,
  entryPoints: ["electron/main.ts"],
  outfile: "dist-electron/main.mjs",
  external: ["electron"],
});

await build({
  ...shared,
  entryPoints: ["electron/api-server.ts"],
  outfile: "dist-electron/api-server.mjs",
  external: ["electron"],
});

await build({
  ...shared,
  entryPoints: ["electron/preload.ts"],
  outfile: "dist-electron/preload.mjs",
  external: ["electron"],
  format: "esm",
});

console.log("Electron files built successfully!");
