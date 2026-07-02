import { spawn } from "child_process";
import path from "path";
import readline from "readline";
import { logger } from "../utils/logger.js";

const childEnv = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key, value]) => key && !key.startsWith("=") && value !== undefined)
    .map(([key, value]) => [key, String(value)]),
);

const pipeWithPrefix = (stream, service, output) => {
  const rl = readline.createInterface({ input: stream });
  rl.on("line", (line) => output.write(`[${service}] ${line}\n`));
};

export const createServiceRunner = ({ rootDir, services }) => {
  const children = new Map();
  let shuttingDown = false;

  const stopAll = (exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;

    for (const child of children.values()) {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        child.kill("SIGTERM");
      }
    }

    setTimeout(() => process.exit(exitCode), 500).unref();
  };

  const startService = (service) => {
    const cwd = path.join(rootDir, "services", service);
    const child = spawn(process.execPath, ["app.js"], {
      cwd,
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });

    children.set(service, child);
    pipeWithPrefix(child.stdout, service, process.stdout);
    pipeWithPrefix(child.stderr, service, process.stderr);

    child.on("exit", (code, signal) => {
      children.delete(service);
      if (!shuttingDown) {
        logger.error({ message: "Service exited unexpectedly", service, exit: signal || code });
        stopAll(code || 1);
      }
    });
  };

  const startAll = () => {
    logger.info({ message: "Starting backend services", count: services.length });
    services.forEach(startService);
  };

  return { startAll, stopAll };
};
