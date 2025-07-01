# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.css`

## Mappings Overview

- **Total Mappings**: 1
- **Generated Lines**: 2

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                    | Name |
| --------- | -------- | ---------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 6:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/css/css/input/style.css | N/A  |

## Source Contents

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
