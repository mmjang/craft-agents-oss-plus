import { createWriteStream, existsSync } from 'fs'
import { mkdir, rm, writeFile, rename } from 'fs/promises'
import { join, dirname } from 'path'
import { tmpdir } from 'os'
import { spawn } from 'child_process'
import { request as httpsRequest } from 'https'
import { request as httpRequest } from 'http'
import { mainLog } from './logger'
import {
  getPortableRuntimeStatus,
  getUserPortableRuntimePath,
  setupPortableRuntime,
} from './portable-runtime'

export type PortableRuntimeStage = 'git' | 'python' | 'node' | 'pip' | 'finalize'

export interface PortableRuntimeInstallProgress {
  status: 'checking' | 'downloading' | 'extracting' | 'installing' | 'configuring' | 'success' | 'error'
  stage?: PortableRuntimeStage
  progress?: number
  message: string
}

export type PortableRuntimeInstallCallback = (progress: PortableRuntimeInstallProgress) => void

const WINDOWS_GIT_VERSION = '2.47.1'
const WINDOWS_PYTHON_VERSION = '3.11.9'
const WINDOWS_NODE_VERSION = '20.18.2'

const MAC_PYTHON_VERSION = '3.11.11'
const MAC_PYTHON_RELEASE = '20250115'
const MAC_NODE_VERSION = '20.18.2'

const DEFAULT_MIRROR_PRESET = process.env.PORTABLE_RUNTIME_MIRROR_PRESET || 'china'

