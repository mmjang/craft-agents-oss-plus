import { app } from 'electron'
import { mainLog } from './logger'

const DEFAULT_CDP_PORT = 9222

/**
 * Setup Chrome DevTools Protocol (CDP) debugging support.
 * Enables external agents to connect and debug/automate the app.
 *
 * Usage (environment variable - recommended for dev):
 *   CDP_PORT=9222 bun run electron:dev
 *
 * Usage (command line - for packaged app):
 *   --cdp           Enable CDP on default port (9222)
 *   --cdp-port=N    Enable CDP on custom port N
 *
 * Must be called before app.whenReady().
 */
export function setupCdp(): { enabled: boolean; port: number } {
  // Check environment variable first (easier for dev mode)
  const envPort = process.env.CDP_PORT ? parseInt(process.env.CDP_PORT, 10) : 0

  // Parse --cdp-port=<port> or --cdp flag
  const cdpPortArg = process.argv.find(arg => arg.startsWith('--cdp-port='))
  const argPort = cdpPortArg
    ? parseInt(cdpPortArg.split('=')[1], 10) || DEFAULT_CDP_PORT
    : process.argv.includes('--cdp')
      ? DEFAULT_CDP_PORT
      : 0

  // Environment variable takes precedence
  const port = envPort || argPort

  if (!port) return { enabled: false, port: 0 }

  // Security warning for production
  if (app.isPackaged) {
    mainLog.warn('CDP debugging enabled in production - security risk!')
  }

  app.commandLine.appendSwitch('remote-debugging-port', String(port))
  mainLog.info(`CDP enabled on port ${port}`)
  console.log(`\n=== CDP Debugging ===\nPort: ${port}\nConnect: chrome://inspect\nWebSocket: ws://127.0.0.1:${port}\n=====================\n`)

  return { enabled: true, port }
}
