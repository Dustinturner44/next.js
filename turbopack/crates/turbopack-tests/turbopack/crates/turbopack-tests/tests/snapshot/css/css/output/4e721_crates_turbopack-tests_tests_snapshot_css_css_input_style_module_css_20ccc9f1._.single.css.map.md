# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css`

## Mappings Overview

- **Total Mappings**: 4
- **Generated Lines**: 2

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                           | Name |
| --------- | -------- | ----------------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css | N/A  |
| 2:47      | 3:2      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css | N/A  |
| 2:169     | 9:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css | N/A  |
| 2:227     | 14:0     | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.module.css | N/A  |

## Source Contents

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
