# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1a.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1b.css`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1.css`

## Mappings Overview

- **Total Mappings**: 3
- **Generated Lines**: 8

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                           | Name |
| --------- | -------- | ----------------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1a.css | N/A  |
| 5:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1b.css | N/A  |
| 8:0       | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1.css  | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1a.css

```javascript
.b1a {
  content: '3';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1b.css

```javascript
.b1b {
  content: '4';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1.css

```javascript
@import 'b1a.css';
@import 'b1b.css';

.b1 {
  content: '5';
}
```
