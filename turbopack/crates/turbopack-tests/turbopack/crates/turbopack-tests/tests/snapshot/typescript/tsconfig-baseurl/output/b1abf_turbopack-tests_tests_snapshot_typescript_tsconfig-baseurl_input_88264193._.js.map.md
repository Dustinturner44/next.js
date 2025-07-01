# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/prop.ts`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/node_modules/bar/index.js`

## Mappings Overview

- **Total Mappings**: 24
- **Generated Lines**: 29

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                                        | Name |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 9:0       | 1:7      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/prop.ts                   | N/A  |
| 9:6       | 1:13     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/prop.ts                   | N/A  |
| 9:13      | 1:20     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/prop.ts                   | N/A  |
| 15:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 16:0      | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:0      | 7:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:8      | 7:8      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:11     | 7:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:12     | 7:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:218    | 7:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:219    | 7:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:226    | 7:21     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:228    | 7:23     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:434    | 7:23     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:435    | 7:23     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:442    | 7:31     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:444    | 7:33     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:650    | 7:33     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:651    | 7:33     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:658    | 7:38     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 21:660    | 7:40     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts                  | N/A  |
| 29:0      | 1:7      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/node_modules/bar/index.js | N/A  |
| 29:6      | 1:13     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/node_modules/bar/index.js | N/A  |
| 29:12     | 1:19     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/node_modules/bar/index.js | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/prop.ts

```javascript
export const prop = 1
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/index.ts

```javascript
import { prop as globalFoo } from 'foo'
import { prop as localFoo } from './foo'
import { prop as atFoo } from '@/foo'

import * as bar from 'bar'

console.log(globalFoo, localFoo, atFoo, bar)
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/typescript/tsconfig-baseurl/input/node_modules/bar/index.js

```javascript
export const bar = 'bar'
```
