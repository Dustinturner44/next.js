# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/y.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/x.css`

## Mappings Overview

- **Total Mappings**: 2
- **Generated Lines**: 5

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                  | Name |
| --------- | -------- | -------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/y.css | N/A  |
| 5:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/x.css | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/y.css

```javascript
@import 'x.css';

.y {
  content: '2 1';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/x.css

```javascript
@import 'y.css';

.x {
  content: '1 2';
}
```
