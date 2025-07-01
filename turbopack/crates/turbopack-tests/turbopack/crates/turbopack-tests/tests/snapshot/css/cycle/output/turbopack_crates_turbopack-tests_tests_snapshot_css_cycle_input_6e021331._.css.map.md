# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/b.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/a.css`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/e.css`
4. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/d.css`
5. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/c.css`
6. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/2.css`

## Mappings Overview

- **Total Mappings**: 5
- **Generated Lines**: 14

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                  | Name |
| --------- | -------- | -------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/b.css | N/A  |
| 5:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/a.css | N/A  |
| 8:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/e.css | N/A  |
| 11:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/d.css | N/A  |
| 14:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/c.css | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/b.css

```javascript
@import 'c.css';

.b {
  content: '4 1';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/a.css

```javascript
@import 'b.css';

.a {
  content: '5 2';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/e.css

```javascript
@import 'a.css';

.e {
  content: '1 3';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/d.css

```javascript
@import 'e.css';

.d {
  content: '2 4';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/c.css

```javascript
@import 'd.css';

.c {
  content: '3 5';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle/input/2.css

```javascript
@import 'c.css';
```
