# Change Log

All notable changes to the **Master RTL** extension are documented here.

## [3.4.2]

### Maintenance
- **Republished as a clean version bump so the 3.4.1 fix installs as an update.** No behavior changes since 3.4.1 — VS Code only treats a package as an update when its version number increases, so this release carries the obsolete-folder fix forward under a new version that installs cleanly over an existing 3.4.1 build. After updating, run **Developer: Reload Window** once for it to take effect.

## [3.4.1]

### Fixed
- **🎨 Claude Code chat theme was stuck and threw an error when changed.** After Claude Code updated itself, VS Code left the previous version's folder on disk (listed in `.obsolete`). Master RTL tried to patch **every** `anthropic.claude-code-*` folder it found, including that superseded copy — and because the old folder is locked / mid-deletion, the write failed with `EPERM`/`EBUSY`/`ENOENT`. That single error made the extension report *"couldn't update Claude Code's stylesheet"* **and skip the reload prompt**, so even though the live install was actually re-themed, the chat was never reloaded and appeared frozen on the previous theme (e.g. **GitHub Light**). Master RTL now patches **only the live install** and ignores versions VS Code has marked obsolete.
- **Changing the theme/RTL from VS Code's Settings UI did nothing.** Editing `rtlMarkdown.claudeCodeTheme` (or `rtlMarkdown.claudeCodeRtl`) in Settings only refreshed the status bar — it never re-wrote Claude Code's CSS, so the choice silently didn't apply. The setting now re-patches the stylesheet and prompts a reload, exactly like the status-bar picker.
- **A failure on a leftover copy no longer blocks a successful change.** If the live install is patched but a stale copy can't be written, Master RTL now treats the change as successful (and still prompts the reload) instead of surfacing a misleading error.

## [3.4.0]

### Added
- **🎨 Color themes for the Claude Code chat** — recolor the whole **Claude Code** chat panel with one of **11 hand-tuned themes**: **Dracula, Nord, One Dark, Tokyo Night, Catppuccin Mocha, Gruvbox Dark, Solarized Dark, Rosé Pine, Synthwave, Sepia (Paper)** and **GitHub Light**. Each theme restyles backgrounds, message text, the code-block surface, accents and links for a cohesive, professional look. Pick one from the status-bar **Claude Theme** button or the command **Master RTL: Claude Code Chat Theme…**, or set `rtlMarkdown.claudeCodeTheme` (default **Tokyo Night**). A **window reload** applies the change.

### How it works
- Claude Code's chat is built on its own semantic CSS variables (`--app-*`, falling back to `--vscode-*`). Master RTL appends a single guarded, reversible block to Claude Code's own `webview/index.css` that re-defines those variables. It's **CSS only**, idempotent, re-applied after Claude Code updates, and removed cleanly when you pick **Default**. Code **syntax tokens** are produced by Monaco from your active VS Code editor theme, so they keep following it while the theme harmonizes everything around them.

