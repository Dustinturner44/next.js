import type { OverlayDispatch, OverlayState, Corners } from '../../shared'

import { startTransition, useState } from 'react'

import { DevToolsPanelFooter } from './devtools-panel-footer'
import { DevToolsPanelTab } from './devtools-panel-tab/devtools-panel-tab'
import { Dialog, DialogContent, DialogHeader, DialogBody } from '../dialog'
import { Overlay } from '../overlay/overlay'
import {
  ACTION_DEVTOOLS_PANEL_CLOSE,
  ACTION_DEVTOOLS_POSITION,
  ACTION_DEVTOOLS_SCALE,
  STORAGE_KEY_SCALE,
  STORAGE_KEY_POSITION,
} from '../../shared'
import { css } from '../../utils/css'
import { OverlayBackdrop } from '../overlay'
import { Draggable } from '../errors/dev-tools-indicator/draggable'
import { INDICATOR_PADDING } from '../devtools-indicator/devtools-indicator'
import { FullScreenIcon } from '../../icons/fullscreen'
import { Cross } from '../../icons/cross'
import {
  PictureInPictureIcon,
  usePictureInPicture,
} from './devtools-picture-in-picture'

export type DevToolsPanelTabType = 'issues' | 'route' | 'settings'

export function DevToolsPanel({
  state,
  dispatch,
  issueCount,
}: {
  state: OverlayState
  dispatch: OverlayDispatch
  issueCount: number
}) {
  const [activeTab, setActiveTab] = useState<'issues' | 'route' | 'settings'>(
    'settings'
  )
  const [vertical, horizontal] = state.devToolsPosition.split('-', 2)

  const onCloseDevToolsPanel = () => {
    dispatch({ type: ACTION_DEVTOOLS_PANEL_CLOSE })
  }

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: ACTION_DEVTOOLS_POSITION,
      devToolsPosition: e.target.value as Corners,
    })
    localStorage.setItem(STORAGE_KEY_POSITION, e.target.value)
  }

  const handleScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: ACTION_DEVTOOLS_SCALE,
      scale: Number(e.target.value),
    })
    localStorage.setItem(STORAGE_KEY_SCALE, e.target.value)
  }

  const {
    activatePictureInPictureAction,
    pictureInPictureActive,
    pictureInPictureAvailable,
  } = usePictureInPicture()
  function handlePipClick() {
    startTransition(async () => {
      await activatePictureInPictureAction()
    })
  }

  return (
    <Overlay
      data-nextjs-devtools-panel-overlay
      style={
        pictureInPictureActive
          ? {}
          : {
              [vertical]: `${INDICATOR_PADDING}px`,
              [horizontal]: `${INDICATOR_PADDING}px`,
              [vertical === 'top' ? 'bottom' : 'top']: 'auto',
              [horizontal === 'left' ? 'right' : 'left']: 'auto',
            }
      }
    >
      {/* TODO: Investigate why onCloseDevToolsPanel on Dialog doesn't close when clicked outside. */}
      <OverlayBackdrop
        data-nextjs-devtools-panel-overlay-backdrop
        onClick={onCloseDevToolsPanel}
      />
      <Draggable
        disabled={pictureInPictureActive}
        data-nextjs-devtools-panel-draggable
        padding={INDICATOR_PADDING}
        onDragStart={() => {}}
        position={state.devToolsPosition}
        setPosition={(p) => {
          localStorage.setItem(STORAGE_KEY_POSITION, p)
          dispatch({
            type: ACTION_DEVTOOLS_POSITION,
            devToolsPosition: p,
          })
        }}
      >
        <>
          <Dialog
            data-nextjs-devtools-panel-dialog
            aria-labelledby="nextjs__container_dev_tools_panel_label"
            aria-describedby="nextjs__container_dev_tools_panel_desc"
            onClose={onCloseDevToolsPanel}
          >
            <DialogContent>
              <DialogHeader data-nextjs-devtools-panel-dialog-header>
                <div data-nextjs-devtools-panel-header>
                  <div data-nextjs-devtools-panel-header-tab-group>
                    <button
                      data-nextjs-devtools-panel-header-tab={
                        activeTab === 'issues'
                      }
                      onClick={() => setActiveTab('issues')}
                    >
                      Issues
                      <span data-nextjs-devtools-panel-header-tab-issues-badge>
                        {issueCount}
                      </span>
                    </button>
                    <button
                      data-nextjs-devtools-panel-header-tab={
                        activeTab === 'route'
                      }
                      onClick={() => setActiveTab('route')}
                    >
                      Route Info
                    </button>
                    <button
                      data-nextjs-devtools-panel-header-tab={
                        activeTab === 'settings'
                      }
                      onClick={() => setActiveTab('settings')}
                    >
                      Settings
                    </button>
                  </div>
                  <div data-nextjs-devtools-panel-header-action-button-group>
                    {!pictureInPictureActive && pictureInPictureAvailable && (
                      <button
                        data-nextjs-devtools-panel-header-action-button
                        title="Activate picture-in-picture mode"
                        onClick={handlePipClick}
                      >
                        <PictureInPictureIcon />
                      </button>
                    )}
                    {/* TODO: Currently no-op, will add fullscreen toggle. */}
                    {!pictureInPictureActive && (
                      <button data-nextjs-devtools-panel-header-action-button>
                        <FullScreenIcon width={16} height={16} />
                      </button>
                    )}
                    {!pictureInPictureActive && (
                      <button
                        data-nextjs-devtools-panel-header-action-button
                        onClick={onCloseDevToolsPanel}
                      >
                        <Cross width={16} height={16} />
                      </button>
                    )}
                  </div>
                </div>
              </DialogHeader>
              <DialogBody>
                <DevToolsPanelTab
                  activeTab={activeTab}
                  devToolsPosition={state.devToolsPosition}
                  scale={state.scale}
                  handlePositionChange={handlePositionChange}
                  handleScaleChange={handleScaleChange}
                />
              </DialogBody>
            </DialogContent>
            <DevToolsPanelFooter versionInfo={state.versionInfo} />
          </Dialog>
        </>
      </Draggable>
    </Overlay>
  )
}

