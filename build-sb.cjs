// Squad Beyond 用の埋め込みHTMLを作る
// 使い方: node build-sb.cjs <画像のベースURL>
//   例) node build-sb.cjs https://cdn.jsdelivr.net/gh/USER/biolucia-zero@main/images/
// 出力: squadbeyond/sb_embed.html（SBのカスタムHTMLにそのまま貼る）
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const BASE = process.argv[2] || 'IMG_BASE/';
const SCOPE = '#blz';

// 画像ごとの使用箇所（コメントと画像一覧に使う）
const IMAGE_NOTES = {
  'fv_hair.jpg': 'FV 写真（現行LP sp_lca_aroma_02.png の上部を切り出し）',
  'bottle.png': 'FV 商品ボトル（資料P15から切り抜き・背景透過）',
  'pouch.png': 'FV 商品パウチ／オファー 商品画像（資料P13から切り抜き・背景透過）',
  'sp_recom_01.png': 'Q4 設問画像（現行LP）',
  'sp_point.png': 'Q5 設問画像（現行LP）',
  'sp_rakuten_ranking_lca.png': '実績 楽天ランキング11冠（現行LP）',
  'total_2m.png': '実績 累計200万本突破（資料P11から切り出し）',
};

const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(DIR, 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(DIR, 'script.js'), 'utf8');

// --- CSS を #blz の中に閉じ込める ---
function scopeSelector(sel) {
  return sel.split(',').map(s => {
    s = s.trim();
    if (!s) return s;
    if (s === ':root' || s === 'body' || s === 'html') return SCOPE;
    if (s === '*') return `${SCOPE}, ${SCOPE} *`;
    if (s.startsWith('*')) return `${SCOPE} ${s}`;
    return `${SCOPE} ${s}`;
  }).join(', ');
}
function scopeCss(src) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  let out = '', i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i);
    if (open === -1) break;
    const head = src.slice(i, open).trim();
    // 対応する閉じ括弧を探す
    let depth = 1, j = open + 1;
    while (j < src.length && depth) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; }
    const body = src.slice(open + 1, j - 1);
    if (head.startsWith('@keyframes')) out += `${head.replace('@keyframes ', '@keyframes blz-')}{${body}}\n`;
    else if (head.startsWith('@media')) out += `${head}{\n${scopeCss(body)}}\n`;
    else out += `${scopeSelector(head)}{${body}}\n`;
    i = j;
  }
  return out;
}
let scoped = scopeCss(css)
  .replace(/animation:\s*(\w+)/g, (m, n) => (n === 'none' ? m : `animation: blz-${n}`))
  .replace(/animation-name:\s*(\w+)/g, 'animation-name: blz-$1');
// ページ全体ではなく記事の幅に収める
scoped += `${SCOPE} { background: transparent; }\n${SCOPE} .page { max-width: 100%; }\n${SCOPE} [hidden] { display: none !important; }\n${SCOPE} img { border: 0; max-width: 100%; box-shadow: none; }\n${SCOPE} a { box-shadow: none; }\n`;

// --- HTML 本文 ---
let body = html.match(/<main class="page">([\s\S]*)<\/main>/)[1];
body = body.replace(/<img([^>]*?)src="images\/([^"]+)"([^>]*)>/g, (m, a, file, b) => {
  const note = IMAGE_NOTES[file] || '';
  return `<!-- 画像: ${file}｜${note} -->\n<img${a}src="${BASE}${file}"${b}>`;
});
const fonts = html.match(/<link href="https:\/\/fonts[^>]+>/)[0];

const out = `<!-- ===== ビオルチア0円アンケート記事（Squad Beyond カスタムHTML用） =====
  ・画像のベースURL: ${BASE}
  ・遷移先URL: スクリプト内 CTA_URL を差し替えてください
  ・スタイルはすべて ${SCOPE} の中だけに効きます
===================================================================== -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>
${scoped}</style>
<div id="blz"><div class="page">
${body.trim()}
</div></div>
<script>
${js.trim()}
</script>
`;

fs.mkdirSync(path.join(DIR, 'squadbeyond'), { recursive: true });
fs.writeFileSync(path.join(DIR, 'squadbeyond', 'sb_embed.html'), out);

// --- 画像一覧 ---
const rows = Object.entries(IMAGE_NOTES).map(([f, n]) => {
  const kb = Math.round(fs.statSync(path.join(DIR, 'images', f)).size / 1024);
  return `| ${f} | ${n} | ${kb}KB | ${BASE}${f} |`;
}).join('\n');
fs.writeFileSync(path.join(DIR, 'squadbeyond', '画像一覧.md'),
`# 画像一覧（Squad Beyond 用）

| ファイル | 使う場所 | 容量 | 指定するURL |
|---|---|---|---|
${rows}

## 差し替え方
- まとめて変える: \`node build-sb.cjs <ベースURL>\` で sb_embed.html を作り直す
- 1枚だけ変える: sb_embed.html 内の \`<!-- 画像: ファイル名 -->\` コメントの直下の src を、SBにアップした画像のURLに書き換える
`);
console.log('OK', BASE, (out.length / 1024).toFixed(0) + 'KB');
