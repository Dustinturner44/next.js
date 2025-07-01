# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/imported.css`
3. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.css`
4. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.module.css`
5. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css`

## Mappings Overview

- **Total Mappings**: 9
- **Generated Lines**: 21

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                            | Name |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.css        | N/A  |
| 5:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/imported.css                      | N/A  |
| 10:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/imported.css                      | N/A  |
| 15:0      | 6:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.css                         | N/A  |
| 18:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.module.css | N/A  |
| 21:0      | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css                  | N/A  |
| 21:47     | 3:2      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css                  | N/A  |
| 21:169    | 9:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css                  | N/A  |
| 21:227    | 14:0     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css                  | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.css

```javascript
.foo-style { color: green; }
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/imported.css

```javascript
.imported {
  color: cyan;
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.css

```javascript
@import url('./imported.css');
/* De-duplicate similar imports */
@import url('../input/imported.css');
/* But not if they have different attributes */
@import url('./imported.css') layer(layer) print;
.style {
  color: yellow;
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/node_modules/foo/style.module.css

```javascript
.foo-module-style { color: blue; }
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css

```javascript
.module-style {
  color: magenta;
  > h1,
  + .inner {
    background: purple;
  }
}

.composed-module-style {
  composes: foo-module-style from 'foo/style.module.css';
  color: green;
}

.another-composed-module-style {
  composes: foo-module-style from 'foo/style.module.css';
  color: yellow;
}
```
