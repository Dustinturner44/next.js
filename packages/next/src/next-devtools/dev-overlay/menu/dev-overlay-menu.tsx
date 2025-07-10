import { useDevOverlayContext } from '../../dev-overlay.browser'
import {
  MENU_DURATION_MS,
  useClickOutside,
} from '../components/errors/dev-tools-indicator/utils'
import { useRenderErrorContext } from '../dev-overlay'
import { useDelayedRender } from '../hooks/use-delayed-render'
import GearIcon from '../icons/gear-icon'
import { ACTION_ERROR_OVERLAY_OPEN } from '../shared'
import { MenuContext, usePanelContext } from './context'
import { useRef, useState, type CSSProperties } from 'react'
import { MenuItem } from './menu-item'
import { getIndicatorOffset } from '../utils/indicator-metrics'
import { INDICATOR_PADDING } from '../components/devtools-indicator/devtools-indicator'
import { css } from '../utils/css'

/**
 *
 * SYNC WITH REAL MENU THIS IS MISSING A LOT
 */
export const DevtoolMenu = ({
  closeOnClickOutside = true,
  onClose,
}: {
  closeOnClickOutside?: boolean
  onClose?: () => void
}) => {
  const isTurbopack = !!process.env.TURBOPACK
  const { dispatch, state } = useDevOverlayContext()
  const { totalErrorCount } = useRenderErrorContext()
  const { panel, setPanel, triggerRef } = usePanelContext()
  // const { mounted: menuMounted, rendered: menuRendered } = useDelayedRender(
  //   panel === 'panel-selector',
  //   {
  //     // Intentionally no fade in, makes the UI feel more immediate
  //     enterDelay: 0,
  //     // Graceful fade out to confirm that the UI did not break
  //     exitDelay: MENU_DURATION_MS,
  //   }
  // )
  const [vertical, horizontal] = state.devToolsPosition.split('-', 2)

  const menuRef = useRef<HTMLDivElement>(null)

  useClickOutside(menuRef, triggerRef, closeOnClickOutside, () => {
    onClose?.()
  })

  const [selectedIndex, setSelectedIndex] = useState(-1)

  function closeMenu() {
    setPanel((prev) => (prev === 'panel-selector' ? null : prev))
    setTimeout(() => setSelectedIndex(-1), MENU_DURATION_MS)
  }
  const indicatorOffset = getIndicatorOffset(state)

  const [indicatorVertical, indicatorHorizontal] = state.devToolsPosition.split(
    '-',
    2
  )

  const verticalOffset =
    vertical === indicatorVertical && horizontal === indicatorHorizontal
      ? indicatorOffset
      : INDICATOR_PADDING

  const positionStyle = {
    [vertical]: `${verticalOffset}px`,
    [horizontal]: `${INDICATOR_PADDING}px`,
    [vertical === 'top' ? 'bottom' : 'top']: 'auto',
    [horizontal === 'left' ? 'right' : 'left']: 'auto',
  } as CSSProperties

  return (
    <div
      ref={menuRef}
      // what reef is this again
      // ref={menuRef}
      id="nextjs-dev-tools-menu"
      role="menu"
      dir="ltr"
      aria-orientation="vertical"
      aria-label="Next.js Dev Tools Items"
      tabIndex={-1}
      style={{
        WebkitFontSmoothing: 'antialiased',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        background: 'var(--color-background-100)',
        backgroundClip: 'padding-box',
        boxShadow: 'var(--shadow-menu)',
        borderRadius: 'var(--rounded-xl)',
        position: 'fixed',
        fontFamily: 'var(--font-stack-sans)',
        zIndex: 3,
        overflow: 'hidden',
        opacity: 1,
        // outline: 0,
        minWidth: '248px',
        transition:
          'opacity var(--animate-out-duration-ms) var(--animate-out-timing-function)',
        // scale: 1,
        border: '1px solid var(--color-gray-200)',
        ...positionStyle,
      }}
      // todo reimpl this
      // onKeyDown={onMenuKeydown}
      // data-rendered
      // style={{
      //   // this is probably totally broken, hold up
      //   bottom: 'calc(100% + 8px)',
      //   left: '8px', // maybe fixed now?

      // }}
      // style={{
      //   border: '2px solid var(--color-gray-200)',
      //   // fix calcs they are wrong
      //   // position: 'absolute',
      //   ...positionStyle,
      //   // ...(vertical === 'bottom'
      //   //   ? { bottom: 'calc(100% + 65px)' }
      //   //   : { top: 'calc(100% + 20px)' }),
      //   // ...(horizontal === 'left'
      //   //   ? { left: '20px' }
      //   //   : { right: '8px', left: 'auto' }),
      // }}
    >
      {/* this provider should be higher in tree? eh maybe not */}
      <MenuContext
        value={{
          closeMenu,
          selectedIndex,
          setSelectedIndex,
        }}
      >
        <div style={{ padding: '6px', width: '100%' }}>
          {/* how is this not distributed */}
          {totalErrorCount > 0 && (
            <MenuItem
              title={`${totalErrorCount} ${totalErrorCount === 1 ? 'issue' : 'issues'} found. Click to view details in the dev overlay.`}
              index={0}
              label="Issues"
              value={<IssueCount>{totalErrorCount}</IssueCount>}
              onClick={function openErrorOverlay() {
                // setOpen(null)
                setPanel(null)
                if (totalErrorCount > 0) {
                  dispatch({
                    type: ACTION_ERROR_OVERLAY_OPEN,
                  })
                }
              }}
            />
          )}
          <MenuItem
            title={`Current route is ${state.staticIndicator ? 'static' : 'dynamic'}.`}
            label="Route"
            index={1}
            value={state.staticIndicator ? 'Static' : 'Dynamic'}
            onClick={
              () => setPanel('route-info')

              // setOpen(OVERLAYS.Route)
            }
            data-nextjs-route-type={
              state.staticIndicator ? 'static' : 'dynamic'
            }
          />
          {!!process.env.TURBOPACK ? (
            <MenuItem
              title="Turbopack is enabled."
              label="Turbopack"
              value="Enabled"
            />
          ) : (
            <MenuItem
              index={2}
              title="Learn about Turbopack and how to enable it in your application."
              label="Try Turbopack"
              value={<ChevronRight />}
              onClick={
                () => setPanel('turbo-info')
                // setOpen(OVERLAYS.Turbo)
                // null
                // todo dunno yet
              }
            />
          )}
          {/* todo: fix index */}
             <MenuItem
            data-segment-explorer
            label="Route Info"
            value={<ChevronRight />}
            onClick={
              () => setPanel('segment-explorer')
              // setOpen(OVERLAYS.SegmentExplorer)
            }
            index={isTurbopack ? 3 : 4}
          />
        </div>

        <div className="dev-tools-indicator-footer">
          <MenuItem
            data-preferences
            label="Preferences"
            value={<GearIcon />}
            onClick={
              () => setPanel('preferences')
              // setOpen(OVERLAYS.Preferences)
            }
            index={isTurbopack ? 2 : 3}
          />
       
          {/* {process.env.__NEXT_DEVTOOL_SEGMENT_EXPLORER ? (
           
          ) : null} */}
        </div>
      </MenuContext>
    </div>
  )
}

