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

// ── Claude Code chat color themes ────────────────────────────────────────────
// Claude Code's chat is built on its own semantic CSS variables (--app-*, which
// fall back to --vscode-*). We append a guarded, reversible block to its OWN
// webview/index.css that re-defines those variables, recolouring the whole chat
// to a chosen theme — backgrounds, message text, code surface, accents, links.
// Code syntax tokens are produced by Monaco from the active VS Code theme, so
// they keep following it; the theme harmonises everything around them.
const CC_THEME_END = 'QALAM-THEME-CLAUDE-CODE:END ===== */';
const CC_THEME_BLOCK_RE = /\n*\/\* =====[ ]QALAM-THEME-CLAUDE-CODE:START[\s\S]*?QALAM-THEME-CLAUDE-CODE:END ===== \*\/\n*/g;

// Curated, professional palettes. `dark` drives color-scheme; the rest map onto
// Claude Code's variables. Keys are the values of rtlMarkdown.claudeCodeTheme.
const CC_THEMES = {
  dracula:        { label: 'Dracula',          dark: true,  bg: '#282a36', bg2: '#21222c', fg: '#f8f8f2', fg2: '#a6accd', accent: '#bd93f9', accent2: '#ff79c6', code: '#1e1f29', input: '#21222c', border: '#44475a', link: '#8be9fd' },
  nord:           { label: 'Nord',             dark: true,  bg: '#2e3440', bg2: '#272c36', fg: '#e5e9f0', fg2: '#8a93a6', accent: '#88c0d0', accent2: '#81a1c1', code: '#272b35', input: '#3b4252', border: '#434c5e', link: '#88c0d0' },
  'one-dark':     { label: 'One Dark',         dark: true,  bg: '#282c34', bg2: '#21252b', fg: '#abb2bf', fg2: '#7f848e', accent: '#61afef', accent2: '#c678dd', code: '#21252b', input: '#2c313a', border: '#3b4048', link: '#56b6c2' },
  'tokyo-night':  { label: 'Tokyo Night',      dark: true,  bg: '#1a1b26', bg2: '#16161e', fg: '#c0caf5', fg2: '#787c99', accent: '#7aa2f7', accent2: '#bb9af7', code: '#16161e', input: '#1f2335', border: '#2a2e42', link: '#7dcfff' },
  catppuccin:     { label: 'Catppuccin Mocha', dark: true,  bg: '#1e1e2e', bg2: '#181825', fg: '#cdd6f4', fg2: '#9399b2', accent: '#cba6f7', accent2: '#f5c2e7', code: '#181825', input: '#313244', border: '#313244', link: '#89b4fa' },
  gruvbox:        { label: 'Gruvbox Dark',     dark: true,  bg: '#282828', bg2: '#1d2021', fg: '#ebdbb2', fg2: '#a89984', accent: '#fabd2f', accent2: '#fe8019', code: '#1d2021', input: '#3c3836', border: '#504945', link: '#83a598' },
  'solarized-dark': { label: 'Solarized Dark', dark: true,  bg: '#002b36', bg2: '#00252e', fg: '#93a1a1', fg2: '#5f757d', accent: '#268bd2', accent2: '#b58900', code: '#00252e', input: '#073642', border: '#0a4b5a', link: '#2aa198' },
  'rose-pine':    { label: 'Rosé Pine',        dark: true,  bg: '#191724', bg2: '#1f1d2e', fg: '#e0def4', fg2: '#908caa', accent: '#ebbcba', accent2: '#c4a7e7', code: '#1f1d2e', input: '#26233a', border: '#2a2837', link: '#9ccfd8' },
  synthwave:      { label: 'Synthwave',        dark: true,  bg: '#262335', bg2: '#1f1d2b', fg: '#ffffff', fg2: '#b8a7d9', accent: '#ff7edb', accent2: '#36f9f6', code: '#1a1726', input: '#2a2640', border: '#463a6b', link: '#36f9f6' },
  sepia:          { label: 'Sepia (Paper)',    dark: false, bg: '#f4ecd8', bg2: '#fbf3e3', fg: '#433422', fg2: '#7a6a52', accent: '#b5651d', accent2: '#8a5a2b', code: '#efe6d0', input: '#fbf3e3', border: '#ddcdb0', link: '#8a5a2b' },
  'github-light': { label: 'GitHub Light',     dark: false, bg: '#ffffff', bg2: '#f6f8fa', fg: '#1f2328', fg2: '#656d76', accent: '#0969da', accent2: '#8250df', code: '#f6f8fa', input: '#ffffff', border: '#d0d7de', link: '#0969da' }
};

