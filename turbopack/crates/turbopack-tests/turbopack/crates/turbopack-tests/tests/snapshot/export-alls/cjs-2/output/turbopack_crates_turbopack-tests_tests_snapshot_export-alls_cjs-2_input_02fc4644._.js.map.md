# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/commonjs.js`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/c.js`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/b.js`
4. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/index.js`

## Mappings Overview

- **Total Mappings**: 25
- **Generated Lines**: 36

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                | Name |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------- | ---- |
| 7:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/commonjs.js | N/A  |
| 7:14      | 1:14     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/commonjs.js | N/A  |
| 8:0       | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/commonjs.js | N/A  |
| 8:8       | 2:8      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/commonjs.js | N/A  |
| 8:13      | 2:13     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/commonjs.js | N/A  |
| 8:16      | 2:16     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/commonjs.js | N/A  |
| 13:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/c.js        | N/A  |
| 13:7      | 1:7      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/c.js        | N/A  |
| 15:0      | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/c.js        | N/A  |
| 15:352    | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/c.js        | N/A  |
| 15:394    | 3:42     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/c.js        | N/A  |
| 22:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/b.js        | N/A  |
| 22:7      | 1:7      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/b.js        | N/A  |
| 24:0      | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/b.js        | N/A  |
| 24:338    | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/b.js        | N/A  |
| 24:401    | 3:63     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/b.js        | N/A  |
| 25:1      | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/b.js        | N/A  |
| 25:75     | 4:74     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/b.js        | N/A  |
| 32:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/index.js    | N/A  |
| 32:7      | 1:7      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/index.js    | N/A  |
| 34:0      | 2:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/index.js    | N/A  |
| 36:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/index.js    | N/A  |
| 36:8      | 3:8      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/index.js    | N/A  |
| 36:11     | 3:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/index.js    | N/A  |
| 36:12     | 3:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/index.js    | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/commonjs.js

```javascript
// commonjs.js
exports.hello = 'World'
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/c.js

```javascript
// c.js
export * from './commonjs.js'
// This would be handled by existing logic
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/b.js

```javascript
// b.js
export * from './c'
// This would not be handled, but still need __turbopack__cjs__
// as there are properties dynamically added by __turbopack__cjs__ in c.js
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/export-alls/cjs-2/input/index.js

```javascript
// a.js
import * as B from './b'
console.log(B)
```
