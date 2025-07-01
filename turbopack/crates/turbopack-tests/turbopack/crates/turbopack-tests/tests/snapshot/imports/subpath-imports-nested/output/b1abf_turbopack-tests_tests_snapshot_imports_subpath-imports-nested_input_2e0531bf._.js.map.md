# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/foo.js`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/nested/index.js`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/index.js`

## Mappings Overview

- **Total Mappings**: 14
- **Generated Lines**: 27

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                                 | Name |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------------- | ---- |
| 9:39      | 1:15     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/foo.js          | N/A  |
| 17:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/nested/index.js | N/A  |
| 19:39     | 2:15     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/nested/index.js | N/A  |
| 19:250    | 2:15     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/nested/index.js | N/A  |
| 19:251    | 2:15     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/nested/index.js | N/A  |
| 19:261    | 2:18     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/nested/index.js | N/A  |
| 25:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/index.js        | N/A  |
| 27:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/index.js        | N/A  |
| 27:8      | 3:8      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/index.js        | N/A  |
| 27:11     | 3:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/index.js        | N/A  |
| 27:12     | 3:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/index.js        | N/A  |
| 27:235    | 3:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/index.js        | N/A  |
| 27:236    | 3:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/index.js        | N/A  |
| 27:246    | 3:15     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/index.js        | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/foo.js

```javascript
export default 'foo'
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/nested/index.js

```javascript
import foo from '#foo'
export default foo
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/imports/subpath-imports-nested/input/index.js

```javascript
import foo from './nested'

console.log(foo)
```
