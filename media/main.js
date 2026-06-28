(function () {
  const vscode = acquireVsCodeApi();
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const container = document.getElementById('container');
  const outline = document.getElementById('outline');
  const themeSelect = document.getElementById('theme-select');

  const saved = vscode.getState() || {};
  let isApplyingRemote = false;
  let debounceTimer = null;
  let currentMode = saved.mode || 'split';
  let currentTheme = saved.theme || 'auto';
  let tocOpen = saved.tocOpen || false;

  function persist() {
    vscode.setState({ mode: currentMode, theme: currentTheme, tocOpen: tocOpen });
  }

  /* ── View mode ── */
  function setMode(mode) {
    currentMode = mode;
    container.className = 'container mode-' + mode;
    document.body.classList.toggle('preview-only', mode === 'preview');
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    const btn = document.getElementById('tab-' + mode);
    if (btn) btn.classList.add('active');
    if (mode !== 'edit') renderPreview();
    persist();
  }

  /* ── Reading theme ── */
  function applyTheme(theme) {
    currentTheme = theme;
    preview.className = 'markdown-body' + (theme && theme !== 'auto' ? ' theme-' + theme : '');
    if (themeSelect && themeSelect.value !== theme) themeSelect.value = theme;
    persist();
  }

  /* ── Table of contents ── */
  function setToc(open) {
    tocOpen = open;
    document.body.classList.toggle('toc-open', open);
    const b = document.getElementById('toc-toggle');
    if (b) b.classList.toggle('active', open);
    persist();
  }

  function buildToc() {
    const heads = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (!heads.length) {
      outline.innerHTML = '<div class="outline-title">Contents</div>' +
        '<a style="color:var(--md-muted);cursor:default">— No headings —</a>';
      return;
    }
    let html = '<div class="outline-title">Contents</div>';
    heads.forEach((h, i) => {
      const id = h.id || ('h-' + i);
      h.id = id;
      const lvl = h.tagName.substring(1);
      const text = h.textContent.replace(/^#/, '').trim();
      html += '<a class="lvl-' + lvl + '" data-target="' + id + '">' + escapeText(text) + '</a>';
    });
    outline.innerHTML = html;
  }

  function escapeText(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ── Render preview ── */
  function renderPreview() {
    try {
      preview.innerHTML = window.renderMarkdown(editor.value);
    } catch (e) {
      preview.textContent = String(e);
    }
    buildToc();
    updateStats();
  }

  /* ── Document stats ── */
  function updateStats() {
    const text = editor.value;
    const words = (text.match(/[^\s]+/g) || []).length;
    const chars = text.length;
    const lines = text ? text.split('\n').length : 0;
    const minutes = Math.max(1, Math.round(words / 200));
    setStat('stat-words', words.toLocaleString('en-US'));
    setStat('stat-chars', chars.toLocaleString('en-US'));
    setStat('stat-lines', lines.toLocaleString('en-US'));
    setStat('stat-read', minutes.toLocaleString('en-US'));
  }
  function setStat(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function pushEdit() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      vscode.postMessage({ type: 'edit', text: editor.value });
    }, 250);
  }

  function afterEdit() {
    if (currentMode !== 'edit') renderPreview();
    else updateStats();
    pushEdit();
  }

  /* ── Text formatting in the editor ── */
  function getSel() {
    return { start: editor.selectionStart, end: editor.selectionEnd, val: editor.value };
  }
  function setSel(value, selStart, selEnd) {
    editor.value = value;
    editor.selectionStart = selStart;
    editor.selectionEnd = selEnd == null ? selStart : selEnd;
    editor.focus();
    afterEdit();
  }
  function surround(before, after) {
    after = after == null ? before : after;
    const s = getSel();
    const sel = s.val.substring(s.start, s.end);
    if (sel) {
      // If already wrapped, remove it (toggle)
      const outer = s.val.substring(s.start - before.length, s.end + after.length);
      if (outer === before + sel + after) {
        const v = s.val.substring(0, s.start - before.length) + sel + s.val.substring(s.end + after.length);
        setSel(v, s.start - before.length, s.end - before.length);
        return;
      }
      const v = s.val.substring(0, s.start) + before + sel + after + s.val.substring(s.end);
      setSel(v, s.start + before.length, s.end + before.length);
    } else {
      const v = s.val.substring(0, s.start) + before + after + s.val.substring(s.end);
      setSel(v, s.start + before.length);
    }
  }
  function linePrefix(prefix, toggle) {
    const s = getSel();
    let lineStart = s.val.lastIndexOf('\n', s.start - 1) + 1;
    let lineEnd = s.val.indexOf('\n', s.end);
    if (lineEnd === -1) lineEnd = s.val.length;
    const block = s.val.substring(lineStart, lineEnd);
    const lines = block.split('\n');
    const allHave = lines.every((l) => l.startsWith(prefix));
    const out = lines.map((l) => {
      if (toggle && allHave) return l.substring(prefix.length);
      return l.startsWith(prefix) ? l : prefix + l;
    }).join('\n');
    const v = s.val.substring(0, lineStart) + out + s.val.substring(lineEnd);
    setSel(v, lineStart, lineStart + out.length);
  }
  function insertText(text, caretBack) {
    const s = getSel();
    const v = s.val.substring(0, s.start) + text + s.val.substring(s.end);
    const pos = s.start + text.length - (caretBack || 0);
    setSel(v, pos);
  }

  const TABLE_TPL = '\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| Cell | Cell | Cell |\n';

  const FORMATTERS = {
    bold: () => surround('**'),
    italic: () => surround('*'),
    strike: () => surround('~~'),
    code: () => surround('`'),
    codeblock: () => surround('\n```\n', '\n```\n'),
    h1: () => linePrefix('# ', true),
    h2: () => linePrefix('## ', true),
    h3: () => linePrefix('### ', true),
    quote: () => linePrefix('> ', true),
    ul: () => linePrefix('- ', true),
    ol: () => linePrefix('1. ', true),
    task: () => linePrefix('- [ ] ', true),
    link: () => surround('[', '](https://)'),
    image: () => insertText('![description](https://)', 0),
    table: () => insertText(TABLE_TPL, 0),
    hr: () => insertText('\n\n---\n\n', 0)
  };

  document.querySelectorAll('.fmt').forEach((b) => {
    b.addEventListener('click', () => {
      const fn = FORMATTERS[b.dataset.fmt];
      if (fn) fn();
    });
  });

  /* ── Main toolbar buttons ── */
  document.getElementById('tab-edit').addEventListener('click', () => setMode('edit'));
  document.getElementById('tab-split').addEventListener('click', () => setMode('split'));
  document.getElementById('tab-preview').addEventListener('click', () => setMode('preview'));
  document.getElementById('open-default').addEventListener('click', () => {
    vscode.postMessage({ type: 'openDefault' });
  });
  const tocBtn = document.getElementById('toc-toggle');
  if (tocBtn) tocBtn.addEventListener('click', () => setToc(!tocOpen));
  const promptsBtn = document.getElementById('prompts-btn');
  if (promptsBtn) promptsBtn.addEventListener('click', () => vscode.postMessage({ type: 'prompts' }));
  if (themeSelect) themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));

  /* ── Outline navigation ── */
  outline.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-target]');
    if (!a) return;
    const el = document.getElementById(a.dataset.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      outline.querySelectorAll('a').forEach((x) => x.classList.remove('active'));
      a.classList.add('active');
    }
  });

  /* ── Copy code ── */
  preview.addEventListener('click', (e) => {
    const btn = e.target.closest('.code-copy');
    if (!btn) return;
    const block = btn.closest('.code-block');
    const code = block ? block.querySelector('code') : null;
    if (!code) return;
    const text = code.innerText;
    const done = () => {
      btn.classList.add('copied');
      const label = btn.querySelector('span');
      const old = label ? label.textContent : '';
      if (label) label.textContent = 'Copied!';
      setTimeout(() => { btn.classList.remove('copied'); if (label) label.textContent = old; }, 1400);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
      } else {
        fallbackCopy(text, done);
      }
    } catch (err) { fallbackCopy(text, done); }
  });
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ── Editing ── */
  editor.addEventListener('input', () => {
    if (isApplyingRemote) return;
    afterEdit();
  });

  editor.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      afterEdit();
    } else if (ctrl && e.key.toLowerCase() === 's') {
      e.preventDefault();
      clearTimeout(debounceTimer);
      vscode.postMessage({ type: 'edit', text: editor.value });
      vscode.postMessage({ type: 'save' });
    } else if (ctrl && e.key.toLowerCase() === 'b') {
      e.preventDefault(); FORMATTERS.bold();
    } else if (ctrl && e.key.toLowerCase() === 'i') {
      e.preventDefault(); FORMATTERS.italic();
    } else if (ctrl && e.key.toLowerCase() === 'k') {
      e.preventDefault(); FORMATTERS.link();
    }
  });

  /* ── Synced scrolling + active outline highlighting ── */
  editor.addEventListener('scroll', () => {
    if (currentMode !== 'split') return;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
  });
  preview.addEventListener('scroll', () => {
    if (!tocOpen) return;
    const heads = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let activeId = null;
    heads.forEach((h) => {
      if (h.getBoundingClientRect().top < 120) activeId = h.id;
    });
    if (activeId) {
      outline.querySelectorAll('a').forEach((a) => {
        a.classList.toggle('active', a.dataset.target === activeId);
      });
    }
  });

  /* ── Messages from the extension ── */
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'update') {
      if (editor.value !== msg.text) {
        const pos = editor.selectionStart;
        isApplyingRemote = true;
        editor.value = msg.text;
        try {
          editor.selectionStart = editor.selectionEnd = Math.min(pos, editor.value.length);
        } catch (e) { /* ignore */ }
        isApplyingRemote = false;
        if (currentMode !== 'edit') renderPreview();
        else updateStats();
      }
    } else if (msg.type === 'config') {
      const c = msg.config || {};
      const root = document.documentElement.style;
      if (c.fontFamily) root.setProperty('--font-family', c.fontFamily);
      if (c.fontSize) root.setProperty('--font-size', c.fontSize + 'px');
      if (c.lineHeight) root.setProperty('--line-height', String(c.lineHeight));
      if (!window.__inited) {
        window.__inited = true;
        // Priority: saved state, then the configured default
        applyTheme((saved.theme) || c.previewTheme || 'auto');
        setToc(tocOpen);
        setMode((saved.mode) || c.defaultMode || 'split');
      }
    }
  });

  // Initial setup before config arrives
  applyTheme(currentTheme);
  setToc(tocOpen);
  setMode(currentMode);
  vscode.postMessage({ type: 'ready' });
})();
