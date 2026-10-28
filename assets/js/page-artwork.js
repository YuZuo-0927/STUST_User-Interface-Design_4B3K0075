/* =========================================================
   ArtScope — 作品詳情頁腳本
   所有區塊皆依作品資料動態產生；缺少資料時自動隱藏。
   ========================================================= */
(function () {
  "use strict";

  var AS = window.AS;
  var esc = AS.utils.escapeHtml;
  var data = AS.data;

  var current = null;      // 目前作品
  var images = [];         // 圖片列表（封面 + 補充圖片）
  var imageIndex = 0;      // 目前選取的圖片

  /* ---------- 網址 ---------- */

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    return (params.get("slug") || "").trim();
  }

  // 從網址取得要顯示的圖片編號（artwork.html?slug=…&img=2）
  function getInitialImageIndex() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("img");
    var n = raw === null ? 1 : parseInt(raw, 10);
    if (isNaN(n) || n < 1) n = 1;
    return n - 1;
  }

  // 切換圖片時同步網址，分享網址就會停在目前這張圖
  function syncUrlImage() {
    if (!current) return;
    try {
      var params = new URLSearchParams(window.location.search);
      params.set("slug", current.slug);
      if (images.length > 1) params.set("img", String(imageIndex + 1));
      else params.delete("img");
      history.replaceState(null, "", window.location.pathname + "?" + params.toString());
    } catch (e) {
      /* 某些環境不允許更換網址，忽略即可 */
    }
  }

  /* ---------- 未找到狀態 ---------- */

  function renderNotFound(slug) {
    var main = document.getElementById("main");
    main.innerHTML =
      '<div class="container" style="padding-block:var(--sp-8)">' +
      '<div class="state-block" role="alert">' +
      '<div class="state-block__icon" aria-hidden="true">!</div>' +
      '<h1 class="state-block__title">找不到這件作品</h1>' +
      '<p class="state-block__text">' +
      (slug
        ? "網址指定的作品（" + esc(slug) + "）不存在，可能已被移除或網址輸入錯誤。"
        : "這個頁面需要作品識別網址才能顯示內容。") +
      "</p>" +
      '<div class="state-block__actions">' +
      '<a class="btn btn--primary" href="gallery.html">返回作品探索</a>' +
      '<a class="btn btn--ghost" href="index.html">返回首頁</a>' +
      "</div></div></div>";
  }

  /* ---------- 圖片檢視器（頁內） ---------- */

  function renderViewer() {
    var host = document.getElementById("image-viewer");
    if (!host) return;

    var item = images[imageIndex];
    var multi = images.length > 1;

    host.innerHTML =
      '<div class="image-viewer__head">' +
      '<p class="image-viewer__title">作品圖片 <span data-viewer-counter></span></p>' +
      '<div class="viewer-nav">' +
      (multi
        ? '<button type="button" class="icon-btn" data-viewer-prev aria-label="上一張圖片">‹ 上一張</button>' +
          '<button type="button" class="icon-btn" data-viewer-next aria-label="下一張圖片">下一張 ›</button>'
        : "") +
      '<button type="button" class="icon-btn" data-viewer-zoom aria-label="放大檢視目前圖片">⊕ 放大檢視</button>' +
      "</div></div>" +
      '<div class="image-viewer__stage">' +
      AS.ui.imageFrame(item.src, item.alt, "viewer-main", 'data-viewer-img') +
      "</div>" +
      '<p class="image-viewer__caption" data-viewer-caption>' +
      esc(item.caption || item.alt || "") +
      "</p>" +
      (multi
        ? '<div class="thumbs" role="tablist" aria-label="作品圖片選擇">' +
          images
            .map(function (img, i) {
              return (
                '<button type="button" class="thumb" role="tab" data-thumb="' +
                i +
                '" aria-current="' +
                (i === imageIndex ? "true" : "false") +
                '" aria-label="查看第 ' +
                (i + 1) +
                " 張圖片：" +
                esc(img.alt || img.caption || "圖片 " + (i + 1)) +
                '">' +
                AS.ui.imageFrame(img.src, "", "") +
                "</button>"
              );
            })
            .join("") +
          "</div>"
        : "");

    var counter = host.querySelector("[data-viewer-counter]");
    if (counter) {
      counter.textContent = multi ? "（" + (imageIndex + 1) + " / " + images.length + "）" : "（1 張）";
    }

    AS.ui.bindImageError(host);
  }

  function setImage(index) {
    if (!images.length) return;
    imageIndex = (index + images.length) % images.length;
    renderViewer();
    updateHero();
    syncUrlImage();
  }

  // 主視覺與檢視器同步（從系列卡片進入時會直接停在指定圖片）
  function updateHero() {
    var item = images[imageIndex];
    if (!item) return;
    var hero = document.getElementById("hero-image");
    if (hero) {
      hero.src = item.src;
      hero.alt = item.alt || "";
    }
    var caption = document.querySelector("[data-hero-caption]");
    if (caption) {
      caption.textContent = item.caption || "";
      caption.hidden = !item.caption;
    }
  }

  /* ---------- 創作故事 ---------- */

  function renderStory(work) {
    var host = document.getElementById("story");
    if (!host) return;

    var keys = Object.keys(work.story);
    if (!keys.length) {
      host.hidden = true; // 沒有故事資料 → 整個區塊隱藏
      return;
    }

    var totalLength = keys.reduce(function (sum, k) {
      return sum + work.story[k].text.length;
    }, 0);
    var collapsible = totalLength > 700 && keys.length > 1;

    host.hidden = false;
    host.innerHTML =
      '<span class="section-head__eyebrow">Story</span>' +
      '<h2 class="section-head__title">創作故事</h2>' +
      '<p class="story__lead">以下內容依作品資料分層呈現，未提供的欄位不會顯示。</p>' +
      keys
        .map(function (key, i) {
          var section = work.story[key];
          var extra = collapsible && i > 0;
          return (
            '<section class="story__section' +
            (extra ? " story__section--extra" : "") +
            '"' +
            (extra ? ' hidden data-extra' : "") +
            ">" +
            "<h3>" +
            esc(section.label) +
            "</h3>" +
            "<p>" +
            esc(section.text) +
            "</p>" +
            "</section>"
          );
        })
        .join("") +
      (collapsible
        ? '<div class="story__actions"><button type="button" class="btn btn--ghost" data-story-toggle aria-expanded="false">展開其餘故事段落</button></div>'
        : "");
  }

  /* ---------- 製作過程 ---------- */

  function renderProcess(work) {
    var host = document.getElementById("process");
    if (!host) return;

    if (!work.process.length) {
      host.hidden = true; // 沒有製作過程資料 → 隱藏
      return;
    }

    host.hidden = false;
    host.innerHTML =
      '<span class="section-head__eyebrow">Process</span>' +
      '<h2 class="section-head__title">製作過程</h2>' +
      (work.process.length > 1
        ? '<div class="process__tabs" role="tablist" aria-label="製作階段選擇">' +
          work.process
            .map(function (stage, i) {
              return (
                '<button type="button" class="process__tab" role="tab" id="ptab-' +
                i +
                '" data-stage="' +
                i +
                '" aria-selected="' +
                (i === 0 ? "true" : "false") +
                '" aria-controls="ppanel" tabindex="' +
                (i === 0 ? "0" : "-1") +
                '">' +
                esc(stage.stage) +
                "</button>"
              );
            })
            .join("") +
          "</div>"
        : "") +
      '<div class="process__panel" id="ppanel" role="tabpanel" tabindex="0" data-process-panel></div>';

    renderStage(work, 0);
  }

  function renderStage(work, index) {
    var host = document.querySelector("[data-process-panel]");
    if (!host) return;
    var stage = work.process[index];
    if (!stage) return;

    host.classList.remove("process__fade");
    void host.offsetWidth; // 重新觸發淡入動畫
    host.classList.add("process__fade");

    host.innerHTML =
      "<div>" +
      AS.ui.imageFrame(stage.image, work.title + " 製作階段：" + stage.stage, "") +
      '<div style="margin-top:var(--sp-3)">' +
      '<button type="button" class="icon-btn" data-process-zoom="' +
      index +
      '" aria-label="放大檢視「' +
      esc(stage.stage) +
      '」圖片">⊕ 放大檢視</button>' +
      "</div></div>" +
      "<div>" +
      '<p class="process__stage-index">階段 ' +
      (index + 1) +
      " / " +
      work.process.length +
      "</p>" +
      '<h3 class="process__stage-name">' +
      esc(stage.stage) +
      "</h3>" +
      (stage.caption
        ? '<p class="process__caption">' + esc(stage.caption) + "</p>"
        : '<p class="placeholder-note--inline">此階段說明待補充。</p>') +
      "</div>";

    Array.prototype.forEach.call(document.querySelectorAll("[data-stage]"), function (tab) {
      var active = Number(tab.getAttribute("data-stage")) === index;
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.setAttribute("tabindex", active ? "0" : "-1");
    });

    AS.ui.bindImageError(host);
  }

  /* ---------- 相關作品／上一件下一件 ---------- */

  function renderRelated(work) {
    var host = document.getElementById("related");
    if (!host) return;
    var list = data.related(work, 3);

    if (!list.length) {
      host.hidden = true;
      return;
    }

    host.hidden = false;
    host.innerHTML =
      '<div class="section-head">' +
      '<div><span class="section-head__eyebrow">Related</span>' +
      '<h2 class="section-head__title">相關作品</h2></div>' +
      '<a class="btn btn--ghost" href="gallery.html">返回作品探索</a></div>' +
      AS.ui.gridHTML(list);

    AS.ui.bindImageError(host);
    AS.ui.setupReveal();
  }

  function renderPager(work) {
    var host = document.getElementById("pager");
    if (!host) return;
    var n = data.neighbours(work.slug);

    var html = "";
    if (n.prev) {
      html +=
        '<a href="artwork.html?slug=' +
        encodeURIComponent(n.prev.slug) +
        '" rel="prev"><span class="pager__label">← 上一件作品</span>' +
        '<span class="pager__title">' +
        esc(n.prev.title) +
        "</span></a>";
    }
    if (n.next) {
      html +=
        '<a class="pager--next" href="artwork.html?slug=' +
        encodeURIComponent(n.next.slug) +
        '" rel="next"><span class="pager__label">下一件作品 →</span>' +
        '<span class="pager__title">' +
        esc(n.next.title) +
        "</span></a>";
    }
    host.innerHTML = html;
    host.hidden = !html;
  }

  /* ---------- 主要渲染 ---------- */

  function render(work) {
    var main = document.getElementById("main");
    images = work.images.slice();
    // 從網址參數決定起始圖片（例如從系列卡片 ?img=2 進入）
    imageIndex = Math.min(Math.max(getInitialImageIndex(), 0), images.length - 1);

    var typeLabel = data.categoryLabel(work.type);
    var favOn = AS.favorites.has(work.id);

    main.innerHTML =
      '<div class="container">' +
      /* A. 返回與切換 */
      '<div class="detail-topbar">' +
      '<a class="btn btn--ghost" href="gallery.html">← 返回作品探索</a>' +
      '<span class="badge badge--accent">作品 ' +
      (data.neighbours(work.slug).index + 1) +
      " / " +
      data.all().length +
      "</span>" +
      "</div>" +

      /* A+B. 主視覺與圖片資訊 */
      '<div class="detail-hero">' +
      "<div>" +
      '<div class="detail-hero__media">' +
      AS.ui.imageFrame(images[imageIndex].src, images[imageIndex].alt, "", 'id="hero-image"') +
      '<button type="button" class="icon-btn detail-hero__zoom" data-hero-zoom aria-label="放大檢視作品主視覺">⊕ 放大</button>' +
      "</div>" +
      '<p class="detail-hero__caption" data-hero-caption' +
      (images[imageIndex].caption ? "" : " hidden") +
      ">" +
      esc(images[imageIndex].caption || "") +
      "</p>" +
      /* B. 圖片檢視器 */
      '<div class="image-viewer" id="image-viewer"></div>' +
      "</div>" +

      "<div>" +
      '<div class="detail-meta">' +
      '<span class="badge">' +
      esc(typeLabel) +
      "</span>" +
      (work.demo ? '<span class="badge badge--demo">DEMO 佔位資料</span>' : "") +
      work.tags
        .map(function (t) {
          return '<span class="badge">' + esc(t) + "</span>";
        })
        .join("") +
      "</div>" +
      '<h1 class="detail-title">' +
      esc(work.title) +
      "</h1>" +
      (work.description
        ? '<p class="detail-desc">' + esc(work.description) + "</p>"
        : '<p class="placeholder-note--inline">作品簡短介紹待補充。</p>') +

      /* F. 收藏與分享 */
      '<div class="detail-actions">' +
      AS.ui.favoriteButton(work, "lg") +
      '<button type="button" class="btn" data-copy-link>🔗 複製作品網址</button>' +
      (navigator.share
        ? '<button type="button" class="btn" data-share>分享作品</button>'
        : "") +
      "</div>" +

      '<p class="placeholder-note" style="margin-top:var(--sp-5)">' +
      '<span class="placeholder-note__tag">操作提示</span>' +
      "點擊圖片或「放大檢視」可進入全螢幕檢視；檢視中可用 Esc 關閉、← → 切換圖片，手機可左右滑動切換。" +
      "</p>" +
      "</div>" +
      "</div>" +

      /* C. 創作故事 */
      '<section class="story" id="story" hidden aria-labelledby="story-title"></section>' +

      /* D. 製作過程 */
      '<section class="process" id="process" hidden aria-labelledby="process-title"></section>' +

      /* E. 相關作品 */
      '<section class="related" id="related" hidden aria-labelledby="related-title"></section>' +

      /* 上一件／下一件 */
      '<nav class="pager" id="pager" aria-label="作品瀏覽"></nav>' +
      "</div>";

    renderViewer();
    renderStory(work);
    renderProcess(work);
    renderRelated(work);
    renderPager(work);

    AS.ui.bindImageError(main);
    AS.ui.syncFavoriteButtons(work.id);
  }

  /* ---------- 事件 ---------- */

  function bindEvents() {
    var main = document.getElementById("main");

    main.addEventListener("click", function (e) {
      var work = current;
      if (!work) return;

      // 放大主視覺（與目前選取的圖片同步）
      if (e.target.closest("[data-hero-zoom]")) {
        AS.ui.openLightbox(images, imageIndex, e.target.closest("button"));
        return;
      }

      // 檢視器控制
      if (e.target.closest("[data-viewer-zoom]")) {
        AS.ui.openLightbox(images, imageIndex, e.target.closest("button"));
        return;
      }
      if (e.target.closest("[data-viewer-prev]")) {
        setImage(imageIndex - 1);
        return;
      }
      if (e.target.closest("[data-viewer-next]")) {
        setImage(imageIndex + 1);
        return;
      }
      var thumb = e.target.closest("[data-thumb]");
      if (thumb) {
        setImage(Number(thumb.getAttribute("data-thumb")));
        return;
      }

      // 製作階段
      var tab = e.target.closest("[data-stage]");
      if (tab) {
        renderStage(work, Number(tab.getAttribute("data-stage")));
        return;
      }
      var stageZoom = e.target.closest("[data-process-zoom]");
      if (stageZoom) {
        var idx = Number(stageZoom.getAttribute("data-process-zoom"));
        AS.ui.openLightbox(
          work.process.map(function (s) {
            return { src: s.image, alt: work.title + "：" + s.stage, caption: s.stage };
          }),
          idx,
          stageZoom
        );
        return;
      }

      // 故事展開／收合
      var storyToggle = e.target.closest("[data-story-toggle]");
      if (storyToggle) {
        var expanded = storyToggle.getAttribute("aria-expanded") === "true";
        Array.prototype.forEach.call(document.querySelectorAll("[data-extra]"), function (node) {
          node.hidden = expanded;
        });
        storyToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        storyToggle.textContent = expanded ? "展開其餘故事段落" : "收合故事段落";
        return;
      }

      // 複製連結
      if (e.target.closest("[data-copy-link]")) {
        AS.ui.copyText(window.location.href)
          .then(function () {
            AS.ui.toast("已複製作品網址", "success");
          })
          .catch(function () {
            AS.ui.toast("複製失敗，請手動複製網址列連結", "warn");
          });
        return;
      }

      // 系統分享
      if (e.target.closest("[data-share]") && navigator.share) {
        navigator
          .share({
            title: work.title + "｜昱佐 YuZuo",
            text: work.description || "ArtScope 數位美術展覽",
            url: window.location.href
          })
          .catch(function () {
            /* 使用者取消分享 */
          });
      }
    });

    // 製作階段分頁鍵盤操作（左右鍵切換）
    main.addEventListener("keydown", function (e) {
      var tab = e.target.closest("[data-stage]");
      if (!tab) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-stage]"));
      var i = tabs.indexOf(tab);
      var next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      renderStage(current, Number(next.getAttribute("data-stage")));
    });
  }

  function init() {
    var slug = getSlug();
    var work = slug ? data.bySlug(slug) : null;

    if (!work) {
      renderNotFound(slug);
      document.title = "找不到作品｜昱佐 YuZuo";
      return;
    }

    current = work;
    document.title = work.title + "｜昱佐 YuZuo";
    render(work);
    bindEvents();
    AS.ui.setupReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
