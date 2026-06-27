(function () {
  const vscode = acquireVsCodeApi();
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const container = document.getElementById('container');

  let isApplyingRemote = false;
  let debounceTimer = null;
  let currentMode = 'split';

  function setMode(mode) {
    currentMode = mode;
    container.className = 'container mode-' + mode;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    const btn = document.getElementById('tab-' + mode);
    if (btn) btn.classList.add('active');
    if (mode !== 'edit') renderPreview();
  }

  function renderPreview() {
    try {
      preview.innerHTML = window.renderMarkdown(editor.value);
    } catch (e) {
      preview.textContent = String(e);
    }
  }

  function pushEdit() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      vscode.postMessage({ type: 'edit', text: editor.value });
    }, 250);
  }

  document.getElementById('tab-edit').addEventListener('click', () => setMode('edit'));
  document.getElementById('tab-split').addEventListener('click', () => setMode('split'));
  document.getElementById('tab-preview').addEventListener('click', () => setMode('preview'));
  document.getElementById('open-default').addEventListener('click', () => {
    vscode.postMessage({ type: 'openDefault' });
  });

  editor.addEventListener('input', () => {
    if (isApplyingRemote) return;
    if (currentMode !== 'edit') renderPreview();
    pushEdit();
  });

  // Tab => دو فاصله، و Ctrl+S => ذخیره
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      editor.dispatchEvent(new Event('input'));
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      clearTimeout(debounceTimer);
      vscode.postMessage({ type: 'edit', text: editor.value });
      vscode.postMessage({ type: 'save' });
    }
  });

  // اسکرول همگام در حالت دوبخشی
  editor.addEventListener('scroll', () => {
    if (currentMode !== 'split') return;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
  });

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
      }
    } else if (msg.type === 'config') {
      const c = msg.config || {};
      const root = document.documentElement.style;
      if (c.fontFamily) root.setProperty('--font-family', c.fontFamily);
      if (c.fontSize) root.setProperty('--font-size', c.fontSize + 'px');
      if (c.lineHeight) root.setProperty('--line-height', String(c.lineHeight));
      if (c.defaultMode && !window.__modeInitialized) {
        window.__modeInitialized = true;
        setMode(c.defaultMode);
      }
    }
  });

  setMode('split');
  vscode.postMessage({ type: 'ready' });
})();
