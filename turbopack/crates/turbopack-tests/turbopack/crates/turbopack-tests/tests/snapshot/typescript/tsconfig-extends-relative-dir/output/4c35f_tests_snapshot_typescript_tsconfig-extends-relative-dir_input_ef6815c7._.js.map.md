# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/prop.ts`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts`

## Mappings Overview

- **Total Mappings**: 19
- **Generated Lines**: 19

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                                    | Name |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 9:0       | 1:7      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/prop.ts  | N/A  |
| 9:6       | 1:13     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/prop.ts  | N/A  |
| 9:13      | 1:20     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/prop.ts  | N/A  |
| 15:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:0      | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:8      | 5:8      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:11     | 5:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:12     | 5:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:237    | 5:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:238    | 5:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:245    | 5:21     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:247    | 5:23     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:472    | 5:23     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:473    | 5:23     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:480    | 5:31     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:482    | 5:33     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:707    | 5:33     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:708    | 5:33     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |
| 19:715    | 5:38     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/prop.ts

```javascript
export const prop = 1
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-extends-relative-dir/input/index.ts

```javascript
import { prop as globalFoo } from 'foo'
import { prop as localFoo } from './foo'
import { prop as atFoo } from '@/foo'

console.log(globalFoo, localFoo, atFoo)
```
