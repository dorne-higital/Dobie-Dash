/**
 * "Share clip" after a new best: makes the last 10 seconds as a video (game/clip.ts) and
 * opens the share sheet. On iPhone the video is written to the app's cache first (the
 * share sheet needs a file); in a browser it uses Web Share with a file, or downloads it.
 */
import { Capacitor } from '@capacitor/core'
import { canMakeClips, makeClip } from '~/game/clip'
import type { RunRecord } from '~/game/replay'

export function useClip() {
  const config = useServices().config
  const look = useLook()
  const making = ref(false)

  function blobToBase64(b: Blob): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(String(r.result).split(',')[1] ?? '')
      r.onerror = () => rej(r.error)
      r.readAsDataURL(b)
    })
  }

  async function share(record: RunRecord, caption: string): Promise<'shared' | 'saved' | 'failed'> {
    if (making.value) return 'failed'
    making.value = true
    try {
      const blob = await makeClip(config.game(), record, { look: look.value, caption })
      if (!blob || !blob.size) return 'failed'
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const name = `dobie-dash.${ext}`
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const { Share } = await import('@capacitor/share')
        const { uri } = await Filesystem.writeFile({
          path: name,
          data: await blobToBase64(blob),
          directory: Directory.Cache,
        })
        await Share.share({ title: caption, files: [uri] })
        return 'shared'
      }
      const file = new File([blob], name, { type: blob.type })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption })
        return 'shared'
      }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = name
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
      return 'saved'
    } catch (e) {
      console.warn('[clip]', e)
      return 'failed'
    } finally {
      making.value = false
    }
  }

  return { can: canMakeClips(), making, share }
}
