import { useCallback } from 'react'

/**
 * Hook that provides sound alert functions.
 * Delegates to the main process which plays WAV files natively.
 *
 * @param enabled - Whether sound alerts are enabled
 */
export function useSoundAlerts(enabled: boolean) {
  const playCompleteSound = useCallback(() => {
    if (!enabled) return
    window.electronAPI.playSoundAlert('complete')
  }, [enabled])

  const playPermissionSound = useCallback(() => {
    if (!enabled) return
    window.electronAPI.playSoundAlert('permission')
  }, [enabled])

  return { playCompleteSound, playPermissionSound }
}
