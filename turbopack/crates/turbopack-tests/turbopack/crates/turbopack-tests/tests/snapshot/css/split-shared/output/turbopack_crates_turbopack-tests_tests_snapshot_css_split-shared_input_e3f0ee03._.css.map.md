# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/shared1.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/shared.css`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4a.css`
4. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4b.css`
5. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4.css`
6. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3a.css`
7. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3b.css`
8. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3.css`
9. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/entry2.css`

## Mappings Overview

- **Total Mappings**: 8
- **Generated Lines**: 23

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                               | Name |
| --------- | -------- | --------------------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/shared1.css | N/A  |
| 5:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/shared.css  | N/A  |
| 8:0       | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4a.css     | N/A  |
| 11:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4b.css     | N/A  |
| 14:0      | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b4.css      | N/A  |
| 17:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3a.css     | N/A  |
| 20:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3b.css     | N/A  |
| 23:0      | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/b3.css      | N/A  |

## Source Contents

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

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/split-shared/input/entry2.css

```javascript
@import 'b4.css';
@import 'b3.css';
```
