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
import { Dev0Header } from '../components/dev-zero-panel/dev-zero-header'
import { Dev0Panel } from '../components/dev-zero-panel/dev-zero-panel'
import { HubPanel } from '../components/hub-panel/hub-panel'
import { ForkUrlPanel } from '../components/fork-url/fork-url-panel'
import { useSidebarContext } from '../context/sidebar-context'
import { css } from '../utils/css'
import React, { useRef } from 'react'
import { useClickOutsideAndEscape } from '../components/errors/dev-tools-indicator/utils'

const MenuPanel = () => {
  const {
    togglePanel,
    openPanel,
    closePanel,
    closeAllPanels,
    setSelectedIndex,
    panels,
    activePanel,
  } = usePanelRouterContext()
  const { state, dispatch } = useDevOverlayContext()
  const { totalErrorCount } = useRenderErrorContext()
  const { projects, createProject, isLoading, killProject } = useDev0Context()
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
      deletable: false,
    },
    {
      title: `Current route is ${state.staticIndicator ? 'static' : 'dynamic'}.`,
      label: 'Route',
      value:
        activePanel === 'route-type' ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {state.staticIndicator ? 'Static' : 'Dynamic'}
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-green-700)',
                boxShadow: '0 0 0 1px var(--color-green-200)',
              }}
            />
          </span>
        ) : (
          state.staticIndicator ? 'Static' : 'Dynamic'
        ),
      onClick: () => togglePanel('route-type'),
      attributes: {
        'data-nextjs-route-type': state.staticIndicator ? 'static' : 'dynamic',
        'data-panel-active': panels.has('route-type') ? 'true' : 'false',
      },
      deletable: false,
    },
    !!process.env.TURBOPACK
      ? {
          title: 'Turbopack is enabled.',
          label: 'Turbopack',
          value: 'Enabled',
          deletable: false,
        }
      : {
          title:
            'Learn about Turbopack and how to enable it in your application.',
          label: 'Try Turbopack',
          value:
            activePanel === 'turbo-info' ? (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ChevronRight />
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-green-700)',
                    boxShadow: '0 0 0 1px var(--color-green-200)',
                  }}
                />
              </span>
            ) : (
              <ChevronRight />
            ),
          onClick: () => togglePanel('turbo-info'),
          attributes: {
            'data-panel-active':
              activePanel === 'turbo-info' ? 'true' : 'false',
          },
          deletable: false,
        },
    !!process.env.__NEXT_DEVTOOL_SEGMENT_EXPLORER && {
      label: 'Route Info',
      value:
        activePanel === 'segment-explorer' ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ChevronRight />
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-green-700)',
                boxShadow: '0 0 0 1px var(--color-green-200)',
              }}
            />
          </span>
        ) : (
          <ChevronRight />
        ),
      onClick: () => togglePanel('segment-explorer'),
      attributes: {
        'data-segment-explorer': true,
        'data-panel-active':
          activePanel === 'segment-explorer' ? 'true' : 'false',
      },
      deletable: false,
    },
  ].filter(Boolean)

  // Add dev-0 projects (reverse to show newest first) - styled differently
  const projectItems = visibleProjects.reverse().map((project) => {
    const panelName = `dev0-project-${project.name}` as PanelStateKind
    const isActive = activePanel === panelName

    return {
      label:
        project.status === 'creating' ? 'Creating project...' : project.name,
      value:
        project.status === 'creating' ? (
          <span
            className="loading-spinner"
            style={{ width: '14px', height: '14px' }}
          />
        ) : isActive ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              fontSize: '10px',
              fontWeight: 'bold',
              color: 'var(--color-purple-700)',
              backgroundColor: 'var(--color-purple-alpha-200)',
              padding: '2px 6px',
              borderRadius: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              DEV
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-green-700)',
                boxShadow: '0 0 0 1px var(--color-green-200)',
              }}
            />
          </span>
        ) : (
          <span style={{ 
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'var(--color-purple-700)',
            backgroundColor: 'var(--color-purple-alpha-200)',
            padding: '2px 6px',
            borderRadius: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            DEV
          </span>
        ),
      onClick:
        project.status === 'creating'
          ? undefined
          : () => togglePanel(panelName),
      disabled: project.status === 'creating',
      attributes: {
        'data-dev0-project': project.name,
        'data-dev0-status': project.status,
        'data-panel-active': isActive ? 'true' : 'false',
        'data-item-type': 'project',
      },
    }
  })

  const additionalItems = [
    {
      label: 'Hub',
      value: <ChevronRight />,
      onClick: () => {
        closePanel('panel-selector')
        openPanel('hub')
      },
      attributes: {
        'data-hub': true,
      },
      deletable: false,
    },
    {
      label: 'Create New Project',
      value: isLoading ? 'Creating...' : '+',
      onClick: handleCreateProject,
      disabled: isLoading,
      attributes: {
        'data-create-project': true,
      },
      deletable: false,
    },
    {
      label: 'Fork URL',
      value:
        activePanel === 'fork-url' ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ChevronRight />
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-green-700)',
                boxShadow: '0 0 0 1px var(--color-green-200)',
              }}
            />
          </span>
        ) : (
          <ChevronRight />
        ),
      onClick: () => togglePanel('fork-url'),
      attributes: {
        'data-fork-url': true,
        'data-panel-active': activePanel === 'fork-url' ? 'true' : 'false',
      },
      deletable: false,
    },
    {
      label: sidebarIsOpen ? 'Close Sidebar' : 'Open Sidebar',
      value: sidebarIsOpen ? <ChevronRight /> : <ChevronRight />,
      onClick: () => {
        toggleSidebar()
      },
      attributes: {
        'data-sidebar-toggle': true,
      },
      deletable: false,
    },
    {
      label: 'Preferences',
      value: <GearIcon />,
      onClick: () => togglePanel('preferences'),
      attributes: {
        'data-preferences': true,
      },
      deletable: false,
    },
  ]

  const handleDeleteItem = (label: string) => {
    // Check if it's a dev-0 project
    const project = visibleProjects.find(
      (p) => p.name === label || label === 'Creating project...'
    )
    if (project && project.status !== 'creating') {
      killProject(project.name)
    }
  }

  return (
    <>
      <CommandPalette
        items={[...projectItems, ...baseItems, ...additionalItems]}
        closeOnClickOutside={false}
        onDeleteItem={handleDeleteItem}
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

        /* Style active menu items */
        .dev-tools-indicator-item[data-panel-active='true'] {
          background-color: var(--color-gray-alpha-100);
          position: relative;
        }

        .dev-tools-indicator-item[data-panel-active='true']::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background-color: var(--color-green-700);
          border-radius: 0 2px 2px 0;
        }

        .dev-tools-indicator-item[data-panel-active='true']:hover {
          background-color: var(--color-gray-alpha-200);
        }

        /* Style project items differently */
        .dev-tools-indicator-item[data-item-type='project'] {
          border-left: 3px solid var(--color-purple-700);
          background-color: var(--color-purple-alpha-050);
          position: relative;
        }

        .dev-tools-indicator-item[data-item-type='project']:hover {
          background-color: var(--color-purple-alpha-100);
        }

        .dev-tools-indicator-item[data-item-type='project'][data-panel-active='true'] {
          background-color: var(--color-purple-alpha-100);
          border-left: 3px solid var(--color-purple-800);
        }

        .dev-tools-indicator-item[data-item-type='project'][data-panel-active='true']:hover {
          background-color: var(--color-purple-alpha-200);
        }
      `}</style>
    </>
  )
}

const HubModal = () => {
  const { closePanel } = usePanelRouterContext()
  const { state } = useDevOverlayContext()
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isClosing, setIsClosing] = React.useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      closePanel('hub')
    }, 200)
  }

  useClickOutsideAndEscape(modalRef, triggerRef, true, (reason) => {
    if (reason === 'escape' || reason === 'outside') {
      handleClose()
    }
  })

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 2147483647, // Maximum z-index to render above all panels
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          opacity: isClosing ? 0 : 1,
          transition: 'opacity 200ms ease-out',
        }}
        onClick={handleClose}
      >
        <div
          ref={modalRef}
          style={{
            width: '90%',
            maxWidth: '1200px',
            height: '90%',
            maxHeight: '800px',
            backgroundColor: 'var(--color-background-100)',
            borderRadius: 'var(--rounded-xl)',
            border: '1px solid var(--color-gray-alpha-400)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            transform: isClosing ? 'scale(0.95)' : 'scale(1)',
            opacity: isClosing ? 0 : 1,
            transition: 'all 200ms ease-out',
            zIndex: 2147483647, // Also set z-index on the modal content
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-gray-alpha-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--color-background-200)',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              Dev Tools Hub
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                color: 'var(--color-gray-700)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  'var(--color-gray-alpha-200)'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--color-gray-700)'
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <HubPanel />
          </div>
        </div>
      </div>
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
  const { triggerRef, togglePanel, panels } = usePanelRouterContext()
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
            width: (480 + 32) / state.scale,
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

      <PanelRoute name="fork-url">
        <DynamicPanel
          sharePanelSizeGlobally={false}
          sizeConfig={{
            kind: 'fixed',
            height: 280 / state.scale,
            width: 400 / state.scale,
          }}
          closeOnClickOutside
          header={<DevToolsHeader title="Fork from URL" />}
        >
          <ForkUrlPanel />
        </DynamicPanel>
      </PanelRoute>

      <PanelRoute name="hub">
        <HubModal />
      </PanelRoute>
    </>
  )
}

const Dev0ProjectRoutes = () => {
  const { projects } = useDev0Context()
  const { state } = useDevOverlayContext()
  const [refreshKeys, setRefreshKeys] = React.useState<Record<string, number>>({})

  const runningProjects = projects.filter((p) => p.status === 'running')

  const handleRefresh = (projectName: string) => {
    setRefreshKeys(prev => ({
      ...prev,
      [projectName]: (prev[projectName] || 0) + 1
    }))
  }

  return (
    <>
      {runningProjects.map((project) => (
        <PanelRoute key={project.name} name={`dev0-project-${project.name}`}>
          <DynamicPanel
            
            sharePanelSizeGlobally={false}
            sharePanelPositionGlobally={true}
            draggable
            sizeConfig={{
              kind: 'resizable',
              maxHeight: '90vh',
              maxWidth: '90vw',
              minHeight: 400 / state.scale,
              minWidth: 600 / state.scale,
              initialSize: {
                height: 300 / state.scale,
                width: 400 / state.scale,
              },
            }}
            header={
              <Dev0Header
                projectName={project.name}
                projectPath={project.absolutePath || project.cwd}
                deploymentUrl={project.deploymentUrl}
                port={project.port}
                onRefresh={() => handleRefresh(project.name)}
              />
            }
          >
            <Dev0Panel
              projectName={project.name}
              port={project.port!}
              refreshKey={refreshKeys[project.name] || 0}
            />
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
  const { panels, activePanel } = usePanelRouterContext()
  const isOpen = panels.has(name as PanelStateKind)
  const isActive = activePanel === name

  // Always mount panel-selector, mount others if they're open
  const shouldMount = name === 'panel-selector' ? isOpen : isOpen
  const { mounted, rendered } = useDelayedRender(shouldMount, {
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
