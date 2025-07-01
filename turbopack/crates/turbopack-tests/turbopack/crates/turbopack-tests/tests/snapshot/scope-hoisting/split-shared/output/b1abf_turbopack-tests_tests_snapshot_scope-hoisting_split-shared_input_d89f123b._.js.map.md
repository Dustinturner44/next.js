# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/x/index.js`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/y/index.js`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/index.js`

## Mappings Overview

- **Total Mappings**: 8
- **Generated Lines**: 20

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                         | Name |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------- | ---- |
| 7:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/x/index.js | N/A  |
| 7:11      | 1:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/x/index.js | N/A  |
| 7:205     | 1:36     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/x/index.js | N/A  |
| 13:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/y/index.js | N/A  |
| 13:11     | 1:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/y/index.js | N/A  |
| 13:206    | 1:37     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/y/index.js | N/A  |
| 19:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/index.js   | N/A  |
| 20:0      | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/index.js   | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/x/index.js

```javascript
setTimeout(() => import('./inner'), 500)
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/y/index.js

```javascript
setTimeout(() => import('./middle'), 1000)
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/scope-hoisting/split-shared/input/index.js

```javascript
import './x/index'
import './y/index'
```
