// SharedWorker script - handles multiple connections
self.addEventListener('connect', (event: MessageEvent) => {
  const port = event.ports[0]

  // Import the dependency and send the message
  import('./worker-dep')
    .then((mod) => {
      port.postMessage('shared-worker.ts:' + mod.default)
    })
    .catch((error) => {
      console.error('SharedWorker import error:', error)
      port.postMessage('error: ' + error.message)
    })

  port.start()
})
