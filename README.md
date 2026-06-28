<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4f46e5,100:7c3aed&height=200&section=header&text=Qalam&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=The%20Right-to-Left%20Markdown%20Editor%20for%20VS%20Code&descSize=18&descAlignY=62&animation=fadeIn" width="100%" alt="Qalam" />

<img src="https://raw.githubusercontent.com/morpheusadam/RTL-.md-Files-Vs-Code-Extention/main/icon.png" width="130" alt="Qalam logo" />

<br/><br/>

<a href="https://github.com/morpheusadam/RTL-.md-Files-Vs-Code-Extention">
  <img src="https://readme-typing-svg.demolab.com?font=Segoe+UI&weight=600&size=24&duration=2600&pause=900&color=7C3AED&center=true&vCenter=true&width=620&lines=Write+Markdown+in+true+Right-to-Left;Persian+%E2%80%A2+Arabic+%E2%80%A2+Hebrew+%E2%80%A2+Urdu;Write.+Preview.+Read+naturally." alt="Typing animation" />
</a>

<br/>

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/morpheusadam.qalam-rtl-markdown?style=for-the-badge&color=7c3aed&label=Marketplace&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=morpheusadam.qalam-rtl-markdown)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/morpheusadam.qalam-rtl-markdown?style=for-the-badge&color=4f46e5&label=Installs)](https://marketplace.visualstudio.com/items?itemName=morpheusadam.qalam-rtl-markdown)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/morpheusadam.qalam-rtl-markdown?style=for-the-badge&color=8b5cf6&label=Rating)](https://marketplace.visualstudio.com/items?itemName=morpheusadam.qalam-rtl-markdown)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

</div>

<div align="center">

### ✦ Write the way right-to-left languages are meant to be read ✦

</div>

VS Code's built-in editor is left-aligned and has no official API to flip text direction. **Qalam** solves this with a dedicated **right-to-left custom editor** and a matching **live preview** — so your `.md` files finally look the way you write them. Built for **Persian (فارسی)**, **Arabic (العربية)**, **Hebrew (עברית)**, and **Urdu (اردو)**, and great for any mixed RTL/LTR document.

<div align="center">

| ✏️ Edit | 🔀 Split | 👁️ Preview |
|:---:|:---:|:---:|
| True RTL, right-aligned writing | Editor + live preview, synced scroll | Clean rendered, fully RTL |

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

- 🪶 **True RTL editing** — right-aligned, natural right-to-left base direction
- 🎨 **Colorful code** — built-in offline syntax highlighting for 17+ languages, with a language badge and one-click **Copy**
- 📖 **11 reading themes** — switch the preview template live: Auto · GitHub · Sepia · Nord · Dracula · One Dark · Solarized Light/Dark · Rosé Pine · Gruvbox · Monokai
- 🧰 **Formatting toolbar** — bold, italic, headings, lists, checklists, links, tables & more (`Ctrl+B/I/K`)
- 🤖 **AI prompt templates** — reusable, customizable templates you paste into **Claude Code** & **GitHub Copilot** chat
- 🧭 **Live outline** — auto table of contents with click-to-scroll
- 📊 **Status bar** — word, character & line counts + reading time

</td>
<td width="50%" valign="top">

- 🪞 **Live preview** — fully RTL, synced scrolling in Split mode
- 🧱 **Rich rendering** — headings, nested lists, task lists, aligned tables, quotes, GitHub callouts, auto-links
- 🔤 **Smart code direction** — code stays LTR inside RTL text
- 🔘 **Status bar toggle** — turn the RTL editor on/off with one click
- ⚙️ **Customizable** — font, size, line height, default mode, reading theme
- 🔌 **Offline & Restricted-Mode friendly** — no network, no trust needed

</td>
</tr>
</table>

---

## 🚀 Getting Started

```text
1. Install the extension
2. Open any .md, .markdown, or .mdx file
3. It opens automatically in the Qalam RTL editor
```

Use the toolbar to switch between **Edit**, **Split**, and **Preview**.

> 💡 **Open in the normal editor:** click **“Open in Text Editor”** in the toolbar, or right-click the file → **Reopen Editor With…** → **Text Editor**.

---

## ⚙️ Settings

| Setting | Default | Description |
|---|---|---|
| `rtlMarkdown.fontFamily` | `Vazirmatn, Tahoma, 'Segoe UI', sans-serif` | Font family for editor & preview |
| `rtlMarkdown.fontSize` | `16` | Font size in pixels |
| `rtlMarkdown.lineHeight` | `2` | Line height |
| `rtlMarkdown.defaultMode` | `preview` | View on open: `edit`, `split`, or `preview` |
| `rtlMarkdown.previewTheme` | `auto` | Reading theme: `auto`, `github`, `sepia`, `nord`, `dracula`, `one-dark`, `solarized-light`, `solarized-dark`, `rose-pine`, `gruvbox`, `monokai` (also switchable live from the toolbar) |
| `rtlMarkdown.promptTemplates` | _6 starters_ | Your reusable AI prompt templates for Claude Code / Copilot chat (each `{ "name", "body" }`) |

> 💡 For the best Persian/Arabic typography, install the free **[Vazirmatn](https://github.com/rastikerdar/vazirmatn)** font.

---

## ⌨️ Shortcuts & Commands

| Action | How |
|---|---|
| Save | `Ctrl / Cmd + S` |
| Bold / Italic / Link | `Ctrl / Cmd + B` · `I` · `K` |
| Insert indentation | `Tab` (two spaces) |
| Toggle outline / change reading theme | Toolbar |
| Copy a code block | **Copy** button on the block |
| Open in RTL editor | Command Palette → **RTL Markdown: Open in RTL Editor** |
| Open in plain text editor | Command Palette → **RTL Markdown: Open in Text Editor** |

---

## 🤖 Use with Claude Code & GitHub Copilot

Qalam is built for developers who code with **Claude Code** or **GitHub Copilot** *and* write in right-to-left languages:

- **AI prompt templates** — keep your favorite reusable prompts one click away. Open them from the status-bar **Prompts** button, the editor toolbar, or the command **`Qalam: Insert Prompt Template`**. The template is copied to your clipboard so you can paste it straight into the Claude Code or Copilot chat box (and it's inserted at the cursor if a text editor is focused). Edit your own set anytime via `rtlMarkdown.promptTemplates`.
- **Auto-RTL for AI-generated docs** — any `.md` / `.markdown` / `.mdx` that Claude Code or Copilot generates opens **right-to-left automatically** in Qalam, properly aligned for Persian, Arabic, Hebrew, and Urdu.

> ℹ️ VS Code renders each extension's chat inside a sandboxed webview, so no third-party extension can change the text direction *inside* the Claude Code / Copilot chat panel itself. Qalam gives you the prompt-template workflow above instead.

---

## 🔧 Make it the default editor (optional)

Qalam registers itself as the default editor for Markdown. If VS Code still opens the plain editor, add this to your `settings.json`:

```jsonc
"workbench.editorAssociations": {
  "*.md": "rtlMarkdown.editor",
  "*.markdown": "rtlMarkdown.editor",
  "*.mdx": "rtlMarkdown.editor"
}
```

---

## 🛠️ Build from source

```bash
git clone https://github.com/morpheusadam/RTL-.md-Files-Vs-Code-Extention.git
cd RTL-.md-Files-Vs-Code-Extention
npm install -g @vscode/vsce
vsce package        # creates qalam-rtl-markdown-0.0.1.vsix
```

Install the generated `.vsix` from the Extensions view → **…** → **Install from VSIX**, or press `F5` to launch an Extension Development Host.

---

## ❓ FAQ

**Does it support syntax highlighting?**
Yes — the **rendered preview** colorizes fenced code blocks for 17+ languages using a built-in, fully offline highlighter (no network), complete with a language badge and a Copy button. The editing textarea itself stays clean RTL text; for token-by-token highlighting *while typing*, switch back to the text editor anytime via the toolbar button.

**Will my changes sync with Git / the normal editor?**
Yes. Qalam edits the real file; changes are two-way synced and saved normally.

**Which languages are supported?**
Any RTL script — Persian, Arabic, Hebrew, Urdu, and more — including documents that mix RTL and LTR (English words or code inside RTL text).

---

<div align="center">

### Made with ♥ for the right-to-left writing community

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7c3aed,100:4f46e5&height=120&section=footer" width="100%" alt="footer" />

**[MIT License](LICENSE)** © morpheusadam

</div>
