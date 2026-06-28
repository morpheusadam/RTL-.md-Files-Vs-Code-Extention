<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:d97757,50:7c3aed,100:4f46e5&height=210&section=header&text=Master%20RTL&fontSize=82&fontColor=ffffff&fontAlignY=38&desc=Right-to-Left%20for%20Claude%20Code%2C%20Markdown%20%26%20AI%20Chat%20in%20VS%20Code&descSize=18&descAlignY=60&animation=fadeIn" width="100%" alt="Master RTL — RTL for Claude Code, Markdown and AI Chat in VS Code" />

<img src="https://raw.githubusercontent.com/morpheusadam/RTL-.md-Files-Vs-Code-Extention/main/icon.png" width="120" alt="Master RTL logo" />

<br/><br/>

<a href="https://marketplace.visualstudio.com/items?itemName=morpheusadam.qalam-rtl-markdown">
  <img src="https://readme-typing-svg.demolab.com?font=Segoe+UI&weight=700&size=26&duration=2400&pause=800&color=D97757&center=true&vCenter=true&width=720&lines=Make+Claude+Code+read+right-to-left;Persian+%E2%80%A2+Arabic+%E2%80%A2+Hebrew+%E2%80%A2+Urdu;English+%26+code+stay+left-to-right;A+true+RTL+Markdown+editor%2C+too." alt="Animated tagline" />
</a>

