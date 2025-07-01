# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/other.module.css [test] (css module)`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.module.css [test] (css module)`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.js`

## Mappings Overview

- **Total Mappings**: 7
- **Generated Lines**: 19

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                                                      | Name |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 5:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/other.module.css [test] (css module) | N/A  |
| 6:0       | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/other.module.css [test] (css module) | N/A  |
| 7:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/other.module.css [test] (css module) | N/A  |
| 11:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.module.css [test] (css module) | N/A  |
| 12:0      | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.module.css [test] (css module) | N/A  |
| 13:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.module.css [test] (css module) | N/A  |
| 19:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.js                             | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/other.module.css [test] (css module)

```javascript
__turbopack_context__.v({
  foo: 'other-module__NjlEuq__foo',
})
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.module.css [test] (css module)

```javascript
__turbopack_context__.v({
  bar:
    'index-module__jZ0vmq__bar' +
    ' ' +
    __turbopack_context__.i(
      '[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/other.module.css [test] (css module)'
    )['foo'],
})
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.js

```javascript
import { foo } from './index.module.css'
```
