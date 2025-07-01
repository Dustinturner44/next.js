# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/absolute-uri-import/input/other.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/absolute-uri-import/input/withduplicateurl.css`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/absolute-uri-import/input/index.css`

## Mappings Overview

- **Total Mappings**: 3
- **Generated Lines**: 11

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                               | Name |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------- | ---- |
| 5:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/absolute-uri-import/input/other.css            | N/A  |
| 8:0       | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/absolute-uri-import/input/withduplicateurl.css | N/A  |
| 11:0      | 7:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/absolute-uri-import/input/index.css            | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/absolute-uri-import/input/other.css

```javascript
.foo {
  background-color: red;
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/absolute-uri-import/input/withduplicateurl.css

```javascript
/* This should not be duplicated */
@import 'https://example.com/stylesheet1.css';

.bar {
  background-color: green;
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/absolute-uri-import/input/index.css

```javascript
@import 'https://example.com/stylesheet1.css';
@import 'https://example.com/withquote".css';
@import './other.css';
@import './withduplicateurl.css';
@import url('https://example.com/stylesheet2.css');

body {
  background-color: blue;
}
```