<br/><br/>

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/morpheusadam.qalam-rtl-markdown?style=for-the-badge&color=d97757&label=Marketplace&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=morpheusadam.qalam-rtl-markdown)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/morpheusadam.qalam-rtl-markdown?style=for-the-badge&color=7c3aed&label=Installs&logo=docusign&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=morpheusadam.qalam-rtl-markdown)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/morpheusadam.qalam-rtl-markdown?style=for-the-badge&color=4f46e5&label=Downloads)](https://marketplace.visualstudio.com/items?itemName=morpheusadam.qalam-rtl-markdown)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/morpheusadam.qalam-rtl-markdown?style=for-the-badge&color=8b5cf6&label=Rating)](https://marketplace.visualstudio.com/items?itemName=morpheusadam.qalam-rtl-markdown&ssr=false#review-details)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

### ✦ The first extension that makes the **Claude Code** chat panel truly right-to-left ✦

<sub>Persian (فارسی) · Arabic (العربية) · Hebrew (עברית) · Urdu (اردو) — read & write naturally, while English and code stay left-to-right.</sub>

</div>

<br/>

<div align="center">

<img src="https://raw.githubusercontent.com/morpheusadam/RTL-.md-Files-Vs-Code-Extention/main/media/claude-rtl-demo.png" width="100%" alt="Before and after: Claude Code chat in default left-to-right vs Master RTL right-to-left" />

<sub><b>Before</b> Persian sticks to the left and punctuation breaks · <b>After</b> Master RTL flips the chat right-to-left and keeps code LTR.</sub>

</div>

<br/>

---

## 🚀 Why Master RTL?

VS Code — and the tools built on it — assume left-to-right. If you write **Persian, Arabic, Hebrew, or Urdu**, your AI chat and your Markdown come out misaligned, with punctuation in the wrong place and text glued to the left edge. **Master RTL fixes that**, end to end:

> **🤖 It flips the Claude Code chat to right-to-left** — the first extension to do it — *and* gives you a real RTL Markdown editor, reading themes, and AI prompt templates. One install, the whole right-to-left workflow.

<br/>

<table>
<tr>
<td width="33%" align="center" valign="top">

### 🤖
**RTL Claude Code chat**

Persian/Arabic/Hebrew/Urdu read right-to-left; English & code stay LTR — auto-detected per line.

</td>
<td width="33%" align="center" valign="top">

### 🪶
**True RTL Markdown editor**

A real right-to-left custom editor for `.md` with live, synced preview.

</td>
<td width="33%" align="center" valign="top">

### 🎨
**Beautiful by default**

11 reading themes, colorful offline code highlighting, a live outline & word stats.

</td>
</tr>
</table>

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

- 🤖 **Right-to-left Claude Code chat** — one click; English & code stay LTR
- 📋 **Templates button inside Claude Code** — drop a prompt into the chat with one click
- 🪶 **True RTL editing** — right-aligned, natural right-to-left base direction
- 🎨 **Colorful code** — offline syntax highlighting for 17+ languages, with a language badge and one-click **Copy**
- 📖 **11 reading themes** — Auto · GitHub · Sepia · Nord · Dracula · One Dark · Solarized Light/Dark · Rosé Pine · Gruvbox · Monokai
- 🤖 **AI prompt templates** — reusable prompts you paste into **Claude Code** & **GitHub Copilot** chat

</td>
<td width="50%" valign="top">

- 🪞 **Live preview** — fully RTL, synced scrolling in Split mode
- 🧰 **Formatting toolbar** — bold, italic, headings, lists, tables & more (`Ctrl+B/I/K`)
- 🧭 **Live outline** — auto table of contents with click-to-scroll
- 🔤 **Smart direction** — code stays LTR inside RTL text, automatically
- 📊 **Status bar** — word, character & line counts + reading time
- 🔌 **Offline & Restricted-Mode friendly** — no network, no trust needed

</td>
</tr>
</table>

---

## 🤖 Make Claude Code right-to-left

This is the headline feature. After installing, the Claude Code chat is set to RTL out of the box.

```text
1. Install Master RTL  →  2. Reload the window  →  3. Open Claude Code — it reads right-to-left
```

Toggle it anytime from the **status-bar “Claude RTL” button**, or the Command Palette → **“Master RTL: Right-to-Left for Claude Code”**.

<details>
<summary><b>🧠 How it works (click to expand)</b></summary>

<br/>

Claude Code renders its chat inside a **sandboxed webview**, so no extension can style it from the outside — that is a real VS Code limitation. Master RTL works *with* it instead of around it:

- It adds a **single, clearly-marked, fully-reversible** stylesheet block to Claude Code’s **own** webview CSS.
- Direction is decided **per paragraph** with `unicode-bidi: plaintext`, so:
  - **Persian / Arabic / Hebrew / Urdu** → right-to-left, right-aligned, correct punctuation.
  - **English text & code blocks** → stay left-to-right and left-aligned. Nothing English is disturbed.
- The block is **re-applied automatically** after Claude Code updates (which reset its files).
- Turn the feature off and Master RTL **removes the block cleanly** — your Claude Code is back to stock.

> ℹ️ A **window reload** applies any change (VS Code only loads webview CSS at startup).

</details>

<details>
<summary><b>❓ Is this safe? Will it break Claude Code? (click to expand)</b></summary>

<br/>

- The RTL change is **CSS only** — it never touches Claude Code’s JavaScript, so it can’t break functionality.
- The optional **templates button** adds a tiny script to Claude Code’s webview; it’s wrapped in a `try/catch` so any error is swallowed and **Claude Code keeps working** no matter what.
- Both patches are **idempotent and reversible**: exactly one marked block is added per file; toggling off restores the original byte-for-byte.
- The RTL rules are **scoped to chat text and the input** — toolbars, buttons and icons keep their original positions.
- Verified by an offline test suite (`npm test`) plus a headless-browser check of the templates button.
- GitHub Copilot’s chat is closed-source and **not** patched; use the prompt templates below with it.

</details>

---

## 📋 Prompt templates, right inside Claude Code

Master RTL puts a **templates button** in the Claude Code chat input. Click it, pick one of your saved prompts, and it drops straight into the chat box — no copy/paste, no leaving the panel.

```text
1. Set your prompts in  rtlMarkdown.promptTemplates  (6 useful Persian starters included)
2. Click the 📋 button in the Claude Code input  →  pick a template  →  it’s inserted
```

- Your templates live in one setting and the button **stays in sync** when you edit them.
- Re-applied automatically after Claude Code updates; toggle it off anytime with **Master RTL: Prompt-Templates Button in Claude Code** (`rtlMarkdown.claudeCodeTemplates`).
- Prefer the keyboard? **Master RTL: Send Prompt Template to Claude Code** copies a template, focuses the chat, and — in **terminal mode** — types it straight in.

> ℹ️ Like the RTL feature, a **window reload** applies changes to the button.

---

## 📝 RTL Markdown editor

Open any `.md`, `.markdown`, or `.mdx` file — it opens in the Master RTL editor automatically.

<div align="center">

| ✏️ Edit | 🔀 Split | 👁️ Preview |
|:---:|:---:|:---:|
| True RTL, right-aligned writing | Editor + live preview, synced scroll | Clean rendered, fully RTL |

</div>

Use the toolbar to switch modes, change the reading theme, or open the live outline.

> 💡 **Prefer the plain editor for a file?** Click **“Open in Text Editor”** in the toolbar, or right-click → **Reopen Editor With…** → **Text Editor**.

---

## 🤝 Use with Claude Code & GitHub Copilot

Master RTL is built for developers who code with **AI** *and* write right-to-left:

- **🤖 RTL Claude Code chat** — described above.
- **AI prompt templates** — keep your favorite reusable prompts one click away (status-bar **Prompts** button, toolbar, or **“Master RTL: Insert AI Prompt Template”**). The template is copied to your clipboard so you can paste it straight into the chat (and inserted at the cursor if a text editor is focused). Edit your set via `rtlMarkdown.promptTemplates`.
- **Auto-RTL for AI-generated docs** — any `.md` / `.markdown` / `.mdx` that Claude Code or Copilot generates opens **right-to-left automatically**.

---

## ⚙️ Settings

| Setting | Default | Description |
|---|---|---|
| `rtlMarkdown.claudeCodeRtl` | `true` | Make the **Claude Code** chat panel right-to-left (English & code stay LTR). Re-applies after Claude Code updates; needs a window reload |
| `rtlMarkdown.claudeCodeTemplates` | `true` | Add a **prompt-templates button** inside the Claude Code chat input. Re-applies after Claude Code updates; needs a window reload |
| `rtlMarkdown.fontFamily` | `Vazirmatn, Tahoma, 'Segoe UI', sans-serif` | Font family for editor & preview |
| `rtlMarkdown.fontSize` | `16` | Font size in pixels |
| `rtlMarkdown.lineHeight` | `2` | Line height |
| `rtlMarkdown.defaultMode` | `preview` | View on open: `edit`, `split`, or `preview` |
| `rtlMarkdown.previewTheme` | `auto` | Reading theme: `auto`, `github`, `sepia`, `nord`, `dracula`, `one-dark`, `solarized-light`, `solarized-dark`, `rose-pine`, `gruvbox`, `monokai` |
| `rtlMarkdown.promptTemplates` | _6 starters_ | Your reusable AI prompt templates for Claude Code / Copilot chat |

> 💡 For the best Persian/Arabic typography, install the free **[Vazirmatn](https://github.com/rastikerdar/vazirmatn)** font.

---

## ⌨️ Commands & Shortcuts

| Action | How |
|---|---|
| **Make Claude Code chat RTL** | Status-bar **Claude RTL** button · **Master RTL: Right-to-Left for Claude Code** |
| **Templates button in Claude Code** | **Master RTL: Prompt-Templates Button in Claude Code** (toggle) |
| **Send a template to Claude Code** | **Master RTL: Send Prompt Template to Claude Code** |
| Insert an AI prompt template | Status-bar **Prompts** button · **Master RTL: Insert AI Prompt Template** |
| Toggle the RTL Markdown editor | Status-bar **RTL** button · **Master RTL: Toggle RTL Markdown Editor** |
| Save | `Ctrl / Cmd + S` |
| Bold / Italic / Link | `Ctrl / Cmd + B` · `I` · `K` |
| Copy a code block | **Copy** button on the block |
| Open in plain text editor | **Master RTL: Open in Text Editor** |

---

## 🌍 Languages

Built and tuned for every right-to-left script, including documents that mix RTL and LTR:

<div align="center">

**فارسی (Persian)** · **العربية (Arabic)** · **עברית (Hebrew)** · **اردو (Urdu)** · Kurdish · Pashto · Dari

</div>

English words, code, URLs and numbers inside right-to-left text are detected and kept left-to-right automatically.

---

## ❓ FAQ

<details>
<summary><b>Does it really change the Claude Code chat, or just Markdown?</b></summary>

<br/>Both. Master RTL flips the **Claude Code chat panel** to right-to-left *and* gives you a dedicated RTL Markdown editor. The Claude Code part is on by default and fully reversible.
</details>

<details>
<summary><b>Will English and code look wrong now?</b></summary>

<br/>No. Direction is detected per line: only right-to-left text flips. English paragraphs stay left-aligned and code blocks stay left-to-right — exactly as before.
</details>

<details>
<summary><b>What happens when Claude Code updates?</b></summary>

<br/>Master RTL re-applies its stylesheet automatically on the next start, so RTL keeps working across Claude Code updates. A window reload makes it visible.
</details>

<details>
<summary><b>How do I turn the Claude Code RTL off?</b></summary>

<br/>Click the **Claude RTL** status-bar button (or run **Master RTL: Right-to-Left for Claude Code**), then reload. Master RTL removes its block and restores the original Claude Code styling.
</details>

<details>
<summary><b>Does it work offline / in Restricted Mode?</b></summary>

<br/>Yes. Everything is local — no network calls — and the Markdown editor works without workspace trust.
</details>

<details>
<summary><b>Does it support syntax highlighting?</b></summary>

<br/>Yes — the rendered preview colorizes fenced code blocks for 17+ languages with a built-in, fully offline highlighter, a language badge, and a Copy button.
</details>

---

## 🛠️ Build from source

```bash
git clone https://github.com/morpheusadam/RTL-.md-Files-Vs-Code-Extention.git
cd RTL-.md-Files-Vs-Code-Extention
npm install -g @vscode/vsce
npm test          # runs the RTL-patch test suite
vsce package      # creates the .vsix
```

Install the generated `.vsix` from the Extensions view → **…** → **Install from VSIX**, or press `F5` to launch an Extension Development Host.

---

<div align="center">

### ⭐ If Master RTL helps you, a star and a quick review go a long way

<a href="https://marketplace.visualstudio.com/items?itemName=morpheusadam.qalam-rtl-markdown&ssr=false#review-details">
  <img src="https://img.shields.io/badge/Leave%20a%20review-on%20the%20Marketplace-d97757?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Leave a review" />
</a>
<a href="https://github.com/morpheusadam/RTL-.md-Files-Vs-Code-Extention">
  <img src="https://img.shields.io/badge/Star%20on-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Star on GitHub" />
</a>

<br/><br/>

### Made with ♥ for the right-to-left writing community

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4f46e5,50:7c3aed,100:d97757&height=120&section=footer" width="100%" alt="footer" />

**[MIT License](LICENSE)** © morpheusadam

</div>