function claudeThemeBlock(name) {
  const t = CC_THEMES[name];
  if (!t) return null; // 'default' / unknown → no block, keep Claude Code's own colours
  return `

/* ===== QALAM-THEME-CLAUDE-CODE:START =====
   Added by Master RTL (setting: rtlMarkdown.claudeCodeTheme = "${name}").
   Recolours the Claude Code chat with the "${t.label}" theme. Fully reversible —
   delete this block, pick "Default", or run "Master RTL: Claude Code Chat Theme". */
:root, html, body {
  color-scheme: ${t.dark ? 'dark' : 'light'};
  --app-primary-background: ${t.bg};
  --app-secondary-background: ${t.bg2};
  --app-primary-foreground: ${t.fg};
  --app-secondary-foreground: ${t.fg2};
  --app-input-background: ${t.input};
  --app-input-foreground: ${t.fg};
  --app-input-secondary-foreground: ${t.fg2};
  --app-input-placeholder-foreground: ${t.fg2};
  --app-input-border: ${t.border};
  --app-code-background: ${t.code};
  --app-claude-orange: ${t.accent};
  --app-claude-clay-button-orange: ${t.accent};
  --app-accent-color: ${t.accent};
  --app-warning-accent: ${t.accent2};
  --app-link: ${t.link};
  --app-link-color: ${t.link};
  --app-link-foreground: ${t.link};
  --app-primary-border-color: ${t.border};
  --vscode-sideBar-background: ${t.bg};
  --vscode-editor-background: ${t.code};
  --vscode-foreground: ${t.fg};
  --vscode-descriptionForeground: ${t.fg2};
  --vscode-input-background: ${t.input};
  --vscode-input-foreground: ${t.fg};
  --vscode-textLink-foreground: ${t.link};
  --vscode-textLink-activeForeground: ${t.link};
  --vscode-focusBorder: ${t.accent};
  --vscode-panel-border: ${t.border};
  --vscode-widget-border: ${t.border};
  --vscode-scrollbarSlider-background: ${t.border}88;
}
[class*="codeBlockWrapper"] {
  background: ${t.code};
  border: 1px solid ${t.border};
  border-radius: 8px;
}
[class*="message_"] :not(pre) > code {
  background: ${t.code};
  border: 1px solid ${t.border}66;
  border-radius: 4px;
  padding: 0.1em 0.35em;
}
/* ===== QALAM-THEME-CLAUDE-CODE:END ===== */
`;
}

