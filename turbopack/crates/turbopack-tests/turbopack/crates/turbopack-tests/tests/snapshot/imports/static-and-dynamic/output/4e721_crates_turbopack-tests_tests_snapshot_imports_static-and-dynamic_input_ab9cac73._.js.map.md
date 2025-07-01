# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/vercel.mjs`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js`

## Mappings Overview

- **Total Mappings**: 15
- **Generated Lines**: 18

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                        | Name |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------ | ---- |
| 9:39      | 1:15     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/vercel.mjs | N/A  |
| 15:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 17:0      | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 17:8      | 2:8      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 17:11     | 2:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 17:12     | 2:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 17:223    | 2:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 17:224    | 2:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 17:234    | 2:15     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 18:0      | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 18:188    | 4:23     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 18:192    | 4:27     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 18:193    | 4:28     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 18:201    | 4:36     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |
| 18:204    | 4:39     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js   | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/vercel.mjs

```javascript
export default 'turbopack'
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/static-and-dynamic/input/index.js

```javascript
import img from './vercel.mjs'
console.log(img)

import('./vercel.mjs').then(console.log)
```
