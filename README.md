# Nova Mobile

Nova — the mobile companion to the TenderPilot AI web app. An Expo (React Native) app that signs in to the same Supabase project as TenderPilot AI, so accounts and data are shared between web and mobile.

## Getting started

1. Copy `.env.example` to `.env.local` and fill in the values. The two Supabase values are the same as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the TenderPilot AI web app's `.env`. `EXPO_PUBLIC_WEB_APP_URL` is optional; it is where "Create an account" sends people.
2. Install and run:

```bash
npm install
npm start        # Expo dev server; scan the QR code with Expo Go
npm run android  # open on Android
npm run ios      # open on iOS
```

New accounts are created on the TenderPilot AI web app; the mobile app only signs in.

## Project layout

- `app/` — screens, using Expo Router (file name = route)
  - `index.tsx` — landing screen
  - `login.tsx` — sign in
  - `(app)/` — screens that need a signed-in user; `home.tsx` is the dashboard, `account.tsx` holds currency and sign out
- `src/lib/supabase.ts` — Supabase client shared by the whole app
- `src/providers/auth-provider.tsx` — session state, sign in/out, "Remember me"
- `src/providers/currency-provider.tsx` — display currency (rand by default); amounts are stored in rand and converted with daily rates from ExchangeRate-API
- `src/components/glass.tsx` — frosted-glass panel used by the bottom menu
- `assets/` — app icons, splash, logo and NOVA avatar
- `docs/design/` — Nova concept art and branding
- `.claude/`, `.agents/`, `.gemini/`, `.mcp.json` — [Argent](https://github.com/software-mansion/argent) agent tooling for driving simulators/emulators
