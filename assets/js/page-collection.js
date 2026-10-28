/* =========================================================
   ArtScope — 收藏清單頁腳本
   ========================================================= */
(function () {
  "use strict";

  var AS = window.AS;
  var data = AS.data;

  function render() {
    var host = document.getElementById("collection-body");
    var countHost = document.getElementById("collection-count");
    var works = AS.favorites.works();
    var rawCount = AS.favorites.count();

    countHost.textContent = rawCount + " 件收藏";

    if (!works.length) {
      // 區分「從未收藏」與「收藏的作品已不存在」
      host.innerHTML =
        '<div class="state-block" role="status">' +
        '<div class="state-block__icon" aria-hidden="true">♡</div>' +
        '<h2 class="state-block__title">' +
        (rawCount ? "收藏的作品目前不在展出清單中" : "收藏清單還是空的") +
        "</h2>" +
        '<p class="state-block__text">' +
        (rawCount
          ? "你收藏的作品可能已被移除或尚未加入目前的資料檔。可先清除失效的收藏紀錄。"
          : "在作品卡片或作品詳情頁點擊「收藏」，喜歡的作品就會出現在這裡，方便你之後再次欣賞。") +
        "</p>" +
        '<div class="state-block__actions">' +
        '<a class="btn btn--primary" href="gallery.html">前往作品探索</a>' +
        (rawCount ? '<button type="button" class="btn btn--ghost" data-clear-stale>清除失效收藏</button>' : "") +
        '<a class="btn btn--ghost" href="index.html">返回首頁</a>' +
        "</div></div>";
      return;
    }

    host.innerHTML =
      '<div class="results-bar">' +
      '<p class="results-count">顯示 <strong>' +
      works.length +
      "</strong> 件已收藏作品</p>" +
      '<div class="active-filters">' +
      '<a class="btn btn--ghost" href="gallery.html" style="font-size:var(--fs-xs);padding:.35rem .8rem">＋ 繼續瀏覽作品</a>' +
      "</div></div>" +
      AS.ui.gridHTML(works);

    AS.ui.bindImageError(host);
    AS.ui.setupReveal();
  }

  function bindEvents() {
    document.getElementById("collection-body").addEventListener("click", function (e) {
      if (!e.target.closest("[data-clear-stale]")) return;
      // 清除不在目前資料檔中的收藏 id
      var validIds = data.all().map(function (w) {
        return w.id;
      });
      AS.favorites.ids().forEach(function (id) {
        if (validIds.indexOf(id) === -1) AS.favorites.remove(id);
      });
      AS.ui.toast("已清除失效的收藏紀錄", "success");
      render();
    });

    // 收藏狀態改變時（含取消收藏）重新渲染
    window.addEventListener("artscope:favorites", function () {
      render();
    });
  }

  function init() {
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
