import { execFile, execSync } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { execPath } from "process";

const execFileAsync = promisify(execFile);

/**
 * Automatically repair PATH on macOS GUI/packaged application environments.
 */
function fixMacPath() {
  if (process.platform !== "darwin") return;

  const paths = new Set<string>();

  // 1. Add standard developer binary locations
  paths.add("/usr/local/bin");
  paths.add("/opt/homebrew/bin");

  // 2. Merge existing PATH entries
  if (process.env.PATH) {
    process.env.PATH.split(":").forEach((p) => paths.add(p));
  }

  // 3. Fetch active user shell PATH synchronously via a zsh login shell invocation
  try {
    const userPath = execSync("zsh -lic 'echo $PATH'", { encoding: "utf8", timeout: 2000 }).trim();
    if (userPath) {
      userPath.split(":").forEach((p) => paths.add(p));
    }
  } catch (e) {
    // Fail silently if shell invocation fails (e.g. non-Catalina macOS or no zsh)
  }

  // 4. Update the process.env.PATH
  process.env.PATH = Array.from(paths).join(":");
}

// Invoke PATH recovery
try {
  fixMacPath();
} catch {
  // ignore
}


/**
 * Locate `npx-cli.js` shipped with the running Node.js installation.
 *
 * On Windows the `npx` on PATH is actually `npx.cmd`, which Node.js (since
 * 20.12 due to CVE-2024-27980) refuses to spawn from `execFile`/`spawn`
 * without `shell: true`. Going through a shell reintroduces quoting bugs for
 * user-supplied args. Instead we find the real `npx-cli.js` and invoke it
 * directly via the current `node` binary, which works identically on every
 * platform and needs no shell.
 */
function findNpxCli(): string | null {
  const nodeDir = dirname(execPath);
  const candidates = [
    // Windows MSI installer layout: node.exe and node_modules share a dir
    join(nodeDir, "node_modules", "npm", "bin", "npx-cli.js"),
    // Unix layout: .../bin/node + .../lib/node_modules/npm/bin/npx-cli.js
    join(nodeDir, "..", "lib", "node_modules", "npm", "bin", "npx-cli.js"),
  ];
  for (const p of candidates) {
    try {
      if (existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  return null;
}

export interface RunNpxOptions {
  timeout?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface RunNpxResult {
  stdout: string;
  stderr: string;
}

/**
 * Cross-platform wrapper for invoking `npx <args>` without ever using a
 * shell, so user-controlled arguments are never interpreted as shell syntax.
 */
export async function runNpx(args: string[], opts: RunNpxOptions = {}): Promise<RunNpxResult> {
  const npxCli = findNpxCli();
  const { command, commandArgs } = npxCli
    ? { command: execPath, commandArgs: [npxCli, ...args] }
    : { command: "npx", commandArgs: args };
  return execFileAsync(command, commandArgs, {
    timeout: opts.timeout,
    cwd: opts.cwd,
    env: opts.env,
  });
}