export const DEVTOOLS_PANEL_STYLES = css`
  [data-nextjs-devtools-panel-overlay] {
    padding: initial;
    margin: auto;
    /* TODO: This is for fullscreen mode. */
    /* top: 10vh; */

    @media (max-width: 575px) {
      left: 20px !important;
      right: 20px !important;
    }

    @media (min-width: 576px) {
      max-width: 540px;
    }

    @media (min-width: 768px) {
      max-width: 720px;
    }

    @media (min-width: 992px) {
      max-width: 960px;
    }

    @media (display-mode: picture-in-picture) {
      min-width: 100vw;
      min-height: 100vh;
      max-width: none;
      max-height: none;
      padding: 0;
      margin: 0;
      height: 100%;
      top: 0;
    }
  }

  [data-nextjs-devtools-panel-overlay-backdrop] {
    /* TODO: Blur on fullscreen mode. */
    opacity: 0;
  }

  [data-nextjs-devtools-panel-draggable] {
    /* For responsiveness */
    width: 100%;

    @media (display-mode: picture-in-picture) {
      height: 100%;
    }
  }

  [data-nextjs-devtools-panel-dialog] {
    -webkit-font-smoothing: antialiased;
    display: flex;
    flex-direction: column;
    background: var(--color-background-100);
    background-clip: padding-box;
    border: 1px solid var(--color-gray-400);
    border-radius: var(--rounded-xl);
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow-y: auto;
    width: 100%;
    max-height: 50vh;
    min-height: 450px;

    @media (display-mode: picture-in-picture) {
      max-width: none;
      max-height: none;
      height: 100%;
      border: 0;
      border-radius: 0;
    }
  }

  [data-nextjs-devtools-panel-header] {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-gray-400);
  }

  [data-nextjs-devtools-panel-header-tab-group] {
    display: flex;
    align-items: center;
    padding: 8px;
    gap: 6px;
  }

  [data-nextjs-devtools-panel-header-tab] {
    display: flex;
    align-items: center;
    color: var(--color-gray-900);
    border-radius: var(--rounded-md-2);
    padding: 4px 12px;
    font-size: 14px;
    font-weight: 500;

    transition: all 0.2s ease;

    &:hover {
      background-color: var(--color-gray-200);
    }

    &:active {
      background-color: var(--color-gray-300);
    }
  }

  [data-nextjs-devtools-panel-header-tab='true'] {
    color: var(--color-gray-1000);
    background-color: var(--color-gray-100);
  }

  [data-nextjs-devtools-panel-header-tab-issues-badge] {
    display: inline-block;
    margin-left: 8px;
    background-color: var(--color-red-400);
    color: var(--color-red-900);
    font-size: 11px;
    border-radius: var(--rounded-full);
    padding: 2px 6px;
    width: 20px;
    height: 20px;
    font-weight: 500;
  }

  [data-nextjs-devtools-panel-header-action-button-group] {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-right: 8px;
  }

  [data-nextjs-devtools-panel-header-action-button] {
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    color: var(--color-gray-600);
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--color-gray-200);
      color: var(--color-gray-900);
    }

    &:active {
      background-color: var(--color-gray-300);
    }
  }
`
