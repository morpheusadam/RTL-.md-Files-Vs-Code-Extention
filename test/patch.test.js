// Offline test for the Master RTL → Claude Code patch logic.
// Stubs the `vscode` module and runs the real patch functions against a TEMP
// copy of a CSS file, so it never touches a real install. If Claude Code is
// present we use its real index.css as the fixture; otherwise we synthesize a
// minimal one — the test runs the same either way.
const fs = require('fs');
const path = require('path');
const os = require('os');
const Module = require('module');

// ── locate a fixture CSS (real Claude Code if installed, else a stub) ──
function findRealClaudeCss() {
  const dir = path.join(os.homedir(), '.vscode', 'extensions');
  try {
    for (const name of fs.readdirSync(dir)) {
      if (/^anthropic\.claude-code-/i.test(name)) {
        const p = path.join(dir, name, 'webview', 'index.css');
        if (fs.existsSync(p)) return p;
      }
    }
  } catch (_) { /* no extensions dir */ }
  return null;
}
// Strip any previously-applied Master RTL block (RTL or theme) so the baseline
// is always "unpatched", even when the real Claude Code CSS already has them.
const STRIP_RE = /\n*\/\* =====[ ]QALAM-RTL-CLAUDE-CODE:START[\s\S]*?QALAM-RTL-CLAUDE-CODE:END ===== \*\/\n*/g;
const STRIP_THEME_RE = /\n*\/\* =====[ ]QALAM-THEME-CLAUDE-CODE:START[\s\S]*?QALAM-THEME-CLAUDE-CODE:END ===== \*\/\n*/g;
const realCss = findRealClaudeCss();
const ORIGINAL = (realCss
  ? fs.readFileSync(realCss, 'utf8')
  : '.message_07S1Yg{display:flex}.messageInput_cKsPxg{outline:none}'
).replace(STRIP_RE, '\n').replace(STRIP_THEME_RE, '\n');
console.log(realCss ? `fixture: real Claude Code CSS (${path.basename(path.dirname(path.dirname(realCss)))})` : 'fixture: synthetic CSS (Claude Code not installed)');

// ── build a temp "extension" dir with the fixture ──
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'masterrtl-'));
const extDir = path.join(tmpRoot, 'anthropic.claude-code-9.9.9-test');
fs.mkdirSync(path.join(extDir, 'webview'), { recursive: true });
const cssPath = path.join(extDir, 'webview', 'index.css');
fs.writeFileSync(cssPath, ORIGINAL, 'utf8');

// ── stub require('vscode') → point getExtension at the temp dir ──
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (r, ...rest) { return r === 'vscode' ? 'vscode' : origResolve.call(this, r, ...rest); };
require.cache['vscode'] = { id: 'vscode', filename: 'vscode', loaded: true, exports: {
  extensions: { getExtension: (id) => id === 'anthropic.claude-code' ? { extensionPath: extDir } : undefined },
  workspace: { getConfiguration: () => ({ get: () => true, update: async () => {} }) },
  window: {}, commands: {}, ConfigurationTarget: { Global: 1 }
}};

const __t = require(path.join(__dirname, '..', 'extension.js')).__test__;
const { setClaudeRtl, findClaudeCssPaths, findClaudeFiles, claudeRtlIsApplied, CC_RTL_BLOCK_RE,
        patchClaudeFiles, claudeThemeBlock, CC_THEME_BLOCK_RE, CC_THEMES } = __t;

let failures = 0;
const check = (name, ok) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + name); if (!ok) failures++; };
const count = (s, sub) => s.split(sub).length - 1;
const read = () => fs.readFileSync(cssPath, 'utf8');

check('finds the fixture index.css', findClaudeCssPaths().includes(cssPath));
check('not applied initially', claudeRtlIsApplied() === false);

const r1 = setClaudeRtl(true); const a1 = read();
check('apply: reports one change, no error', r1.changed === 1 && r1.error === null);
check('apply: exactly one block', count(a1, 'QALAM-RTL-CLAUDE-CODE:END') === 1);
check('apply: claudeRtlIsApplied() true', claudeRtlIsApplied() === true);
check('apply: original CSS kept as prefix', a1.startsWith(ORIGINAL.replace(/\s*$/, '')));

const r2 = setClaudeRtl(true); const a2 = read();
check('idempotent: no second write', r2.changed === 0);
check('idempotent: still one block', count(a2, 'QALAM-RTL-CLAUDE-CODE:END') === 1);
check('idempotent: byte-identical', a2 === a1);

const r3 = setClaudeRtl(false); const a3 = read();
check('remove: reports a change', r3.changed === 1);
check('remove: no marker remains', count(a3, 'QALAM-RTL-CLAUDE-CODE') === 0);
check('remove: restored to original', a3.trimEnd() === ORIGINAL.trimEnd());

setClaudeRtl(true);
check('regex strips block cleanly', count(read().replace(CC_RTL_BLOCK_RE, '\n'), 'QALAM-RTL-CLAUDE-CODE') === 0);

// reset the css fixture before the theme tests
setClaudeRtl(false);

