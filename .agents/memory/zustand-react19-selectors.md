---
name: Zustand v5 + React 19 selector pitfall
description: Object.values/Object.keys in useSim selectors cause "Maximum update depth exceeded" infinite loops; fix with useShallow.
---

# Zustand v5 + React 19 — selector stability

## The rule
Never use `Object.values()`, `Object.keys()`, or any selector that returns a **new reference** every call inside `useSim(selector)`. In React 19 + Zustand v5, `useSyncExternalStore` detects state changes via reference equality. A selector that always returns a new array/object triggers an infinite re-render loop.

**Why:** Zustand v5 uses `useSyncExternalStore`. If the selector returns a new array on every call (even with identical content), React thinks state changed → schedules a re-render → selector runs again → new array → infinite loop.

**How to apply:** Wrap such selectors with `useShallow` from `zustand/react/shallow`:

```ts
import { useShallow } from 'zustand/react/shallow'

// BAD — new array every render:
const agents = useSim((s) => Object.values(s.agents));

// GOOD — shallow-compared, stable when content unchanged:
const agents = useSim(useShallow((s) => Object.values(s.agents)));
const agentIds = useSim(useShallow((s) => Object.keys(s.agents)));
```

Also safe: read from `useSim.getState()` directly (outside render, e.g. in `useEffect` or event handlers) — no subscription involved.

The error message to watch for: `"The result of getServerSnapshot should be cached to avoid an infinite loop"` + `"Maximum update depth exceeded"` in `HamburgerMenu` or any component that subscribes to derived arrays.
