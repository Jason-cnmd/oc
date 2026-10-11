/* ==========================================================================
   OC应用集市 · 应用集市页（market.html）
   数据来源：assets/js/files-data.js（由 tools/generate-files-data.js 扫描 files/ 生成）
   功能：渲染文件列表 + 关键词搜索 + 排序 + 统计
   ========================================================================== */
(function () {
  'use strict';

  var grid = document.getElementById('fileGrid');
  if (!grid) { return; }

  var FILES = Array.isArray(window.OC_MARKET_FILES) ? window.OC_MARKET_FILES.slice() : [];
  var DIR = window.OC_MARKET_DIR || 'files/';

  var DESC = {
    '便携版': '免安装，解压即用，不写入注册表，可放进 U 盘随身携带。',
    '安装版': '标准安装向导，自动创建开始菜单快捷方式与文件关联。',
    '其他工具': '独立小工具，双击即可运行，体积小、启动快。'
  };
  var PALETTE = ['#1A6CB5', '#0E477A', '#F9A61C', '#2E8BC0', '#E8930A', '#12A19A'];

  var state = { keyword: '', sort: 'name' };

  /* ---------------- 工具函数 ---------------- */
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatSize(bytes) {
    var n = Number(bytes) || 0;
    if (n >= 1073741824) { return (n / 1073741824).toFixed(2) + ' GB'; }
    if (n >= 1048576) { return (n / 1048576).toFixed(1) + ' MB'; }
    if (n >= 1024) { return (n / 1024).toFixed(1) + ' KB'; }
    return n + ' B';
  }

  function basename(filePath) {
    var p = String(filePath || '');
    var i = p.lastIndexOf('/');
    return i < 0 ? p : p.slice(i + 1);
  }

  function initial(name) {
    var s = String(name || '').trim();
    if (/^[A-Za-z]/.test(s)) { return s.charAt(0).toUpperCase(); }
    var cjk = s.match(/[\u4e00-\u9fa5]/);
    if (cjk) { return cjk[0]; }
    return s.charAt(0).toUpperCase();
  }

  function tileColor(name) {
    var h = 0;
    var s = String(name || '');
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return PALETTE[h % PALETTE.length];
  }

  function cmpVersion(a, b) {
    var pa = String(a || '0').split('.');
    var pb = String(b || '0').split('.');
    var len = Math.max(pa.length, pb.length);
    for (var i = 0; i < len; i++) {
      var x = parseInt(pa[i], 10) || 0;
      var y = parseInt(pb[i], 10) || 0;
      if (x !== y) { return x - y; }
    }
    return 0;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) { el.textContent = String(text); }
  }

  /* ---------------- 计算“最新版本” ---------------- */
  var latestByGroup = {};
  FILES.forEach(function (item) {
    if (!item.version) { return; }
    var key = item.name + '|' + item.variant;
    if (!latestByGroup[key] || cmpVersion(item.version, latestByGroup[key]) > 0) {
      latestByGroup[key] = item.version;
    }
  });

  /* ---------------- 顶部统计 ---------------- */
  function renderStats() {
    var totalBytes = FILES.reduce(function (sum, f) { return sum + (Number(f.size) || 0); }, 0);
    var dates = FILES.map(function (f) { return f.date; }).filter(Boolean).sort();
    setText('statCount', FILES.length);
    setText('statSize', formatSize(totalBytes));
    setText('statDate', dates.length ? dates[dates.length - 1] : '—');
    setText('statDir', DIR);
  }

  /* ---------------- 排序 ---------------- */
  function sortList(list) {
    return list.slice().sort(function (a, b) {
      if (state.sort === 'size-desc') { return (b.size || 0) - (a.size || 0); }
      if (state.sort === 'size-asc') { return (a.size || 0) - (b.size || 0); }
      if (state.sort === 'date-desc') {
        return String(b.date || '').localeCompare(String(a.date || '')) ||
          a.name.localeCompare(b.name, 'zh-Hans-CN');
      }
      return a.name.localeCompare(b.name, 'zh-Hans-CN') ||
        a.variant.localeCompare(b.variant, 'zh-Hans-CN') ||
        cmpVersion(a.version, b.version);
    });
  }

  /* ---------------- 卡片模板 ---------------- */
  function cardHtml(item, index) {
    var isLatest = !!item.version && latestByGroup[item.name + '|' + item.variant] === item.version;
    var label = item.name + ' ' + item.variant + (item.version ? ' v' + item.version : '');
    var url = encodeURI(item.file);
    var downloadIcon = '<svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
      ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 3v12"/><path d="m7 12 5 5 5-5"/><path d="M4 21h16"/></svg>';

    return '<article class="file-card" style="--i:' + index + '">' +
      '<div class="file-card__head">' +
        '<span class="file-card__avatar" style="background:' + tileColor(item.name) + '" aria-hidden="true">' +
          esc(initial(item.name)) + '</span>' +
        '<div class="file-card__ident">' +
          '<h3 class="file-card__name">' + esc(item.name) +
            (item.version ? '<span class="file-card__ver">v' + esc(item.version) + '</span>' : '') +
          '</h3>' +
          '<p class="file-card__file">' + esc(basename(item.file)) + '</p>' +
        '</div>' +
        (isLatest ? '<span class="file-card__badge">最新</span>' : '') +
      '</div>' +
      '<p class="file-card__desc">' + esc(DESC[item.variant] || DESC['其他工具']) + '</p>' +
      '<ul class="file-card__meta">' +
        '<li>' + esc(item.variant) + '</li>' +
        '<li>' + esc(formatSize(item.size)) + '</li>' +
        '<li>' + esc(item.date || '—') + '</li>' +
        '<li>' + esc(String(item.ext || '').toUpperCase()) + '</li>' +
      '</ul>' +
      '<a class="btn btn--orange file-card__dl" href="' + url + '" download' +
        ' aria-label="下载 ' + esc(label) + '">下载' + downloadIcon + '</a>' +
      '</article>';
  }

  /* ---------------- 渲染列表 ---------------- */
  var emptyBox = document.getElementById('emptyState');
  function render() {
    var kw = state.keyword.trim().toLowerCase();
    var list = FILES.filter(function (item) {
      if (!kw) { return true; }
      return (item.name + ' ' + item.variant + ' ' + (item.version || '') + ' ' + item.file)
        .toLowerCase().indexOf(kw) > -1;
    });
    list = sortList(list);

    if (list.length) {
      grid.innerHTML = list.map(cardHtml).join('');
      grid.removeAttribute('hidden');
      if (emptyBox) { emptyBox.hidden = true; }
    } else {
      grid.innerHTML = '';
      grid.setAttribute('hidden', 'hidden');
      if (emptyBox) { emptyBox.hidden = false; }
    }
    setText('resultCount', list.length ? '共 ' + list.length + ' 个文件' : '没有匹配结果');
  }

  /* ---------------- 事件绑定 ---------------- */
  var searchInput = document.getElementById('searchInput');
  var searchClear = document.getElementById('searchClear');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      state.keyword = searchInput.value;
      if (searchClear) { searchClear.hidden = !state.keyword; }
      render();
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', function () {
      if (!searchInput) { return; }
      searchInput.value = '';
      state.keyword = '';
      searchClear.hidden = true;
      searchInput.focus();
      render();
    });
  }

  var sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      state.sort = sortSelect.value;
      render();
    });
  }

  /* ---------------- 启动 ---------------- */
  renderStats();
  render();
})();
