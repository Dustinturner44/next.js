import { usePanelContext } from './context'
import { DevtoolMenu } from './dev-overlay-menu'
import { DevtoolPanelV2 } from '../panel/panel'
import { SettingsTab } from '../components/devtools-panel/devtools-panel-tab/settings-tab'
import { RouteInfoBody } from '../components/errors/dev-tools-indicator/dev-tools-info/route-info'
import { PageSegmentTree } from '../components/overview/segment-explorer'
import { TurbopackInfoBody } from '../components/errors/dev-tools-indicator/dev-tools-info/turbopack-info'
import { DevToolsHeader } from '../components/errors/dev-tools-indicator/dev-tools-info/dev-tools-header'
import { useDelayedRender } from '../hooks/use-delayed-render'
import {
  MENU_CURVE,
  MENU_DURATION_MS,
} from '../components/errors/dev-tools-indicator/utils'
import { useDevOverlayContext } from '../../dev-overlay.browser'
// import { useDevOverlayContext } from '../dev-overlay.browser'

function PanelRoute({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  const { mounted, rendered } = useDelayedRender(active, {
    enterDelay: 0,
    exitDelay: MENU_DURATION_MS,
  })

  if (!mounted) return null

  return (
    <div
      style={{
        opacity: rendered ? 1 : 0,
        transition: `opacity ${MENU_DURATION_MS}ms ${MENU_CURVE}`,
      }}
    >
      {children}
    </div>
  )
}

// todo: use activity to manage state
export const PanelRouter = () => {
  const { panel, setPanel } = usePanelContext()
  const { state } = useDevOverlayContext()

  return (
    <>
      <PanelRoute active={panel === 'panel-selector'}>
        <DevtoolMenu
          onClose={() => {
            setPanel(null)
          }}
        />
      </PanelRoute>

      <PanelRoute active={panel === 'preferences'}>
        <DevtoolPanelV2
          name="preferences"
          // draggable={false}
          // resizable={false}
          // sizeConfig={{

          //   kind: 'fixed',
          //   height: 300,
          //   width: 400,
          // }}
          sizeConfig={{
            kind: 'resizable',
            // todo till refactor for strings
            maxHeight: 1500,
            maxWidth: 1500,
            minHeight: 200,
            minWidth: 200,
          }}
          closeOnClickOutside
          onClose={() => {
            setPanel('panel-selector')
          }}
          header={
            <DevToolsHeader
              title="Preferences"
              onBack={() => setPanel('panel-selector')}
            />
          }
        >
          <SettingsTab />
        </DevtoolPanelV2>
      </PanelRoute>

      <PanelRoute active={panel === 'route-info'}>
        <DevtoolPanelV2
          // style={{
          //   padding: '10px'
          // }}
          name="route-info"
          // draggable={false}
          // resizable={false}
          // sizeConfig={{
          //   kind: 'fixed',
          //   height: 300,
          //   width: 400,
          // }}
          sizeConfig={{
            kind: 'resizable',
            // todo till refactor for strings
            maxHeight: 1500,
            maxWidth: 1500,
            minHeight: 200,
            minWidth: 200,
          }}
          onClose={() => {
            setPanel('panel-selector')
          }}
          closeOnClickOutside
          // onClose={( ) =>}
          header={
            <DevToolsHeader
              title={`${state.staticIndicator ? 'Static' : 'Dynamic'} Route`}
              onBack={() => setPanel('panel-selector')}
            />
          }
        >
          <RouteInfoBody />
        </DevtoolPanelV2>
      </PanelRoute>

      <PanelRoute active={panel === 'segment-explorer'}>
        <DevtoolPanelV2
          name="segment-explorer"
          sizeConfig={{
            kind: 'resizable',
            // todo till refactor for strings
            maxHeight: 1500,
            maxWidth: 1500,
            minHeight: 200,
            minWidth: 200,
          }}
          header={
            <DevToolsHeader
              title="Segment Explorer"
              onBack={() => setPanel('panel-selector')}
            />
          }
        >
          <PageSegmentTree />
        </DevtoolPanelV2>
      </PanelRoute>

      <PanelRoute active={panel === 'turbo-info'}>
        {/* todo dedupe all these names */}
        <DevtoolPanelV2
          name="turbo-info"
          // sizeConfig={{
          //   kind: 'fixed',
          //   height: 400,
          //   width: 500,
          // }}
          sizeConfig={{
            kind: 'resizable',
            // todo till refactor for strings
            maxHeight: 1500,
            maxWidth: 1500,
            minHeight: 200,
            minWidth: 200,
          }}
          // draggable={false}
          onClose={() => {
            setPanel('panel-selector')
          }}
          // resizable={false}
          closeOnClickOutside
          header={
            <DevToolsHeader
              title="Turbopack Info"
              onBack={() => setPanel('panel-selector')}
            />
          }
        >
          <TurbopackInfoBody />
        </DevtoolPanelV2>
      </PanelRoute>
    </>
  )
}
