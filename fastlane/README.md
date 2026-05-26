# fastlane

Local-only release pipeline for the iOS app. Replaces `eas build --platform ios` so we never burn EAS Build cloud quota.

## One-time setup

```bash
# Install Ruby dependencies (fastlane and friends)
bundle install
```

If `bundle` isn't found, you have it from the system Ruby — that's fine, just don't use `sudo`. If permission errors, run `gem install bundler --user-install` first.

The first run of `bundle exec fastlane beta` will prompt for your Apple ID 2FA. After that, fastlane caches the session token for 30 days.

## Daily workflow

```bash
git pull                                  # get the latest from Claude's commits
bundle exec fastlane build                # optional: local-only sanity check (~10 min)
bundle exec fastlane beta                 # full ship to TestFlight (~15 min)
```

That's it. No cloud quota burned, no EAS submit interactive prompts, no `--non-interactive` env-var dance.

## What each lane does

| Lane | What it does |
|---|---|
| `bump_build` | Just increments the iOS build number. Use when you need to bump without shipping. |
| `build` | Bumps build number + archives the app + exports an `.ipa` into `build/`. No upload. Run this to verify a build works before committing to the upload step. |
| `beta` | Everything in `build` + uploads to TestFlight + commits the build-number bump + pushes to git. The full ship. |

## What's where

- `fastlane/Fastfile` — the lane definitions (this is the script)
- `fastlane/Appfile` — bundle ID, Apple ID, team ID (no secrets here)
- `Gemfile` (at project root) — fastlane version pinning

## Notes

- **Signing**: fastlane uses your local Keychain's distribution certificate, which was set up via `npx eas-cli credentials --platform ios` (May 2026). If Xcode can build the app, fastlane can sign it.
- **Build number**: `beta` auto-increments and pushes the bump back to GitHub. So the next person to `git pull` sees the new build number. No conflicts as long as only one person ships at a time.
- **First ship after this setup**: the build number in Xcode is `1` (or whatever the project file says). App Store Connect rejects this because build 9 was the last EAS-managed one. After the first `fastlane beta`, the number will increment, and after that everything chains correctly.
