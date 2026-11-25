# Frontend Guidelines

This is an Expo / React Native application served on web, iOS, and Android.
Prioritize cross-platform behavior and keep the web build self-contained.

Run every command here from `frontend/` unless stated otherwise.

## Expo changed — do not trust training data

Expo ships breaking changes every SDK release. Before writing code that touches
an Expo or React Native API:

1. Read the `expo` version in `package.json` (SDK 57).
2. Read the matching docs: <https://docs.expo.dev/versions/v57.0.0/>.
3. Use `npx expo install <package>` instead of `npm install` for Expo modules.

## Commands

```bash
npx expo start            # dev server
npx expo start --web      # web dev server on :8081
npx expo lint             # lint
npx tsc --noEmit          # typecheck
npm run format            # Prettier write
npm run format:check      # Prettier check
npm test                  # Jest single run
npx expo-doctor           # dependency/config diagnosis
npx expo install --fix    # SDK-compatible version fixes
```

Prettier owns formatting and import order. Do not hand-format.

## Tests (Jest)

Jest owns frontend logic and side-effect boundaries. It must not duplicate Hurl
(HTTP contracts) or Maestro (device journeys).

- **Placement:** colocated `__tests__/` under `src/lib`, `src/features`, and
  `src/shared`. Never under `src/app`.
- **Naming:** `*.test.ts` / `*.test.tsx`, English test names.
- **Required:** URL resolution, manifest validation, interceptors, storage,
  form schemas, slot filtering.
- **No:** component snapshots, style assertions, localized text assertions.
- **Mocking:** mock at the edges (`@/lib/api/client`, storage, Expo, router).
  Never mock the unit under test.

## Navigation

Use Expo Router. Routes live in `src/app/`; every file is a screen and
`_layout.tsx` defines a navigator. Keep non-route code outside `src/app/`.

Screens:

- `index.tsx` — loading gate: settings without a server, home otherwise.
- `settings.tsx` — server form and status, always reachable.
- `home.tsx` — module surface; redirects to settings without a server.
- `update.tsx` — blocking update screen, gestures disabled.
- `+not-found.tsx`.

## Layering

```text
app      → features, shared, lib, i18n, constants
features → shared, lib, i18n, constants
shared   → lib, i18n, constants
lib      → i18n, constants
```

Enforced by `eslint-plugin-boundaries`. Features never import another feature.
`src/app/` holds routes and layouts only. App layouts are the composition root
and may call feature hooks.

Feature folders, created only when needed: `components/`, `hooks/`,
`services/`, `helpers/`, `schema.ts`, `provider.tsx`, `queryKeys.ts`. No
barrels, no `types.ts`/`utils.ts` catch-alls.

## Naming and exports

- Component files PascalCase; other files camelCase. `src/app/**`,
  `src/shared/components/ui/**`, feature `provider.tsx`, and `*.types.ts` are
  exempt from the filename rule.
- Platform files: `Component.web.tsx`, `Component.types.ts`.
- One public component per file, default export, exported props type.
- Hook files default-export exactly one hook (`export default function
useXxx()`); import them directly. Destructure object/array returns at the call
  site.
- Helpers, services, schemas: named exports.

## Server URL and API client

- `src/lib/api/serverUrl.ts` is pure: normalize and resolve, no React, no
  storage.
- Resolution order: stored > `EXPO_PUBLIC_AMIBOT_SERVER_URL` > web origin. On
  native there is no default.
- Stored `""` is the explicit disconnect sentinel; stored invalid values are an
  explicit absence. Neither may fall back.
- `setApiBaseUrl` updates the Axios instance; do not create extra Axios
  instances.
- `CLIENT_API_VERSION` in `clientInfo.ts` is sent on every request. A `426`
  response shows `/update`.

## Manifest and slots

- Zod schema in `src/lib/api/manifest.ts`; unknown fields ignored, required
  fields and `api_version` validated.
- The server manifest is rebuilt per request; client ordering must match:
  order, module, id.
- `platforms` absent means all; empty means none.
- The catalogue is the only place components can be referenced. Never load
  JavaScript from a remote URL.
- Rendered slots: `app.header`, `app.main`, `app.settings`. Reserved names:
  `app.navigation`, `app.sidebar`, `chat.*`.

## UI

- Read `frontend/DESIGN.md` before any visual change; it is the source of
  truth for the Liquid Glass direction and its anti-patterns.
- NativeWind classes come from `src/global.css`; JS-only colors from
  `constants/theme.ts`.
- Chrome uses `GlassSurface` variants (`navigation`, `floating`, `overlay`)
  instead of ad-hoc blur, opacity, or border classes. Blur, opacity, border,
  shadow, and radius values live in `constants/theme.ts`.
- Never nest glass surfaces and never apply glass to content cards, list rows,
  settings sections, or inputs. Slot contributions rendered inside the glass
  header must return plain content.
- Reduced transparency falls back to an opaque surface; reduced motion disables
  stack transitions. Use `useAccessibilityPreferences`, and do not animate
  glass decoration.
- Gluestack vendor files under `src/shared/components/ui/**` stay untouched
  except when upgrading the vendor source.
- No drawer, sidebar, tabs, or auth until their modules land.
- User-facing strings live in `src/i18n/locales/{en,fr}.json`; no hardcoded
  copy in components.

## Maestro

- Every user-facing flow ships or updates a flow in `tests/web/maestro/` or
  `tests/mobile/maestro/`.
- The web flow runs against the embedded build in the test image, with
  `EXPO_PUBLIC_APP_LOCALE=en`.
- Use stable `testID` values and set `nativeID` too for web DOM selectors.
- Run one flow at a time from the repository root.

## Rules

- `ios/` and `android/` are generated. Never edit them by hand; configure via
  `app.json`.
- Expo Go cannot load custom native code; use a development build for native
  packages.
- Prefer Expo modules over third-party libraries.
- Do not add dependencies without asking.
