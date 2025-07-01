# Source Map Visualization

## Basic Information

## Source Files

1. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/other.module.css`
2. `turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.module.css`

## Mappings Overview

- **Total Mappings**: 2
- **Generated Lines**: 5

## Mapping Details (First 50 entries)

| Generated | Original | Source File                                                                                                                  | Name |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- | ---- |
| 2:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/other.module.css | N/A  |
| 5:0       | 1:0      | turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.module.css | N/A  |

## Source Contents

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/other.module.css

```javascript
.foo {
  background-color: red;
}
```

### turbopack:///[project]/turbopack/crates/turbopack-tests/tests/snapshot/cssmodules/relative-uri-import/input/index.module.css

```javascript
.bar {
  composes: foo from 'other.module.css';
}
```