const MIRRORS = {
  china: {
    gitWindows: {
      primary: `https://npmmirror.com/mirrors/git-for-windows/v${WINDOWS_GIT_VERSION}.windows.1/PortableGit-${WINDOWS_GIT_VERSION}-64-bit.7z.exe`,
      fallback: `https://github.com/git-for-windows/git/releases/download/v${WINDOWS_GIT_VERSION}.windows.1/PortableGit-${WINDOWS_GIT_VERSION}-64-bit.7z.exe`,
    },
    pythonWindows: {
      primary: `https://mirrors.tuna.tsinghua.edu.cn/python/${WINDOWS_PYTHON_VERSION}/python-${WINDOWS_PYTHON_VERSION}-embed-amd64.zip`,
      fallback: `https://www.python.org/ftp/python/${WINDOWS_PYTHON_VERSION}/python-${WINDOWS_PYTHON_VERSION}-embed-amd64.zip`,
    },
    nodeWindows: {
      primary: `https://npmmirror.com/mirrors/node/v${WINDOWS_NODE_VERSION}/node-v${WINDOWS_NODE_VERSION}-win-x64.zip`,
      fallback: `https://nodejs.org/dist/v${WINDOWS_NODE_VERSION}/node-v${WINDOWS_NODE_VERSION}-win-x64.zip`,
    },
    pythonMac: {
      primary: `https://ghproxy.com/https://github.com/indygreg/python-build-standalone/releases/download/${MAC_PYTHON_RELEASE}/cpython-${MAC_PYTHON_VERSION}+${MAC_PYTHON_RELEASE}-__ARCH__-apple-darwin-install_only.tar.gz`,
      fallback: `https://github.com/indygreg/python-build-standalone/releases/download/${MAC_PYTHON_RELEASE}/cpython-${MAC_PYTHON_VERSION}+${MAC_PYTHON_RELEASE}-__ARCH__-apple-darwin-install_only.tar.gz`,
    },
    nodeMac: {
      primary: `https://npmmirror.com/mirrors/node/v${MAC_NODE_VERSION}/node-v${MAC_NODE_VERSION}-darwin-__ARCH__.tar.gz`,
      fallback: `https://nodejs.org/dist/v${MAC_NODE_VERSION}/node-v${MAC_NODE_VERSION}-darwin-__ARCH__.tar.gz`,
    },
    getPip: {
      primary: 'https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple/pip/get-pip.py',
      fallback: 'https://bootstrap.pypa.io/get-pip.py',
    },
    pipIndex: {
      url: 'https://pypi.tuna.tsinghua.edu.cn/simple',
      host: 'pypi.tuna.tsinghua.edu.cn',
    },
    npmRegistry: 'https://registry.npmmirror.com',
  },
  global: {
    gitWindows: {
      primary: `https://github.com/git-for-windows/git/releases/download/v${WINDOWS_GIT_VERSION}.windows.1/PortableGit-${WINDOWS_GIT_VERSION}-64-bit.7z.exe`,
      fallback: `https://npmmirror.com/mirrors/git-for-windows/v${WINDOWS_GIT_VERSION}.windows.1/PortableGit-${WINDOWS_GIT_VERSION}-64-bit.7z.exe`,
    },
    pythonWindows: {
      primary: `https://www.python.org/ftp/python/${WINDOWS_PYTHON_VERSION}/python-${WINDOWS_PYTHON_VERSION}-embed-amd64.zip`,
      fallback: `https://mirrors.tuna.tsinghua.edu.cn/python/${WINDOWS_PYTHON_VERSION}/python-${WINDOWS_PYTHON_VERSION}-embed-amd64.zip`,
    },
    nodeWindows: {
      primary: `https://nodejs.org/dist/v${WINDOWS_NODE_VERSION}/node-v${WINDOWS_NODE_VERSION}-win-x64.zip`,
      fallback: `https://npmmirror.com/mirrors/node/v${WINDOWS_NODE_VERSION}/node-v${WINDOWS_NODE_VERSION}-win-x64.zip`,
    },
    pythonMac: {
      primary: `https://github.com/indygreg/python-build-standalone/releases/download/${MAC_PYTHON_RELEASE}/cpython-${MAC_PYTHON_VERSION}+${MAC_PYTHON_RELEASE}-__ARCH__-apple-darwin-install_only.tar.gz`,
      fallback: `https://ghproxy.com/https://github.com/indygreg/python-build-standalone/releases/download/${MAC_PYTHON_RELEASE}/cpython-${MAC_PYTHON_VERSION}+${MAC_PYTHON_RELEASE}-__ARCH__-apple-darwin-install_only.tar.gz`,
    },
    nodeMac: {
      primary: `https://nodejs.org/dist/v${MAC_NODE_VERSION}/node-v${MAC_NODE_VERSION}-darwin-__ARCH__.tar.gz`,
      fallback: `https://npmmirror.com/mirrors/node/v${MAC_NODE_VERSION}/node-v${MAC_NODE_VERSION}-darwin-__ARCH__.tar.gz`,
    },
    getPip: {
      primary: 'https://bootstrap.pypa.io/get-pip.py',
      fallback: 'https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple/pip/get-pip.py',
    },
    pipIndex: {
      url: 'https://pypi.org/simple',
      host: 'pypi.org',
    },
    npmRegistry: 'https://registry.npmjs.org',
  },
} as const

function resolveMirrorPreset() {
  const preset = DEFAULT_MIRROR_PRESET in MIRRORS ? DEFAULT_MIRROR_PRESET : 'china'
  return MIRRORS[preset as keyof typeof MIRRORS]
}

function replaceArch(url: string, arch: string): string {
  return url.replace('__ARCH__', arch)
}

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true })
}

async function safeRemove(path: string, label: string) {
  const retryDelayMs = 300
  const maxAttempts = 5
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await rm(path, { force: true })
      return
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code
      const retryable = code === 'EPERM' || code === 'EBUSY'
      if (!retryable || attempt === maxAttempts) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        mainLog.warn(`[portable-runtime] Failed to remove ${label}: ${message}`)
        return
      }
      await new Promise(resolve => setTimeout(resolve, retryDelayMs))
    }
  }
}

