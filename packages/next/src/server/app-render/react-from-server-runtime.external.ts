import { InvariantError } from '../../shared/lib/invariant-error'
import { vendored } from '../route-modules/app-page/module.compiled'

if (process.env.NEXT_RUNTIME === 'edge') {
  throw new InvariantError(
    'The next-server runtime is not available in Edge runtime.'
  )
}

export const ReactServer = vendored['react-rsc']!.React
export const ReactClient = vendored['react-ssr']!.React
