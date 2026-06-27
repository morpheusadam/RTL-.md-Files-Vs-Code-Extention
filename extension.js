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
    <button id="tab-edit" class="tab" type="button">✏️ Edit</button>
    <button id="tab-split" class="tab" type="button">🔀 Split</button>
    <button id="tab-preview" class="tab" type="button">👁️ Preview</button>
    <span class="spacer"></span>
    <button id="open-default" class="ghost" type="button">Open in Text Editor</button>
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
