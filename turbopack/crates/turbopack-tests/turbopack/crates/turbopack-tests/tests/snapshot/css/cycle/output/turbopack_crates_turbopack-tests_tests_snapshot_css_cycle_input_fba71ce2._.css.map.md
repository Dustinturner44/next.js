# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/k.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/j.css`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/i.css`

## Mappings Overview

- **Total Mappings**: 3
- **Generated Lines**: 8

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                  | Name |
| --------- | -------- | -------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/k.css | N/A  |
| 5:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/j.css | N/A  |
| 8:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/i.css | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/k.css

```javascript
@import 'i.css';

.k {
  content: '1';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/j.css

```javascript
@import 'k.css';

.j {
  content: '2';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/i.css

```javascript
@import 'j.css';

.i {
  content: '3';
}
```
