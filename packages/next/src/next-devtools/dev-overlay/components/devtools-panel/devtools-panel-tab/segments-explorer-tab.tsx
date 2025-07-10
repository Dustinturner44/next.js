import { PageSegmentTree } from '../../overview/segment-explorer'

function SegmentsExplorer({
  routerType,
  page,
}: React.HTMLProps<HTMLDivElement> & {
  routerType: 'app' | 'pages'
  page: string
}) {
  return <PageSegmentTree />
}

export function SegmentsExplorerTab({
  routerType,
  page,
}: {
  routerType: 'app' | 'pages'
  page: string
}) {
  return <SegmentsExplorer routerType={routerType} page={page} />
}

export const SEGMENTS_EXPLORER_TAB_STYLES = `
`
