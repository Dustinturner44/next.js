import { usePanelRouterContext, type PanelStateKind } from './context'
import { ChevronRight, IssueCount } from './dev-overlay-menu'
import { CommandPalette } from './command-palette'
import { DynamicPanel } from '../panel/dynamic-panel'
import {
  learnMoreLink,
  RouteInfoBody,
} from '../components/errors/dev-tools-indicator/dev-tools-info/route-info'
import { PageSegmentTree } from '../components/overview/segment-explorer'
import { TurbopackInfoBody } from '../components/errors/dev-tools-indicator/dev-tools-info/turbopack-info'
import { DevToolsHeader } from '../components/errors/dev-tools-indicator/dev-tools-info/dev-tools-header'
import { useDelayedRender } from '../hooks/use-delayed-render'
import {
  getShadowRoot,
  MENU_CURVE,
  MENU_DURATION_MS,
} from '../components/errors/dev-tools-indicator/utils'
import { useDevOverlayContext } from '../../dev-overlay.browser'
import { createContext, useContext } from 'react'
import { useRenderErrorContext } from '../dev-overlay'
import {
  ACTION_DEV_INDICATOR_SET,
  ACTION_DEVTOOLS_POSITION,
  ACTION_DEVTOOLS_SCALE,
  ACTION_ERROR_OVERLAY_OPEN,
} from '../shared'
import GearIcon from '../icons/gear-icon'
import { UserPreferencesBody } from '../components/errors/dev-tools-indicator/dev-tools-info/user-preferences'
import { useHideShortcutStorage } from '../components/errors/dev-tools-indicator/dev-tools-info/preferences'
import { useShortcuts } from '../hooks/use-shortcuts'
import { useUpdateAllPanelPositions } from '../components/devtools-indicator/devtools-indicator'
import { useDev0Context } from '../context/dev-zero-context'
import { Dev0Panel } from '../components/dev-zero-panel/dev-zero-panel'
import { Dev0Header } from '../components/dev-zero-panel/dev-zero-header'
import { HubPanel } from '../components/hub-panel/hub-panel'
import { useSidebarContext } from '../context/sidebar-context'
import { css } from '../utils/css'

