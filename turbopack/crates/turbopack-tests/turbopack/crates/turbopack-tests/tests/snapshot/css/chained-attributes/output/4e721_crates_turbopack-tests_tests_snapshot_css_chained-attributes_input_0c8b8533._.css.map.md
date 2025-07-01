# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/c.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/b.css`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/a.css`
4. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/style.css`

## Mappings Overview

- **Total Mappings**: 5
- **Generated Lines**: 38

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                   | Name |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------- | ---- |
| 5:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/c.css     | N/A  |
| 14:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/c.css     | N/A  |
| 23:0      | 4:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/b.css     | N/A  |
| 32:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/a.css     | N/A  |
| 38:0      | 3:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/style.css | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/c.css

```javascript
.imported {
  color: red;
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/b.css

```javascript
@import url('./c.css') layer(foo) (orientation: landscape);
@import url('./c.css') layer(bar) (orientation: portrait);

.imported {
  color: orange;
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/a.css

```javascript
@import url('./b.css') supports(font-format(woff2));

.imported {
  color: cyan;
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/chained-attributes/input/style.css

```javascript
@import url('./a.css') layer(layer) supports(not(display: inline-grid)) print;

.style {
  color: yellow;
}
```
