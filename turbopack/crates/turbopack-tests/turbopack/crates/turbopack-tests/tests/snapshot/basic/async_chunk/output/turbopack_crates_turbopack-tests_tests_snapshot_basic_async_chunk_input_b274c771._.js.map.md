# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js`

## Mappings Overview

- **Total Mappings**: 28
- **Generated Lines**: 24

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                              | Name |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------ | ---- |
| 7:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 8:0       | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 9:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 13:0      | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 13:1      | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 13:4      | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 13:221    | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 13:222    | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 13:228    | 5:3      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 13:228    | 5:2      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 13:230    | 5:4      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 14:0      | 6:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 14:1      | 6:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 14:4      | 6:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 14:221    | 6:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 14:222    | 6:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 14:228    | 6:3      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 14:228    | 6:2      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 14:230    | 6:4      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js                 | N/A  |
| 22:0      | 1:7      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js | N/A  |
| 22:9      | 1:16     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js | N/A  |
| 22:13     | 1:20     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js | N/A  |
| 22:18     | 1:25     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js | N/A  |
| 23:4      | 2:2      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js | N/A  |
| 23:12     | 2:10     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js | N/A  |
| 23:18     | 2:16     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js | N/A  |
| 23:19     | 2:17     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js | N/A  |
| 24:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/import.js

```javascript
import { foo } from 'foo'
import { bar } from 'bar'
import './shared'

foo(true)
bar(true)
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/async_chunk/input/node_modules/foo/index.js

```javascript
export function foo(value) {
  console.assert(value)
}
```
