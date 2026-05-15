# vessel-template

Minimal starter template for a [Vessel](https://vessel.app) cargo — a sandboxed static web app distributed as a ZIP file.

## Getting Started

1. **Clone this repo** and rename it for your project
2. **Edit `manifest.json`:**
   - Set `id` to a unique cargo ID (e.g. `"my-project-dist"`)
   - Set `name`, `author`, and `description`
   - Rename the app entry `id` from `"my-app"` to your app name
3. **Rename the app folder:** `apps/my-app/` → `apps/<your-app-name>/`
4. **Edit `apps/<your-app-name>/index.html`** — this is your app entry point
5. **Add permissions** in `manifest.json` if your app needs SDK APIs:
   - `"storage"` — persistent key/value storage
   - `"network"` — proxied HTTP requests
   - `"notifications"` — native system notifications
   - `"clipboard"` — write to system clipboard
6. **Replace `my-app-dist` with your cargo ID** in both `scripts/pack.js` and `.github/workflows/release.yml`

## Build

Requires Node.js 18+.

```bash
node scripts/pack.js
```

Produces `dist/<cargo-id>.zip`. No `npm install` needed — the SDK bundle is included in this repo at `sdk/index.js`.

## Install

Drag the zip file into the Vessel app.

## SDK Usage

```js
import { ready, storage, http, notifications, clipboard } from '../../sdk/index.js'

// Always call ready() first
await ready()

// Then use whichever APIs your app declared in manifest.json
await storage.set('key', 'value')
const value = await storage.get('key')
```

See `sdk/index.js` for the full API.
