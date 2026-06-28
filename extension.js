// RTL Markdown — a custom right-to-left editor for Markdown files.
// Written in plain JavaScript so it runs without a build step.

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const VIEW_TYPE = 'rtlMarkdown.editor';
const MD_PATTERNS = ['*.md', '*.markdown', '*.mdx'];
const MD_RE = /\.(md|markdown|mdx)$/i;

// ── Claude Code RTL patch ────────────────────────────────────────────────────
// Claude Code renders its chat inside a sandboxed webview, so no extension can
// reach into it from the outside. The only way to flip it right-to-left is to
// add a stylesheet to Claude Code's *own* webview CSS. We append a single,
// clearly-marked, fully reversible block to its `webview/index.css`. The block
// uses `unicode-bidi: plaintext`, so each paragraph's direction is auto-detected
// from its content: Persian/Arabic/Hebrew/Urdu read right-to-left while English
// text and code blocks stay left-to-right — no layout is broken.
const CC_EXT_ID = 'anthropic.claude-code';
const CC_CSS_REL = path.join('webview', 'index.css');
const CC_RTL_START = '/* ===== QALAM-RTL-CLAUDE-CODE:START';
const CC_RTL_END = 'QALAM-RTL-CLAUDE-CODE:END ===== */';
// Matches our whole block (with surrounding blank lines) so we can strip/replace it.
const CC_RTL_BLOCK_RE = /\n*\/\* =====[ ]QALAM-RTL-CLAUDE-CODE:START[\s\S]*?QALAM-RTL-CLAUDE-CODE:END ===== \*\/\n*/g;

function claudeRtlBlock() {
  return `

/* ===== QALAM-RTL-CLAUDE-CODE:START =====
   Added by the "Qalam — RTL Markdown" extension (setting: rtlMarkdown.claudeCodeRtl).
   Makes Claude Code's chat read right-to-left for Persian / Arabic / Hebrew / Urdu,
   while English text and code blocks stay left-to-right. Each block's direction is
   auto-detected from its own content via unicode-bidi:plaintext, so nothing English
   or code-related is disturbed. This whole block is safe to delete, and Qalam can
   remove it for you with the "Qalam: RTL for Claude Code" toggle. */
[class*="message_"] :is(p,li,h1,h2,h3,h4,h5,h6,blockquote,dd,dt,td,th,figcaption,summary) {
  unicode-bidi: plaintext;
  text-align: start;
  align-self: stretch;
}
[class*="message_"] :is(ul,ol) { unicode-bidi: plaintext; }
[class*="message_"] li { list-style-position: inside; }
[class*="messageInput_"],
[class*="messageInput_"] > p,
[class*="messageInput_"] > div { unicode-bidi: plaintext; text-align: start; }
[class*="message_"] :is(pre,code,kbd,samp,.monaco-editor),
[class*="message_"] :is(pre,code,kbd,samp,.monaco-editor) * {
  unicode-bidi: normal;
  direction: ltr;
  text-align: left;
}
[class*="message_"] :not(pre) > code { unicode-bidi: isolate; }
/* ===== QALAM-RTL-CLAUDE-CODE:END ===== */
`;
}

let statusBarItem;
let promptStatusItem;
let claudeRtlStatusItem;