function IssueCount({ children }: { children: number }) {
  return (
    <span
      className="dev-tools-indicator-issue-count"
      data-has-issues={children > 0}
    >
      <span className="dev-tools-indicator-issue-count-indicator" />
      {children}
    </span>
  )
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        fill="#666"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.50011 1.93945L6.03044 2.46978L10.8537 7.293C11.2442 7.68353 11.2442 8.31669 10.8537 8.70722L6.03044 13.5304L5.50011 14.0608L4.43945 13.0001L4.96978 12.4698L9.43945 8.00011L4.96978 3.53044L4.43945 3.00011L5.50011 1.93945Z"
      />
    </svg>
  )
}

// .dev-tools-indicator-menu {
//   -webkit-font-smoothing: antialiased;
//   display: flex;
//   flex-direction: column;
//   align-items: flex-start;
//   background: var(--color-background-100);
//   /* border: 1px solid var(--color-gray-alpha-400); */
//   background-clip: padding-box;
//   box-shadow: var(--shadow-menu);
//   border-radius: var(--rounded-xl);
//   /*  todo: may need to port this for the other indicator menu :( */
//   position: fixed;
//   font-family: var(--font-stack-sans);
//   z-index: 3;
//   overflow: hidden;
//   opacity: 0;
//   outline: 0;
//   min-width: 248px;
//   transition: opacity var(--animate-out-duration-ms)
//     var(--animate-out-timing-function);

