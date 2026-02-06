import { serve } from "@/index.js";
import { execSync } from "child_process";
import { mkdirSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tmpDir = join(__dirname, "..", "tmp");
const profileDir = join(__dirname, "..", "profiles");

const HTTP_PORT = 9222;
const CDP_PORT = 9223;

// Create tmp and profile directories if they don't exist
console.log("Creating tmp directory...");
mkdirSync(tmpDir, { recursive: true });
console.log("Creating profiles directory...");
mkdirSync(profileDir, { recursive: true });

// Install Playwright browsers if not already installed
console.log("Checking Playwright browser installation...");

function findPackageManager(): { name: string; command: string } | null {
  const managers = [
    { name: "bun", command: "bunx playwright install chromium" },
    { name: "pnpm", command: "pnpm exec playwright install chromium" },
    { name: "npm", command: "npx playwright install chromium" },
  ];

  const isWindows = process.platform === "win32";

  for (const manager of managers) {
    try {
      // Cross-platform command existence check
      const checkCmd = isWindows ? `where ${manager.name}` : `which ${manager.name}`;
      execSync(checkCmd, { stdio: "ignore" });
      return manager;
    } catch {
      // Package manager not found, try next
    }
  }
  return null;
}

function isChromiumInstalled(): boolean {
  const isWindows = process.platform === "win32";

  // Playwright cache locations vary by platform
  const possiblePaths: string[] = [];

  if (isWindows) {
    // Windows: check LOCALAPPDATA first (default), then fallback locations
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      possiblePaths.push(join(localAppData, "ms-playwright"));
    }
    const userProfile = process.env.USERPROFILE;
    if (userProfile) {
      possiblePaths.push(join(userProfile, ".cache", "ms-playwright"));
    }
  } else {
    // Unix: ~/.cache/ms-playwright
    const homeDir = process.env.HOME || "";
    if (homeDir) {
      possiblePaths.push(join(homeDir, ".cache", "ms-playwright"));
    }
  }

  for (const playwrightCacheDir of possiblePaths) {
    if (!existsSync(playwrightCacheDir)) {
      continue;
    }

    // Check for chromium directories (e.g., chromium-1148, chromium_headless_shell-1148)
    try {
      const entries = readdirSync(playwrightCacheDir);
      if (entries.some((entry) => entry.startsWith("chromium"))) {
        return true;
      }
    } catch {
      // Continue to next path
    }
  }

  return false;
}

// Cross-platform process killer
function killProcessOnPort(port: number): void {
  const isWindows = process.platform === "win32";

  try {
    if (isWindows) {
      // Windows: use netstat and taskkill
      // Note: These commands work in both cmd.exe and Git Bash
      // Using cmd.exe explicitly to avoid Git Bash path translation issues
      const output = execSync(
        `cmd.exe /c "netstat -ano | findstr :${port} | findstr LISTENING"`,
        { encoding: "utf-8", shell: "cmd.exe" }
      );
      const lines = output.trim().split("\n");
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          console.log(`Killing process on port ${port} (PID: ${pid})`);
          execSync(`cmd.exe /c "taskkill /F /PID ${pid}"`, { stdio: "ignore", shell: "cmd.exe" });
        }
      }
    } else {
      // Unix: use lsof and kill
      const pid = execSync(`lsof -ti:${port}`, { encoding: "utf-8" }).trim();
      if (pid) {
        console.log(`Killing process on port ${port} (PID: ${pid})`);
        execSync(`kill -9 ${pid}`);
      }
    }
  } catch {
    // No process on port, which is expected
  }
}

// Check if the response is from dev-browser server
async function isDevBrowserServer(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}`, {
      signal: AbortSignal.timeout(1000),
    });
    if (!res.ok) return false;

    const data = (await res.json()) as { wsEndpoint?: string };
    // dev-browser server returns { wsEndpoint: "ws://..." }
    return typeof data.wsEndpoint === "string" && data.wsEndpoint.startsWith("ws://");
  } catch {
    return false;
  }
}

try {
  if (!isChromiumInstalled()) {
    console.log("Playwright Chromium not found. Installing (this may take a minute)...");

    const pm = findPackageManager();
    if (!pm) {
      throw new Error("No package manager found (tried bun, pnpm, npm)");
    }

    console.log(`Using ${pm.name} to install Playwright...`);
    execSync(pm.command, { stdio: "inherit" });
    console.log("Chromium installed successfully.");
  } else {
    console.log("Playwright Chromium already installed.");
  }
} catch (error) {
  console.error("Failed to install Playwright browsers:", error);
  console.log("You may need to run: npx playwright install chromium");
}

// Check if server is already running (and it's actually dev-browser)
console.log("Checking for existing servers...");
if (await isDevBrowserServer(HTTP_PORT)) {
  console.log("Dev-browser server already running on port " + HTTP_PORT);
  process.exit(0);
}

// Clean up stale processes on both ports (crash recovery)
console.log("Cleaning up stale processes...");
killProcessOnPort(HTTP_PORT);
killProcessOnPort(CDP_PORT);

// Wait a moment for ports to be released
await new Promise((resolve) => setTimeout(resolve, 300));

console.log("Starting dev browser server...");
const headless = process.env.HEADLESS === "true";
const server = await serve({
  port: HTTP_PORT,
  cdpPort: CDP_PORT,
  headless,
  profileDir,
});

console.log(`Dev browser server started`);
console.log(`  WebSocket: ${server.wsEndpoint}`);
console.log(`  Tmp directory: ${tmpDir}`);
console.log(`  Profile directory: ${profileDir}`);
console.log(`\nReady`);
console.log(`\nPress Ctrl+C to stop`);

// Keep the process running
await new Promise(() => {});
