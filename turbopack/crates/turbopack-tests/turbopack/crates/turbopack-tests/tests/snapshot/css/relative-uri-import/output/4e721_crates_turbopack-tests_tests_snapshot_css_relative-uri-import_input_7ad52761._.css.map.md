# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/relative-uri-import/input/another.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/relative-uri-import/input/other.css`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/relative-uri-import/input/index.css`

## Mappings Overview

- **Total Mappings**: 3
- **Generated Lines**: 8

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                      | Name |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/relative-uri-import/input/another.css | N/A  |
| 5:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/relative-uri-import/input/other.css   | N/A  |
| 8:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/relative-uri-import/input/index.css   | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/relative-uri-import/input/another.css

```javascript
.bar {
  background-color: green;
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/relative-uri-import/input/other.css

```javascript
@import 'another.css';

.foo {
  background-color: red;
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/relative-uri-import/input/index.css

```javascript
@import 'other.css';

body {
  background-color: blue;
}
```
