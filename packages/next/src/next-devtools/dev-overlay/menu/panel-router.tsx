import { usePanelRouterContext, type PanelStateKind } from './context'
import { ChevronRight, IssueCount } from './dev-overlay-menu'
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
import { createContext, useContext, useState } from 'react'
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
import { MCPToolPanel } from '../components/mcp-tool-panel/mcp-tool-panel'
import { useSidebarContext } from '../context/sidebar-context'
import { css } from '../utils/css'
import React, { useRef, useState, useEffect } from 'react'
import { useClickOutsideAndEscape } from '../components/errors/dev-tools-indicator/utils'
import { AccordionCommandPalette } from './accordion-command-palette'

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
  const { projects, createProject, isLoading, killProject, getDisplayName, updateDisplayName } = useDev0Context()
  const { toggleSidebar, isOpen: sidebarIsOpen } = useSidebarContext()
  const [renamingProject, setRenamingProject] = useState<string | null>(null)
  const [mcpTools, setMcpTools] = useState<any[]>([])
  const [mcpLoading, setMcpLoading] = useState(true)

  // Fetch MCP tools
  useEffect(() => {
    const fetchMCPTools = async () => {
      try {
        const response = await fetch('http://localhost:8001/all-tools')
        if (response.ok) {
          const data = await response.json()
          setMcpTools(data.tools || [])
        }
      } catch (error) {
        console.error('Failed to fetch MCP tools:', error)
      } finally {
        setMcpLoading(false)
      }
    }

    fetchMCPTools()
    const interval = setInterval(fetchMCPTools, 2000)
    return () => clearInterval(interval)
  }, [])

  const visibleProjects = projects.filter(
    (p) => p.status === 'running' || p.status === 'creating'
  )

  const handleCreateProject = async () => {
    await createProject()
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
          <span style={{ color: 'var(--color-blue-700)', fontSize: '13px' }}>open</span>
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
              <span style={{ color: 'var(--color-blue-700)', fontSize: '13px' }}>open</span>
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
          <span style={{ color: 'var(--color-blue-700)', fontSize: '13px' }}>open</span>
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

  const projectItems = visibleProjects
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map((project) => {
    const panelName = `dev0-project-${project.name}` as PanelStateKind
    const isActive = activePanel === panelName

    return {
      label:
        project.status === 'creating' ? 'Creating project...' : getDisplayName(project.name),
      value:
        project.status === 'creating' ? (
          <span
            className="loading-spinner"
            style={{ width: '14px', height: '14px' }}
          />
        ) : isActive ? (
          <span style={{ 
            color: 'var(--color-blue-700)',
            fontSize: '13px'
          }}>
            open
          </span>
        ) : null,
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
      deletable: project.status !== 'creating',
      renameable: project.status !== 'creating',
      onRename: () => {
        setRenamingProject(project.name)
      },
      isRenaming: renamingProject === project.name,
      renameValue: getDisplayName(project.name),
      onRenameSubmit: async (newName: string) => {
        console.log('onRenameSubmit called with:', newName)
        console.log('Current display name:', getDisplayName(project.name))
        console.log('Project name:', project.name)
        
        if (newName && newName.trim() && newName !== getDisplayName(project.name)) {
          console.log('Calling updateDisplayName...')
          try {
            await updateDisplayName(project.name, newName.trim())
            console.log('updateDisplayName completed')
          } catch (error) {
            console.error('Failed to update display name:', error)
          }
        } else {
          console.log('Skipping update - same name or empty')
        }
        setRenamingProject(null)
      },
      onRenameCancel: () => {
        setRenamingProject(null)
      },
    }
  })

  const createProjectItem = {
    label: 'Create New Project',
    value: isLoading ? (
      <span
        className="loading-spinner"
        style={{ width: '14px', height: '14px' }}
      />
    ) : (
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="var(--color-green-700)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    ),
    onClick: isLoading ? undefined : handleCreateProject,
    disabled: isLoading,
    attributes: {
      'data-create-project': true,
      'data-item-type': 'create-project',
    },
    deletable: false,
  }

  const mcpToolItems = mcpTools.map((tool, index) => {
    const panelName = `mcp-tool-${tool.name}` as PanelStateKind
    const isActive = activePanel === panelName
    
    const displayName = tool.name.includes('_') 
      ? tool.name.split('_').slice(1).join('_')
      : tool.name

    return {
      label: `${index}. ${displayName}`,
      value: isActive ? (
        <span style={{ color: 'var(--color-blue-700)', fontSize: '13px' }}>open</span>
      ) : tool.online ? (
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--color-green-700)',
          display: 'inline-block'
        }} />
      ) : (
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--color-gray-500)',
          display: 'inline-block'
        }} />
      ),
      onClick: () => togglePanel(panelName),
      attributes: {
        'data-mcp-tool': tool.name,
        'data-mcp-online': tool.online ? 'true' : 'false',
        'data-panel-active': isActive ? 'true' : 'false',
      },
      deletable: false,
    }
  })

  // Create MCP Tools accordion
  const mcpToolsAccordionItem = {
    label: 'MCP Tools',
    value: (
      <span style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        fontSize: '12px',
        color: 'var(--color-text-secondary)' 
      }}>
        {mcpLoading ? (
          <span
            className="loading-spinner"
            style={{ width: '12px', height: '12px' }}
          />
        ) : (
          mcpTools.length
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    ),
    onClick: undefined,
    attributes: {
      'data-accordion': 'mcp-tools',
      'data-accordion-open': 'false',
    },
    deletable: false,
    isAccordion: true,
    accordionContent: mcpToolItems,
  }

  const terminalItem = {
    label: 'Terminal',
    value: sidebarIsOpen ? (
      <span style={{ color: 'var(--color-green-700)', fontSize: '12px' }}>active</span>
    ) : (
      <ChevronRight />
    ),
    onClick: () => {
      toggleSidebar()
    },
    attributes: {
      'data-sidebar-toggle': true,
    },
    deletable: false,
  }

  const additionalItems = [
    {
      label: 'Community',
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
    // {
    //   label: 'Fork URL',
    //   value:
    //     activePanel === 'fork-url' ? (
    //       <span style={{ color: 'var(--color-blue-700)', fontSize: '13px' }}>open</span>
    //     ) : (
    //       <ChevronRight />
    //     ),
    //   onClick: () => togglePanel('fork-url'),
    //   attributes: {
    //     'data-fork-url': true,
    //     'data-panel-active': activePanel === 'fork-url' ? 'true' : 'false',
    //   },
    //   deletable: false,
    // },
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

  const devToolsAccordionItem = {
    label: 'Plugins',
    value: (
      <span style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        fontSize: '12px',
        color: 'var(--color-text-secondary)' 
      }}>
        {projectItems.length + 2}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    ),
    onClick: undefined, 
    attributes: {
      'data-accordion': 'devtools',
      'data-accordion-open': 'false',
    },
    deletable: false,
    isAccordion: true,
    accordionContent: [createProjectItem, ...projectItems, terminalItem],
  }

  const menuItems = [
    ...baseItems,
    devToolsAccordionItem,
    mcpToolsAccordionItem,
    ...additionalItems,
  ].filter(Boolean)

  return (
    <>
      <AccordionCommandPalette
        items={menuItems}
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

        .dev-tools-indicator-item[data-panel-active='true'] {
          background-color: var(--color-gray-alpha-100);
        }

        .dev-tools-indicator-item[data-panel-active='true']:hover {
          background-color: var(--color-gray-alpha-200);
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
          zIndex: 2147483647, 
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
            zIndex: 2147483647, 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
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
              zIndex: 10,
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

      <MCPToolRoutes />
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
              minHeight: 0,
              minWidth: 0,
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

const MCPToolRoutes = () => {
  const { state } = useDevOverlayContext()
  const [mcpTools, setMcpTools] = useState<any[]>([])

  // Fetch MCP tools
  useEffect(() => {
    const fetchMCPTools = async () => {
      try {
        const response = await fetch('http://localhost:8001/all-tools')
        if (response.ok) {
          const data = await response.json()
          setMcpTools(data.tools || [])
        }
      } catch (error) {
        console.error('Failed to fetch MCP tools:', error)
      }
    }

    fetchMCPTools()
    const interval = setInterval(fetchMCPTools, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {mcpTools.map((tool) => (
        <PanelRoute key={tool.name} name={`mcp-tool-${tool.name}`}>
          <DynamicPanel
            sharePanelSizeGlobally={false}
            sharePanelPositionGlobally={true}
            draggable
            sizeConfig={{
              kind: 'resizable',
              maxHeight: '90vh',
              maxWidth: '90vw',
              minHeight: 400 / state.scale,
              minWidth: 500 / state.scale,
              initialSize: {
                height: 500 / state.scale,
                width: 600 / state.scale,
              },
            }}
            header={
              <DevToolsHeader title={tool.name.includes('_') 
                ? tool.name.split('_').slice(1).join('_')
                : tool.name}>
                <MCPToolHeaderContent tool={tool} />
              </DevToolsHeader>
            }
          >
            <MCPToolPanel toolName={tool.name} tool={tool} />
          </DynamicPanel>
        </PanelRoute>
      ))}
    </>
  )
}

const MCPToolHeaderContent = ({ tool }: { tool: any }) => {
  const { getDisplayName } = useDev0Context()
  const projectId = tool.name.split('_')[0] || 'unknown'
  const displayName = getDisplayName(projectId)
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied' | 'failed'>('idle')
  
  const handleCopy = async () => {
    try {
      const command = 'claude mcp add devtools -- node /Users/robby/dev-0/packages/mcp-server/dist/index.js --stdio'
      await navigator.clipboard.writeText(command)
      setCopyFeedback('copied')
      setTimeout(() => setCopyFeedback('idle'), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopyFeedback('failed')
      setTimeout(() => setCopyFeedback('idle'), 2000)
    }
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      fontSize: '12px',
      color: 'var(--color-text-secondary)',
    }}>
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: 'var(--color-gray-alpha-200)',
        border: '1px solid var(--color-gray-alpha-400)',
      }}>
        {displayName}
      </span>
      <code
        style={{
          backgroundColor: 'var(--color-gray-alpha-200)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-gray-alpha-400)',
        }}
      >
        claude mcp add devtools
      </code>
      <button
        onClick={handleCopy}
        style={{
          background: 'transparent',
          border: '1px solid var(--color-gray-alpha-400)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer',
          color: copyFeedback === 'copied' ? 'var(--color-green-700)' : 
                copyFeedback === 'failed' ? 'var(--color-red-700)' : 
                'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        title="Copy command to add MCP server to Claude Code"
      >
        {copyFeedback === 'copied' ? '✓ Copied' : 
         copyFeedback === 'failed' ? '✗ Failed' : 
         'Copy'}
      </button>
    </div>
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

