# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/index.js`

## Mappings Overview

- **Total Mappings**: 11
- **Generated Lines**: 15

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                                      | Name |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 11:0      | 4:6      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts | N/A  |
| 11:9      | 4:16     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts | N/A  |
| 11:32     | 4:39     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts | N/A  |
| 11:33     | 4:43     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts | N/A  |
| 11:35     | 4:52     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts | N/A  |
| 12:4      | 5:2      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts | N/A  |
| 12:11     | 5:9      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts | N/A  |
| 12:13     | 5:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts | N/A  |
| 12:15     | 5:13     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts | N/A  |
| 12:16     | 5:13     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts | N/A  |
| 15:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/index.js        | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts

```javascript
// Compile with pnpm tsc turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/sourcemapped.ts --sourceMap --inlineSources --target esnext
// tsc compile errors can be ignored
type Fn<T> = () => T
export function runExternalSourceMapped<T>(fn: Fn<T>): T {
  return fn()
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/source_maps/input-source-map-merged/input/index.js

```javascript
import { runExternalSourceMapped } from './sourcemapped.js'

runExternalSourceMapped()
```
