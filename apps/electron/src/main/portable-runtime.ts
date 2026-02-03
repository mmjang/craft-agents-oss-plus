/**
 * Portable Runtime Setup
 *
 * This module configures bundled portable runtimes (Python, Node.js) for users
 * who don't have development tools installed. It also configures Chinese mirror
 * sources for npm and pip to improve download speeds in mainland China.
 *
 * On Windows, it also configures Git Bash which is required by Claude Agent SDK.
 */

import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { execFileSync, execSync } from 'child_process'
import { mainLog } from './logger'

interface MirrorConfig {
  npm: string
  pip: string
  pipTrustedHost: string
}

const MIRROR_PRESETS: Record<string, MirrorConfig> = {
  china: {
    npm: 'https://registry.npmmirror.com',
    pip: 'https://pypi.tuna.tsinghua.edu.cn/simple',
    pipTrustedHost: 'pypi.tuna.tsinghua.edu.cn',
  },
  china_aliyun: {
    npm: 'https://registry.npmmirror.com',
    pip: 'https://mirrors.aliyun.com/pypi/simple',
    pipTrustedHost: 'mirrors.aliyun.com',
  },
  global: {
    npm: 'https://registry.npmjs.org',
    pip: 'https://pypi.org/simple',
    pipTrustedHost: 'pypi.org',
  },
}

/**
 * Get the path to the portable runtime directory based on platform
 */
function getPortablePath(): string {
  // In packaged app, resources are in app.getPath('exe')/../Resources
  // In dev mode, they're in the resources folder relative to __dirname
  const resourcesPath = app.isPackaged
    ? join(process.resourcesPath || '', '')
    : join(__dirname, '../resources')

  const isWindows = process.platform === 'win32'
  const isMac = process.platform === 'darwin'

  const platformDir = isWindows ? 'portable-win' : isMac ? 'portable-darwin' : 'portable-linux'

  return join(resourcesPath, platformDir)
}

/**
 * Setup portable runtime environment
 *
 * This function:
 * 1. Adds bundled Python and Node.js to PATH (if available)
 * 2. Configures Git Bash for Windows (required by Claude Agent SDK)
 * 3. Sets up mirror sources for npm and pip
 *
 * @param mirrorPreset - Which mirror preset to use ('china', 'china_aliyun', 'global')
 */
