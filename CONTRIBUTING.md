# Contributing to Home Hero

Welcome. This doc is for developers joining the team — what to install, what to read, how to ship.

If you're not a developer (you're a clinician, advisor, or family using the product), this doc isn't for you. The product docs live at `/guide` once you're signed in.

---

## Read first

Before touching any code, read **[docs/product-philosophy.md](./docs/product-philosophy.md)** end to end. It's ~15 minutes. It defines what Home Hero is, what it isn't, and the two non-negotiables that override every code decision. The product is therapist-built; the codebase reflects that. Don't add a feature that violates the philosophy.

---

## The stack at a glance

| Layer | Tech | Where |
|---|---|---|
| App (web + iOS) | Expo Router + React Native | `src/app/`, `src/components/` |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) | `supabase/` |
| Hosting (web) | Vercel | auto-deploys from `main` |
| Hosting (iOS) | TestFlight via fastlane + Xcode local builds | `fastlane/`, `ios/` |
| AI | OpenAI gpt-4o-mini via Supabase Edge Function | `supabase/functions/evaluate-submission/` |

Single codebase, two surfaces (web + iOS) via Expo. The same React components ship to both. Platform-specific behavior is gated on `Platform.OS === 'ios'`.

---

## One-time local setup

You need: macOS, Node 22+, Xcode 26+, Ruby 3.x or 4.x, CocoaPods, Homebrew. The repo path **must not contain spaces** — keep it at e.g. `~/Development/hero-app/`, not `~/Hero App/`.

```bash
# 1. Clone the repo
git clone https://github.com/susanpikesquare/hero-app.git
cd hero-app

# 2. Install Node dependencies
npm install

# 3. Install Ruby dependencies (for fastlane)
bundle install

# 4. Install iOS native dependencies
cd ios && pod install && cd ..

# 5. Get the Supabase keys
#    You'll need to be invited to the Supabase project first.
#    Once invited, grab the URL + publishable (anon) key from:
#    https://supabase.com/dashboard/project/lgougfxihmbiezlmvbvm/settings/api
#    Put them in a `.env.local` file at the project root:
#
#      EXPO_PUBLIC_SUPABASE_URL=https://lgougfxihmbiezlmvbvm.supabase.co
#      EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...   (publishable, NOT service_role)
#
#    Never commit .env.local.
```

You're set up. Verify with:

```bash
npx expo start --web      # opens web app at localhost:8081
```

For native iOS:

```bash
npx expo run:ios          # builds + runs in iOS Simulator (~10 min first time, ~30s cached)
# OR: open ios/HomeHero.xcworkspace in Xcode and hit ⌘R
```

If `expo run:ios` errors on CocoaPods, you might be hitting the Ruby 4 + CocoaPods 1.16 incompat. Two workarounds: set `LANG=en_US.UTF-8 RCT_USE_PREBUILT_RNCORE=0 RCT_USE_RN_DEP=0 npx expo run:ios`, or use Xcode directly.

---

## Daily workflow

```bash
git pull                                  # always pull before starting
# ... write code ...
git add -p && git commit -m "feat: ..."   # commit with a message that describes the WHY
git push                                  # push to main (we don't do PRs yet)
```

The team is small enough that we push to `main` directly. Conventions:

- **Always `git pull` before starting work.** Catches anything the other person pushed.
- **Commit messages describe the why, not the what.** "Fix kid join blank-page redirect loop" is good. "Fix bug" is not.
- **Communicate before refactors that touch >5 files.** A quick Slack/text saves merge pain.
- **Don't push if tests/typecheck fail.** Run `npx tsc --noEmit` before pushing. Lint with `npx eslint .`.
- **Don't commit `.env.local`, service-role keys, or `ios/Pods/`.** The `.gitignore` should catch all of these; if you find yourself working around it, stop and ask.

---

## Deploying

### Web (instant via Vercel)

```bash
git push                                  # Vercel auto-deploys from main, ~60s
```

That's it. Production: https://hero-app-pied-three.vercel.app/

### iOS — OTA update (JS-only changes, free)

```bash
npx eas-cli update --branch production --message "what changed" --environment production
```

Hits the iOS app on next cold-launch + reload. Use this for any pure-JS change — bug fixes, copy, UI tweaks, new screens. **Most ships go via OTA.**

### iOS — full TestFlight build (native changes, ~15 min)

```bash
bundle exec fastlane beta
```

Use this when:
- Adding/removing a native module (anything in `node_modules` with iOS Swift/ObjC)
- Changing `app.json` (icon, splash, bundle id, native config)
- Updating Expo SDK version

This bumps the iOS build number, archives via Xcode locally, uploads to App Store Connect. No EAS cloud quota burn. See `fastlane/README.md` for details.

---

## Where things live

```
src/
  app/              # Expo Router file-based routing
    index.tsx         # / (landing page — web marketing + iOS chooser)
    /app/             # Parent dashboard + signed-in surfaces
    /kid/             # Kid-only surface (anon auth via join code)
    privacy.tsx       # Legal pages (data-driven)
    terms.tsx
    guide.tsx         # Customer-facing product guide
  components/       # Shared React components
  lib/              # Shared utilities (Supabase client, hooks, content)
  hooks/            # Reusable React hooks
  constants/        # Design tokens

supabase/
  migrations/       # SQL schema migrations (timestamped, applied in order)
  functions/        # Edge Functions (Deno)

ios/                # Native Xcode project (commit ios/, not ios/Pods/)
fastlane/           # Local iOS release pipeline
docs/               # Internal docs (philosophy, etc.)
scripts/            # One-off ops scripts (seed photos, etc.)
```

---

## Database changes

Migrations are SQL files in `supabase/migrations/` with a timestamp prefix. To apply a change:

1. Write the migration as `supabase/migrations/{YYYYMMDDHHMMSS}_v0_{short_name}.sql`
2. Apply it to the live project — easiest via the Supabase MCP (if using Claude Code) or by pasting into the SQL editor at https://supabase.com/dashboard/project/lgougfxihmbiezlmvbvm/sql
3. Regenerate types: in the Supabase dashboard, Project Settings → API → Database types. Replace `src/lib/database.types.ts`. (Or edit by hand if it's a small change.)
4. Commit the migration file + updated types together

Don't run migrations against the production project from your local CLI unless you really know what you're doing — there's no staging environment yet.

---

## Style notes

- TypeScript strict. No `any`. If you find yourself reaching for it, stop.
- Functional components only. No class components.
- The `KidShell` brand is hard-walled from parent surfaces. Kid surfaces never show parent-facing copy raw. Parent surfaces never show the bunny mascot. See product-philosophy.md.
- React Native `<Text>` does NOT decode HTML entities. Use Unicode characters directly (`'`, not `&rsquo;`).
- Don't use absolute paths anywhere — `$SRCROOT`, `~`, etc. break on someone else's machine.

---

## Who to ask for what

- **Product / clinical questions**: Erica (LMFT, founding consultant)
- **Auth / Supabase / data model**: ask Susan first, then check `supabase/migrations/`
- **iOS native / build pipeline**: this doc + `fastlane/README.md`
- **Anything else**: post in the team channel before assuming

Welcome aboard.
