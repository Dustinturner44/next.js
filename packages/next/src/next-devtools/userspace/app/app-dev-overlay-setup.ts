import { patchConsoleError } from './errors/intercept-console-error'
import { handleGlobalErrors } from './errors/use-error-handler'
import { initializeDebugLogForwarding } from './forward-logs'

handleGlobalErrors()
patchConsoleError()

// Always initialize debug log forwarding for file logging
initializeDebugLogForwarding('app')
