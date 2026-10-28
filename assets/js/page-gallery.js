/* =========================================================
   ArtScope — 作品探索頁腳本
   篩選狀態會記在 sessionStorage，返回頁面時自動還原。
   ========================================================= */
(function () {
  "use strict";

  var AS = window.AS;
  var esc = AS.utils.escapeHtml;
  var data = AS.data;

  var STORAGE_KEY = "artscope:gallery-filter";

  var state = {
    type: "",
    tag: "",
    query: "",
    featured: false,
    layout: "grid"
  };

  /* ---------- 狀態讀寫 ---------- */

  function saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function loadState() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          state.type = parsed.type || "";
          state.tag = parsed.tag || "";
          state.query = parsed.query || "";
          state.featured = !!parsed.featured;
          state.layout = parsed.layout === "editorial" ? "editorial" : "grid";
        }
      }
    } catch (e) {}

    // 網址參數優先（例如從首頁「看精選作品」或分類卡片進入）
    var params = new URLSearchParams(window.location.search);
    if (params.has("type")) state.type = params.get("type") || "";
    if (params.has("tag")) state.tag = params.get("tag") || "";
    if (params.has("featured")) state.featured = params.get("featured") !== "0";
  }

  function hasFilter() {
    return !!(state.type || state.tag || state.featured || state.query.trim());
  }

  /* ---------- 篩選工具列 ---------- */

  function renderQuickChips() {
    var host = document.getElementById("quick-chips");
    if (!host) return;
    var featuredCount = data.featured().length;
    host.innerHTML =
      '<button type="button" class="chip" data-featured aria-pressed="' +
      (state.featured ? "true" : "false") +
      '">精選作品（' +
      featuredCount +
      "）</button>";
  }

  function renderTypeChips() {
    var host = document.getElementById("type-chips");
    var items = [{ id: "", label: "全部" }].concat(data.categories());

    host.innerHTML = items
      .map(function (item) {
        var active = state.type === item.id;
        return (
          '<button type="button" class="chip" data-type="' +
          esc(item.id) +
          '" aria-pressed="' +
          (active ? "true" : "false") +
          '">' +
          esc(item.label) +
          "</button>"
        );
      })
      .join("");
  }

  function renderTagChips() {
    var host = document.getElementById("tag-chips");
    var tags = data.tags();

    if (!tags.length) {
      host.innerHTML = '<span class="placeholder-note--inline">尚無標籤</span>';
      return;
    }

    var items = [{ id: "", label: "全部" }].concat(
      tags.map(function (t) {
        return { id: t, label: t };
      })
    );

    host.innerHTML = items
      .map(function (item) {
        var active = state.tag === item.id;
        return (
          '<button type="button" class="chip" data-tag="' +
          esc(item.id) +
          '" aria-pressed="' +
          (active ? "true" : "false") +
          '">' +
          esc(item.label) +
          "</button>"
        );
      })
      .join("");
  }

  function renderActiveFilters() {
    var host = document.getElementById("active-filters");
    var parts = [];

    if (state.featured) {
      parts.push(
        '<span class="filter-tag">只看精選作品' +
          '<button type="button" data-clear="featured" aria-label="清除精選篩選">✕</button></span>'
      );
    }
    if (state.type) {
      parts.push(
        '<span class="filter-tag">類型：' +
          esc(data.categoryLabel(state.type)) +
          '<button type="button" data-clear="type" aria-label="清除類型篩選">✕</button></span>'
      );
    }
    if (state.tag) {
      parts.push(
        '<span class="filter-tag">標籤：' +
          esc(state.tag) +
          '<button type="button" data-clear="tag" aria-label="清除標籤篩選">✕</button></span>'
      );
    }
    if (state.query.trim()) {
      parts.push(
        '<span class="filter-tag">搜尋：' +
          esc(state.query.trim()) +
          '<button type="button" data-clear="query" aria-label="清除搜尋關鍵字">✕</button></span>'
      );
    }

    if (parts.length) {
      parts.push(
        '<button type="button" class="btn btn--ghost" data-clear="all" style="padding:.35rem .8rem;font-size:var(--fs-xs)">清除全部條件</button>'
      );
      host.innerHTML = parts.join("");
    } else {
      host.innerHTML = "";
    }
  }

  function renderLayoutToggle() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-layout]"), function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-layout") === state.layout ? "true" : "false");
    });
  }

  /* ---------- 結果 ---------- */

  function renderResults() {
    var host = document.getElementById("gallery-results");
    var countHost = document.getElementById("results-count");
    var list = data.filter(state);
    var total = data.all().length;

    renderActiveFilters();
    renderLayoutToggle();

    if (!hasFilter()) {
      countHost.innerHTML = "共 <strong>" + total + "</strong> 件作品";
    } else {
      countHost.innerHTML =
        "符合條件 <strong>" + list.length + "</strong> 件（全部 " + total + " 件）";
    }

    if (!list.length) {
      var noWorksAtAll = !hasFilter() && total === 0;
      host.innerHTML = noWorksAtAll
        ? '<div class="state-block" role="status">' +
          '<div class="state-block__icon" aria-hidden="true">0</div>' +
          '<h2 class="state-block__title">目前沒有展出作品</h2>' +
          '<p class="state-block__text">正式作品資料尚未加入。請在 <code>assets/js/data.js</code> 的 <code>artworks</code> 陣列新增作品，並放入圖片。</p>' +
          '<div class="state-block__actions">' +
          '<a class="btn btn--primary" href="index.html">返回首頁</a>' +
          '<a class="btn btn--ghost" href="about.html">展覽介紹</a>' +
          "</div></div>"
        : '<div class="state-block" role="status">' +
          '<div class="state-block__icon" aria-hidden="true">0</div>' +
          '<h2 class="state-block__title">沒有符合條件的作品</h2>' +
          '<p class="state-block__text">請試著調整或清除目前的篩選條件，瀏覽完整的展出作品。</p>' +
          '<div class="state-block__actions">' +
          '<button type="button" class="btn btn--primary" data-clear="all">清除全部條件</button>' +
          '<a class="btn btn--ghost" href="index.html">返回首頁</a>' +
          "</div></div>";
      return;
    }

    host.innerHTML = AS.ui.gridHTML(list, state.layout === "editorial" ? "grid--editorial" : "");
    AS.ui.bindImageError(host);
    AS.ui.setupReveal();
  }

  function render() {
    renderQuickChips();
    renderTypeChips();
    renderTagChips();
    renderResults();
    saveState();
  }

  /* ---------- 事件 ---------- */

  function clearFilter(which) {
    if (which === "type" || which === "all") state.type = "";
    if (which === "tag" || which === "all") state.tag = "";
    if (which === "featured" || which === "all") state.featured = false;
    if (which === "tag" || which === "all") state.tag = "";
    if (which === "query" || which === "all") {
      state.query = "";
      var input = document.getElementById("search-input");
      if (input) input.value = "";
    }
    if (which === "all") {
      // 清除網址參數，避免重新整理後條件又回來
      try {
        history.replaceState(null, "", window.location.pathname);
      } catch (e) {}
    }
    render();
    if (which === "all") AS.ui.toast("已清除篩選條件", "info");
  }

  function bindEvents() {
    var quickHost = document.getElementById("quick-chips");
    if (quickHost) {
      quickHost.addEventListener("click", function (e) {
        if (!e.target.closest("[data-featured]")) return;
        state.featured = !state.featured;
        render();
        AS.ui.toast(state.featured ? "只顯示精選作品" : "已顯示全部作品", "info");
      });
    }

    document.getElementById("type-chips").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-type]");
      if (!btn) return;
      state.type = btn.getAttribute("data-type");
      render();
    });

    document.getElementById("tag-chips").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tag]");
      if (!btn) return;
      state.tag = btn.getAttribute("data-tag");
      render();
    });

    document.getElementById("active-filters").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-clear]");
      if (!btn) return;
      clearFilter(btn.getAttribute("data-clear"));
    });

    document.getElementById("gallery-results").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-clear]");
      if (!btn) return;
      clearFilter(btn.getAttribute("data-clear"));
    });

    var input = document.getElementById("search-input");
    input.value = state.query;
    var timer = null;
    input.addEventListener("input", function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        state.query = input.value;
        render();
      }, 220);
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-layout]"), function (btn) {
      btn.addEventListener("click", function () {
        state.layout = btn.getAttribute("data-layout");
        render();
        AS.ui.toast(
          state.layout === "editorial" ? "已切換為編輯式網格" : "已切換為規則網格",
          "info"
        );
      });
    });
  }

  function init() {
    loadState();
    bindEvents();
    render();
    AS.ui.bindImageError(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
