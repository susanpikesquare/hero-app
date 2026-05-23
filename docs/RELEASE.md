# Home Hero — TestFlight release runbook

Step-by-step for getting a build onto your iPhone (and Erica's, and anyone else you invite) via TestFlight.

## One-time setup

### 1. Install + log into the EAS CLI

```bash
npm install -g eas-cli
eas login
```

When `eas login` prompts, use the Expo account you want to own the build. If you don't have one, sign up at https://expo.dev — free.

### 2. Link this project to EAS

From the project root:

```bash
eas init
```

This creates an Expo project ID and writes it back into `app.json` under `expo.extra.eas.projectId`. Commit that change.

### 3. App Store Connect: create the app entry

You only do this once per app.

1. Sign in at https://appstoreconnect.apple.com
2. **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform:** iOS
   - **Name:** Home Hero
   - **Primary language:** English (U.S.)
   - **Bundle ID:** `co.pikesquare.homehero` (must match `ios.bundleIdentifier` in `app.json`. If it's not in the dropdown, register it first at https://developer.apple.com/account/resources/identifiers/list)
   - **SKU:** something unique, e.g. `home-hero-001`
4. Click **Create**.
5. Once the app exists, copy its **Apple ID** (a long number in the App Information section) and paste it into `eas.json` under `submit.production.ios.ascAppId` (replacing `REPLACE_AFTER_FIRST_BUILD`).

## Every release

### 4. Build for TestFlight

```bash
eas build --platform ios --profile production
```

What happens:

- EAS prompts you to sign in to Apple. The first build asks several questions about distribution certificates and provisioning profiles — let EAS manage them (the default).
- Build runs in EAS's cloud (~20–40 min). You can close the terminal; you'll get an email when it's done.
- When done, the `.ipa` is hosted at a URL in your terminal output and on https://expo.dev.

### 5. Upload to TestFlight

```bash
eas submit --platform ios --profile production --latest
```

This uploads the latest build to App Store Connect. Apple processes it (~15–60 min) and then it appears in TestFlight.

### 6. Add testers

In App Store Connect → **TestFlight** tab:

- **Internal Testing** (recommended for the founding cohort): up to 100 people who already have App Store Connect access. No Apple review needed; builds available within minutes of processing.
- **External Testing**: up to 10,000 people by email. Requires a one-time "Beta App Review" from Apple (~24–48 hours) for each new build group.

For Erica + her clients, internal testing is the move:

1. **Users and Access** → invite Erica (and anyone else) as a user. Pick the **App Manager** or **Developer** role.
2. Back in TestFlight → **Internal Testing** → create a group → add Erica + testers.
3. They get an email; they install **TestFlight** from the App Store, then install Home Hero from inside TestFlight.

## Quick reference

```bash
# Cut a new build
eas build --platform ios --profile production

# Upload latest build to TestFlight
eas submit --platform ios --profile production --latest

# See your builds
eas build:list --platform ios

# Run a development build on a simulator (no TestFlight needed)
eas build --platform ios --profile development
```

## Troubleshooting

- **"App needs version + buildNumber"**: `app.json` ships with `version: 0.0.1` and `ios.buildNumber: 1`. The `production` profile has `autoIncrement: true`, so the build number auto-increments. If a build is rejected as a duplicate, bump `version` manually in `app.json` before the next build.
- **Bundle ID mismatch**: `app.json` and App Store Connect must agree on `co.pikesquare.homehero`. If you change the bundle ID, you have to create a new App Store Connect entry.
- **Apple ID 2FA prompts**: EAS will ask for an app-specific password. Generate one at https://appleid.apple.com → **Sign-In and Security** → **App-Specific Passwords**.
- **EAS free-tier queue is slow**: builds can wait 10–20 min before they start during peak hours. Paid tier ($19/mo) skips the queue.

## What's NOT in this app yet (good to know before testing)

- AI photo validation
- Reference-photo upload (parent side)
- Submission review buttons (approve / needs work)
- Push notifications
- Reward / streak mechanics

Anything beyond "kid takes a photo, parent sees it in a list" is on the next-session list.
