# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css [test] (css module)`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.module.css [test] (css module)`

## Mappings Overview

- **Total Mappings**: 22
- **Generated Lines**: 29

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                                                | Name |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 5:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css [test] (css module)                  | N/A  |
| 6:0       | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css [test] (css module)                  | N/A  |
| 7:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css [test] (css module)                  | N/A  |
| 8:0       | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css [test] (css module)                  | N/A  |
| 9:0       | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css [test] (css module)                  | N/A  |
| 10:0      | 6:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css [test] (css module)                  | N/A  |
| 16:0      | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 17:0      | 5:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:0      | 7:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:8      | 7:8      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:11     | 7:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:12     | 7:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:208    | 7:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:209    | 7:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:219    | 7:17     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:221    | 7:19     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:440    | 7:19     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:441    | 7:19     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 23:451    | 7:27     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js                                              | N/A  |
| 27:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.module.css [test] (css module) | N/A  |
| 28:0      | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.module.css [test] (css module) | N/A  |
| 29:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.module.css [test] (css module) | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css [test] (css module)

```javascript
__turbopack_context__.v({
  'another-composed-module-style':
    'style-module__Iu_hLa__another-composed-module-style' +
    ' ' +
    __turbopack_context__.i(
      '[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.module.css [test] (css module)'
    )['foo-module-style'],
  'composed-module-style':
    'style-module__Iu_hLa__composed-module-style' +
    ' ' +
    __turbopack_context__.i(
      '[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.module.css [test] (css module)'
    )['foo-module-style'],
  inner: 'style-module__Iu_hLa__inner',
  'module-style': 'style-module__Iu_hLa__module-style',
})
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/index.js

```javascript
import 'foo/style.css'
import 'foo'
import './style.css'
import fooStyle from 'foo/style.module.css'
import style from './style.module.css'

console.log(style, fooStyle, import('foo'))
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.module.css [test] (css module)

```javascript
__turbopack_context__.v({
  'foo-module-style': 'style-module__CEkn7G__foo-module-style',
})
```
