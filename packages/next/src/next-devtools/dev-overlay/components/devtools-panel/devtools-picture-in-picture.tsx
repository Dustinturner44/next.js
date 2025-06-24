import { useState, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

export const supportsPictureInPicture =
  // TODO: Who imports this in SSR?
  typeof window !== 'undefined' && 'documentPictureInPicture' in window

declare global {
  interface DocumentPictureInPicture {
    addEventListener: (type: 'enter', listener: () => void) => void
    removeEventListener: (type: 'enter', listener: () => void) => void
    requestWindow: () => Promise<Window>
    window: Window | null
  }
  const documentPictureInPicture: DocumentPictureInPicture
}

function getPictureInPictureWindowSnapshot(): Window | null {
  return supportsPictureInPicture ? documentPictureInPicture.window : null
}
function subscribeToPictureInPictureWindow(listener: () => void): () => void {
  if (supportsPictureInPicture) {
    documentPictureInPicture.addEventListener('enter', listener)
    return () => {
      documentPictureInPicture.removeEventListener('enter', listener)
    }
  } else {
    return () => {}
  }
}

export function usePictureInPictureWindow() {
  return useSyncExternalStore(
    subscribeToPictureInPictureWindow,
    getPictureInPictureWindowSnapshot
  )
}

export function PictureInPictureIcon() {
  return (
    <svg
      data-testid="geist-icon"
      height="16"
      stroke-linejoin="round"
      viewBox="0 0 16 16"
      width="16"
      style={{ color: 'currentcolor' }}
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M6.75 13.5H1.5V2.5H14.5V6.75V7.5H16V6.75V2C16 1.44772 15.5523 1 15 1H1C0.447714 1 0 1.44772 0 2V14C0 14.5523 0.447716 15 1 15H6.75H7.5V13.5H6.75ZM10.5 10.5H14.5V13.5H10.5V10.5ZM9 9H10.5H14.5H16V10.5V13.5V15H14.5H10.5H9V13.5V10.5V9Z"
        fill="currentColor"
      ></path>
    </svg>
  )
}

export function usePictureInPicture() {
  const [pictureInPictureActive, setPip] = useState(false)
  const pictureInPictureAvailable =
    usePictureInPictureWindow() === null && supportsPictureInPicture

  async function activatePictureInPictureAction() {
    if (documentPictureInPicture.window !== null) {
      // Don't steal pip from product code.
      return
    }

    const reactContainer = document.querySelector('nextjs-portal')
    if (reactContainer === null) {
      throw new Error(
        'Could not find react container for PIP. This is a bug in Next.js.'
      )
    }

    const originalContainer = reactContainer.parentElement!
    const pipWindow = await documentPictureInPicture.requestWindow()

    pipWindow.addEventListener('pagehide', () => {
      originalContainer.append(reactContainer)
      flushSync(() => {
        setPip(false)
      })
    })
    // TODO: Close devtools on pip close.

    pipWindow.document.body.style.margin = '0'
    pipWindow.document.body.style.height = '100vh'
    pipWindow.document.body.append(reactContainer)
    flushSync(() => {
      setPip(true)
    })
  }

  return {
    activatePictureInPictureAction,
    pictureInPictureActive,
    pictureInPictureAvailable,
  }
}