function activate(context) {
  const provider = new RtlMarkdownEditorProvider(context);

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider('rtlMarkdown.editor', provider, {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('rtlMarkdown.openWithDefault', (uri) => {
      const target = resolveUri(uri);
      if (target) {
        vscode.commands.executeCommand('vscode.openWith', target, 'default');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('rtlMarkdown.openWithRtl', (uri) => {
      const target = resolveUri(uri);
      if (target) {
        vscode.commands.executeCommand('vscode.openWith', target, 'rtlMarkdown.editor');
      }
    })
  );

  // Toggle command — turn the RTL editor on/off for Markdown.
  context.subscriptions.push(
    vscode.commands.registerCommand('rtlMarkdown.toggle', toggleRtl)
  );

  // Prompt templates for AI chat (Claude Code / GitHub Copilot).
  context.subscriptions.push(
    vscode.commands.registerCommand('rtlMarkdown.promptTemplates', insertPromptTemplate),
    vscode.commands.registerCommand('rtlMarkdown.editPromptTemplates', editPromptTemplates)
  );

  // Claude Code RTL toggle.
  context.subscriptions.push(
    vscode.commands.registerCommand('rtlMarkdown.toggleClaudeRtl', toggleClaudeRtl)
  );

  // Status bar (footer) button.
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'rtlMarkdown.toggle';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();
  statusBarItem.show();

  // Status bar button to insert a prompt template into AI chat.
  promptStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  promptStatusItem.text = '$(comment-discussion) Prompts';
  promptStatusItem.tooltip = 'Qalam: insert a prompt template for Claude Code / GitHub Copilot chat';
  promptStatusItem.command = 'rtlMarkdown.promptTemplates';
  context.subscriptions.push(promptStatusItem);
  promptStatusItem.show();

  // Status bar button to toggle right-to-left Claude Code chat.
  claudeRtlStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  claudeRtlStatusItem.command = 'rtlMarkdown.toggleClaudeRtl';
  context.subscriptions.push(claudeRtlStatusItem);
  updateClaudeRtlStatus();
  claudeRtlStatusItem.show();

  // Apply the Claude Code RTL patch on startup if the setting is enabled. This
  // also re-applies after Claude Code updates (which reset its files).
  applyClaudeRtlOnStartup();

  // Keep the buttons in sync if settings change elsewhere.
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('workbench.editorAssociations')) {
        updateStatusBar();
      }
      if (e.affectsConfiguration('rtlMarkdown.claudeCodeRtl')) {
        updateClaudeRtlStatus();
      }
    })
  );
}

function rtlIsEnabled() {
  const assoc = vscode.workspace.getConfiguration().get('workbench.editorAssociations') || {};
  return assoc['*.md'] === VIEW_TYPE;
}

async function setRtlEnabled(enabled) {
  const cfg = vscode.workspace.getConfiguration();
  const assoc = Object.assign({}, cfg.get('workbench.editorAssociations') || {});
  for (const pattern of MD_PATTERNS) {
    if (enabled) {
      assoc[pattern] = VIEW_TYPE;
    } else if (assoc[pattern] === VIEW_TYPE) {
      delete assoc[pattern];
    }
  }
  await cfg.update('workbench.editorAssociations', assoc, vscode.ConfigurationTarget.Global);
}

function activeMarkdownUri() {
  const group = vscode.window.tabGroups.activeTabGroup;
  const tab = group && group.activeTab;
  const input = tab && tab.input;
  if (!input) return undefined;
  const uri = input.uri;
  if (uri && MD_RE.test(uri.path)) return uri;
  return undefined;
}

async function toggleRtl() {
  const next = !rtlIsEnabled();
  await setRtlEnabled(next);
  updateStatusBar();

  const uri = activeMarkdownUri();
  if (uri) {
    await vscode.commands.executeCommand('vscode.openWith', uri, next ? VIEW_TYPE : 'default');
  }

  vscode.window.setStatusBarMessage(
    next ? '$(check) RTL Markdown editor enabled' : '$(circle-slash) RTL Markdown editor disabled',
    2500
  );
}

function updateStatusBar() {
  if (!statusBarItem) return;
  const on = rtlIsEnabled();
  statusBarItem.text = on ? '$(book) RTL' : '$(book) RTL: off';
  statusBarItem.tooltip = on
    ? 'RTL Markdown is ON — Markdown opens in the right-to-left editor.\nClick to disable.'
    : 'RTL Markdown is OFF — Markdown opens in the normal editor.\nClick to enable.';
  statusBarItem.backgroundColor = on
    ? undefined
    : new vscode.ThemeColor('statusBarItem.warningBackground');
}

function resolveUri(uri) {
  if (uri && uri.fsPath) return uri;
  const active = vscode.window.activeTextEditor;
  return active ? active.document.uri : undefined;
}

// ── Prompt templates for AI chat (Claude Code / GitHub Copilot) ──
function getPromptTemplates() {
  const raw = vscode.workspace.getConfiguration('rtlMarkdown').get('promptTemplates');
  if (Array.isArray(raw)) {
    return raw.filter((t) => t && typeof t.name === 'string' && typeof t.body === 'string');
  }
  return [];
}

