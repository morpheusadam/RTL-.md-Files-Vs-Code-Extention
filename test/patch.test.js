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
// Strip any previously-applied block so the baseline is always "unpatched",
// even when the real Claude Code CSS already has Master RTL installed.
const STRIP_RE = /\n*\/\* =====[ ]QALAM-RTL-CLAUDE-CODE:START[\s\S]*?QALAM-RTL-CLAUDE-CODE:END ===== \*\/\n*/g;
const realCss = findRealClaudeCss();
const ORIGINAL = (realCss
  ? fs.readFileSync(realCss, 'utf8')
  : '.message_07S1Yg{display:flex}.messageInput_cKsPxg{outline:none}'
).replace(STRIP_RE, '\n');
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

const { setClaudeRtl, findClaudeCssPaths, claudeRtlIsApplied, CC_RTL_BLOCK_RE } =
  require(path.join(__dirname, '..', 'extension.js')).__test__;

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

fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log('\n' + (failures === 0 ? 'ALL TESTS PASSED ✓' : failures + ' TEST(S) FAILED'));
process.exit(failures === 0 ? 0 : 1);
