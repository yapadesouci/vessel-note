---
name: cargo-creation
description: Use when creating a new Vessel cargo — a zip-packaged static web app that runs sandboxed in the Vessel host with SDK access to storage, notifications, clipboard, and network
---

# Vessel Cargo Creation

## Overview

A Vessel **cargo** is a ZIP file containing one or more static web apps (`manifest.json` + `apps/` + bundled SDK). All apps in a cargo share a single `sdk/index.js`. Cargos run in sandboxed iframes inside the Vessel Electron host, communicating with native APIs via the SDK through postMessage.

## File Structure

```
my-dist/
  manifest.json        ← required, must be at zip root
  sdk/
    index.js           ← SDK bundle (shared by all apps, committed in template)
  apps/
    {appId}/
      index.html       ← entry point for this app
      assets/          ← optional: images, fonts, additional JS/CSS
```

## manifest.json

```json
{
  "id": "my-dist",
  "name": "My Distribution",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "What this cargo does",
  "icon": "🎯",
  "cdns": ["unpkg", "jsdelivr"],
  "apps": [
    { "id": "main",  "name": "Main App",  "permissions": ["storage"] },
    { "id": "extra", "name": "Extra App", "permissions": ["network"] }
  ]
}
```

| Field | Rule |
|-------|------|
| `id` | `/^[a-z0-9-]{1,64}$/` — lowercase alphanumeric + hyphens only |
| `name` | Required non-empty string |
| `version` | Valid semver — `1.0.0` not `v1.0.0` |
| `author` | Required non-empty string |
| `apps` | Required non-empty array. Each entry: `{ id, name, permissions }`. Permissions are a subset of `["storage", "notifications", "clipboard", "network"]` — declare only what you use |
| `cdns` | Optional array of curated CDN keys. Allowed values: `"unpkg"`, `"jsdelivr"`, `"cdnjs"`. Enables loading scripts/styles from those CDNs via CSP. |
| `icon` | Optional emoji or image URL |
| `description` | Optional, shown in Marketplace |

## SDK Integration

```html
<script type="module">
  import { ready, storage, notifications, clipboard, http } from '../../sdk/index.js'

  // REQUIRED: handshakes with host — must complete before any API call
  await ready()

  // APIs are now usable
  const count = await storage.get('count') ?? 0
  await storage.set('count', count + 1)
  await notifications.send({ title: 'Done', body: 'Count updated' })
  await clipboard.write(String(count + 1))
  const res = await http.fetch('https://api.example.com/data')
</script>
```

**`await ready()` is mandatory.** It performs the postMessage handshake with the host. Calling any API before it resolves throws immediately. If the host doesn't respond within 5 s, it throws `VesselHandshakeTimeout`.

## SDK API Reference

| API | Signature | Notes |
|-----|-----------|-------|
| `storage.get` | `(key: string) → unknown \| null` | Per-app JSON store, 10 MB max |
| `storage.set` | `(key: string, value: unknown) → void` | Persisted at `~/.vessel/storage/<distId>__<appId>.json` |
| `notifications.send` | `({ title, body }) → void` | Requires `notifications` permission |
| `notifications.schedule` | `({ items: ScheduledNotif[] }) → void` | Requires `notifications` permission. Replaces all scheduled notifications. `ScheduledNotif`: `{ id, title, body, fireAt }` where `fireAt` is a Unix ms timestamp. Max lookahead: 7 days. |
| `clipboard.write` | `(text: string) → void` | Requires `clipboard` permission |
| `http.fetch` | `(url: string, options?: HttpOptions) → HttpResponse` | Requires `network` permission. `HttpOptions`: `{ method?, headers?, body? }`. `HttpResponse`: `{ status, headers, body, bodyEncoding: 'text'\|'base64' }` |

Calling an API without the matching permission throws `VesselPermissionDenied`.

## Packaging

The template ships with `sdk/index.js` already committed — no npm install required.

```bash
# Using the included script
node scripts/pack.js

# Or manually — must zip from inside the directory
cd my-dist/
zip -r ../my-dist.zip .
```

Update the `outFile` variable in `scripts/pack.js` to match your cargo ID.

## Security Constraints

Cargos run in a sandboxed iframe. The host enforces this CSP on every response:

```
default-src vessel:
script-src vessel: 'unsafe-inline' [cdn-origins if declared]
style-src vessel: 'unsafe-inline' [cdn-origins if declared]
img-src vessel: data: [cdn-origins if declared]
connect-src vessel:
```

**What this means for cargo authors:**
- ❌ Direct `fetch('https://...')` is blocked — use `http.fetch()` instead
- ✅ `http.fetch(url, options?)` makes external HTTPS calls via the host — requires `network` permission
- ✅ Loading scripts/styles from `unpkg`, `jsdelivr`, or `cdnjs` is allowed if declared in `cdns`
- ❌ Loading CDN fonts is not supported even with `cdns` declared
- ✅ Inline `<style>` and `<script>` blocks work
- ✅ `data:` URIs for images work
- ✅ ES module imports from relative paths work

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Calling any API before `await ready()` | Move all API calls after `await ready()` |
| `"version": "v1.0.0"` | Remove the `v` — must be bare semver |
| `"id": "My Cargo"` | Use `my-cargo` — lowercase, hyphens only |
| `fetch('https://...')` directly | Use `http.fetch(...)` and add `"network"` to permissions |
| Loading a CDN script without declaring it | Add the CDN key to `"cdns"`. Allowed: `"unpkg"`, `"jsdelivr"`, `"cdnjs"`. |
| Loading CDN fonts | Not supported — bundle fonts locally |
| Zipping the folder itself | `cd my-dist && zip -r ../x.zip .` not `zip -r x.zip my-dist/` |
| Top-level `await` outside a module | Add `type="module"` to your `<script>` tag |
| Importing SDK as `./sdk/index.js` from inside an app | Use `../../sdk/index.js` — apps live two levels deep |
| Putting `index.html` at the zip root | Place it in `apps/{appId}/index.html` |
| Top-level `"permissions"` in manifest | Permissions belong in each app entry, not at the cargo level |
| Single app with no `apps` array | Always use `"apps": [...]` — even single-app cargos require the array |
| Missing `author` field | `author` is required — add a non-empty string |
