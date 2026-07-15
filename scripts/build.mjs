import net from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const devRunning = await isPortOpen(3000);
if (devRunning) {
  console.error(
    "\n[build] 检测到 localhost:3000 上 dev 服务正在运行。\n" +
      "请先停止 npm run dev，再执行 build，否则 .next 缓存会损坏导致页面报错。\n"
  );
  process.exit(1);
}

const nextBin = path.join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

const child = spawn(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
