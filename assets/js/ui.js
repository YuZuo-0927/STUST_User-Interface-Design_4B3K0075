/* =========================================================
   ArtScope — 共用介面：頁首、頁尾、提示、圖片檢視器、卡片
   ========================================================= */
(function () {
  "use strict";

  var AS = (window.AS = window.AS || {});
  var esc = AS.utils.escapeHtml;
  var data = AS.data;

  /* ---------------- 圖片（含載入失敗替代狀態） ---------------- */

  /**
   * 產生圖片框：載入失敗時會顯示明確的替代訊息，
   * 並保留原本的版面大小。
   */
  function imageFrame(src, alt, className, extraAttr) {
    return (
      '<span class="img-frame ' +
      (className || "") +
      '">' +
      '<img class="img-frame__img" src="' +
      esc(src) +
      '" alt="' +
      esc(alt || "") +
      '" loading="lazy" decoding="async" ' +
      (extraAttr || "") +
      ">" +
      '<span class="img-frame__error" hidden>' +
      '<span class="img-frame__error-title">圖片載入失敗</span>' +
      '<span class="img-frame__error-note">請確認檔案是否存在於專案資料夾中。</span>' +
      "</span>" +
      "</span>"
    );
  }

  function bindImageError(root) {
    var imgs = (root || document).querySelectorAll(".img-frame__img:not([data-bound])");
    Array.prototype.forEach.call(imgs, function (img) {
      img.setAttribute("data-bound", "1");
      img.addEventListener("error", function () {
        var frame = img.closest(".img-frame");
        if (!frame || frame.classList.contains("is-broken")) return;
        // 圖片載入失敗：保留版面，改顯示明確的替代狀態
        img.hidden = true;
        var err = frame.querySelector(".img-frame__error");
        if (err) err.hidden = false;
        frame.classList.add("is-broken");
      });
      // 已快取失敗的圖不會再次觸發 error，補上判斷
      if (img.complete && img.naturalWidth === 0) {
        img.dispatchEvent(new Event("error"));
      }
    });
  }

  /* ---------------- 提示訊息（toast） ---------------- */

  var toastTimer = null;
  function toast(message, tone) {
    var region = document.getElementById("toast-region");
    if (!region) return;
    region.innerHTML =
      '<div class="toast toast--' +
      (tone || "info") +
      '" role="note">' +
      '<span class="toast__icon" aria-hidden="true">' +
      (tone === "success" ? "✓" : tone === "warn" ? "!" : "i") +
      "</span>" +
      '<span class="toast__text">' +
      esc(message) +
      "</span></div>";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      region.innerHTML = "";
    }, 2600);
  }

  /* ---------------- 收藏按鈕狀態同步 ---------------- */

  function syncFavoriteButtons(id) {
    var on = AS.favorites.has(id);
    var buttons = document.querySelectorAll('.fav-btn[data-id="' + id + '"]');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
      var work = data.byId(id);
      var name = work ? work.title : "此作品";
      btn.setAttribute("aria-label", (on ? "取消收藏" : "收藏") + name);
      var label = btn.querySelector(".fav-btn__label");
      if (label) label.textContent = on ? "已收藏" : "收藏";
      var mark = btn.querySelector(".fav-btn__mark");
      if (mark) mark.hidden = !on;
    });
    // 收藏數量徽章
    var count = AS.favorites.count();
    Array.prototype.forEach.call(document.querySelectorAll("[data-fav-count]"), function (el) {
      el.textContent = count ? String(count) : "";
      el.hidden = count === 0;
    });
  }

  function syncAllFavoriteButtons() {
    Array.prototype.forEach.call(document.querySelectorAll(".fav-btn[data-id]"), function (btn) {
      syncFavoriteButtons(btn.getAttribute("data-id"));
    });
    var count = AS.favorites.count();
    Array.prototype.forEach.call(document.querySelectorAll("[data-fav-count]"), function (el) {
      el.textContent = count ? String(count) : "";
      el.hidden = count === 0;
    });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".fav-btn") : null;
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var id = btn.getAttribute("data-id");
    var added = AS.favorites.toggle(id);
    syncFavoriteButtons(id);
    var work = data.byId(id);
    var name = work ? work.title : "作品";
    toast(added ? "已收藏「" + name + "」" : "已取消收藏「" + name + "」", added ? "success" : "info");
    // 讓收藏清單頁可以偵測變化
    window.dispatchEvent(new CustomEvent("artscope:ui-favorites", { detail: { id: id, added: added } }));
  });

  /* ---------------- 作品卡片 ---------------- */

  function favoriteButton(work, size) {
    var on = AS.favorites.has(work.id);
    return (
      '<button type="button" class="fav-btn ' +
      (size === "lg" ? "fav-btn--lg " : "") +
      (on ? "is-active" : "") +
      '" data-id="' +
      esc(work.id) +
      '" aria-pressed="' +
      (on ? "true" : "false") +
      '" aria-label="' +
      (on ? "取消收藏" : "收藏") +
      esc(work.title) +
      '">' +
      '<span class="fav-btn__icon" aria-hidden="true"></span>' +
      (size === "lg"
        ? '<span class="fav-btn__label">' + (on ? "已收藏" : "收藏") + "</span>"
        : '<span class="fav-btn__mark" ' + (on ? "" : "hidden") + ">已收藏</span>") +
      "</button>"
    );
  }

  function demoBadge(work) {
    return work.demo ? '<span class="badge badge--demo">DEMO</span>' : "";
  }

  function cardHTML(work, opts) {
    opts = opts || {};
    var typeLabel = data.categoryLabel(work.type);
    var tagsText = work.tags.length ? " · " + work.tags.join(" · ") : "";
    var total = work.images.length;
    var index = typeof opts.imageIndex === "number" ? opts.imageIndex : 0;
    if (index < 0 || index >= total) index = 0;
    var image = work.images[index] || { src: work.coverImage, alt: work.title + " 封面" };
    var isSeries = total > 1;
    var href =
      "artwork.html?slug=" +
      encodeURIComponent(work.slug) +
      (isSeries ? "&img=" + (index + 1) : "");
    var alt = isSeries
      ? work.title + " 第 " + (index + 1) + " 張圖片（共 " + total + " 張）"
      : image.alt;

    return (
      '<article class="card" data-reveal>' +
      '<a class="card__link" href="' +
      href +
      '">' +
      '<span class="card__media">' +
      imageFrame(image.src, alt, "card__frame") +
      (isSeries ? '<span class="badge badge--series">' + (index + 1) + " / " + total + "</span>" : "") +
      demoBadge(work) +
      "</span>" +
      '<span class="card__body">' +
      '<span class="card__title">' +
      esc(work.title) +
      "</span>" +
      '<span class="card__meta">' +
      esc(typeLabel) +
      esc(tagsText) +
      (isSeries ? '<span class="card__count">系列圖片 ' + (index + 1) + " / " + total + "</span>" : "") +
      "</span>" +
      (work.description ? '<span class="card__desc">' + esc(work.description) + "</span>" : "") +
      "</span>" +
      "</a>" +
      favoriteButton(work) +
      "</article>"
    );
  }

  /* 系列展開：多張圖片的作品在列表中拆成多張卡片，
     每張卡片都連到同一件作品的詳情頁，並直接開在對應的圖片上。 */
  function expandSeries(list) {
    var out = [];
    list.forEach(function (work) {
      if (work.images.length > 1) {
        work.images.forEach(function (img, i) {
          out.push({ work: work, imageIndex: i });
        });
      } else {
        out.push({ work: work, imageIndex: 0 });
      }
    });
    return out;
  }

  function gridHTML(list, modifier, opts) {
    opts = opts || {};
    if (!list.length) return "";
    var cards = opts.expandSeries ? expandSeries(list) : list.map(function (w) {
      return { work: w, imageIndex: 0 };
    });
    return (
      '<div class="grid ' +
      (modifier || "") +
      '">' +
      cards
        .map(function (item) {
          return cardHTML(item.work, { imageIndex: item.imageIndex });
        })
        .join("") +
      "</div>"
    );
  }

  /* ---------------- 區塊收合（往下滑隱藏、往上滑出現） ----------------
     頁首與作品探索的篩選列都使用這個行為。
     options：
       keepVisible() 回傳 true 時強制保持顯示（例如手機選單展開）
       topLimit      距離頁面頂端多少 px 內一律顯示（預設 8）
       className     收合時加上的 class 名稱（預設 is-hidden） */
  function autoHideOnScroll(element, options) {
    if (!element) return null;
    var opts = options || {};
    var className = opts.className || "is-hidden";
    var topLimit = typeof opts.topLimit === "number" ? opts.topLimit : 8;
    var SCROLL_GAP = 10; // 小於此位移視為抖動，不切換狀態
    var lastY = window.scrollY || 0;

    function setHidden(next) {
      element.classList.toggle(className, next);
      // 可選：同步在 body 加上 class，供其他區塊調整版面（例如頁首藏起時篩選列貼到最上緣）
      if (opts.bodyClass) document.body.classList.toggle(opts.bodyClass, next);
    }

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var delta = y - lastY;
      if (Math.abs(delta) < SCROLL_GAP) return;
      lastY = y;
      // 頁面頂端、或指定情況下一律保持顯示
      if (y <= topLimit || (opts.keepVisible && opts.keepVisible())) {
        setHidden(false);
        return;
      }
      setHidden(delta > 0);
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    // 鍵盤操作：焦點移入該區塊時保持可見，避免鍵盤使用者找不到目前位置
    element.addEventListener("focusin", function () {
      lastY = window.scrollY || 0;
      setHidden(false);
    });

    return {
      show: function () {
        lastY = window.scrollY || 0;
        setHidden(false);
      },
      hide: function () {
        setHidden(true);
      }
    };
  }

  /* ---------------- 頁首 ---------------- */

  var NAV = [
    { page: "gallery", href: "gallery.html", label: "作品探索" },
    { page: "collection", href: "collection.html", label: "收藏清單" },
    { page: "about", href: "about.html", label: "展覽介紹" }
  ];

  function renderHeader() {
    var host = document.getElementById("site-header");
    if (!host) return;
    var current = document.body.getAttribute("data-page") || "";
    var count = AS.favorites.count();

    var config = data.config || {};
    var logo = config.logo || "";
    var creator = config.creator || config.siteName || "ArtScope";

    host.innerHTML =
      '<header class="site-header">' +
      '<div class="container site-header__inner">' +
      '<a class="brand" href="index.html" aria-label="' +
      esc(creator) +
      ' 作品集首頁">' +
      (logo
        ? '<img class="brand__logo" src="' + esc(logo) + '" alt="' + esc(creator) + ' LOGO" width="34" height="34">'
        : '<span class="brand__mark" aria-hidden="true"></span>') +
      '<span class="brand__name">' +
      esc(creator) +
      "</span>" +
      "</a>" +
      '<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="primary-nav">' +
      '<span class="menu-toggle__bars" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="menu-toggle__text">選單</span>' +
      "</button>" +
      '<nav class="nav" id="primary-nav" aria-label="主要導覽">' +
      NAV.map(function (item) {
        var active = item.page === current;
        return (
          '<a class="nav__link' +
          (active ? " is-active" : "") +
          '" href="' +
          item.href +
          '"' +
          (active ? ' aria-current="page"' : "") +
          ">" +
          item.label +
          (item.page === "collection"
            ? '<span class="nav__count" data-fav-count ' +
              (count ? "" : "hidden") +
              ">" +
              count +
              "</span>"
            : "") +
          "</a>"
        );
      }).join("") +
      "</nav>" +
      "</div>" +
      "</header>";

    var toggle = host.querySelector(".menu-toggle");
    var nav = host.querySelector("#primary-nav");

    function setMenu(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.classList.toggle("is-open", open);
      nav.classList.toggle("is-open", open);
      toggle.querySelector(".menu-toggle__text").textContent = open ? "關閉" : "選單";
      document.body.classList.toggle("menu-open", open);
    }

    /* ---------- 導覽列收合：往下滑隱藏、往上滑出現 ---------- */
    var headerBar = host.querySelector(".site-header");
    var headerCollapse = autoHideOnScroll(headerBar, {
      // 手機選單展開時必須保持可見，否則面板會跟著被藏起來
      keepVisible: function () {
        return toggle.getAttribute("aria-expanded") === "true";
      },
      bodyClass: "is-header-hidden"
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && toggle.getAttribute("aria-expanded") === "true") setMenu(false);
    });

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      setMenu(open);
      if (open && headerCollapse) headerCollapse.show();
    });
  }

  /* ---------------- 頁尾 ---------------- */

  function renderFooter() {
    var host = document.getElementById("site-footer");
    if (!host) return;
    var contact = (data.about && data.about.contact) || {};
    var contactText = contact.email || contact.link || contact.note || "";

    host.innerHTML =
      '<footer class="site-footer">' +
      '<div class="container site-footer__inner">' +
      '<div class="site-footer__brand">' +
      '<p class="site-footer__name">' +
      esc(data.config.siteName || "ArtScope") +
      "</p>" +
      '<p class="site-footer__tag">' +
      esc(data.config.siteTagline || "") +
      "</p>" +
      "</div>" +
      '<nav class="site-footer__nav" aria-label="頁尾導覽">' +
      '<a href="index.html">返回首頁</a>' +
      '<a href="gallery.html">作品探索</a>' +
      '<a href="collection.html">收藏清單</a>' +
      '<a href="about.html">展覽介紹</a>' +
      "</nav>" +
      '<div class="site-footer__contact">' +
      '<p class="site-footer__label">聯絡資訊</p>' +
      (contactText
        ? "<p>" + esc(contactText) + "</p>"
        : '<p class="placeholder-note placeholder-note--inline">聯絡資訊待補充</p>') +
      "</div>" +
      "</div>" +
      '<div class="container site-footer__base">' +
      "<p>© " +
      new Date().getFullYear() +
      " " +
      esc(data.config.creator || data.config.siteName || "ArtScope") +
      "｜" +
      esc(data.config.siteName || "ArtScope") +
      " 數位美術作品集</p>" +
      '<p class="site-footer__mode">內容模式：' +
      (data.mode === "formal" ? "正式展示" : "文字預留中") +
      "</p>" +
      "</div>" +
      "</footer>";
  }

  /* ---------------- 圖片檢視器（燈箱） ---------------- */

  var lb = {
    images: [],
    index: 0,
    opener: null,
    root: null
  };

  function buildLightbox() {
    if (document.getElementById("lightbox")) return;
    var wrap = document.createElement("div");
    wrap.className = "lightbox";
    wrap.id = "lightbox";
    wrap.hidden = true;
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "圖片放大檢視");
    wrap.innerHTML =
      '<div class="lightbox__backdrop" data-lb-close></div>' +
      '<div class="lightbox__panel">' +
      '<div class="lightbox__bar">' +
      '<p class="lightbox__counter" data-lb-counter aria-live="polite"></p>' +
      '<button type="button" class="lightbox__close" data-lb-close aria-label="關閉圖片檢視（Esc）">✕<span class="lightbox__close-text">關閉</span></button>' +
      "</div>" +
      '<figure class="lightbox__stage">' +
      '<img class="lightbox__img" alt="" data-lb-img>' +
      '<div class="lightbox__error" data-lb-error hidden>' +
      '<p class="lightbox__error-title">圖片載入失敗</p>' +
      '<p>此圖片無法顯示，請確認檔案路徑是否正確。</p>' +
      "</div>" +
      "</figure>" +
      '<figcaption class="lightbox__caption" data-lb-caption></figcaption>' +
      '<button type="button" class="lightbox__nav lightbox__nav--prev" data-lb-prev aria-label="上一張圖片">‹</button>' +
      '<button type="button" class="lightbox__nav lightbox__nav--next" data-lb-next aria-label="下一張圖片">›</button>' +
      "</div>";
    document.body.appendChild(wrap);
    lb.root = wrap;

    wrap.addEventListener("click", function (e) {
      if (e.target.closest("[data-lb-close]")) closeLightbox();
      if (e.target.closest("[data-lb-prev]")) stepLightbox(-1);
      if (e.target.closest("[data-lb-next]")) stepLightbox(1);
    });

    // 觸控滑動
    var startX = null;
    var stage = wrap.querySelector(".lightbox__stage");
    stage.addEventListener(
      "touchstart",
      function (e) {
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );
    stage.addEventListener(
      "touchend",
      function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) stepLightbox(dx > 0 ? -1 : 1);
        startX = null;
      },
      { passive: true }
    );
  }

  function renderLightboxImage() {
    var img = lb.root.querySelector("[data-lb-img]");
    var err = lb.root.querySelector("[data-lb-error]");
    var cap = lb.root.querySelector("[data-lb-caption]");
    var counter = lb.root.querySelector("[data-lb-counter]");
    var item = lb.images[lb.index];
    if (!item) return;

    img.hidden = false;
    err.hidden = true;
    img.src = item.src;
    img.alt = item.alt || "";
    cap.textContent = item.caption || item.alt || "";
    counter.textContent = lb.index + 1 + " / " + lb.images.length;

    var multi = lb.images.length > 1;
    lb.root.querySelector("[data-lb-prev]").hidden = !multi;
    lb.root.querySelector("[data-lb-next]").hidden = !multi;

    img.onerror = function () {
      img.hidden = true;
      err.hidden = false;
    };
  }

  function stepLightbox(delta) {
    if (lb.images.length < 2) return;
    lb.index = (lb.index + delta + lb.images.length) % lb.images.length;
    renderLightboxImage();
  }

  function openLightbox(images, index, opener) {
    buildLightbox();
    lb.images = images || [];
    lb.index = Math.max(0, Math.min(index || 0, lb.images.length - 1));
    lb.opener = opener || document.activeElement;
    lb.root.hidden = false;
    document.body.classList.add("lightbox-open");
    renderLightboxImage();
    lb.root.querySelector(".lightbox__close").focus();
  }

  function closeLightbox() {
    if (!lb.root || lb.root.hidden) return;
    lb.root.hidden = true;
    document.body.classList.remove("lightbox-open");
    lb.images = [];
    if (lb.opener && document.contains(lb.opener)) lb.opener.focus();
  }

  function lightboxOpen() {
    return !!(lb.root && !lb.root.hidden);
  }

  document.addEventListener("keydown", function (e) {
    if (!lightboxOpen()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === "ArrowLeft") {
      stepLightbox(-1);
    } else if (e.key === "ArrowRight") {
      stepLightbox(1);
    } else if (e.key === "Tab") {
      // 焦點保持在檢視器內
      var focusables = lb.root.querySelectorAll("button:not([hidden])");
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------------- 分享與複製連結 ---------------- */

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    // 檢視器／file:// 環境下 Clipboard API 可能被拒，改用傳統複製方式
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        if (legacyCopy(text)) return Promise.resolve();
        return Promise.reject(new Error("copy-failed"));
      });
    }
    return new Promise(function (resolve, reject) {
      if (legacyCopy(text)) resolve();
      else reject(new Error("copy-failed"));
    });
  }

  /* ---------------- 捲動進場動畫 ---------------- */

  var revealScrollHandler = null;

  function setupReveal() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, function (n) {
        n.classList.add("is-visible");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "160px 0px 160px 0px", threshold: 0 }
    );
    Array.prototype.forEach.call(nodes, function (n) {
      io.observe(n);
    });

    // 備援：快速捲動或頁面跳轉時，IntersectionObserver 可能錯過元素，
    // 這裡用捲動事件補上，確保內容一定會顯示出來。
    var ticking = false;
    function revealVisible() {
      ticking = false;
      Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]:not(.is-visible)"), function (n) {
        var rect = n.getBoundingClientRect();
        if (rect.top < window.innerHeight + 240 && rect.bottom > -240) {
          n.classList.add("is-visible");
          io.unobserve(n);
        }
      });
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(revealVisible);
    }
    if (revealScrollHandler) {
      window.removeEventListener("scroll", revealScrollHandler);
      window.removeEventListener("resize", revealScrollHandler);
    }
    revealScrollHandler = onScroll;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    revealVisible();
  }

  /* ---------------- 頁面載入 ---------------- */

  function init() {
    renderHeader();
    renderFooter();
    buildLightbox();
    bindImageError(document);
    setupReveal();
    document.body.classList.add("is-ready");
    syncAllFavoriteButtons();
  }

  window.addEventListener("artscope:favorites", function () {
    syncAllFavoriteButtons();
  });

  AS.ui = {
    imageFrame: imageFrame,
    bindImageError: bindImageError,
    toast: toast,
    cardHTML: cardHTML,
    gridHTML: gridHTML,
    favoriteButton: favoriteButton,
    demoBadge: demoBadge,
    syncFavoriteButtons: syncFavoriteButtons,
    syncAllFavoriteButtons: syncAllFavoriteButtons,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox,
    copyText: copyText,
    setupReveal: setupReveal,
    autoHideOnScroll: autoHideOnScroll
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
