// Lightweight, offline code highlighter for Qalam — dependency-free and CSP-safe.
// Output: an HTML string with <span> elements carrying tok-* classes that CSS colors.
(function () {
  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Map language aliases to their base grammar
  const ALIASES = {
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    ts: 'javascript', tsx: 'javascript', typescript: 'javascript', node: 'javascript',
    py: 'python', python3: 'python',
    sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', shellscript: 'bash',
    yml: 'yaml',
    htm: 'html', xml: 'html', svg: 'html', vue: 'html',
    scss: 'css', less: 'css',
    rb: 'ruby',
    'c++': 'cpp', cxx: 'cpp', cc: 'cpp', h: 'cpp', hpp: 'cpp', c: 'cpp',
    cs: 'csharp', 'c#': 'csharp',
    golang: 'go',
    rs: 'rust',
    kt: 'kotlin',
    md: 'markdown'
  };

  const KW = {
    javascript: 'async await break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield as enum implements interface namespace type readonly public private protected abstract declare',
    python: 'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case',
    bash: 'if then else elif fi for in do done case esac while until function select time return break continue local export readonly declare set unset shift source eval exec trap',
    css: '',
    html: '',
    json: '',
    yaml: '',
    sql: 'select from where insert into values update set delete create table drop alter add column primary key foreign references index join inner left right outer on group by order having limit offset union all distinct as and or not null like in between exists count sum avg min max case when then else end desc asc default unique constraint',
    go: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var',
    rust: 'as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait type unsafe use where while',
    cpp: 'alignas auto break case catch class const constexpr continue default delete do double else enum explicit export extern false float for friend goto if inline int long namespace new noexcept nullptr operator private protected public register return short signed sizeof static struct switch template this throw true try typedef typename union unsigned using virtual void volatile while bool char',
    csharp: 'abstract as base bool break byte case catch char class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach get goto if implicit in int interface internal is lock long namespace new null object out override params private protected public readonly ref return sealed set short sizeof static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using var virtual void volatile while async await yield',
    java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record',
    ruby: 'def end if elsif else unless while until for in do begin rescue ensure raise return yield class module self nil true false and or not then case when break next redo retry super require require_relative attr_accessor attr_reader attr_writer',
    php: 'abstract and array as break callable case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list namespace new or print private protected public require require_once return static switch throw trait try unset use var while xor yield',
    kotlin: 'abstract as break by catch class companion const continue do else enum false final finally for fun if import in interface internal is lateinit null object open override package private protected public return sealed super this throw true try typealias val var when while',
    markdown: ''
  };

  const BOOLS = 'true false null undefined None True False nil NULL NaN Infinity';
  const BUILTINS = {
    python: 'print len range int str float list dict set tuple bool type isinstance enumerate zip map filter open input sum min max abs round sorted reversed any all super self __init__',
    javascript: 'console window document Math JSON Object Array String Number Boolean Promise Map Set Symbol Date RegExp Error parseInt parseFloat isNaN require module exports'
  };

  // Build the rule set for a language (each rule is a regex string with a y/sticky flag)
  function rxList(specs) {
    return specs.map(function (s) {
      return { type: s[1], re: new RegExp(s[0], s[2] || 'y') };
    });
  }

  function wordRe(words) {
    return '\\b(?:' + words.trim().split(/\s+/).join('|') + ')\\b';
  }

  const COMMON_NUM = '(?:0[xXbBoO][0-9a-fA-F_]+|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?[fFlLuU]*)';

  function buildGrammar(lang) {
    const kw = KW[lang] || '';
    const specs = [];
    specs.push(['\\s+', null]);

    if (lang === 'html') {
      return rxList([
        ['<!--[\\s\\S]*?-->', 'comment'],
        ['<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', 'comment'],
        ['<!DOCTYPE[^>]*>', 'comment', 'yi'],
        ['</?[A-Za-z][\\w:-]*', 'tag'],
        ['"[^"]*"', 'string'],
        ["'[^']*'", 'string'],
        ['[A-Za-z_:][\\w:.-]*(?=\\s*=)', 'attr'],
        ['[<>/=]', 'punctuation'],
        ['\\s+', null],
        ['[^<]+', null]
      ]);
    }

    if (lang === 'css') {
      return rxList([
        ['\\/\\*[\\s\\S]*?\\*\\/', 'comment'],
        ['@[\\w-]+', 'keyword'],
        ['"(?:\\\\.|[^"\\\\])*"', 'string'],
        ["'(?:\\\\.|[^'\\\\])*'", 'string'],
        ['#[0-9a-fA-F]{3,8}\\b', 'number'],
        ['!important', 'keyword'],
        ['[\\w-]+(?=\\s*\\()', 'function'],
        ['[A-Za-z-]+(?=\\s*:)', 'attr'],
        ['-?\\d[\\d.]*(?:px|em|rem|ex|ch|vh|vw|vmin|vmax|%|s|ms|deg|rad|turn|fr|dpi)?\\b', 'number'],
        ['[.#&][\\w-]+', 'class'],
        ['[:][:]?[\\w-]+', 'keyword'],
        ['[{}();:,>~+*]', 'punctuation'],
        ['\\s+', null]
      ]);
    }

    if (lang === 'json') {
      return rxList([
        ['"(?:\\\\.|[^"\\\\])*"(?=\\s*:)', 'attr'],
        ['"(?:\\\\.|[^"\\\\])*"', 'string'],
        ['\\b(?:true|false|null)\\b', 'boolean'],
        ['-?' + COMMON_NUM, 'number'],
        ['[{}\\[\\],:]', 'punctuation'],
        ['\\s+', null]
      ]);
    }

    if (lang === 'yaml') {
      return rxList([
        ['#.*', 'comment'],
        ['^[\\s-]*[\\w .-]+(?=\\s*:)', 'attr', 'ym'],
        ['"(?:\\\\.|[^"\\\\])*"', 'string'],
        ["'(?:\\\\.|[^'\\\\])*'", 'string'],
        ['\\b(?:true|false|null|yes|no|on|off)\\b', 'boolean', 'yi'],
        ['-?' + COMMON_NUM, 'number'],
        ['[:\\-|>&*]', 'punctuation'],
        ['\\s+', null]
      ]);
    }

    if (lang === 'markdown') {
      return rxList([
        ['^#{1,6}\\s.*', 'keyword', 'ym'],
        ['`[^`]+`', 'string'],
        ['\\*\\*[^*]+\\*\\*', 'class'],
        ['\\[[^\\]]+\\]\\([^)]+\\)', 'function'],
        ['^\\s*[-*+]\\s', 'punctuation', 'ym'],
        ['\\s+', null]
      ]);
    }

    // Generic C-like / scripting languages
    const hashComment = (lang === 'python' || lang === 'bash' || lang === 'ruby' || lang === 'yaml');
    const dashComment = (lang === 'sql');

    if (hashComment) specs.push(['#.*', 'comment']);
    if (dashComment) specs.push(['--.*', 'comment']);
    specs.push(['\\/\\/.*', 'comment']);
    specs.push(['\\/\\*[\\s\\S]*?\\*\\/', 'comment']);

    if (lang === 'python') {
      specs.push(['[rbfRBF]{0,2}"""[\\s\\S]*?"""', 'string']);
      specs.push(["[rbfRBF]{0,2}'''[\\s\\S]*?'''", 'string']);
      specs.push(['@[\\w.]+', 'function']);
    }
    if (lang === 'bash') {
      specs.push(['\\$\\{[^}]*\\}', 'variable']);
      specs.push(['\\$[\\w@*#?!-]+', 'variable']);
    }

    specs.push(['[rbfRBF]{0,2}"(?:\\\\.|[^"\\\\\\n])*"', 'string']);
    specs.push(["[rbfRBF]{0,2}'(?:\\\\.|[^'\\\\\\n])*'", 'string']);
    specs.push(['`(?:\\\\.|[^`\\\\])*`', 'string']);

    specs.push(['\\b(?:' + BOOLS.split(' ').join('|') + ')\\b', 'boolean']);
    if (kw) specs.push([wordRe(kw), 'keyword', lang === 'sql' ? 'yi' : 'y']);

    const builtins = BUILTINS[lang];
    if (builtins) specs.push([wordRe(builtins), 'builtin']);

    specs.push([COMMON_NUM, 'number']);
    specs.push(['[A-Za-z_$][\\w$]*(?=\\s*\\()', 'function']);
    specs.push(['\\b[A-Z][A-Za-z0-9_]*\\b', 'class']);
    specs.push(['[A-Za-z_$][\\w$]*', null]);
    specs.push(['[+\\-*/%=<>!&|^~?:]+', 'operator']);
    specs.push(['[{}()\\[\\];,.]', 'punctuation']);

    return rxList(specs);
  }

  const CACHE = {};
  function grammarFor(lang) {
    if (!CACHE[lang]) CACHE[lang] = buildGrammar(lang);
    return CACHE[lang];
  }

  const SUPPORTED = {
    javascript: 1, python: 1, bash: 1, css: 1, html: 1, json: 1, yaml: 1,
    sql: 1, go: 1, rust: 1, cpp: 1, csharp: 1, java: 1, ruby: 1, php: 1,
    kotlin: 1, markdown: 1
  };

  function lex(code, rules) {
    let html = '';
    let pos = 0;
    const n = code.length;
    let guard = 0;
    while (pos < n) {
      if (++guard > n + 5) break;
      let matched = false;
      for (let r = 0; r < rules.length; r++) {
        const rule = rules[r];
        rule.re.lastIndex = pos;
        const m = rule.re.exec(code);
        if (m && m[0].length > 0) {
          const text = m[0];
          html += rule.type
            ? '<span class="tok-' + rule.type + '">' + escapeHtml(text) + '</span>'
            : escapeHtml(text);
          pos += text.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        html += escapeHtml(code[pos]);
        pos++;
      }
    }
    return html;
  }

  // API: window.highlightCode(code, lang) -> HTML string
  // If the language is unsupported, returns safely escaped text only.
  window.highlightCode = function (code, lang) {
    const key = (lang || '').toLowerCase().trim();
    const base = ALIASES[key] || key;
    if (!base || !SUPPORTED[base]) {
      return escapeHtml(code);
    }
    try {
      return lex(code, grammarFor(base));
    } catch (e) {
      return escapeHtml(code);
    }
  };

  window.highlightLangName = function (lang) {
    const key = (lang || '').toLowerCase().trim();
    const base = ALIASES[key] || key;
    return SUPPORTED[base] ? base : (key || '');
  };
})();
