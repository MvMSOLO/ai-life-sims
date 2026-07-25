---
name: Vite config without Lovable wrapper
description: Replacing @lovable.dev/vite-tanstack-config with standard TanStack Start vite setup — must include @vitejs/plugin-react explicitly.
---

# Vite config — removing Lovable wrapper

## The rule
When replacing `@lovable.dev/vite-tanstack-config`, you MUST add `@vitejs/plugin-react` explicitly to the plugins array. The `tanstackStart` plugin alone does NOT include it and will error at runtime.

**Why:** Lovable's wrapper bundled react-refresh inside. Without it, TanStack Start throws "React Refresh runtime not found" during SSR in dev mode.

**How to apply (minimal correct config):**

```ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tanstackStart({ server: { entry: 'server' } }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
```

Also remove `@lovable.dev/vite-tanstack-config` from `package.json` devDependencies (`bun remove @lovable.dev/vite-tanstack-config`) and clean up `bunfig.toml` `minimumReleaseAgeExcludes`.
