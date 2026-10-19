import { spawnSync } from "node:child_process";

const result = spawnSync(
  "pnpm",
  ["--filter", "engine", "uw", "evidence", "build"],
  {
    cwd: new URL("..", import.meta.url),
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

process.exit(result.status ?? 1);