export function setupPortableRuntime(mirrorPreset: string = 'china'): void {
  const portablePath = getPortablePath()
  const mirror = MIRROR_PRESETS[mirrorPreset] || MIRROR_PRESETS.china
  const isWindows = process.platform === 'win32'
  const pathSeparator = isWindows ? ';' : ':'

  mainLog.info(`[portable-runtime] Checking portable runtime at: ${portablePath}`)

  // Check if portable directory exists
  if (!existsSync(portablePath)) {
    mainLog.info('[portable-runtime] Portable runtime directory not found, skipping')
    // Still configure mirrors even without portable runtime
    configureMirrors(mirror)
    return
  }

  // ========== Windows: Git Bash Configuration ==========
  if (isWindows) {
    const gitPath = join(portablePath, 'git')
    const bashExe = join(gitPath, 'bin', 'bash.exe')

    if (existsSync(bashExe)) {
      // Claude Agent SDK requires this environment variable on Windows
      process.env.CLAUDE_CODE_GIT_BASH_PATH = bashExe

      // Add Git tools to PATH
      const gitBinPath = join(gitPath, 'bin')
      const gitUsrBinPath = join(gitPath, 'usr', 'bin')
      process.env.PATH = [gitBinPath, gitUsrBinPath, process.env.PATH].join(pathSeparator)

      mainLog.info(`[portable-runtime] Git Bash configured: ${bashExe}`)
    } else {
      mainLog.warn('[portable-runtime] Git Bash not found - Claude Agent SDK may not work properly on Windows')
    }
  }

  // ========== Python Configuration ==========
  const pythonPath = join(portablePath, 'python')
  const pythonBin = isWindows
    ? join(pythonPath, 'python.exe')
    : join(pythonPath, 'bin', 'python3')

  if (existsSync(pythonBin)) {
    if (isWindows) {
      process.env.PATH = [pythonPath, join(pythonPath, 'Scripts'), process.env.PATH].join(
        pathSeparator
      )

      // Check if pip is installed, if not, install it using Chinese mirror
      const pipInstalled = existsSync(join(pythonPath, 'Scripts', 'pip.exe')) ||
                          existsSync(join(pythonPath, 'Lib', 'site-packages', 'pip'))
      const getPipPath = join(pythonPath, 'get-pip.py')

      if (!pipInstalled && existsSync(getPipPath)) {
        mainLog.info('[portable-runtime] pip not found, installing using Tsinghua mirror...')
        try {
          execSync(
            `"${pythonBin}" "${getPipPath}" -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn`,
            { stdio: 'pipe', timeout: 120000 }
          )
          mainLog.info('[portable-runtime] pip installed successfully')
        } catch (err) {
          mainLog.warn('[portable-runtime] Failed to install pip:', err)
        }
      }
    } else {
      process.env.PATH = [join(pythonPath, 'bin'), process.env.PATH].join(pathSeparator)
    }
    mainLog.info(`[portable-runtime] Python configured: ${pythonBin}`)
  } else {
    mainLog.info('[portable-runtime] Portable Python not found')
  }

  // ========== Node.js Configuration ==========
  const nodePath = join(portablePath, 'node')
  const nodeBin = isWindows ? join(nodePath, 'node.exe') : join(nodePath, 'bin', 'node')

  if (existsSync(nodeBin)) {
    if (isWindows) {
      process.env.PATH = [nodePath, process.env.PATH].join(pathSeparator)
    } else {
      process.env.PATH = [join(nodePath, 'bin'), process.env.PATH].join(pathSeparator)
    }
    mainLog.info(`[portable-runtime] Node.js configured: ${nodeBin}`)
  } else {
    mainLog.info('[portable-runtime] Portable Node.js not found')
  }

  // ========== Craft Agent npm-global bin (for Claude Code installed via portable npm) ==========
  const npmGlobalBin = isWindows
    ? join(homedir(), '.craft-agent', 'npm-global')
    : join(homedir(), '.craft-agent', 'npm-global', 'bin')

  if (existsSync(npmGlobalBin)) {
    process.env.PATH = [npmGlobalBin, process.env.PATH].join(pathSeparator)
    mainLog.info(`[portable-runtime] npm-global bin added to PATH: ${npmGlobalBin}`)
  } else {
    mainLog.info(`[portable-runtime] npm-global bin not found (will be created on first Claude Code install): ${npmGlobalBin}`)
  }

  // ========== Configure Mirrors ==========
  configureMirrors(mirror)

  // ========== Self-check (best-effort, logs only) ==========
  runPortableRuntimeSelfCheck(portablePath, isWindows)

  mainLog.info(`[portable-runtime] Setup complete (mirror: ${mirrorPreset})`)
}

/**
 * Configure package manager mirrors
 */
function configureMirrors(mirror: MirrorConfig): void {
  // npm/yarn/pnpm mirrors
  process.env.npm_config_registry = mirror.npm
  process.env.YARN_REGISTRY = mirror.npm

  // pip mirrors
  process.env.PIP_INDEX_URL = mirror.pip
  process.env.PIP_TRUSTED_HOST = mirror.pipTrustedHost

  // Other binary mirrors (for packages that download binaries during install)
  process.env.ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
  process.env.SASS_BINARY_SITE = 'https://npmmirror.com/mirrors/node-sass/'
  process.env.PUPPETEER_DOWNLOAD_HOST = 'https://npmmirror.com/mirrors'

  mainLog.info(`[portable-runtime] Mirrors configured: npm=${mirror.npm}, pip=${mirror.pip}`)
}

/**
 * Get the status of portable runtime components
 */
