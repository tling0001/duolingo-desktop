# Duolingo Desktop

A Tauri v2 desktop application that is being rebuilt around the Android app's mobile learning experience.

## Current implementation

The frontend now contains a responsive app shell based on the supplied Android APK layouts, including:

- Learn tab and vertically scrolling lesson path
- Unit header, guidebook entry point, lesson and chest nodes
- Leagues podium and standings, Daily / Monthly quest tabs, shop catalog and Profile Achievements / Stats tabs
- Course-specific sample exercises for Spanish, French, German, Italian, Portuguese and Japanese
- Persistent local hearts, streak freezes, one-use XP boost and gem purchases
- Lesson question flow, answer feedback, progress, and completion screen
- Course selector and settings sheet
- Animated navigation, lesson transitions, and bottom sheets

The Android APK extraction supplied for this project was inspected for navigation, node geometry, quest cards, shop, league, and profile structure. See [Android source mapping](docs/android-source-map.md) for verified layout and API references.

**Account connection:** Settings now accepts an existing Duolingo JWT and makes authenticated, read-only requests to the three Android routes verified in the APK (`/users/{id}/quests`, `/progress`, and `/schema`). The JWT is held in memory only. This is not a password login or a complete account sync; lesson answers, course-path loading, leagues, profile details, and purchases are not connected. The current Rive node animation is an SVG/CSS recreation, not the original Rive binary. The APK extraction contains decompiled Android classes/resources and Unity IL2CPP binaries, not the original editable Unity project or the private server implementation.

## Windows install location

The Windows NSIS installer is configured for a per-user install at:

```text
%LOCALAPPDATA%\Programs\Duolingo
```

A custom NSIS template is pinned to Tauri CLI v2.12.4 and changes the current-user default install directory while preserving the normal directory selection, registry, shortcut, and uninstall flow.

## Requirements

- Node.js 22+
- Rust stable
- Tauri v2 system prerequisites for the host OS

## Development

```sh
npm install
npm run tauri -- dev
```

## Production build

```sh
npm run tauri -- build
```

## CI artifacts

GitHub Actions builds on pushes to `main`, pull requests, and manual dispatches:

| Platform | Runner | Output |
| --- | --- | --- |
| macOS Apple Silicon | `macos-15` | DMG |
| macOS Intel | `macos-15-intel` | DMG |
| Windows x64 | `windows-latest` | NSIS EXE |
| Linux x64 | `ubuntu-24.04` | AppImage, DEB, RPM |

Installers are uploaded as workflow artifacts for 14 days. Builds are not signed or notarized, and no GitHub Release is created automatically.
