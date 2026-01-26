/**
 * Claude Code Installer
 *
 * Uses the app's portable Node.js to install @anthropic-ai/claude-code globally.
 * This ensures Claude Code is available even if the user doesn't have Node.js installed.
 */
import { spawn, type ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { homedir } from 'os'
import { mainLog } from './logger'

export interface InstallProgress {
  status: 'checking' | 'installing' | 'success' | 'error' | 'already_installed'
  message: string
  progress?: number // 0-100
}

export type InstallProgressCallback = (progress: InstallProgress) => void

/**
 * Get the path to the portable Node.js installation
 */
function getPortableNodePath(): string {
  const platform = process.platform === 'darwin' ? 'portable-darwin' : 'portable-win'
  const resourcesPath = app.isPackaged
    ? process.resourcesPath
    : join(__dirname, '..', 'resources')

  return join(resourcesPath, platform, 'node')
}

/**
 * Get the npm executable path
 */
function getNpmPath(): string {
  const nodePath = getPortableNodePath()
  if (process.platform === 'win32') {
    return join(nodePath, 'npm.cmd')
  }
  return join(nodePath, 'bin', 'npm')
}

/**
 * Get the node executable path
 */
function getNodePath(): string {
  const nodePath = getPortableNodePath()
  console.log('Portable Node Path:', nodePath)
  if (process.platform === 'win32') {
    return join(nodePath, 'node.exe')
  }
  return join(nodePath, 'bin', 'node')
}

/**
 * Get the global npm prefix path (where packages are installed)
 */
function getGlobalNpmPrefix(): string {
  return join(homedir(), '.craft-agent', 'npm-global')
}

/**
 * Get the path where the claude binary should be installed
 */
function getClaudeBinPath(): string {
  const prefix = getGlobalNpmPrefix()
  if (process.platform === 'win32') {
    return join(prefix, 'claude.cmd')
  }
  return join(prefix, 'bin', 'claude')
}

/**
 * Check if Claude Code is already installed via our portable npm
 */
export function isClaudeCodeInstalledViaPortable(): boolean {
  const claudePath = getClaudeBinPath()
  return existsSync(claudePath)
}

/**
 * Install Claude Code using the portable npm
 * Returns a promise that resolves when installation is complete
 */
export function installClaudeCode(
  onProgress: InstallProgressCallback
): { promise: Promise<void>; cancel: () => void } {
  let childProcess: ChildProcess | null = null
  let cancelled = false

  const promise = new Promise<void>((resolve, reject) => {
    // Check if already installed
    if (isClaudeCodeInstalledViaPortable()) {
      onProgress({
        status: 'already_installed',
        message: 'Claude Code is already installed',
        progress: 100,
      })
      resolve()
      return
    }

    const nodePath = getNodePath()
    const npmPath = getNpmPath()
    const prefix = getGlobalNpmPrefix()

    // Verify portable node exists
    if (!existsSync(nodePath)) {
      mainLog.error('[ClaudeCodeInstaller] Portable Node.js not found at:', nodePath)
      onProgress({
        status: 'error',
        message: 'Portable Node.js not found. Please reinstall the application.',
      })
      reject(new Error('Portable Node.js not found'))
      return
    }

    mainLog.info('[ClaudeCodeInstaller] Starting installation...')
    mainLog.info('[ClaudeCodeInstaller] Node path:', nodePath)
    mainLog.info('[ClaudeCodeInstaller] NPM path:', npmPath)
    mainLog.info('[ClaudeCodeInstaller] Prefix:', prefix)

    onProgress({
      status: 'installing',
      message: 'Installing Claude Code...',
      progress: 10,
    })

    // Run npm install -g @anthropic-ai/claude-code
    const args = [
      npmPath,
      'install',
      '-g',
      '@anthropic-ai/claude-code',
      '--prefix',
      prefix,
    ]

    mainLog.info('[ClaudeCodeInstaller] Running:', nodePath, args.join(' '))

    childProcess = spawn(nodePath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Ensure npm uses the portable node
        PATH: `${join(getPortableNodePath(), 'bin')}:${process.env.PATH}`,
      },
    })

    let stdout = ''
    let stderr = ''
    let progressValue = 10

    childProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      stdout += text
      mainLog.info('[ClaudeCodeInstaller] stdout:', text.trim())

      // Update progress based on npm output
      if (text.includes('added')) {
        progressValue = Math.min(progressValue + 20, 90)
      } else if (text.includes('npm')) {
        progressValue = Math.min(progressValue + 5, 90)
      }

      onProgress({
        status: 'installing',
        message: text.trim() || 'Installing...',
        progress: progressValue,
      })
    })

    childProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString()
      stderr += text
      mainLog.warn('[ClaudeCodeInstaller] stderr:', text.trim())

      // npm often outputs progress to stderr
      if (!text.includes('ERR!') && !text.includes('error')) {
        onProgress({
          status: 'installing',
          message: text.trim() || 'Installing...',
          progress: progressValue,
        })
      }
    })

    childProcess.on('error', (err) => {
      mainLog.error('[ClaudeCodeInstaller] Process error:', err)
      if (!cancelled) {
        onProgress({
          status: 'error',
          message: `Installation failed: ${err.message}`,
        })
        reject(err)
      }
    })

    childProcess.on('close', (code) => {
      childProcess = null

      if (cancelled) {
        reject(new Error('Installation cancelled'))
        return
      }

      if (code === 0) {
        // Verify installation
        if (isClaudeCodeInstalledViaPortable()) {
          mainLog.info('[ClaudeCodeInstaller] Installation successful')
          onProgress({
            status: 'success',
            message: 'Claude Code installed successfully',
            progress: 100,
          })
          resolve()
        } else {
          mainLog.error('[ClaudeCodeInstaller] Installation completed but binary not found')
          onProgress({
            status: 'error',
            message: 'Installation completed but Claude Code binary not found',
          })
          reject(new Error('Installation completed but binary not found'))
        }
      } else {
        const errorMsg = stderr.trim() || `Installation failed with exit code ${code}`
        mainLog.error('[ClaudeCodeInstaller] Installation failed:', errorMsg)
        onProgress({
          status: 'error',
          message: errorMsg,
        })
        reject(new Error(errorMsg))
      }
    })
  })

  const cancel = () => {
    cancelled = true
    if (childProcess) {
      childProcess.kill()
      childProcess = null
    }
  }

  return { promise, cancel }
}
