import { createRequire as __createRequire } from "module";
const require = __createRequire(import.meta.url);

// electron/preload.ts
import { contextBridge } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true
});
//# sourceMappingURL=preload.mjs.map
