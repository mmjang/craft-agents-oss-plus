import { accessSync, existsSync, constants } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface DetectedChrome {
  executablePath: string;
  browser: "chrome" | "chrome-canary" | "edge";
  description: string;
}

interface BrowserCandidate {
  browser: DetectedChrome["browser"];
  description: string;
  paths: string[];
}

function getMacCandidates(): BrowserCandidate[] {
  const home = homedir();
  return [
    {
      browser: "chrome",
      description: "Google Chrome",
      paths: [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        join(home, "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
      ],
    },
    {
      browser: "chrome-canary",
      description: "Google Chrome Canary",
      paths: [
        "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
        join(home, "Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"),
      ],
    },
    {
      browser: "edge",
      description: "Microsoft Edge",
      paths: [
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        join(home, "Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"),
      ],
    },
  ];
}

function getWindowsCandidates(): BrowserCandidate[] {
  const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA || "";

  return [
    {
      browser: "chrome",
      description: "Google Chrome",
      paths: [
        join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
        join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
        ...(localAppData
          ? [join(localAppData, "Google", "Chrome", "Application", "chrome.exe")]
          : []),
      ],
    },
    {
      browser: "chrome-canary",
      description: "Google Chrome Canary",
      paths: localAppData
        ? [join(localAppData, "Google", "Chrome SxS", "Application", "chrome.exe")]
        : [],
    },
    {
      browser: "edge",
      description: "Microsoft Edge",
      paths: [
        join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
        join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
      ],
    },
  ];
}

function isExecutable(path: string): boolean {
  try {
    if (process.platform === "win32") {
      return existsSync(path);
    }
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect a locally installed Chromium-based browser.
 * Priority: Chrome Stable > Chrome Canary > Microsoft Edge.
 * Returns null if no browser is found.
 */
export function detectChrome(): DetectedChrome | null {
  const candidates =
    process.platform === "darwin"
      ? getMacCandidates()
      : process.platform === "win32"
        ? getWindowsCandidates()
        : [];

  for (const candidate of candidates) {
    for (const path of candidate.paths) {
      if (isExecutable(path)) {
        return {
          executablePath: path,
          browser: candidate.browser,
          description: candidate.description,
        };
      }
    }
  }

  return null;
}
