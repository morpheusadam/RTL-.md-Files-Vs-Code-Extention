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
- 🪞 **Live preview** — fully RTL, synced scrolling in Split mode
- 🧭 **Three view modes** — Edit · Split · Preview
- 🎨 **Theme-aware** — follows your active VS Code color theme

</td>
<td width="50%" valign="top">

- 🧱 **Rich rendering** — headings, lists, task lists, tables, quotes, code
- 🔤 **Smart code direction** — code stays LTR inside RTL text
- ⚙️ **Customizable** — font, size, line height, default mode
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

> 💡 For the best Persian/Arabic typography, install the free **[Vazirmatn](https://github.com/rastikerdar/vazirmatn)** font.

---

## ⌨️ Shortcuts & Commands

| Action | How |
|---|---|
| Save | `Ctrl / Cmd + S` |
| Insert indentation | `Tab` (two spaces) |
| Open in RTL editor | Command Palette → **RTL Markdown: Open in RTL Editor** |
| Open in plain text editor | Command Palette → **RTL Markdown: Open in Text Editor** |

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

**Does it support syntax highlighting like the native editor?**
Qalam is a custom editor, so it shows clean RTL text rather than tokenized highlighting. For code-heavy Markdown, switch back to the text editor anytime via the toolbar button.

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
