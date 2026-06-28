// RTL Markdown — a custom right-to-left editor for Markdown files.
// Written in plain JavaScript so it runs without a build step.

const vscode = require('vscode');

const VIEW_TYPE = 'rtlMarkdown.editor';
const MD_PATTERNS = ['*.md', '*.markdown', '*.mdx'];
const MD_RE = /\.(md|markdown|mdx)$/i;

let statusBarItem;
let promptStatusItem;

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

  // Keep the button in sync if the association changes elsewhere.
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('workbench.editorAssociations')) {
        updateStatusBar();
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