function escapePowerShellPath(path: string): string {
  return path.replace(/'/g, "''")
}

function runCommand(command: string, args: string[], options: { cwd?: string } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'ignore',
      windowsHide: true,
      cwd: options.cwd,
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed: ${command} ${args.join(' ')} (exit ${code ?? 'unknown'})`))
      }
    })
  })
}

async function downloadToFile(url: string, dest: string, onProgress?: (percent: number) => void): Promise<void> {
  await ensureDir(dirname(dest))

  const requestFn = url.startsWith('https') ? httpsRequest : httpRequest
  await new Promise<void>((resolve, reject) => {
    const req = requestFn(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        downloadToFile(res.headers.location, dest, onProgress).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        res.resume()
        reject(new Error(`Download failed (${res.statusCode}) for ${url}`))
        return
      }

      const total = Number(res.headers['content-length'] || 0)
      let received = 0
      const fileStream = createWriteStream(dest)

      res.on('data', (chunk) => {
        received += chunk.length
        if (total > 0 && onProgress) {
          onProgress(Math.round((received / total) * 100))
        }
      })

      res.pipe(fileStream)
      fileStream.on('finish', () => {
        fileStream.close()
        if (onProgress) onProgress(100)
        resolve()
      })
      fileStream.on('error', reject)
    })

    req.on('error', reject)
    req.end()
  })
}

async function downloadWithFallback(urls: string[], dest: string, onProgress?: (percent: number) => void): Promise<void> {
  let lastError: Error | null = null
  for (const url of urls) {
    try {
      await safeRemove(dest, `temp file ${dest}`)
      await downloadToFile(url, dest, onProgress)
      return
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Download failed')
      mainLog.warn(`[portable-runtime] Download failed for ${url}: ${lastError.message}`)
    }
  }
  throw lastError || new Error('All download attempts failed')
}

async function extractZipWindows(zipPath: string, dest: string): Promise<void> {
  await ensureDir(dest)
  const escapedZip = escapePowerShellPath(zipPath)
  const escapedDest = escapePowerShellPath(dest)
  const command = `Expand-Archive -LiteralPath '${escapedZip}' -DestinationPath '${escapedDest}' -Force`
  await runCommand('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command])
}

async function extractTarGz(tarPath: string, dest: string): Promise<void> {
  await ensureDir(dest)
  await runCommand('tar', ['-xzf', tarPath, '-C', dest, '--strip-components', '1'])
}

async function extractPortableGit(exePath: string, dest: string): Promise<void> {
  await ensureDir(dest)
  await runCommand(exePath, ['-y', `-o${dest}`])
}

async function installPipWindows(pythonDir: string, getPipPath: string, pipIndex: { url: string; host: string }): Promise<void> {
  const pythonExe = join(pythonDir, 'python.exe')
  await runCommand(pythonExe, [
    getPipPath,
    '-i',
    pipIndex.url,
    '--trusted-host',
    pipIndex.host,
  ], { cwd: pythonDir })
}

async function writeWindowsPythonConfig(pythonDir: string, pipIndex: { url: string; host: string }) {
  const pthPath = join(pythonDir, 'python311._pth')
  const pipIniPath = join(pythonDir, 'pip', 'pip.ini')
  await ensureDir(join(pythonDir, 'pip'))
  await writeFile(pthPath, `python311.zip\n.\nLib/site-packages\nimport site\n`)
  await writeFile(
    pipIniPath,
    `[global]\nindex-url = ${pipIndex.url}\ntrusted-host = ${pipIndex.host}\n\n[install]\ntrusted-host = ${pipIndex.host}\n`
  )
}

async function writeMacPythonConfig(pythonDir: string, pipIndex: { url: string; host: string }) {
  const pipConfPath = join(pythonDir, 'pip', 'pip.conf')
  await ensureDir(join(pythonDir, 'pip'))
  await writeFile(
    pipConfPath,
    `[global]\nindex-url = ${pipIndex.url}\ntrusted-host = ${pipIndex.host}\n\n[install]\ntrusted-host = ${pipIndex.host}\n`
  )
}

async function writeNodeConfig(nodeDir: string, npmRegistry: string) {
  const npmrcPath = join(nodeDir, '.npmrc')
  const useChinaMirrors = npmRegistry.includes('npmmirror.com')
  const lines = [`registry=${npmRegistry}`]
  if (useChinaMirrors) {
    lines.push(
      'disturl=https://npmmirror.com/dist',
      'electron_mirror=https://npmmirror.com/mirrors/electron/',
      'sass_binary_site=https://npmmirror.com/mirrors/node-sass/',
      'phantomjs_cdnurl=https://npmmirror.com/mirrors/phantomjs/'
    )
  }
  await writeFile(npmrcPath, `${lines.join('\n')}\n`)
}

export async function installPortableRuntime(onProgress: PortableRuntimeInstallCallback): Promise<void> {
  const status = getPortableRuntimeStatus()
  const mirror = resolveMirrorPreset()

  onProgress({ status: 'checking', message: 'Checking portable runtime...' })

  if (status.available && status.gitBash && status.python && status.node) {
    onProgress({ status: 'success', stage: 'finalize', progress: 100, message: 'Portable runtime already installed' })
    return
  }

  const runtimeRoot = getUserPortableRuntimePath()
  await ensureDir(runtimeRoot)

  if (process.platform === 'win32') {
    const gitDir = join(runtimeRoot, 'git')
    const pythonDir = join(runtimeRoot, 'python')
    const nodeDir = join(runtimeRoot, 'node')

    if (!existsSync(join(gitDir, 'bin', 'bash.exe'))) {
      onProgress({ status: 'downloading', stage: 'git', message: 'Downloading Git Bash...', progress: 0 })
      const gitArchive = join(tmpdir(), `portable-git-${Date.now()}.7z.exe`)
      await downloadWithFallback([mirror.gitWindows.primary, mirror.gitWindows.fallback], gitArchive, (percent) => {
        onProgress({ status: 'downloading', stage: 'git', message: 'Downloading Git Bash...', progress: percent })
      })
      onProgress({ status: 'extracting', stage: 'git', message: 'Extracting Git Bash...', progress: 0 })
      await extractPortableGit(gitArchive, gitDir)
      await safeRemove(gitArchive, 'Git Bash archive')
    }

    if (!existsSync(join(pythonDir, 'python.exe'))) {
      onProgress({ status: 'downloading', stage: 'python', message: 'Downloading Python...', progress: 0 })
      const pythonZip = join(tmpdir(), `portable-python-${Date.now()}.zip`)
      await downloadWithFallback([mirror.pythonWindows.primary, mirror.pythonWindows.fallback], pythonZip, (percent) => {
        onProgress({ status: 'downloading', stage: 'python', message: 'Downloading Python...', progress: percent })
      })
      onProgress({ status: 'extracting', stage: 'python', message: 'Extracting Python...', progress: 0 })
      await extractZipWindows(pythonZip, pythonDir)
      await safeRemove(pythonZip, 'Python archive')
    }

    await writeWindowsPythonConfig(pythonDir, mirror.pipIndex)

    const getPipPath = join(pythonDir, 'get-pip.py')
    if (!existsSync(getPipPath)) {
      onProgress({ status: 'downloading', stage: 'pip', message: 'Downloading pip installer...', progress: 0 })
      await downloadWithFallback([mirror.getPip.primary, mirror.getPip.fallback], getPipPath, (percent) => {
        onProgress({ status: 'downloading', stage: 'pip', message: 'Downloading pip installer...', progress: percent })
      })
    }

    if (!existsSync(join(pythonDir, 'Scripts', 'pip.exe'))) {
      onProgress({ status: 'installing', stage: 'pip', message: 'Installing pip...', progress: 0 })
      try {
        await installPipWindows(pythonDir, getPipPath, mirror.pipIndex)
      } catch (error) {
        mainLog.warn('[portable-runtime] pip install failed:', error)
      }
    }

    if (!existsSync(join(nodeDir, 'node.exe'))) {
      onProgress({ status: 'downloading', stage: 'node', message: 'Downloading Node.js...', progress: 0 })
      const nodeZip = join(tmpdir(), `portable-node-${Date.now()}.zip`)
      await downloadWithFallback([mirror.nodeWindows.primary, mirror.nodeWindows.fallback], nodeZip, (percent) => {
        onProgress({ status: 'downloading', stage: 'node', message: 'Downloading Node.js...', progress: percent })
      })
      onProgress({ status: 'extracting', stage: 'node', message: 'Extracting Node.js...', progress: 0 })
      await extractZipWindows(nodeZip, runtimeRoot)
      const extractedDir = join(runtimeRoot, `node-v${WINDOWS_NODE_VERSION}-win-x64`)
      if (existsSync(extractedDir)) {
        await rm(nodeDir, { recursive: true, force: true })
        await rename(extractedDir, nodeDir)
      }
      await safeRemove(nodeZip, 'Node.js archive')
    }

    await writeNodeConfig(nodeDir, mirror.npmRegistry)
  } else if (process.platform === 'darwin') {
    const pythonDir = join(runtimeRoot, 'python')
    const nodeDir = join(runtimeRoot, 'node')
    const arch = process.arch === 'arm64' ? 'aarch64' : 'x86_64'
    const nodeArch = process.arch === 'arm64' ? 'arm64' : 'x64'

    if (!existsSync(join(pythonDir, 'bin', 'python3'))) {
      onProgress({ status: 'downloading', stage: 'python', message: 'Downloading Python...', progress: 0 })
      const pythonTar = join(tmpdir(), `portable-python-${Date.now()}.tar.gz`)
      const pythonUrls = [
        replaceArch(mirror.pythonMac.primary, arch),
        replaceArch(mirror.pythonMac.fallback, arch),
      ]
      await downloadWithFallback(pythonUrls, pythonTar, (percent) => {
        onProgress({ status: 'downloading', stage: 'python', message: 'Downloading Python...', progress: percent })
      })
      onProgress({ status: 'extracting', stage: 'python', message: 'Extracting Python...', progress: 0 })
      await extractTarGz(pythonTar, pythonDir)
      await safeRemove(pythonTar, 'Python archive')
    }

    await writeMacPythonConfig(pythonDir, mirror.pipIndex)
    if (existsSync(join(pythonDir, 'bin', 'python3'))) {
      onProgress({ status: 'installing', stage: 'pip', message: 'Ensuring pip...', progress: 0 })
      try {
        await runCommand(join(pythonDir, 'bin', 'python3'), ['-m', 'ensurepip', '--upgrade'])
      } catch (error) {
        mainLog.warn('[portable-runtime] ensurepip failed:', error)
      }
    }

    if (!existsSync(join(nodeDir, 'bin', 'node'))) {
      onProgress({ status: 'downloading', stage: 'node', message: 'Downloading Node.js...', progress: 0 })
      const nodeTar = join(tmpdir(), `portable-node-${Date.now()}.tar.gz`)
      const nodeUrls = [
        replaceArch(mirror.nodeMac.primary, nodeArch),
        replaceArch(mirror.nodeMac.fallback, nodeArch),
      ]
      await downloadWithFallback(nodeUrls, nodeTar, (percent) => {
        onProgress({ status: 'downloading', stage: 'node', message: 'Downloading Node.js...', progress: percent })
      })
      onProgress({ status: 'extracting', stage: 'node', message: 'Extracting Node.js...', progress: 0 })
      await extractTarGz(nodeTar, nodeDir)
      await safeRemove(nodeTar, 'Node.js archive')
    }

    await writeNodeConfig(nodeDir, mirror.npmRegistry)
  } else {
    throw new Error(`Unsupported platform for portable runtime: ${process.platform}`)
  }

  onProgress({ status: 'configuring', stage: 'finalize', message: 'Configuring runtime...' })
  setupPortableRuntime(DEFAULT_MIRROR_PRESET)
  onProgress({ status: 'success', stage: 'finalize', progress: 100, message: 'Portable runtime ready' })
}
