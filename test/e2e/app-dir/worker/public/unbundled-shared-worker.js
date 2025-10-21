// SharedWorker script for unbundled test
self.addEventListener('connect', (event) => {
  const port = event.ports[0]
  port.postMessage('unbundled-shared-worker')
  port.start()
})
