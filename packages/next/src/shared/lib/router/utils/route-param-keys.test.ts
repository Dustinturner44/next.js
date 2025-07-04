import { getRouteRegex } from './route-regex'
import { getRouteParamKeys } from './route-param-keys'

describe('getRouteParamKeys', () => {
  it('should return the correct param keys', () => {
    const { groups } = getRouteRegex('/[...slug].json')
    expect(getRouteParamKeys(groups)).toEqual(['slug'])
  })

  it('should have the correct ordering', () => {
    const { groups } = getRouteRegex('/[lang]/[...slug]')
    expect(getRouteParamKeys(groups)).toEqual(['lang', 'slug'])
  })

  it('should have the correct ordering when the groups object is not sorted', () => {
    const groups = {
      slug: { pos: 2, repeat: true, optional: false },
      lang: { pos: 1, repeat: false, optional: false },
    }
    expect(getRouteParamKeys(groups)).toEqual(['lang', 'slug'])
  })
})
