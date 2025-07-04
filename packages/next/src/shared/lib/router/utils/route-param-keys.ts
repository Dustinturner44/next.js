import type { Group } from './route-regex'

/**
 * Get the parameter keys from a route regex, sorted by their position in the
 * route regex which corresponds to the order they appear in the route.
 *
 * @param groups - The groups of the route regex.
 * @returns The parameter keys in the order they appear in the route regex.
 */
export function getRouteParamKeys(
  groups: Record<string, Group>
): readonly string[] {
  const keys = Object.keys(groups)

  // Sort keys directly by their position values
  keys.sort((a, b) => groups[a].pos - groups[b].pos)

  return keys
}
