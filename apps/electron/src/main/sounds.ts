/**
 * Sound alert playback for the main process.
 * Plays bundled WAV files using platform-native commands.
 */
import { join } from 'path'
import { existsSync } from 'fs'
import { execFile } from 'child_process'

export type SoundAlertType = 'complete' | 'permission'

const SOUNDS_DIR = join(__dirname, 'resources/sounds')

/**
 * Play a sound alert by type.
 * Uses platform-native audio playback:
 * - macOS: afplay
 * - Windows: powershell SoundPlayer
 * - Linux: aplay
 */
export function playSoundAlert(type: SoundAlertType): void {
  const filePath = join(SOUNDS_DIR, `${type}.wav`)
  if (!existsSync(filePath)) {
    console.warn(`[sounds] Sound file not found: ${filePath}`)
    return
  }

  try {
    if (process.platform === 'darwin') {
      execFile('afplay', [filePath], (err) => {
        if (err) console.warn('[sounds] afplay error:', err.message)
      })
    } else if (process.platform === 'win32') {
      execFile('powershell', [
        '-NoProfile', '-NonInteractive', '-Command',
        `(New-Object Media.SoundPlayer '${filePath}').PlaySync()`,
      ], (err) => {
        if (err) console.warn('[sounds] powershell error:', err.message)
      })
    } else {
      // Linux: try aplay first, fall back to paplay
      execFile('aplay', ['-q', filePath], (err) => {
        if (err) {
          execFile('paplay', [filePath], (err2) => {
            if (err2) console.warn('[sounds] No audio player found')
          })
        }
      })
    }
  } catch (err) {
    console.warn('[sounds] Failed to play sound:', err)
  }
}
