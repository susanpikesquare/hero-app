fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios bump_build

```sh
[bundle exec] fastlane ios bump_build
```

Increment the iOS build number (Info.plist CFBundleVersion)

### ios build

```sh
[bundle exec] fastlane ios build
```

Build locally — archive + export, no upload. For sanity checks.

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Archive + upload to TestFlight. The full ship.

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
