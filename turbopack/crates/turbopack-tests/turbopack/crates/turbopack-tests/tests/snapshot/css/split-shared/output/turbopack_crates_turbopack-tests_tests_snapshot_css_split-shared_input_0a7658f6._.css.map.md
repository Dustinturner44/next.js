# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/a.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b0.css`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1a.css`
4. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1b.css`
5. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1.css`
6. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b2.css`
7. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/shared1.css`
8. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/shared.css`
9. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3a.css`
10. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3b.css`
11. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3.css`
12. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4a.css`
13. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4b.css`
14. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4.css`
15. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b.css`
16. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/c.css`
17. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/entry.css`

## Mappings Overview

- **Total Mappings**: 16
- **Generated Lines**: 47

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                               | Name |
| --------- | -------- | --------------------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/a.css       | N/A  |
| 5:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b0.css      | N/A  |
| 8:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1a.css     | N/A  |
| 11:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1b.css     | N/A  |
| 14:0      | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b1.css      | N/A  |
| 17:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b2.css      | N/A  |
| 20:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/shared1.css | N/A  |
| 23:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/shared.css  | N/A  |
| 26:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3a.css     | N/A  |
| 29:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3b.css     | N/A  |
| 32:0      | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3.css      | N/A  |
| 35:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4a.css     | N/A  |
| 38:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4b.css     | N/A  |
| 41:0      | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4.css      | N/A  |
| 44:0      | 7:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b.css       | N/A  |
| 47:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/c.css       | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/a.css

```javascript
.a {
  content: '1';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b0.css

```javascript
.b0 {
  content: '2';
}
```

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

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b2.css

```javascript
.b2 {
  content: '6';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/shared1.css

```javascript
.shared {
  content: '7';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/shared.css

```javascript
@import 'shared1.css';

.shared {
  content: '8';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3a.css

```javascript
@import 'shared.css';

.b3a {
  content: '9';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3b.css

```javascript
.b3a {
  content: '10';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3.css

```javascript
@import 'b3a.css';
@import 'b3b.css';

.b3 {
  content: '11';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4a.css

```javascript
@import 'shared.css';

.b4a {
  content: '12';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4b.css

```javascript
@import 'shared.css';

.b4b {
  content: '13';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4.css

```javascript
@import 'b4a.css';
@import 'b4b.css';

.b4 {
  content: '14';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b.css

```javascript
@import 'b0.css';
@import 'b1.css';
@import 'b2.css';
@import 'b3.css';
@import 'b4.css';

.b {
  content: '16';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/c.css

```javascript
@import 'shared.css';

.c {
  content: '17';
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/entry.css

```javascript
@import 'a.css';
@import 'b.css';
@import 'c.css';
```
