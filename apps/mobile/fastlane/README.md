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

### ios upload_metadata

```sh
[bundle exec] fastlane ios upload_metadata
```

Upload metadata and screenshots to App Store Connect

### ios upload_screenshots

```sh
[bundle exec] fastlane ios upload_screenshots
```

Upload only screenshots to App Store Connect

### ios upload_metadata_only

```sh
[bundle exec] fastlane ios upload_metadata_only
```

Upload only metadata (no screenshots) to App Store Connect

### ios download_metadata

```sh
[bundle exec] fastlane ios download_metadata
```

Download existing metadata from App Store Connect

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build and upload to TestFlight

### ios upload_testflight

```sh
[bundle exec] fastlane ios upload_testflight
```

Upload an existing IPA to TestFlight

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
