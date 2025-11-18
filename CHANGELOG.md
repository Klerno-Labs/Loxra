# Changelog

All notable changes to Loxra will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-16

### Added

- **Drag & Drop Support**: XML files can now be dragged directly onto the Validator page
- **Global Keyboard Shortcuts**: Navigate and perform actions with keyboard shortcuts (Ctrl+N, Ctrl+S, etc.)
- **Auto-Save Drafts**: Automatic saving of work every 2 seconds with manual save support (Ctrl+S)
- **Dark/Light Theme Toggle**: Switch between themes with persistent preferences
- **Loading Skeletons**: Replaced spinners with skeleton loading states for better UX
- **Empty States**: Helpful empty state messages with actionable buttons
- **Keyboard Shortcuts Help Modal**: Press Ctrl+/ to view all shortcuts
- **GitHub Actions CI/CD**: Automated testing, building, and release workflows
- **Draft Management Store**: Zustand-based state management for drafts
- **Theme Store**: Persistent theme state with Zustand

### Changed

- **Electron**: Upgraded from v31.7.7 to v33.2.0
- **Vite**: Upgraded from v5.4.9 to v6.0.1 (major version)
- **TypeScript**: Upgraded from v5.6.3 to v5.7.2
- **React Router**: Upgraded from v6.28.0 to v7.0.2
- **React Query**: Upgraded from v5.56.0 to v5.62.7
- **Electron Builder**: Upgraded from v26.0.12 to v25.1.8
- All other dependencies updated to latest stable versions
- Validator page now shows enhanced error messages with better formatting
- App shell now manages global theme and keyboard shortcuts

### Fixed

- Validation errors now properly display when multiple errors exist
- Theme persistence across app restarts
- Input focus handling with keyboard shortcuts

### Security

- Updated all dependencies to patch known vulnerabilities
- Maintained offline-first security model

## [1.0.0] - Initial Release

### Features

- ISO-20022 message builder for pain.001, pacs.008, pacs.009, camt.053
- XML validation with bundled XSD schemas
- Template management system
- Validation history tracking
- CSV batch generation with ZIP export
- Rail adapter support (SEPA, CBPR)
- Inline field validation (IBAN, BIC, currency)
- XML import and pretty-printing
- Offline-first architecture with local schema validation
- Electron desktop app for Windows, macOS, Linux
- Dark-themed UI with Loxra branding
- React + TypeScript frontend with Vite
- libxml2-wasm for XSD validation

[2.0.0]: https://github.com/Somli/Loxra/releases/tag/v2.0.0
[1.0.0]: https://github.com/Somli/Loxra/releases/tag/v1.0.0
