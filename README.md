# Duolingo Desktop

A Tauri v2 desktop application that is being rebuilt around the Android app's mobile learning experience.

## Current implementation

The frontend now contains a responsive, mobile-inspired app shell with:

- Learn tab and vertically scrolling lesson path
- Unit header, guidebook entry point, lesson and chest nodes
- Weekly league, daily quests, shop, and profile tabs
- Lesson question flow, answer feedback, progress, and completion screen
- Course selector and settings sheet
- Animated navigation, lesson transitions, and bottom sheets

The Android APK extraction supplied for this project was inspected for the navigation and layout structure. In particular, `home_content.xml`, `fragment_path.xml`, `view_path_level_rive.xml`, and `view_tab_item.xml` establish the top course/status area, the scrollable learning path, path-node treatment, and five-item bottom navigation. The APK's course catalog contains 303 course identifiers.

**Important:** this is an independently implemented local UI preview. It does not yet authenticate to Duolingo, read a real learner's course state, sync XP/gems/streaks, or submit lesson answers to Duolingo. Sample leaderboard, profile, currency, and lesson data are local demo data. The APK extraction contains decompiled Android classes/resources and Unity IL2CPP binaries, not the original editable Unity project or the private server implementation.

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
