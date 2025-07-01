# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/index.js`

## Mappings Overview

- **Total Mappings**: 20
- **Generated Lines**: 19

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                               | Name |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------- | ---- |
| 9:0       | 4:6      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 9:9       | 4:16     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 9:32      | 4:39     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 9:33      | 4:43     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 9:35      | 4:52     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 10:4      | 5:2      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 10:11     | 5:9      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 10:13     | 5:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 10:15     | 5:13     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 10:16     | 5:13     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 11:0      | 6:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 11:1      | 6:1      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts | N/A  |
| 17:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/index.js        | N/A  |
| 19:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/index.js        | N/A  |
| 19:1      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/index.js        | N/A  |
| 19:4      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/index.js        | N/A  |
| 19:222    | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/index.js        | N/A  |
| 19:223    | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/index.js        | N/A  |
| 19:249    | 3:23     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/index.js        | N/A  |
| 19:249    | 3:22     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/index.js        | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/sourcemapped.ts

```javascript
// Compile with pnpm tsc turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts --sourceMap --inlineSources --target esnext
// tsc compile errors can be ignored
type Fn<T> = () => T
export function runExternalSourceMapped<T>(fn: Fn<T>): T {
  return fn()
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map/input/index.js

```javascript
import { runExternalSourceMapped } from './sourcemapped.js'

runExternalSourceMapped()
```
