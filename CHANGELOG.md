# Change Log

All notable changes to the **Master RTL** extension are documented here.

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
