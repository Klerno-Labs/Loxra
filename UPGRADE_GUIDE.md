# Loxra Upgrade Guide

## 🎉 What's New in Version 2.0

### Major Enhancements

#### 1. **Modern Dependencies** ✨

- **Electron** upgraded to v33.2.0 (latest stable)
- **Vite** upgraded to v6.0.1 (major version bump with performance improvements)
- **TypeScript** upgraded to v5.7.2
- **React Router** upgraded to v7.0.2
- **React Query** upgraded to v5.62.7
- All other dependencies updated to latest versions

#### 2. **Drag & Drop Support** 🎯

The Validator page now supports drag-and-drop for XML files:

- Simply drag an XML file onto the validator textarea
- Visual feedback when dragging files over the drop zone
- Instantly populates the validation field

**How to use:**

1. Navigate to Validator page (Ctrl+3)
2. Drag any `.xml` file from your file explorer
3. Drop it onto the textarea
4. File content is automatically loaded

#### 3. **Global Keyboard Shortcuts** ⌨️

Boost your productivity with keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New message (navigate to Builder) |
| `Ctrl+S` | Save current draft |
| `Ctrl+Shift+V` | Validate (navigate to Validator) |
| `Ctrl+E` | Export current message to clipboard |
| `Ctrl+1` | Go to Dashboard |
| `Ctrl+2` | Go to Builder |
| `Ctrl+3` | Go to Validator |
| `Ctrl+4` | Go to Templates |
| `Ctrl+5` | Go to Settings |
| `Ctrl+/` | Show keyboard shortcuts help |

**Press `Ctrl+/` anytime to see the full shortcuts modal!**

#### 4. **Auto-Save Drafts** 💾

Never lose your work again:

- **Auto-save**: Automatically saves your work every 2 seconds
- **Manual save**: Press `Ctrl+S` to save instantly with a custom name
- **Draft recovery**: Reload drafts from the Templates page
- **Storage**: Up to 50 most recent drafts kept locally

**How it works:**

- Edit any message in the Builder
- After 2 seconds of inactivity, it's auto-saved
- Find your drafts in the Templates page
- Auto-saved drafts are labeled "Auto-save: [type]"

#### 5. **Dark/Light Theme Toggle** 🌓

Switch between themes easily:

- Theme toggle button in the top navigation bar
- Preferences saved to localStorage
- Smooth transitions between themes
- Default: Dark mode (Loxra brand style)

**Note:** Light mode styling is currently optimized for dark theme. Full light mode support coming in v2.1.

#### 6. **Enhanced UI Components** 🎨

**Loading Skeletons:**

- Replaced generic spinners with skeleton loaders
- Shows content structure while loading
- Better perceived performance

**Empty States:**

- Helpful messages when no data exists
- Action buttons to get started quickly
- Clear guidance for new users

**Components added:**

- `<Skeleton>` - Customizable loading placeholder
- `<TableSkeleton>` - For table/list loading states
- `<CardSkeleton>` - For card grid loading
- `<EmptyState>` - Generic empty state component
- `<NoTemplatesEmpty>` - Templates page empty state
- `<NoHistoryEmpty>` - History empty state
- `<NoDraftsEmpty>` - Drafts empty state

#### 7. **GitHub Actions CI/CD** 🚀

**Automated workflows:**

- **CI Pipeline** (`ci.yml`): Runs on every push/PR
  - Linting
  - Type checking
  - Unit tests
  - Build verification
  
- **Build & Release** (`build.yml`): Runs on version tags
  - Multi-platform builds (Windows, macOS, Linux)
  - Automated artifact generation
  - Draft GitHub releases with release notes
  - Parallel builds for faster delivery

**To create a release:**

```bash
# Tag a new version
git tag v2.0.0
git push origin v2.0.0

# GitHub Actions will automatically:
# 1. Run all tests
# 2. Build for all platforms
# 3. Create a draft release
# 4. Upload installers (.exe, .dmg, .AppImage)
```

#### 8. **Better Validation Errors** 🔍

- Error messages now show line numbers (when available)
- Better formatting with proper layout
- Clear visual hierarchy for multiple errors
- Improved error descriptions

#### 9. **State Management with Zustand** 🗃️

Added Zustand for efficient state management:

