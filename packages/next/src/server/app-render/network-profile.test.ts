import { describe, it, expect } from '@jest/globals'
import {
  decideSlow,
  extractNetworkHints,
  createNetworkProfile,
  type NetworkProfileInput,
} from './network-profile'

describe('network-profile', () => {
  describe('decideSlow', () => {
    it('should return true when saveData is enabled', () => {
      const profile: NetworkProfileInput = {
        saveData: true,
      }
      expect(decideSlow(profile)).toBe(true)
    })

    it('should return true when ect is slow-2g', () => {
      const profile: NetworkProfileInput = {
        ect: 'slow-2g',
      }
      expect(decideSlow(profile)).toBe(true)
    })

    it('should return true when ect is 2g', () => {
      const profile: NetworkProfileInput = {
        ect: '2g',
      }
      expect(decideSlow(profile)).toBe(true)
    })

    it('should return false when ect is 3g', () => {
      const profile: NetworkProfileInput = {
        ect: '3g',
      }
      expect(decideSlow(profile)).toBe(false)
    })

    it('should return false when ect is 4g', () => {
      const profile: NetworkProfileInput = {
        ect: '4g',
      }
      expect(decideSlow(profile)).toBe(false)
    })

    it('should return true when rtt > 800', () => {
      const profile: NetworkProfileInput = {
        rtt: 900,
      }
      expect(decideSlow(profile)).toBe(true)
    })

    it('should return false when rtt <= 800', () => {
      const profile: NetworkProfileInput = {
        rtt: 800,
      }
      expect(decideSlow(profile)).toBe(false)
    })

    it('should return true when downlink < 1.5', () => {
      const profile: NetworkProfileInput = {
        downlink: 1.0,
      }
      expect(decideSlow(profile)).toBe(true)
    })

    it('should return false when downlink >= 1.5', () => {
      const profile: NetworkProfileInput = {
        downlink: 1.5,
      }
      expect(decideSlow(profile)).toBe(false)
    })

    it('should return false when downlink is 0', () => {
      const profile: NetworkProfileInput = {
        downlink: 0,
      }
      expect(decideSlow(profile)).toBe(false)
    })

    it('should return true when backpressure is high', () => {
      const profile: NetworkProfileInput = {
        backpressure: 'high',
      }
      expect(decideSlow(profile)).toBe(true)
    })

    it('should return false when backpressure is low', () => {
      const profile: NetworkProfileInput = {
        backpressure: 'low',
      }
      expect(decideSlow(profile)).toBe(false)
    })

    it('should return false when backpressure is none', () => {
      const profile: NetworkProfileInput = {
        backpressure: 'none',
      }
      expect(decideSlow(profile)).toBe(false)
    })

    it('should return true when multiple slow conditions are met', () => {
      const profile: NetworkProfileInput = {
        saveData: true,
        ect: '2g',
        rtt: 1000,
        downlink: 0.5,
      }
      expect(decideSlow(profile)).toBe(true)
    })

    it('should return false when no slow conditions are met', () => {
      const profile: NetworkProfileInput = {
        saveData: false,
        ect: '4g',
        rtt: 50,
        downlink: 10,
        backpressure: 'none',
      }
      expect(decideSlow(profile)).toBe(false)
    })

    it('should return false when profile is empty', () => {
      const profile: NetworkProfileInput = {}
      expect(decideSlow(profile)).toBe(false)
    })
  })

  describe('extractNetworkHints', () => {
    it('should extract hints from Headers object', () => {
      const headers = new Headers({
        'save-data': 'on',
        ect: '3g',
        downlink: '5.0',
        rtt: '100',
      })

      const hints = extractNetworkHints(headers)
      expect(hints).toEqual({
        saveData: true,
        ect: '3g',
        downlink: 5.0,
        rtt: 100,
      })
    })

    it('should extract hints from Map', () => {
      const headers = new Map<string, string>([
        ['save-data', 'on'],
        ['ect', '4g'],
        ['downlink', '10.5'],
        ['rtt', '50'],
      ])

      const hints = extractNetworkHints(headers)
      expect(hints).toEqual({
        saveData: true,
        ect: '4g',
        downlink: 10.5,
        rtt: 50,
      })
    })

    it('should extract hints from plain object', () => {
      const headers = {
        'save-data': 'on',
        ect: '2g',
        downlink: '1.2',
        rtt: '900',
      }

      const hints = extractNetworkHints(headers)
      expect(hints).toEqual({
        saveData: true,
        ect: '2g',
        downlink: 1.2,
        rtt: 900,
      })
    })

    it('should handle missing headers', () => {
      const headers = new Headers()
      const hints = extractNetworkHints(headers)
      expect(hints).toEqual({
        saveData: false,
        ect: undefined,
        downlink: undefined,
        rtt: undefined,
      })
    })

    it('should handle save-data: off', () => {
      const headers = new Headers({
        'save-data': 'off',
      })
      const hints = extractNetworkHints(headers)
      expect(hints.saveData).toBe(false)
    })

    it('should handle array values in plain object', () => {
      const headers = {
        'save-data': ['on', 'extra'],
        ect: ['3g'],
      }

      const hints = extractNetworkHints(headers)
      expect(hints.saveData).toBe(true)
      expect(hints.ect).toBe('3g')
    })

    it('should handle case-insensitive header values', () => {
      const headers = new Headers({
        'save-data': 'ON',
        ect: '3G',
      })

      const hints = extractNetworkHints(headers)
      expect(hints.saveData).toBe(true)
      expect(hints.ect).toBe('3g')
    })
  })

  describe('createNetworkProfile', () => {
    it('should create profile with slow=true for slow conditions', () => {
      const input: NetworkProfileInput = {
        saveData: true,
      }

      const profile = createNetworkProfile(input)
      expect(profile).toEqual({
        saveData: true,
        slow: true,
      })
    })

    it('should create profile with slow=false for fast conditions', () => {
      const input: NetworkProfileInput = {
        ect: '4g',
        rtt: 50,
        downlink: 10,
      }

      const profile = createNetworkProfile(input)
      expect(profile).toEqual({
        ect: '4g',
        rtt: 50,
        downlink: 10,
        slow: false,
      })
    })

    it('should preserve all input fields', () => {
      const input: NetworkProfileInput = {
        saveData: false,
        ect: '3g',
        rtt: 200,
        downlink: 5,
        backpressure: 'low',
      }

      const profile = createNetworkProfile(input)
      expect(profile).toEqual({
        saveData: false,
        ect: '3g',
        rtt: 200,
        downlink: 5,
        backpressure: 'low',
        slow: false,
      })
    })
  })
})
