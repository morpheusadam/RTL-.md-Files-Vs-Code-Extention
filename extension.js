// RTL Markdown — ویرایشگر سفارشی راست‌به‌چپ برای فایل‌های مارک‌داون
// نوشته‌شده با JavaScript خالص تا بدون مرحله build قابل اجرا باشد.

const vscode = require('vscode');

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
}

function resolveUri(uri) {
  if (uri && uri.fsPath) return uri;
  const active = vscode.window.activeTextEditor;
  return active ? active.document.uri : undefined;
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
      defaultMode: c.get('defaultMode')
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
    const mdUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'markdown.js'));
    const mainUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'main.js'));

    return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>RTL Markdown</title>
</head>
<body>
  <div class="toolbar">
    <button id="tab-edit" class="tab" type="button" title="Edit">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      <span>Edit</span>
    </button>
    <button id="tab-split" class="tab" type="button" title="Split">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
      <span>Split</span>
    </button>
    <button id="tab-preview" class="tab" type="button" title="Preview">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      <span>Preview</span>
    </button>
    <span class="spacer"></span>
    <button id="open-default" class="ghost" type="button" title="Open in Text Editor">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
      <span>Open in Text Editor</span>
    </button>
  </div>
  <div class="container" id="container">
    <textarea id="editor" dir="rtl" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off"></textarea>
    <div id="preview" class="markdown-body" dir="rtl"></div>
  </div>
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