//   &[data-rendered='true'] {
//     opacity: 1;
//     scale: 1;
//   }
// }

// .dev-tools-indicator-inner {
//   padding: 6px;
//   width: 100%;
// }
// export const DEV_TOOLS_INDICATOR_STYLES_NEW = css`

//   .dev-tools-indicator-item {
//     display: flex;
//     align-items: center;
//     padding: 8px 6px;
//     height: var(--size-36);
//     border-radius: 6px;
//     text-decoration: none !important;
//     user-select: none;
//     white-space: nowrap;

//     svg {
//       width: var(--size-16);
//       height: var(--size-16);
//     }

//     &:focus-visible {
//       outline: 0;
//     }
//   }

//   .dev-tools-indicator-footer {
//     background: var(--color-background-200);
//     padding: 6px;
//     border-top: 1px solid var(--color-gray-400);
//     width: 100%;
//   }

//   .dev-tools-indicator-item[data-selected='true'] {
//     cursor: pointer;
//     background-color: var(--color-gray-200);
//   }

//   .dev-tools-indicator-label {
//     font-size: var(--size-14);
//     line-height: var(--size-20);
//     color: var(--color-gray-1000);
//   }

//   .dev-tools-indicator-value {
//     font-size: var(--size-14);
//     line-height: var(--size-20);
//     color: var(--color-gray-900);
//     margin-left: auto;
//   }

//   .dev-tools-indicator-issue-count {
//     --color-primary: var(--color-gray-800);
//     --color-secondary: var(--color-gray-100);
//     display: flex;
//     flex-direction: row;
//     align-items: center;
//     justify-content: center;
//     gap: 8px;
//     min-width: var(--size-40);
//     height: var(--size-24);
//     background: var(--color-background-100);
//     border: 1px solid var(--color-gray-alpha-400);
//     background-clip: padding-box;
//     box-shadow: var(--shadow-small);
//     padding: 2px;
//     color: var(--color-gray-1000);
//     border-radius: 128px;
//     font-weight: 500;
//     font-size: var(--size-13);
//     font-variant-numeric: tabular-nums;

//     &[data-has-issues='true'] {
//       --color-primary: var(--color-red-800);
//       --color-secondary: var(--color-red-100);
//     }

//     .dev-tools-indicator-issue-count-indicator {
//       width: var(--size-8);
//       height: var(--size-8);
//       background: var(--color-primary);
//       box-shadow: 0 0 0 2px var(--color-secondary);
//       border-radius: 50%;
//     }
//   }

//   .dev-tools-indicator-shortcut {
//     display: flex;
//     gap: 4px;

//     kbd {
//       width: var(--size-20);
//       height: var(--size-20);
//       display: flex;
//       justify-content: center;
//       align-items: center;
//       border-radius: var(--rounded-md);
//       border: 1px solid var(--color-gray-400);
//       font-family: var(--font-stack-sans);
//       background: var(--color-background-100);
//       color: var(--color-gray-1000);
//       text-align: center;
//       font-size: var(--size-12);
//       line-height: var(--size-16);
//     }
//   }

//   .dev-tools-grabbing {
//     cursor: grabbing;

//     > * {
//       pointer-events: none;
//     }
//   }
// `