export function getPortableRuntimeStatus(): {
  available: boolean
  gitBash: boolean
  python: boolean
  node: boolean
  pythonVersion?: string
  nodeVersion?: string
} {
  const portablePath = getPortablePath()
  const isWindows = process.platform === 'win32'

  if (!existsSync(portablePath)) {
    return {
      available: false,
      gitBash: !isWindows, // macOS/Linux have bash built-in
      python: false,
      node: false,
    }
  }

  const pythonBin = isWindows
    ? join(portablePath, 'python', 'python.exe')
    : join(portablePath, 'python', 'bin', 'python3')

  const nodeBin = isWindows
    ? join(portablePath, 'node', 'node.exe')
    : join(portablePath, 'node', 'bin', 'node')

  const gitBashExists = isWindows
    ? existsSync(join(portablePath, 'git', 'bin', 'bash.exe'))
    : true

  return {
    available: true,
    gitBash: gitBashExists,
    python: existsSync(pythonBin),
    node: existsSync(nodeBin),
  }
}

const SELF_CHECK_TIMEOUT_MS = 8000

function runPortableRuntimeSelfCheck(portablePath: string, isWindows: boolean): void {
  if (!existsSync(portablePath)) return

  const results: Record<string, string> = {}

  const check = (label: string, fn: () => string) => {
    try {
      results[label] = fn()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results[label] = `error: ${message}`
    }
  }

  // Git Bash (Windows only)
  if (isWindows) {
    const bashExe = join(portablePath, 'git', 'bin', 'bash.exe')
    if (existsSync(bashExe)) {
      check('git_bash', () =>
        execFileSync(bashExe, ['--version'], { stdio: 'pipe', timeout: SELF_CHECK_TIMEOUT_MS })
          .toString()
          .trim()
      )
    } else {
      results.git_bash = 'missing'
    }
  }

  // Python + pip
  const pythonBin = isWindows
    ? join(portablePath, 'python', 'python.exe')
    : join(portablePath, 'python', 'bin', 'python3')
  if (existsSync(pythonBin)) {
    check('python', () =>
      execFileSync(pythonBin, ['-V'], { stdio: 'pipe', timeout: SELF_CHECK_TIMEOUT_MS })
        .toString()
        .trim()
    )
    check('pip', () =>
      execFileSync(pythonBin, ['-m', 'pip', '-V'], { stdio: 'pipe', timeout: SELF_CHECK_TIMEOUT_MS })
        .toString()
        .trim()
    )
  } else {
    results.python = 'missing'
    results.pip = 'missing'
  }

  // Node + npm
  const nodePath = join(portablePath, 'node')
  const nodeBin = isWindows ? join(nodePath, 'node.exe') : join(nodePath, 'bin', 'node')
  if (existsSync(nodeBin)) {
    check('node', () =>
      execFileSync(nodeBin, ['-v'], { stdio: 'pipe', timeout: SELF_CHECK_TIMEOUT_MS })
        .toString()
        .trim()
    )
    const npmCliPath = isWindows
      ? join(nodePath, 'node_modules', 'npm', 'bin', 'npm-cli.js')
      : join(nodePath, 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')
    if (existsSync(npmCliPath)) {
      check('npm', () =>
        execFileSync(nodeBin, [npmCliPath, '-v'], { stdio: 'pipe', timeout: SELF_CHECK_TIMEOUT_MS })
          .toString()
          .trim()
      )
    } else {
      results.npm = 'missing'
    }
  } else {
    results.node = 'missing'
    results.npm = 'missing'
  }

  // Claude Code (optional)
  const claudeBin = isWindows
    ? join(homedir(), '.craft-agent', 'npm-global', 'claude.cmd')
    : join(homedir(), '.craft-agent', 'npm-global', 'bin', 'claude')
  if (existsSync(claudeBin)) {
    if (isWindows) {
      check('claude', () =>
        execFileSync('cmd.exe', ['/c', claudeBin, '--version'], {
          stdio: 'pipe',
          timeout: SELF_CHECK_TIMEOUT_MS,
        })
          .toString()
          .trim()
      )
    } else {
      check('claude', () =>
        execFileSync(claudeBin, ['--version'], { stdio: 'pipe', timeout: SELF_CHECK_TIMEOUT_MS })
          .toString()
          .trim()
      )
    }
  } else {
    results.claude = 'not_installed'
  }

  mainLog.info('[portable-runtime] Self-check results:', results)
}
