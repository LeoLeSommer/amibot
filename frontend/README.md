# Frontend

Expo SDK 57 / React Native 0.86 / Expo Router client for web, iOS, and Android.
NativeWind 5 + Tailwind 4 provide styling; Gluestack UI v5 supplies the vendored
button primitives. The visual direction and glass material rules live in
[`DESIGN.md`](./DESIGN.md).

## Commands

Run from `frontend/`.

```bash
npm install
npm run web              # Expo Web dev server on :8081
npm run android          # native run; requires an emulator/device
npm run ios              # native run; requires a simulator
npx expo lint
npm run typecheck
npm run format
npm run format:check
npm test
npm run build:web        # static/web export into dist/
```

Use `npx expo install <package>` to add Expo packages so versions stay
SDK-compatible. Expo ships breaking changes every release: check the versioned
docs at <https://docs.expo.dev/versions/v57.0.0/> instead of relying on memory.

## Server resolution

The client has no hardcoded server URL. `src/lib/api/serverUrl.ts` resolves, in
order:

1. the value stored by the settings screen (`amibot.serverUrl`);
2. `EXPO_PUBLIC_AMIBOT_SERVER_URL` baked at build time;
3. `window.location.origin` on web.

The embedded web build therefore connects to its own origin. On native there is
no default: the first launch shows the settings screen. A stored empty string is
an explicit disconnect and must not fall back, so "Disconnect" survives a
reload. Stored invalid values are an explicit absence for the same reason.

For local web development, create `.env.local`:

```bash
EXPO_PUBLIC_AMIBOT_SERVER_URL=http://localhost:3000
```

Android emulators reach the host at `10.0.2.2`; the app does not rewrite URLs.

## Source structure

Four layers, enforced by `eslint-plugin-boundaries`:

```text
app      → features, shared, lib, i18n, constants
features → shared, lib, i18n, constants
shared   → lib, i18n, constants
lib      → i18n, constants
```

- `src/app/` — routes and layouts only. No business logic or direct API calls;
  use feature hooks and components.
- `src/features/<domain>/` — `components/`, `hooks/`, `services/`, `schema.ts`,
  `provider.tsx`, `queryKeys.ts`. Features never import another feature.
- `src/shared/` — cross-feature UI, the app shell, and the slot renderer. Never
  imports `features/`.
- `src/lib/` — domain-agnostic technical modules: API client, server URL
  resolution, storage, query client. Never imports `shared/` or `features/`.

Do not create empty folders, barrels, or `utils.ts`/`types.ts` catch-alls.

### Naming and exports

- Component files PascalCase; other files camelCase. Expo Router routes keep
  their conventions.
- Gluestack vendor files under `src/shared/components/ui/**` and
  `*.types.ts` are exempt.
- One public component per file, default export, exported `XxxProps` when props
  exist.
- Hook files default-export one hook and are imported as
  `import useXxx from "./useXxx"`. Destructure object/array returns at the call
  site; do not chain members on the hook call.
- Helpers, services, and schemas use named exports.

## Manifest and slots

`src/lib/api/manifest.ts` validates the v1 manifest with Zod. Unknown fields are
ignored; missing required fields and unknown `api_version` values reject with
`ApiError(..., code: "invalid_manifest")`.

`src/features/server/` connects to the server and fetches the manifest. The
manifest is window-scoped by the provider; changing or disconnecting the server
clears the React Query cache.

`src/shared/components/slots/` renders UI contributions:

- `visibleContributions` filters by platform and sorts by order, module, then
  id.
- `renderableContributions` also requires the component to exist in
  `catalogue.ts`.
- `Slot` renders only catalogue components and ignores unknown ones (with a dev
  warning).

The catalogue is intentionally empty. Modules never ship JavaScript: they
reference components compiled into the client. Reserved slot names are
documented in `frontend/AGENTS.md`; the manifest accepts any valid slot.

## Client API contract

`CLIENT_API_VERSION` in `src/lib/api/clientInfo.ts` is sent as
`X-Client-Api-Version` on every request. Keep it greater than or equal to the
backend `MIN_CLIENT_API_VERSION`. A `426` response triggers the blocking
`/update` screen. Bump the constant in the same change that depends on a new
backend contract.

## Tests

Jest covers pure logic only: URL resolution, manifest validation, interceptors,
storage, form schema, slot filtering, and i18n parity. Tests live in colocated
`__tests__/` folders and use English names. No component snapshots or style
assertions. HTTP contracts belong to Hurl; browser/device journeys belong to
Maestro.

## Maestro

Flows live in `../tests/web/maestro/` and `../tests/mobile/maestro/` and assert
English labels with `EXPO_PUBLIC_APP_LOCALE=en`. Keep `testID` values stable and
set `nativeID` as well so React Native Web exposes a DOM `id` selector.