- **Theme Store**: Persistent theme preferences
- **Draft Store**: Auto-save and draft management
- Lightweight alternative to Redux
- Built-in persistence to localStorage
- Type-safe with TypeScript

---

## 🛠️ Migration Guide

### For Developers

**1. Update dependencies:**

```bash
npm install
```

**2. Key breaking changes:**

- Vite 6 uses new config format (already updated)
- React Router 7 has minor API changes (routes still work)
- Electron 33 requires Node 20+ (update if needed)

**3. New peer dependencies:**

```bash
npm install zustand
```

**4. Testing updates:**

All tests pass with updated dependencies. Run:

```bash
npm test
npm run typecheck
npm run lint
```

### For Users

**Upgrade from v1.x:**

1. Download the new installer for your platform
2. Run the installer (it will replace the old version)
3. Your templates and history are preserved (stored in user data)
4. Auto-save drafts start accumulating after first use

**Fresh install:**

1. Download the installer from releases
2. Run the installer
3. Launch Loxra
4. Press `Ctrl+/` to see keyboard shortcuts
5. Start building ISO-20022 messages!

---

## 📋 TODO - Upcoming Features

### High Priority

- [ ] Enhanced error messages with XPath and recovery suggestions
- [ ] Multi-tab interface for Builder (work on multiple messages)
- [ ] pacs.002 Payment Status Report support
- [ ] pain.002 Customer Payment Status Report support

### Medium Priority

- [ ] Full light mode theme support
- [ ] Virtual scrolling for large transaction lists
- [ ] Web Workers for non-blocking validation
- [ ] Advanced search/filter in Templates & History
- [ ] Message comparison tool (diff viewer)

### Long-term

- [ ] Plugin system architecture
- [ ] Import from SWIFT MT format
- [ ] Cloud backup (optional, encrypted)
- [ ] E2E testing with Playwright
- [ ] Accessibility improvements (WCAG 2.1 AA)

---

## 🐛 Known Issues

1. **Light theme incomplete**: Light mode works but some components need better contrast
2. **Auto-save in background**: Auto-save is silent - consider adding toast notifications
3. **Keyboard shortcuts in inputs**: Some shortcuts trigger even when typing in fields (fixed for most cases)
4. **Large CSV batches**: No progress indicator for very large batch operations

---

## 📚 Documentation Updates

### New Hooks

- `useKeyboardShortcuts()` - Global keyboard shortcut handler
- `useShortcutsModal()` - Keyboard shortcuts help modal state
- `useThemeStore()` - Theme state management
- `useDraftStore()` - Draft auto-save management

### New Components

- `<DragDropZone>` - File drag & drop zone
- `<ThemeToggle>` - Theme switcher button
- `<KeyboardShortcutsModal>` - Help modal for shortcuts
- `<Skeleton>` - Loading placeholder
- `<EmptyState>` - Empty state messages

### Updated Components

- `<Validator>` - Now with drag-drop support
- `<TopBar>` - Theme toggle added
- `<App>` - Global keyboard shortcuts and theme management
- `<Builder>` - Auto-save functionality

---

## 🔒 Security

- All dependencies updated to patch known vulnerabilities
- Electron security best practices maintained
- No new network calls - still 100% offline
- LocalStorage used for preferences (encrypted in Electron user data)

---

## 🎯 Performance Improvements

1. **Vite 6**: Faster dev server and build times
2. **React Router 7**: Improved code splitting
3. **Electron 33**: Better memory management
4. **Zustand**: Minimal re-renders vs previous approach
5. **Debounced auto-save**: Reduces unnecessary saves

---

## 🤝 Contributing

### Setting up development

```bash
# Clone the repo
git clone https://github.com/Somli/Loxra.git
cd Loxra

# Install dependencies
npm install

# Start development
npm run dev
```

### Running tests

```bash
npm test          # Unit tests
npm run typecheck # TypeScript validation
npm run lint      # ESLint
```

### Building

```bash
npm run build     # Full build (renderer + main + package)
```

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Somli/Loxra/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Somli/Loxra/discussions)
- **Documentation**: See main [README.md](./README.md)

---

## 🙏 Acknowledgments

Thanks to all the open-source projects that make Loxra possible:

- Electron Team
- React Team
- Vite Team
- The entire npm ecosystem

---

**Version**: 2.0.0  
**Release Date**: November 16, 2025  
**License**: MIT
