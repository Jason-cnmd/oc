/* ==========================================================================
   OC应用集市 · 全站交互（index.html / market.html 共用）
   1) 区块滚动入场动效（带依次延迟）
   2) 平台数据数字滚动
   3) 页脚年份
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- 1. 滚动入场动效 ---------- */
  var revealItems = Array.prototype.slice.call(doc.querySelectorAll('[data-reveal]'));

  function revealNow(el) {
    el.classList.add('is-visible');
    el.removeAttribute('data-reveal');
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(revealNow);
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var el = entry.target;
        el.classList.add('is-visible');
        /* 动效结束后移除 data-reveal，避免残留的过渡延迟影响卡片 hover */
        var timer = window.setTimeout(function () { el.removeAttribute('data-reveal'); }, 1600);
        el.addEventListener('transitionend', function () {
          window.clearTimeout(timer);
          el.removeAttribute('data-reveal');
        }, { once: true });
        observer.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach(function (el) {
      var index = 0;
      var sib = el.previousElementSibling;
      while (sib) {
        if (sib.hasAttribute && sib.hasAttribute('data-reveal')) { index++; }
        sib = sib.previousElementSibling;
      }
      el.style.setProperty('--d', Math.min(index, 4) * 90 + 'ms');
      revealObserver.observe(el);
    });
  }

  /* ---------- 2. 数字滚动 ---------- */
  var counters = Array.prototype.slice.call(doc.querySelectorAll('[data-count]'));

  function render(el, value) {
    el.textContent = Number(value).toLocaleString('en-US');
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    if (reduceMotion) { render(el, target); return; }
    var duration = 1500;
    var startTime = null;
    function step(timestamp) {
      if (startTime === null) { startTime = timestamp; }
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      render(el, Math.round(target * eased));
      if (progress < 1) { window.requestAnimationFrame(step); }
    }
    window.requestAnimationFrame(step);
  }

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var countObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) { return; }
          countUp(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { countObserver.observe(el); });
    } else {
      counters.forEach(function (el) { render(el, parseFloat(el.getAttribute('data-count')) || 0); });
    }
  }

  /* ---------- 3. 页脚年份 ---------- */
  var yearEl = doc.getElementById('year');
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

})();
