# Duolingo Desktop

A Tauri v2 desktop wrapper for the official Duolingo web experience, with automated macOS, Windows, and Linux builds.

> **Implementation note:** The provided Android ZIP is an extracted APK (Unity/IL2CPP binaries and Android resources), not the original editable Android project. It does not contain the complete source or private service implementation needed to recreate Duolingo natively. This first version therefore opens `https://www.duolingo.com/` in a Tauri desktop webview, reusing the official web client for accounts, lessons, courses, and synced progress.

The app does not collect credentials or grant the remote website Tauri native permissions. It uses the OS webview: WebView2 on Windows, WKWebView on macOS, and WebKitGTK on Linux. Compatibility can vary between these engines.

## Requirements

- Node.js 22+
- Rust stable
- Tauri v2 system prerequisites for the host OS

## Development

```sh
npm install
npm run tauri -- dev
```

## Build

```sh
npm run tauri -- build
```

## CI artifacts

GitHub Actions builds on pushes to `main`, pull requests, and manual dispatches:

| Platform | Runner | Output |
| --- | --- | --- |
| macOS Apple Silicon | `macos-15` | DMG |
| macOS Intel | `macos-15-intel` | DMG |
| Windows x64 | `windows-latest` | MSI and NSIS |
| Linux x64 | `ubuntu-24.04` | AppImage, DEB, RPM |

Installers are uploaded as workflow artifacts for 14 days. Builds are not signed or notarized, and no GitHub Release is created automatically.

## Future native port

A fully independent Duolingo client requires an authorized API/SDK or official source repository. The APK dump does not provide the full Unity IL2CPP source, backend, or private service contracts. With an official source tree or supported API, this project can be expanded beyond the webview wrapper.
