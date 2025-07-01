# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/b.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/a.css`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/e.css`
4. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/d.css`
5. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/c.css`
6. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/y.css`
7. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/x.css`
8. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/2.css`

## Mappings Overview

- **Total Mappings**: 7
- **Generated Lines**: 20

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                   | Name |
| --------- | -------- | --------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/b.css | N/A  |
| 5:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/a.css | N/A  |
| 8:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/e.css | N/A  |
| 11:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/d.css | N/A  |
| 14:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/c.css | N/A  |
| 17:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/y.css | N/A  |
| 20:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/x.css | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/b.css

```javascript
@import 'c.css';

.b {
  content: '4 1';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/a.css

```javascript
@import 'b.css';

.a {
  content: '5 2';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/e.css

```javascript
@import 'a.css';

.e {
  content: '1 3';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/d.css

```javascript
@import 'e.css';

.d {
  content: '2 4';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/c.css

```javascript
@import 'd.css';

.c {
  content: '3 5';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/y.css

```javascript
@import 'c.css';

.y {
  content: '7 6';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/x.css

```javascript
@import 'a.css';

.x {
  content: '6 7';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/cycle2/input/2.css

```javascript
@import 'y.css';
@import 'x.css';
```
