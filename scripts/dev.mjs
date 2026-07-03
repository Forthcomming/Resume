import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

// Avoid stale/corrupt webpack chunks when dev and build share `.next`.
try {
  rmSync(".next", { recursive: true, force: true });
} catch {
  /* ignore */
}

const nextBin = path.join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

const child = spawn(process.execPath, [nextBin, "dev"], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