function previewLine(s) {
  const line = String(s).replace(/\s+/g, ' ').trim();
  return line.length > 80 ? line.slice(0, 79) + '…' : line;
}

async function insertPromptTemplate() {
  const templates = getPromptTemplates();
  const items = templates.map((t) => ({ label: t.name, detail: previewLine(t.body), body: t.body }));
  items.push({ label: '$(gear) Edit templates…', detail: 'Open settings to add or change templates', body: null });
  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: 'Pick a prompt template — it is copied so you can paste it into Claude Code / Copilot chat',
    matchOnDetail: true
  });
  if (!pick) return;
  if (pick.body === null) {
    editPromptTemplates();
    return;
  }
  await vscode.env.clipboard.writeText(pick.body);
  // If a text editor is focused, also insert at the cursor as a convenience.
  const ed = vscode.window.activeTextEditor;
  if (ed) {
    await ed.edit((b) => b.insert(ed.selection.active, pick.body));
  }
  vscode.window.setStatusBarMessage('$(check) Prompt copied — paste into chat with Ctrl/Cmd+V', 3000);
}

function editPromptTemplates() {
  return vscode.commands.executeCommand('workbench.action.openSettings', 'rtlMarkdown.promptTemplates');
}

// ── Claude Code RTL: locate + patch its webview stylesheet ──
// Returns the absolute path(s) to Claude Code's `webview/index.css`, or [].
function findClaudeCssPaths() {
  const paths = new Set();

  // Preferred: ask VS Code where the installed extension lives.
  const ext = vscode.extensions.getExtension(CC_EXT_ID);
  if (ext && ext.extensionPath) {
    paths.add(path.join(ext.extensionPath, CC_CSS_REL));
  }

  // Fallback: scan the extensions folder for anthropic.claude-code-* (covers
  // platform-specific folder names and the case where the API hasn't seen it yet).
  try {
    const guess = ext && ext.extensionPath
      ? path.dirname(ext.extensionPath)
      : path.join(require('os').homedir(), '.vscode', 'extensions');
    for (const name of fs.readdirSync(guess)) {
      if (/^anthropic\.claude-code-/i.test(name)) {
        paths.add(path.join(guess, name, CC_CSS_REL));
      }
    }
  } catch (_) { /* extensions dir not found — ignore */ }

  return [...paths].filter((p) => {
    try { return fs.statSync(p).isFile(); } catch (_) { return false; }
  });
}

function claudeRtlIsApplied() {
  const files = findClaudeCssPaths();
  if (files.length === 0) return false;
  return files.every((p) => {
    try { return fs.readFileSync(p, 'utf8').includes(CC_RTL_END); } catch (_) { return false; }
  });
}

// Writes (or removes) our block. `enable` true = add/refresh, false = remove.
// Returns { changed, files, found, error }. Idempotent: rewrites only when needed.
function setClaudeRtl(enable) {
  const files = findClaudeCssPaths();
  if (files.length === 0) {
    return { changed: 0, files: 0, found: false, error: null };
  }
  let changed = 0;
  let error = null;
  for (const p of files) {
    try {
      const original = fs.readFileSync(p, 'utf8');
      const stripped = original.replace(CC_RTL_BLOCK_RE, '\n');
      const next = enable ? stripped.replace(/\s*$/, '\n') + claudeRtlBlock() : stripped;
      if (next !== original) {
        fs.writeFileSync(p, next, 'utf8');
        changed++;
      }
    } catch (e) {
      error = e;
    }
  }
  return { changed, files: files.length, found: true, error };
}

// Apply silently on startup when the setting is on (best-effort; never throws).
function applyClaudeRtlOnStartup() {
  try {
    const on = vscode.workspace.getConfiguration('rtlMarkdown').get('claudeCodeRtl');
    if (on) setClaudeRtl(true);
  } catch (_) { /* ignore */ }
  updateClaudeRtlStatus();
}

