# Qalam — RTL Markdown Editor

**Write and preview Markdown the way right-to-left languages are meant to be read.**

Qalam opens your `.md` files in a true **right-to-left** editor with a live, RTL-aware preview. It is built for **Persian (فارسی), Arabic (العربية), Hebrew (עברית), and Urdu (اردو)** — but works great for any mixed RTL/LTR document.

VS Code's built-in editor is left-aligned and has no official API to flip the text direction. Qalam solves this with a dedicated custom editor that is right-aligned, uses an RTL base direction, and renders a matching preview — so your text finally looks the way you write it.

---

## ✨ Features

- **True RTL editing** — right-aligned text with a natural right-to-left base direction.
- **Live preview** — rendered Markdown that is also fully RTL, with synced scrolling in Split mode.
- **Three view modes** — `Edit`, `Split`, and `Preview`, switchable from the toolbar.
- **RTL-aware rendering** — headings, lists, task lists, tables, blockquotes, code blocks, links, and images.
- **Smart code direction** — inline code and code blocks stay left-to-right, even inside RTL text.
- **Customizable** — set your font family, font size, line height, and the default view.
- **Theme-aware** — follows your active VS Code color theme.
- **Offline & dependency-free** — the Markdown renderer is bundled; no network required.
- **Works in Restricted Mode** — no workspace trust needed.

---

## 🚀 Getting Started

1. Install the extension.
2. Open any `.md`, `.markdown`, or `.mdx` file.
3. It opens automatically in the Qalam RTL editor.

Use the toolbar to switch between **Edit**, **Split**, and **Preview**.

> **Open in the normal editor:** click **“Open in Text Editor”** in the toolbar, or right-click the file → **Reopen Editor With…** → **Text Editor**.

---

## ⚙️ Settings

| Setting | Default | Description |
|---|---|---|
| `rtlMarkdown.fontFamily` | `Vazirmatn, Tahoma, 'Segoe UI', sans-serif` | Font family for the editor and preview. |
| `rtlMarkdown.fontSize` | `16` | Font size in pixels. |
| `rtlMarkdown.lineHeight` | `2` | Line height. |
| `rtlMarkdown.defaultMode` | `preview` | View shown when a file is opened: `edit`, `split`, or `preview`. |

> 💡 For the best Persian/Arabic typography, install the free **[Vazirmatn](https://github.com/rastikerdar/vazirmatn)** font on your system.

---

## ⌨️ Shortcuts & Commands

| Action | How |
|---|---|
| Save | `Ctrl/Cmd + S` |
| Insert indentation | `Tab` (inserts two spaces) |
| Open in RTL editor | Command Palette → **RTL Markdown: Open in RTL Editor** |
| Open in plain text editor | Command Palette → **RTL Markdown: Open in Text Editor** |

---

## 🔧 Make it the default editor (optional)

Qalam registers itself as the default editor for Markdown. If your VS Code still opens the plain editor, add this to your `settings.json`:

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

Install the generated `.vsix` from the Extensions view → **…** → **Install from VSIX**.
Or press `F5` in VS Code to launch an Extension Development Host for live testing.

---

## ❓ FAQ

**Does it support syntax highlighting like the native editor?**
Qalam is a custom editor, so it shows clean RTL text rather than tokenized syntax highlighting. For code-heavy Markdown, switch back to the text editor anytime via the toolbar button.

**Will my changes sync with Git / the normal editor?**
Yes. Qalam edits the real file. Changes are two-way synced with the document and saved normally.

**Which languages are supported?**
Any RTL script — Persian, Arabic, Hebrew, Urdu, and more — including documents that mix RTL and LTR (e.g., English words or code inside Persian text).

---

## 📄 License

[MIT](LICENSE) © morpheusadam
