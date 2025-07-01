# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js`

## Mappings Overview

- **Total Mappings**: 18
- **Generated Lines**: 19

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                          | Name |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------- | ---- |
| 7:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js                  | N/A  |
| 9:0       | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js                  | N/A  |
| 9:1       | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js                  | N/A  |
| 9:4       | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js                  | N/A  |
| 9:217     | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js                  | N/A  |
| 9:218     | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js                  | N/A  |
| 9:224     | 5:3      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js                  | N/A  |
| 9:224     | 5:2      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js                  | N/A  |
| 9:226     | 5:4      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js                  | N/A  |
| 17:0      | 3:7      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js | N/A  |
| 17:9      | 3:16     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js | N/A  |
| 17:13     | 3:20     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js | N/A  |
| 17:18     | 3:25     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js | N/A  |
| 18:4      | 4:2      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js | N/A  |
| 18:12     | 4:10     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js | N/A  |
| 18:18     | 4:16     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js | N/A  |
| 18:19     | 4:17     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js | N/A  |
| 19:0      | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/index.js

```javascript
#!/usr/bin/env node

import { foo } from 'foo'

foo(true)
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/basic/shebang/input/node_modules/foo/index.js

```javascript
#!/usr/bin/env node

export function foo(value) {
  console.assert(value)
}
```
