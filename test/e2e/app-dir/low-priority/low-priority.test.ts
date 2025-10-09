import { nextTestSetup } from 'e2e-utils'

describe('low-priority', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  describe('LowPriority component - server-side rendering', () => {
    // Testing the server-side behavior by sending Client Hints headers directly.
    // In production, these headers would be sent automatically by browsers that
    // support Network Information API Client Hints (based on Accept-CH response headers).

    it('should render children by default (no network hints)', async () => {
      const $ = await next.render$('/')
      expect($('#content').text()).toBe('Full Content')
    })

    it('should render children with fast network (4g)', async () => {
      const res = await next.fetch('/', {
        headers: {
          ect: '4g',
          rtt: '50',
          downlink: '10',
        },
      })
      const html = await res.text()
      expect(html).toContain('Full Content')
      expect(html).not.toContain('Fallback Content')
    })

    it('should render fallback with slow network (2g)', async () => {
      const res = await next.fetch('/', {
        headers: {
          ect: '2g',
        },
      })
      const html = await res.text()
      expect(html).not.toContain('Full Content')
      expect(html).toContain('Fallback Content')
    })

    it('should render fallback with save-data enabled', async () => {
      const res = await next.fetch('/', {
        headers: {
          'save-data': 'on',
        },
      })
      const html = await res.text()
      expect(html).not.toContain('Full Content')
      expect(html).toContain('Fallback Content')
    })

    it('should render fallback with high RTT', async () => {
      const res = await next.fetch('/', {
        headers: {
          rtt: '1000',
        },
      })
      const html = await res.text()
      expect(html).not.toContain('Full Content')
      expect(html).toContain('Fallback Content')
    })

    it('should render fallback with low downlink', async () => {
      const res = await next.fetch('/', {
        headers: {
          downlink: '0.5',
        },
      })
      const html = await res.text()
      expect(html).not.toContain('Full Content')
      expect(html).toContain('Fallback Content')
    })
  })

  describe('LowPriority with when="always"', () => {
    it('should always render fallback regardless of network', async () => {
      const res = await next.fetch('/always', {
        headers: {
          ect: '4g',
          rtt: '50',
          downlink: '10',
        },
      })
      const html = await res.text()
      expect(html).not.toContain('Full Content')
      expect(html).toContain('Always Fallback')
    })
  })

  describe('LowPriority with when="never"', () => {
    it('should always render children regardless of network', async () => {
      const res = await next.fetch('/never', {
        headers: {
          ect: '2g',
          'save-data': 'on',
        },
      })
      const html = await res.text()
      expect(html).toContain('Never Skipped Content')
      expect(html).not.toContain('Never Fallback')
    })
  })

  describe('network() API', () => {
    it('should expose network profile with fast connection', async () => {
      const res = await next.fetch('/network-api', {
        headers: {
          ect: '4g',
          rtt: '50',
          downlink: '10',
        },
      })
      const html = await res.text()
      expect(html).toContain('ECT: 4g')
      expect(html).toContain('RTT: 50')
      expect(html).toContain('Downlink: 10')
      expect(html).toContain('Slow: false')
    })

    it('should expose network profile with slow connection', async () => {
      const res = await next.fetch('/network-api', {
        headers: {
          ect: '2g',
          rtt: '900',
          downlink: '1',
        },
      })
      const html = await res.text()
      expect(html).toContain('ECT: 2g')
      expect(html).toContain('RTT: 900')
      expect(html).toContain('Downlink: 1')
      expect(html).toContain('Slow: true')
    })

    it('should handle missing network hints', async () => {
      const $ = await next.render$('/network-api')
      expect($('#slow').text()).toBe('Slow: false')
    })
  })

  describe('Client Hints headers', () => {
    it('should send Accept-CH header to advertise support', async () => {
      const res = await next.fetch('/')
      const acceptCH = res.headers.get('Accept-CH')
      expect(acceptCH).toBeTruthy()
      expect(acceptCH).toContain('ECT')
      expect(acceptCH).toContain('RTT')
      expect(acceptCH).toContain('Downlink')
      expect(acceptCH).toContain('Save-Data')
    })

    it('should send Critical-CH header for first-request hints', async () => {
      const res = await next.fetch('/')
      const criticalCH = res.headers.get('Critical-CH')
      expect(criticalCH).toBeTruthy()
      expect(criticalCH).toContain('ECT')
      expect(criticalCH).toContain('RTT')
      expect(criticalCH).toContain('Downlink')
    })

    it('should send Vary header for proper caching', async () => {
      const res = await next.fetch('/')
      const vary = res.headers.get('Vary')
      expect(vary).toBeTruthy()
      expect(vary).toContain('ECT')
      expect(vary).toContain('RTT')
      expect(vary).toContain('Downlink')
      expect(vary).toContain('Save-Data')
    })
  })
})