async function toggleClaudeRtl() {
  const cfg = vscode.workspace.getConfiguration('rtlMarkdown');
  const next = !cfg.get('claudeCodeRtl');
  const res = setClaudeRtl(next);
  await cfg.update('claudeCodeRtl', next, vscode.ConfigurationTarget.Global);
  updateClaudeRtlStatus();

  if (!res.found) {
    vscode.window.showWarningMessage(
      'Qalam: Claude Code is not installed, so there is nothing to make right-to-left. The setting was saved and will apply once Claude Code is installed.'
    );
    return;
  }
  if (res.error) {
    vscode.window.showErrorMessage(
      `Qalam: couldn't update Claude Code's stylesheet (${res.error.code || res.error.message}). It may be read-only or in use.`
    );
    return;
  }
  if (!next) {
    vscode.window.showInformationMessage('Qalam: Claude Code RTL turned off. Reload to restore the original layout.', 'Reload Window')
      .then((c) => { if (c) vscode.commands.executeCommand('workbench.action.reloadWindow'); });
    return;
  }
  const pick = await vscode.window.showInformationMessage(
    'Qalam: Claude Code chat is now right-to-left. Reload the window to see it.',
    'Reload Window'
  );
  if (pick === 'Reload Window') {
    vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

function updateClaudeRtlStatus() {
  if (!claudeRtlStatusItem) return;
  const on = vscode.workspace.getConfiguration('rtlMarkdown').get('claudeCodeRtl');
  claudeRtlStatusItem.text = on ? '$(comment-discussion) Claude RTL' : '$(comment-discussion) Claude RTL: off';
  claudeRtlStatusItem.tooltip = on
    ? 'Claude Code chat is set to right-to-left (Persian/Arabic/Hebrew/Urdu read RTL; English & code stay LTR).\nClick to turn off. A window reload applies changes.'
    : 'Claude Code chat is left-to-right.\nClick to make it right-to-left. A window reload applies changes.';
}

class RtlMarkdownEditorProvider {
  constructor(context) {
    this.context = context;
  }

  async resolveCustomTextEditor(document, webviewPanel /*, _token */) {
    const webview = webviewPanel.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };
    webview.html = this.getHtml(webview);

    let isUpdatingFromWebview = false;

    const postDocument = () => {
      webview.postMessage({ type: 'update', text: document.getText() });
    };

    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString() && !isUpdatingFromWebview) {
        postDocument();
      }
    });

    const cfgSub = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('rtlMarkdown')) {
        webview.postMessage({ type: 'config', config: this.getConfig() });
      }
    });

    webviewPanel.onDidDispose(() => {
      changeSub.dispose();
      cfgSub.dispose();
    });

    webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case 'ready':
          webview.postMessage({ type: 'config', config: this.getConfig() });
          postDocument();
          break;
        case 'edit':
          isUpdatingFromWebview = true;
          try {
            await this.updateDocument(document, msg.text);
          } finally {
            isUpdatingFromWebview = false;
          }
          break;
        case 'openDefault':
          vscode.commands.executeCommand('vscode.openWith', document.uri, 'default');
          break;
        case 'prompts':
          vscode.commands.executeCommand('rtlMarkdown.promptTemplates');
          break;
        case 'save':
          document.save();
          break;
      }
    });
  }

  getConfig() {
    const c = vscode.workspace.getConfiguration('rtlMarkdown');
    return {
      fontFamily: c.get('fontFamily'),
      fontSize: c.get('fontSize'),
      lineHeight: c.get('lineHeight'),
      defaultMode: c.get('defaultMode'),
      previewTheme: c.get('previewTheme')
    };
  }

  updateDocument(document, text) {
    if (document.getText() === text) {
      return Promise.resolve(true);
    }
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      text
    );
    return vscode.workspace.applyEdit(edit);
  }

  getHtml(webview) {
    const nonce = getNonce();
    const mediaRoot = vscode.Uri.joinPath(this.context.extensionUri, 'media');
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'style.css'));
    const hlUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'highlight.js'));
    const mdUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'markdown.js'));
    const mainUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'main.js'));

    const ICON = {
      edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
      split: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/>',
      preview: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
      list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
      open: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
      chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
    };
    const svg = (p, w) => `<svg viewBox="0 0 24 24" width="${w || 16}" height="${w || 16}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
    const fmt = (key, label, title) => `<button class="fmt" type="button" data-fmt="${key}" title="${title}">${label}</button>`;

    return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>Qalam — RTL Markdown</title>
</head>
<body>
  <div class="toolbar">
    <div class="seg">
      <button id="tab-edit" class="tab" type="button" title="Edit">${svg(ICON.edit)}<span>Edit</span></button>
      <button id="tab-split" class="tab" type="button" title="Split">${svg(ICON.split)}<span>Split</span></button>
      <button id="tab-preview" class="tab" type="button" title="Preview">${svg(ICON.preview)}<span>Preview</span></button>
    </div>
    <span class="spacer"></span>
    <button id="toc-toggle" class="iconbtn" type="button" title="Table of contents">${svg(ICON.list)}<span>Contents</span></button>
    <button id="prompts-btn" class="iconbtn" type="button" title="Prompt templates for Claude Code / Copilot chat">${svg(ICON.chat)}<span>Prompts</span></button>
    <label class="visually-hidden" for="theme-select">Reading theme</label>
    <select id="theme-select" class="theme-select" title="Reading theme">
      <option value="auto">🎨 Theme: Auto</option>
      <option value="github">🌕 GitHub</option>
      <option value="sepia">📜 Sepia (Paper)</option>
      <option value="nord">❄️ Nord</option>
      <option value="dracula">🧛 Dracula</option>
      <option value="one-dark">🌌 One Dark</option>
      <option value="solarized-light">🌅 Solarized Light</option>
      <option value="solarized-dark">🌃 Solarized Dark</option>
      <option value="rose-pine">🌹 Rosé Pine</option>
      <option value="gruvbox">🍂 Gruvbox</option>
      <option value="monokai">🎬 Monokai</option>
    </select>
    <button id="open-default" class="ghost" type="button" title="Open in Text Editor">${svg(ICON.open)}<span>Text Editor</span></button>
  </div>

  <div class="formatbar" role="toolbar" aria-label="Formatting">
    ${fmt('bold', '<b>B</b>', 'Bold — Ctrl+B')}
    ${fmt('italic', '<i>I</i>', 'Italic — Ctrl+I')}
    ${fmt('strike', '<span style="text-decoration:line-through">S</span>', 'Strikethrough')}
    ${fmt('code', '&lt;/&gt;', 'Inline code')}
    <span class="fmt-divider"></span>
    ${fmt('h1', 'H1', 'Heading 1')}
    ${fmt('h2', 'H2', 'Heading 2')}
    ${fmt('h3', 'H3', 'Heading 3')}
    <span class="fmt-divider"></span>
    ${fmt('ul', '•', 'Bullet list')}
    ${fmt('ol', '1.', 'Numbered list')}
    ${fmt('task', '☑', 'Checklist')}
    ${fmt('quote', '❝', 'Quote')}
    <span class="fmt-divider"></span>
    ${fmt('link', '🔗', 'Link — Ctrl+K')}
    ${fmt('image', '🖼', 'Image')}
    ${fmt('table', '▦', 'Table')}
    ${fmt('codeblock', '{ }', 'Code block')}
    ${fmt('hr', '―', 'Divider')}
  </div>

  <div class="container" id="container">
    <nav id="outline" class="outline" aria-label="Outline"></nav>
    <textarea id="editor" dir="rtl" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off"></textarea>
    <div id="preview" class="markdown-body" dir="rtl"></div>
  </div>

  <div class="statusbar">
    <span class="dot"></span>
    <span class="stat">Words: <b id="stat-words">0</b></span>
    <span class="stat">Characters: <b id="stat-chars">0</b></span>
    <span class="stat">Lines: <b id="stat-lines">0</b></span>
    <span class="spacer"></span>
    <span class="stat">⏱ Reading time: <b id="stat-read">1</b> min</span>
  </div>

  <script nonce="${nonce}" src="${hlUri}"></script>
  <script nonce="${nonce}" src="${mdUri}"></script>
  <script nonce="${nonce}" src="${mainUri}"></script>
</body>
</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

module.exports = {
  activate,
  deactivate() {}
};

// Exposed only for the offline test harness; unused inside VS Code at runtime.
module.exports.__test__ = {
  setClaudeRtl,
  findClaudeCssPaths,
  claudeRtlIsApplied,
  claudeRtlBlock,
  CC_RTL_BLOCK_RE
};
