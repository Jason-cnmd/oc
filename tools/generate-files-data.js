/* ==========================================================================
   OC应用集市 · 文件清单生成器
   --------------------------------------------------------------------------
   作用：扫描 files/ 目录（含子目录），生成 assets/js/files-data.js。
   用法：node tools/generate-files-data.js
   说明：生成的是普通 <script> 数据文件，因此双击 index.html / market.html
        （file:// 协议）也能正常显示，无需服务器与 fetch。
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

/* 目录名自动探测：优先 files，兼容历史拼写 fies */
let dirName = 'files';
if (!fs.existsSync(path.join(root, 'files')) && fs.existsSync(path.join(root, 'fies'))) {
  dirName = 'fies';
}
const sourceDir = path.join(root, dirName);
const outFile = path.join(root, 'assets', 'js', 'files-data.js');

const VARIANT_RULES = [
  { key: '便携版', test: /便携/ },
  { key: '安装版', test: /安装/ }
];
const VERSION_RE = /^v?\d+(\.\d+)*$/i;
const IGNORE = new Set(['thumbs.db', 'desktop.ini', '.ds_store']);

/* ---------- 1. 收集文件 ---------- */
const files = [];
(function walk(dir, rel) {
  if (!fs.existsSync(dir)) { return; }
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    const relPath = rel ? rel + '/' + entry.name : entry.name;
    if (entry.isDirectory()) {
      walk(full, relPath);
    } else if (!IGNORE.has(entry.name.toLowerCase())) {
      files.push({ relPath, stat: fs.statSync(full) });
    }
  });
})(sourceDir, '');

/* ---------- 2. 解析名称 / 版本 / 变体 ---------- */
function parseName(fileName) {
  const base = fileName.replace(/\.[^.]+$/, '');
  const segs = base.split(/[-_－—]/).map((s) => s.trim()).filter(Boolean);

  let variant = '其他工具';
  for (const rule of VARIANT_RULES) {
    if (segs.some((s) => rule.test.test(s))) { variant = rule.key; break; }
  }

  const versionSegs = segs.filter((s) => VERSION_RE.test(s));
  const version = versionSegs.length ? versionSegs[versionSegs.length - 1].replace(/^v/i, '') : '';

  const nameSegs = segs.filter((s) => !VERSION_RE.test(s) && !/^(便携版?|安装版?)$/.test(s));
  const name = nameSegs.join(' ') || base;

  return { name, version, variant, ext: (path.extname(fileName) || '').replace('.', '').toLowerCase() || 'file' };
}

/* ---------- 3. 生成数据文件 ---------- */
const items = files
  .map((f) => {
    const meta = parseName(path.basename(f.relPath));
    return {
      name: meta.name,
      version: meta.version,
      variant: meta.variant,
      ext: meta.ext,
      file: dirName + '/' + f.relPath,
      size: f.stat.size,
      date: f.stat.mtime.toISOString().slice(0, 10)
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN') || a.variant.localeCompare(b.variant, 'zh-Hans-CN') || a.version.localeCompare(b.version, undefined, { numeric: true }));

const body = items.map((it) => '  ' + JSON.stringify(it) + ',').join('\n');
const banner = [
  '/* 由 tools/generate-files-data.js 自动生成，请勿手工修改 */',
  '/* 目录：' + dirName + '/ · 文件数：' + items.length + ' · 生成时间：' + new Date().toISOString() + ' */',
  '/* 新增 / 删除文件后重新执行：node tools/generate-files-data.js */',
  ''
].join('\n');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(
  outFile,
  banner +
  'window.OC_MARKET_DIR = ' + JSON.stringify(dirName + '/') + ';\n' +
  'window.OC_MARKET_FILES = [\n' + body + (body ? '\n' : '') + '];\n',
  'utf8'
);

const totalBytes = items.reduce((sum, it) => sum + it.size, 0);
console.log('generated ' + path.relative(root, outFile) + ' :: ' + items.length + ' files, ' + totalBytes + ' bytes');
items.forEach((it) => console.log('  - ' + it.name + ' ' + it.variant + ' ' + (it.version || '-') + ' (' + it.file + ')'));
