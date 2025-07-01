# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/index.js`

## Mappings Overview

- **Total Mappings**: 21
- **Generated Lines**: 23

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                           | Name |
| --------- | -------- | ----------------------------------------------------------------------------------------------------- | ---- |
| 15:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 15:6      | 1:6      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 16:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 16:8      | 3:8      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 16:11     | 3:11     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 16:12     | 3:12     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:0      | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:6      | 4:6      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:16     | 5:3      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:20     | 5:7      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:21     | 5:8      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:22     | 5:9      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:28     | 5:17     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:32     | 5:21     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:36     | 5:25     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:40     | 6:3      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:44     | 6:7      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:45     | 6:8      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:53     | 6:16     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 17:56     | 6:19     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs  | N/A  |
| 23:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/index.js | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/mod.mjs

```javascript
const assetUrl = new URL('./asset.txt', import.meta.url)

console.log(assetUrl)
fetch(assetUrl)
  .then((res) => res.text())
  .then(console.log)
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/import-meta/url/input/index.js

```javascript
import './mod.mjs'
```