// ── Chat color-theme patch (webview/index.css) ──
console.log('\nChat color-theme patch (webview/index.css):');
const themeKeys = Object.keys(CC_THEMES);
check('ships several themes (>= 8)', themeKeys.length >= 8);
check('default/unknown name produces no block', claudeThemeBlock('default') === null && claudeThemeBlock('nope') === null);

// every theme must produce a self-contained, valid CSS block
let allValid = true;
for (const k of themeKeys) {
  const b = claudeThemeBlock(k) || '';
  const balancedBraces = count(b, '{') === count(b, '}');
  const hasMarkers = b.includes('QALAM-THEME-CLAUDE-CODE:START') && b.includes('QALAM-THEME-CLAUDE-CODE:END');
  const themesVars = b.includes('--app-primary-background') && b.includes('--app-claude-orange');
  if (!(balancedBraces && hasMarkers && themesVars)) { allValid = false; console.log('    bad theme: ' + k); }
}
check('every theme block is balanced, marked & sets the key variables', allValid);

const t1 = patchClaudeFiles([cssPath], CC_THEME_BLOCK_RE, claudeThemeBlock('dracula'));
check('theme apply: one change, no error', t1.changed === 1 && t1.error === null);
check('theme apply: exactly one block', count(read(), 'QALAM-THEME-CLAUDE-CODE:END') === 1);
check('theme apply: original CSS kept as prefix', read().startsWith(ORIGINAL.replace(/\s*$/, '')));

const t2 = patchClaudeFiles([cssPath], CC_THEME_BLOCK_RE, claudeThemeBlock('dracula'));
check('theme idempotent: no second write', t2.changed === 0);

// switching theme replaces (not stacks) the block
patchClaudeFiles([cssPath], CC_THEME_BLOCK_RE, claudeThemeBlock('nord'));
check('switching theme keeps exactly one block', count(read(), 'QALAM-THEME-CLAUDE-CODE:START') === 1);
check('switching theme writes the new theme name', read().includes('"nord"') && !read().includes('"dracula"'));

patchClaudeFiles([cssPath], CC_THEME_BLOCK_RE, null);
check('theme remove: no marker remains', count(read(), 'QALAM-THEME-CLAUDE-CODE') === 0);
check('theme remove: restored to original', read().trimEnd() === ORIGINAL.trimEnd());

// RTL and theme blocks coexist independently in the same file
setClaudeRtl(true);
patchClaudeFiles([cssPath], CC_THEME_BLOCK_RE, claudeThemeBlock('gruvbox'));
check('RTL + theme coexist (both blocks present)',
  count(read(), 'QALAM-RTL-CLAUDE-CODE:END') === 1 && count(read(), 'QALAM-THEME-CLAUDE-CODE:END') === 1);
patchClaudeFiles([cssPath], CC_THEME_BLOCK_RE, null);
check('removing theme leaves the RTL block intact', count(read(), 'QALAM-RTL-CLAUDE-CODE:END') === 1 && count(read(), 'QALAM-THEME-CLAUDE-CODE') === 0);
setClaudeRtl(false);

// ── No-install handling ──
const none = patchClaudeFiles([], CC_RTL_BLOCK_RE, null);
check('no Claude Code installed → found:false, no writes', none.found === false && none.changed === 0);

// ── Obsolete-version handling (the github-light "stuck + error" bug) ──
// After Claude Code updates, VS Code leaves the old version's folder on disk and
// lists it in `.obsolete`. That folder may be locked/mid-deletion, so writing to
// it throws and used to block the whole operation. findClaudeFiles must patch
// ONLY the live install and skip the obsolete copy.
console.log('\nObsolete-version handling:');
const vsStub = require.cache['vscode'].exports;
const realGetExt = vsStub.extensions.getExtension;
const obsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'masterrtl-obs-'));
const liveDir = path.join(obsRoot, 'anthropic.claude-code-2.1.196-win32-x64');
const oldDir  = path.join(obsRoot, 'anthropic.claude-code-2.1.195-win32-x64');
for (const d of [liveDir, oldDir]) fs.mkdirSync(path.join(d, 'webview'), { recursive: true });
fs.writeFileSync(path.join(liveDir, 'webview', 'index.css'), ORIGINAL, 'utf8');
fs.writeFileSync(path.join(oldDir,  'webview', 'index.css'), ORIGINAL, 'utf8');
fs.writeFileSync(path.join(obsRoot, '.obsolete'),
  JSON.stringify({ 'anthropic.claude-code-2.1.195-win32-x64': true }), 'utf8');
vsStub.extensions.getExtension = (id) =>
  id === 'anthropic.claude-code' ? { extensionPath: liveDir } : undefined;

const obsFound = findClaudeFiles(path.join('webview', 'index.css'));
check('obsolete version is skipped (only the live copy is patched)',
  obsFound.length === 1 && obsFound[0].includes('2.1.196') && !obsFound.some((p) => p.includes('2.1.195')));

vsStub.extensions.getExtension = realGetExt; // restore for any later checks
fs.rmSync(obsRoot, { recursive: true, force: true });

fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log('\n' + (failures === 0 ? 'ALL TESTS PASSED ✓' : failures + ' TEST(S) FAILED'));
process.exit(failures === 0 ? 0 : 1);