let statusBarItem;
let promptStatusItem;
let claudeRtlStatusItem;
let claudeThemeStatusItem;

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

  // Claude Code integration: RTL toggle + chat color-theme picker.
  context.subscriptions.push(
    vscode.commands.registerCommand('rtlMarkdown.toggleClaudeRtl', toggleClaudeRtl),
    vscode.commands.registerCommand('rtlMarkdown.pickClaudeTheme', pickClaudeTheme)
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
  claudeRtlStatusItem.show();

  // Status bar button to pick a color theme for the Claude Code chat.
  claudeThemeStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
  claudeThemeStatusItem.command = 'rtlMarkdown.pickClaudeTheme';
  context.subscriptions.push(claudeThemeStatusItem);
  claudeThemeStatusItem.show();

  updateClaudeStatus();

  // Apply the Claude Code patches (RTL + chat theme) on startup per their
  // settings. This also re-applies after Claude Code updates, which reset its files.
  applyClaudePatchesOnStartup();

  // Keep everything in sync if settings change elsewhere. Crucially, when the
  // Claude RTL / theme settings change — including from VS Code's Settings UI,
  // not just our own picker — re-apply the CSS patch so the choice actually
  // takes effect (previously this only refreshed the status bar, so changing the
  // theme in Settings appeared to do nothing).
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('workbench.editorAssociations')) {
        updateStatusBar();
      }
      if (e.affectsConfiguration('rtlMarkdown.claudeCodeRtl') ||
          e.affectsConfiguration('rtlMarkdown.claudeCodeTheme')) {
        applyClaudePatches({ prompt: true });
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

// ── Claude Code patching: locate + safely modify its webview assets ──
// When VS Code updates an extension it leaves the superseded version's folder on
// disk for a while and records it in `<extensions>/.obsolete`. Those folders may
// be locked or mid-deletion, so writing into them throws (EPERM/EBUSY/ENOENT) —
// and they are about to disappear anyway. We must patch only the *live* install.
function obsoleteExtensionFolders(extensionsRoot) {
  try {
    const map = JSON.parse(fs.readFileSync(path.join(extensionsRoot, '.obsolete'), 'utf8'));
    return new Set(Object.keys(map).filter((k) => map[k]));
  } catch (_) {
    return new Set(); // no marker file (or unreadable) → assume nothing obsolete
  }
}

// Returns the absolute path(s) to a file (relative to the extension root) inside
// the live Claude Code install, e.g. findClaudeFiles('webview/index.css').
function findClaudeFiles(rel) {
  const paths = new Set();

  // Preferred: ask VS Code where the active extension lives. This is never the
  // obsolete copy, so always patch it.
  const ext = vscode.extensions.getExtension(CC_EXT_ID);
  const activeName = ext && ext.extensionPath ? path.basename(ext.extensionPath) : null;
  if (ext && ext.extensionPath) {
    paths.add(path.join(ext.extensionPath, rel));
  }

  // Fallback: scan the extensions folder for anthropic.claude-code-* (covers
  // platform-specific folder names and the case where the API hasn't seen it
  // yet) — but skip any version VS Code has marked obsolete. Patching a dying
  // copy only throws spurious "couldn't update Claude Code" errors.
  try {
    const guess = ext && ext.extensionPath
      ? path.dirname(ext.extensionPath)
      : path.join(require('os').homedir(), '.vscode', 'extensions');
    const obsolete = obsoleteExtensionFolders(guess);
    for (const name of fs.readdirSync(guess)) {
      if (!/^anthropic\.claude-code-/i.test(name)) continue;
      if (obsolete.has(name) && name !== activeName) continue; // skip superseded versions
      paths.add(path.join(guess, name, rel));
    }
  } catch (_) { /* extensions dir not found — ignore */ }

  return [...paths].filter((p) => {
    try { return fs.statSync(p).isFile(); } catch (_) { return false; }
  });
}

// Core patcher: in each file, strip any previous block matching `blockRe`, then
// append `blockText` when given (null = remove only). Idempotent — only writes
// when the content actually changes. Returns { changed, files, found, error }.
function patchClaudeFiles(files, blockRe, blockText) {
  if (files.length === 0) return { changed: 0, files: 0, found: false, error: null };
  let changed = 0;
  let error = null;
  for (const p of files) {
    try {
      const original = fs.readFileSync(p, 'utf8');
      const stripped = original.replace(blockRe, '\n');
      const next = blockText ? stripped.replace(/\s*$/, '\n') + blockText : stripped;
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

// RTL stylesheet patch (webview/index.css).
function setClaudeRtl(enable) {
  return patchClaudeFiles(findClaudeFiles(CC_CSS_REL), CC_RTL_BLOCK_RE, enable ? claudeRtlBlock() : null);
}

// Thin convenience wrappers (also used by the offline test harness).
function findClaudeCssPaths() {
  return findClaudeFiles(CC_CSS_REL);
}
function claudeRtlIsApplied() {
  const files = findClaudeCssPaths();
  if (files.length === 0) return false;
  return files.every((p) => {
    try { return fs.readFileSync(p, 'utf8').includes(CC_RTL_END); } catch (_) { return false; }
  });
}

// Chat color-theme patch (webview/index.css). `name` is a key of CC_THEMES, or
// 'default'/unknown to remove the theme block and restore Claude Code's colours.
function getClaudeTheme() {
  const v = vscode.workspace.getConfiguration('rtlMarkdown').get('claudeCodeTheme');
  return typeof v === 'string' ? v : 'default';
}
function setClaudeTheme(name) {
  return patchClaudeFiles(findClaudeFiles(CC_CSS_REL), CC_THEME_BLOCK_RE, claudeThemeBlock(name));
}

function reloadPrompt(message) {
  vscode.window.showInformationMessage(message, 'Reload Window').then((c) => {
    if (c === 'Reload Window') vscode.commands.executeCommand('workbench.action.reloadWindow');
  });
}

// Single place that brings Claude Code's CSS in line with the current settings:
// it (re)writes the RTL block and the theme block, refreshes the status bar and,
// when asked, prompts a reload. Centralising it means the chat theme/RTL apply
// the SAME way whether they were changed from the status-bar picker, the command
// palette, or directly in VS Code's Settings UI. Best-effort: never throws.
//
//   prompt:false → silent (startup / re-apply after a Claude Code update)
//   prompt:true  → user-initiated: show a reload prompt (or a clear reason if not)
function applyClaudePatches({ prompt = false } = {}) {
  const cfg = vscode.workspace.getConfiguration('rtlMarkdown');
  let rtlRes = { changed: 0, found: false, error: null };
  let themeRes = { changed: 0, found: false, error: null };
  try { rtlRes = setClaudeRtl(!!cfg.get('claudeCodeRtl')); } catch (e) { rtlRes.error = e; }
  try { themeRes = setClaudeTheme(getClaudeTheme()); } catch (e) { themeRes.error = e; }
  updateClaudeStatus();

  if (!prompt) return;

  const found = rtlRes.found || themeRes.found;
  const changed = rtlRes.changed + themeRes.changed;
  const error = rtlRes.error || themeRes.error;

  if (!found) {
    vscode.window.showWarningMessage(
      'Master RTL: Claude Code is not installed yet — your choice was saved and will apply automatically once it is.'
    );
    return;
  }
  // Only a hard failure if NOTHING could be written. If at least one file
  // changed, the live Claude Code install got the update — a stale/locked
  // leftover copy failing is harmless and must not block the reload prompt.
  if (error && changed === 0) {
    vscode.window.showErrorMessage(
      `Master RTL: couldn't update Claude Code's stylesheet (${error.code || error.message}). Its files may be read-only or locked.`
    );
    return;
  }
  if (changed > 0) {
    reloadPrompt('Master RTL: Claude Code chat updated. Reload the window to see your changes.');
  }
  // changed === 0 with no error → disk already matches the settings; nothing to do.
}

// Apply patches silently on startup per their settings (best-effort; never
// throws). Also re-applies after Claude Code updates, which reset its files.
function applyClaudePatchesOnStartup() {
  try { applyClaudePatches({ prompt: false }); } catch (_) { /* best-effort */ }
}

// Persist a setting without ever throwing out of a command. If VS Code can't
// write user settings (a malformed settings.json, a read-only/locked file, a
// sync conflict…), we still apply the CSS change so the theme/RTL takes effect
// now — we just warn that the choice may not survive a reload. This is what
// turns the dreaded "couldn't save to settings.json" hard-stop into a soft,
// recoverable notice.
async function saveClaudeSetting(key, value) {
  try {
    await vscode.workspace.getConfiguration('rtlMarkdown')
      .update(key, value, vscode.ConfigurationTarget.Global);
    return true;
  } catch (e) {
    vscode.window.showWarningMessage(
      `Master RTL: applied your change, but couldn't save it to settings.json ` +
      `(${(e && (e.code || e.message)) || 'unknown error'}). It may reset on the next ` +
      `reload — if so, set "rtlMarkdown.${key}" in Settings manually.`
    );
    return false;
  }
}

async function toggleClaudeRtl() {
  const cfg = vscode.workspace.getConfiguration('rtlMarkdown');
  const next = !cfg.get('claudeCodeRtl');
  await saveClaudeSetting('claudeCodeRtl', next);
  // The configuration-change handler applies the patch; do it here too so the
  // command works even if the value happened not to change (idempotent — the
  // handler then sees nothing to write and stays quiet). Runs regardless of
  // whether the save above succeeded, so the change is always visible now.
  applyClaudePatches({ prompt: true });
}

// Pick a color theme for the Claude Code chat from a quick-pick.
async function pickClaudeTheme() {
  const current = getClaudeTheme();
  const items = [
    { label: (current === 'default' ? '$(check) ' : '$(circle-slash) ') + 'Default', description: "Claude Code's own colors", value: 'default' },
    ...Object.keys(CC_THEMES).map((k) => ({
      label: (k === current ? '$(check) ' : '$(paintcan) ') + CC_THEMES[k].label,
      description: k === current ? 'current' : (CC_THEMES[k].dark ? 'dark' : 'light'),
      value: k
    }))
  ];
  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: 'Pick a color theme for the Claude Code chat (a window reload applies it)'
  });
  if (!pick) return;
  await saveClaudeSetting('claudeCodeTheme', pick.value);
  // Apply immediately. If the value actually changed, the config-change handler
  // also fires but finds the disk already in sync (changed:0) and stays quiet,
  // so the user always gets exactly one reload prompt.
  applyClaudePatches({ prompt: true });
}

function updateClaudeStatus() {
  const cfg = vscode.workspace.getConfiguration('rtlMarkdown');
  if (claudeRtlStatusItem) {
    const on = cfg.get('claudeCodeRtl');
    claudeRtlStatusItem.text = on ? '$(comment-discussion) Claude RTL' : '$(comment-discussion) Claude RTL: off';
    claudeRtlStatusItem.tooltip = on
      ? 'Claude Code chat is set to right-to-left (Persian/Arabic/Hebrew/Urdu read RTL; English & code stay LTR).\nClick to turn off. A window reload applies changes.'
      : 'Claude Code chat is left-to-right.\nClick to make it right-to-left. A window reload applies changes.';
  }
  if (claudeThemeStatusItem) {
    const name = getClaudeTheme();
    const themed = !!CC_THEMES[name];
    const label = themed ? CC_THEMES[name].label : 'off';
    claudeThemeStatusItem.text = `$(paintcan) Theme: ${label}`;
    claudeThemeStatusItem.tooltip = `Claude Code chat theme: ${label}.\nClick to try another theme (11 to choose from). A window reload applies it.`;
  }
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
  patchClaudeFiles,
  findClaudeFiles,
  findClaudeCssPaths,
  claudeRtlIsApplied,
  setClaudeRtl,
  setClaudeTheme,
  claudeRtlBlock,
  claudeThemeBlock,
  CC_THEMES,
  CC_RTL_BLOCK_RE,
  CC_THEME_BLOCK_RE
};
