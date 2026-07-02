import path from "path";
import { fileURLToPath } from "url";
import { backendServices } from "./serviceManifest.js";
import { createServiceRunner } from "./shared/runtime/serviceRunner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runner = createServiceRunner({ rootDir: __dirname, services: backendServices });

process.on("SIGINT", () => runner.stopAll(0));
process.on("SIGTERM", () => runner.stopAll(0));

runner.startAll();