const MenuPanel = () => {
  const { togglePanel, closeAllPanels, setSelectedIndex } =
    usePanelRouterContext()
  const { state, dispatch } = useDevOverlayContext()
  const { totalErrorCount } = useRenderErrorContext()
  const { projects, createProject, isLoading } = useDev0Context()
  const { toggleSidebar, isOpen: sidebarIsOpen } = useSidebarContext()

  const visibleProjects = projects.filter(
    (p) => p.status === 'running' || p.status === 'creating'
  )

  const handleCreateProject = async () => {
    await createProject()
    // Don't auto-open panel, let the project appear in the menu
  }

  const baseItems = [
    totalErrorCount > 0 && {
      title: `${totalErrorCount} ${totalErrorCount === 1 ? 'issue' : 'issues'} found. Click to view details in the dev overlay.`,
      label: 'Issues',
      value: <IssueCount>{totalErrorCount}</IssueCount>,
      onClick: () => {
        closeAllPanels()
        setSelectedIndex(-1)
        if (totalErrorCount > 0) {
          dispatch({
            type: ACTION_ERROR_OVERLAY_OPEN,
          })
        }
      },
    },
    {
      title: `Current route is ${state.staticIndicator ? 'static' : 'dynamic'}.`,
      label: 'Route',
      value: state.staticIndicator ? 'Static' : 'Dynamic',
      onClick: () => togglePanel('route-type'),
      attributes: {
        'data-nextjs-route-type': state.staticIndicator ? 'static' : 'dynamic',
      },
    },
    !!process.env.TURBOPACK
      ? {
          title: 'Turbopack is enabled.',
          label: 'Turbopack',
          value: 'Enabled',
        }
      : {
          title:
            'Learn about Turbopack and how to enable it in your application.',
          label: 'Try Turbopack',
          value: <ChevronRight />,
          onClick: () => togglePanel('turbo-info'),
        },
    !!process.env.__NEXT_DEVTOOL_SEGMENT_EXPLORER && {
      label: 'Route Info',
      value: <ChevronRight />,
      onClick: () => togglePanel('segment-explorer'),
      attributes: {
        'data-segment-explorer': true,
      },
    },
  ].filter(Boolean)

  // Add dev-0 projects
  const projectItems = visibleProjects.map((project) => ({
    label: project.status === 'creating' ? 'Creating project...' : project.name,
    value:
      project.status === 'creating' ? (
        <span
          className="loading-spinner"
          style={{ width: '14px', height: '14px' }}
        />
      ) : (
        <ChevronRight />
      ),
    onClick:
      project.status === 'creating'
        ? undefined
        : () => togglePanel(`dev0-project-${project.name}` as PanelStateKind),
    disabled: project.status === 'creating',
    attributes: {
      'data-dev0-project': project.name,
      'data-dev0-status': project.status,
    },
  }))

  const footerItems = [
    {
      label: 'Hub',
      value: <ChevronRight />,
      onClick: () => togglePanel('hub'),
      footer: true,
      attributes: {
        'data-hub': true,
      },
    },
    {
      label: 'Create New Project',
      value: isLoading ? 'Creating...' : '+',
      onClick: handleCreateProject,
      disabled: isLoading,
      footer: true,
      attributes: {
        'data-create-project': true,
      },
    },
    {
      label: sidebarIsOpen ? 'Close Sidebar' : 'Open Sidebar',
      value: sidebarIsOpen ? '⏩' : '⏪',
      onClick: () => {
        toggleSidebar()
      },
      footer: true,
      attributes: {
        'data-sidebar-toggle': true,
      },
    },
    {
      label: 'Preferences',
      value: <GearIcon />,
      onClick: () => togglePanel('preferences'),
      footer: true,
      attributes: {
        'data-preferences': true,
      },
    },
  ]

  return (
    <>
      <CommandPalette 
        items={[...baseItems, ...projectItems, ...footerItems]} 
        closeOnClickOutside={false}
      />
      <style>{css`
        .loading-spinner {
          display: inline-block;
          border: 2px solid var(--color-gray-alpha-400);
          border-top-color: var(--color-gray-900);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  )
}

// a little hacky but it does the trick
const useToggleDevtoolsVisibility = () => {
  const { state, dispatch } = useDevOverlayContext()
  return () => {
    dispatch({
      type: ACTION_DEV_INDICATOR_SET,
      disabled: !state.disableDevIndicator,
    })
    const portal = getShadowRoot()
    if (portal) {
      const menuElement = portal.getElementById('panel-route') as HTMLElement
      const indicatorElement = portal.getElementById(
        'data-devtools-indicator'
      ) as HTMLElement

      if (menuElement && menuElement.firstElementChild) {
        const firstChild = menuElement.firstElementChild as HTMLElement
        const isCurrentlyHidden = firstChild.style.display === 'none'
        firstChild.style.display = isCurrentlyHidden ? '' : 'none'
      }

      if (indicatorElement) {
        const isCurrentlyHidden = indicatorElement.style.display === 'none'
        indicatorElement.style.display = isCurrentlyHidden ? '' : 'none'
      }
    }
  }
}

export const PanelRouter = () => {
  const { state } = useDevOverlayContext()
  const { triggerRef, togglePanel } = usePanelRouterContext()
  const toggleDevtools = useToggleDevtoolsVisibility()

  const [hideShortcut] = useHideShortcutStorage()

  // Toggle panel selector with Command+K
  const togglePanelSelector = () => {
    togglePanel('panel-selector')
  }

  useShortcuts(
    {
      ...(hideShortcut ? { [hideShortcut]: toggleDevtools } : {}),
      'Meta+k': togglePanelSelector,
      'Control+k': togglePanelSelector,
    },
    triggerRef
  )
  return (
    <>
      <PanelRoute name="panel-selector">
        <MenuPanel />
      </PanelRoute>

      <PanelRoute name="preferences">
        <DynamicPanel
          sharePanelSizeGlobally={false}
          sizeConfig={{
            kind: 'fixed',
            height: 500 / state.scale,
            width: 480 + 32,
          }}
          closeOnClickOutside
          header={<DevToolsHeader title="Preferences" />}
        >
          <UserPreferencesWrapper />
        </DynamicPanel>
      </PanelRoute>

      <PanelRoute name="route-type">
        <DynamicPanel
          key={state.staticIndicator ? 'static' : 'dynamic'}
          sharePanelSizeGlobally={false}
          sizeConfig={{
            kind: 'fixed',
            height: state.staticIndicator
              ? 300 / state.scale
              : 325 / state.scale,
            width: 400 / state.scale,
          }}
          closeOnClickOutside
          header={
            <DevToolsHeader
              title={`${state.staticIndicator ? 'Static' : 'Dynamic'} Route`}
            />
          }
        >
          <div
            style={{
              padding: '16px',
              paddingTop: '8px',
            }}
          >
            <RouteInfoBody
              routerType={state.routerType}
              isStaticRoute={state.staticIndicator}
            />
            <InfoFooter
              href={
                learnMoreLink[state.routerType][
                  state.staticIndicator ? 'static' : 'dynamic'
                ]
              }
            />
          </div>
        </DynamicPanel>
      </PanelRoute>

      {process.env.__NEXT_DEVTOOL_SEGMENT_EXPLORER && (
        <PanelRoute name="segment-explorer">
          <DynamicPanel
            sharePanelSizeGlobally={false}
            sharePanelPositionGlobally={false}
            draggable
            sizeConfig={{
              kind: 'resizable',
              maxHeight: '90vh',
              maxWidth: '90vw',
              minHeight: 200 / state.scale,
              minWidth: 250 / state.scale,
              initialSize: {
                height: 375 / state.scale,
                width: 400 / state.scale,
              },
            }}
            header={<DevToolsHeader title="Route Info" />}
          >
            <PageSegmentTree
              isAppRouter={state.routerType === 'app'}
              page={state.page}
            />
          </DynamicPanel>
        </PanelRoute>
      )}

      <PanelRoute name="turbo-info">
        <DynamicPanel
          sharePanelSizeGlobally={false}
          // this size config is really silly, should calculate initial size dynamically
          sizeConfig={{
            kind: 'fixed',
            height: 470 / state.scale,
            width: 400 / state.scale,
          }}
          closeOnClickOutside
          header={<DevToolsHeader title="Try Turbopack" />}
        >
          <div
            style={{
              padding: '16px',
              paddingTop: '8px',
            }}
          >
            <TurbopackInfoBody />
            <InfoFooter href="https://nextjs.org/docs/app/api-reference/turbopack" />
          </div>
        </DynamicPanel>
      </PanelRoute>

      <Dev0ProjectRoutes />

      <PanelRoute name="hub">
        <DynamicPanel
          sharePanelSizeGlobally={false}
          sizeConfig={{
            kind: 'resizable',
            maxHeight: '90vh',
            maxWidth: '90vw',
            minHeight: 400 / state.scale,
            minWidth: 600 / state.scale,
            initialSize: {
              height: 600 / state.scale,
              width: 800 / state.scale,
            },
          }}
          header={<DevToolsHeader title="Dev Tools Hub" />}
        >
          <HubPanel />
        </DynamicPanel>
      </PanelRoute>
    </>
  )
}

const Dev0ProjectRoutes = () => {
  const { projects } = useDev0Context()
  const { state } = useDevOverlayContext()

  const runningProjects = projects.filter((p) => p.status === 'running')

  return (
    <>
      {runningProjects.map((project) => (
        <PanelRoute key={project.name} name={`dev0-project-${project.name}`}>
          <DynamicPanel
            sharePanelSizeGlobally={false}
            sharePanelPositionGlobally={false}
            draggable
            sizeConfig={{
              kind: 'resizable',
              maxHeight: '90vh',
              maxWidth: '90vw',
              minHeight: 400 / state.scale,
              minWidth: 600 / state.scale,
              initialSize: {
                height: 600 / state.scale,
                width: 800 / state.scale,
              },
            }}
            header={
              <Dev0Header
                projectName={project.name}
                projectPath={project.cwd}
                deploymentUrl={project.deploymentUrl}
              />
            }
          >
            <Dev0Panel projectName={project.name} port={project.port!} />
          </DynamicPanel>
        </PanelRoute>
      ))}
    </>
  )
}

const InfoFooter = ({ href }: { href: string }) => {
  return (
    <div className="dev-tools-info-button-container">
      <a
        className="dev-tools-info-learn-more-button"
        href={href}
        target="_blank"
        rel="noreferrer noopener"
      >
        Learn More
      </a>
    </div>
  )
}

const UserPreferencesWrapper = () => {
  const { dispatch, state } = useDevOverlayContext()
  const { closeAllPanels, setSelectedIndex } = usePanelRouterContext()
  const updateAllPanelPositions = useUpdateAllPanelPositions()

  const [hideShortcut, setHideShortcut] = useHideShortcutStorage()

  return (
    <div
      style={{
        padding: '20px',
        paddingTop: '8px',
      }}
    >
      <UserPreferencesBody
        position={state.devToolsPosition}
        scale={state.scale}
        setScale={(scale) => {
          dispatch({
            type: ACTION_DEVTOOLS_SCALE,
            scale,
          })
        }}
        setPosition={(devToolsPosition) => {
          dispatch({
            type: ACTION_DEVTOOLS_POSITION,
            devToolsPosition,
          })
          updateAllPanelPositions(devToolsPosition)
        }}
        hideShortcut={hideShortcut}
        setHideShortcut={setHideShortcut}
        hide={() => {
          dispatch({
            type: ACTION_DEV_INDICATOR_SET,
            disabled: true,
          })
          setSelectedIndex(-1)
          closeAllPanels()
          fetch('/__nextjs_disable_dev_indicator', {
            method: 'POST',
          })
        }}
      />
    </div>
  )
}

export const usePanelContext = () => useContext(PanelContext)
export const PanelContext = createContext<{
  name: PanelStateKind
  mounted: boolean
}>(null!)
// this router can be enhanced by Activity and ViewTransition trivially when we want to use them
function PanelRoute({
  children,
  name,
}: {
  children: React.ReactNode
  name: PanelStateKind | `dev0-project-${string}`
}) {
  const { panels } = usePanelRouterContext()
  const isActive = panels.has(name as PanelStateKind)
  const { mounted, rendered } = useDelayedRender(isActive, {
    enterDelay: 0,
    exitDelay: MENU_DURATION_MS,
  })

  if (!mounted) return null

  return (
    <PanelContext
      value={{
        name,
        mounted,
      }}
    >
      <div
        id="panel-route"
        style={{
          opacity: rendered ? 1 : 0,
          transition: `opacity ${MENU_DURATION_MS}ms ${MENU_CURVE}`,
        }}
      >
        {children}
      </div>
    </PanelContext>
  )
}
