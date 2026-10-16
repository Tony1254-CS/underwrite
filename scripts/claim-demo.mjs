import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractsDir = path.resolve(__dirname, "../contracts");

console.log("Running ClaimDemo script with Forge...");
try {
  const output = execSync("forge script script/ClaimDemo.s.sol", {
    cwd: contractsDir,
    encoding: "utf-8",
    stdio: "pipe",
  });
  console.log(output);
  process.exit(0);
} catch (err) {
  console.error("Execution failed:", err.stdout || err.message);
  process.exit(1);
}