### Removed
- The **prompt-templates button** that 3.3.0 injected into the Claude Code input has been removed (it injected JavaScript into Claude Code's webview). Master RTL no longer modifies Claude Code's `index.js` — only its stylesheet. Your reusable prompt templates remain available via the status-bar **Prompts** button and **Master RTL: Insert AI Prompt Template**.

## [3.3.0]

### Added
- **📋 Prompt-templates button inside Claude Code** — Master RTL can now place a small **templates button** directly in the **Claude Code** chat input. Click it to drop any of your `rtlMarkdown.promptTemplates` straight into the chat box — no copy/paste. The button stays in sync whenever you edit your templates and re-applies automatically after Claude Code updates. Toggle it with **Master RTL: Prompt-Templates Button in Claude Code**, or the `rtlMarkdown.claudeCodeTemplates` setting (on by default). A **window reload** applies the change.
- **📨 Send Prompt Template to Claude Code** — a new command, **Master RTL: Send Prompt Template to Claude Code**, that copies your chosen template, opens and focuses the Claude Code chat, and — when Claude is running in a **terminal** — types the prompt straight in. In the native chat UI it focuses the input so you only need a single `Ctrl/Cmd+V`.

### How it works
- The templates button is added by appending a small, clearly-marked, fully reversible script to Claude Code's *own* webview bundle (the same patch approach as the RTL feature). It runs entirely offline, is wrapped in a `try/catch` so it can never break Claude Code, and is removed cleanly when you turn the feature off.

### Tested
- 24 offline assertions (`npm test`) cover applying, idempotency, clean removal, and bundle-safety of both the RTL and templates patches — run against the real Claude Code stylesheet when it's installed. The injected templates button (render, menu, insertion, special-character escaping) was verified in a headless Chromium harness.

## [3.2.0] — Master RTL 🎉

### Rebrand
- The extension is now **Master RTL — RTL for Claude Code, Markdown & AI Chat**, refocused around its headline feature: making the Claude Code chat panel right-to-left. (Same extension, settings, and `rtlMarkdown.*` commands as before.)

### Added
- **🤖 Right-to-left Claude Code chat** — Qalam can now flip the **Claude Code** chat panel to right-to-left. Persian, Arabic, Hebrew and Urdu read naturally **RTL**, while English text and code blocks stay **LTR** (each block's direction is auto-detected from its own content with `unicode-bidi: plaintext`, so nothing English or code-related is disturbed). Turn it on/off from the new status-bar **Claude RTL** button or the command **Qalam: RTL for Claude Code**, or via the `rtlMarkdown.claudeCodeRtl` setting (on by default). A **window reload** applies the change.

### How it works
- Claude Code renders its chat inside a sandboxed webview, so no extension can reach into it from the outside. Qalam adds a single, clearly-marked, fully reversible stylesheet block to Claude Code's *own* webview CSS. The block is re-applied automatically after Claude Code updates, and Qalam removes it cleanly when you turn the feature off. (This supersedes the note in 3.1.0 — it **is** possible, by patching Claude Code's own stylesheet rather than from the outside.)

## [3.1.0]

### Added
- **🤖 Prompt templates for AI chat** — reusable, fully customizable prompt templates for use with **Claude Code** and **GitHub Copilot** chat. Open them from the new status-bar **Prompts** button, the **Qalam: Insert Prompt Template** command, or the **Prompts** button in the editor toolbar. The selected template is copied to the clipboard (and inserted at the cursor when a text editor is focused) so you can paste it straight into the chat box. Manage your own templates via the `rtlMarkdown.promptTemplates` setting.

### Note
- VS Code renders each extension's chat in a sandboxed webview, so a third-party extension **cannot** force RTL or inject UI directly inside the Claude Code / Copilot chat panels. Qalam instead provides the prompt-template workflow above, and any Markdown those tools generate opens right-to-left automatically in Qalam.

### Changed
- Repositioned and SEO-tuned the Marketplace title, description, and keywords for discoverability by Claude Code / GitHub Copilot users who write right-to-left.

## [3.0.0]

### Fixed
- **Scrambled Preview layout** — in Preview mode the rendered document is no longer laid out as flex items, which previously broke long headings into overlapping vertical word-columns. The preview now flows as a normal block, exactly like a standard reading view.

### Added
- **Six new reading themes** — One Dark, Solarized Light, Solarized Dark, Rosé Pine, Gruvbox, and Monokai, bringing the total to **eleven**. Each ships with a full matching syntax-highlight palette.

### Changed
- **Fully English interface** — every piece of UI text (toolbar, outline/Contents panel, status bar, code Copy button, table and image templates) is now in English.
- Document statistics now render with English (Latin) numerals.

## [2.0.1]

### Changed
- Version bump for Marketplace re-publish (Marketplace versions are immutable; `2.0.0` was already taken). No functional changes from `2.0.0`.

## [2.0.0] — Qalam v2 🎉

The first **major** release. Qalam goes from a clean RTL viewer to a full-featured RTL Markdown studio: **colorful syntax-highlighted code**, **five reading themes**, a **formatting toolbar**, a **live outline**, and a **status bar** — all 100% offline and Restricted-Mode friendly. See the consolidated feature list below.

## [0.0.3]

### Added
- **🎨 Colorful code blocks** — a built-in, offline syntax highlighter for 17+ languages (JS/TS, Python, JSON, HTML, CSS, Bash, SQL, Go, Rust, C/C++, C#, Java, Ruby, PHP, Kotlin, YAML, Markdown). Each block shows a language badge and a one-click **Copy** button.
- **📖 Reading themes** — pick a beautiful preview template live from the toolbar: **Auto** (follows VS Code), **GitHub**, **Sepia (paper)**, **Nord**, and **Dracula**. New setting `rtlMarkdown.previewTheme`.
- **🧰 Formatting toolbar** — one-click Bold, Italic, Strikethrough, inline code, headings, lists, checklists, quotes, links, images, tables, code blocks, and dividers. Keyboard shortcuts: `Ctrl/Cmd+B`, `Ctrl/Cmd+I`, `Ctrl/Cmd+K`.
- **🧭 Live outline (table of contents)** — auto-generated from headings, with click-to-scroll and active-section highlighting. Toggle from the toolbar.
- **📊 Status bar** — live word count, character count, line count, and estimated reading time (in Persian numerals).
- **GitHub-style callouts** — `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`.

### Improved
- Richer Markdown rendering: **nested lists**, **column alignment in tables**, **automatic links** for bare URLs, `==highlight==`, heading anchors, and safer attribute escaping.
- Polished, theme-aware preview template with refined typography, accent-colored headings, zebra-striped tables, and rounded code cards.
- The view mode, reading theme, and outline state are now **remembered** per editor.

## [0.0.2]

### Added
- **Status bar toggle** — a button in the footer that enables/disables the RTL Markdown editor with one click. When toggled, the active Markdown file instantly switches between the RTL editor and the normal text editor.
- New command: **RTL Markdown: Toggle RTL Editor**.

## [0.0.1]

### Added
- True right-to-left (RTL) custom editor for `.md`, `.markdown`, and `.mdx` files.
- Live, RTL-aware Markdown preview with synced scrolling in Split mode.
- Three view modes: Edit, Split, and Preview.
- Rendering for headings, lists, task lists, tables, blockquotes, code blocks, links, and images.
- Configurable font family, font size, line height, and default view mode.
- Theme-aware styling that follows the active VS Code color theme.
- Works in Restricted Mode (no workspace trust required).
- `Ctrl/Cmd + S` to save and `Tab` to insert indentation.
- Commands to switch between the RTL editor and the plain text editor.
