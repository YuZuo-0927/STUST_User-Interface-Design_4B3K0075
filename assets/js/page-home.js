/* =========================================================
   ArtScope — 首頁腳本
   ========================================================= */
(function () {
  "use strict";

  var AS = window.AS;
  var esc = AS.utils.escapeHtml;
  var data = AS.data;

  function placeholderNote(tag, text) {
    return (
      '<span class="placeholder-note">' +
      '<span class="placeholder-note__tag">' +
      esc(tag) +
      "</span>" +
      esc(text) +
      "</span>"
    );
  }

  function renderHeroMeta() {
    var works = data.all();
    var cats = data.categories().filter(function (c) {
      return works.some(function (w) {
        return w.type === c.id;
      });
    });
    document.querySelector("[data-hero-count]").textContent = works.length;
    document.querySelector("[data-hero-categories]").textContent = cats.length;
    document.querySelector("[data-hero-featured]").textContent = data.featured().length;

    // 展覽簡介：尚未提供時維持版型預設文字（不編造內容）
    var intro = data.config.exhibitionIntro;
    if (intro && String(intro).trim()) {
      document.getElementById("hero-intro").textContent = intro;
    }
  }

  function renderHeroMedia() {
    // 主視覺使用第一件精選（優質）作品的圖片
    var featured = data.featured();
    if (!featured.length) return;
    var img = document.querySelector(".hero__media .img-frame__img");
    if (!img) return;
    var work = featured[0];
    img.src = work.coverImage;
    img.alt = "";
    img.setAttribute("data-bound", "1");
    AS.ui.bindImageError(document);
  }

  function renderFeatured() {
    var host = document.getElementById("featured-grid");
    var featured = data.featured();

    if (!featured.length) {
      host.innerHTML =
        '<div class="state-block">' +
        '<div class="state-block__icon" aria-hidden="true">0</div>' +
        '<h3 class="state-block__title">目前沒有精選作品</h3>' +
        '<p class="state-block__text">在資料檔中將作品的 <code>featured</code> 設為 <code>true</code>，即可出現在此區塊。</p>' +
        '<div class="state-block__actions"><a class="btn btn--primary" href="gallery.html">前往作品探索</a></div>' +
        "</div>";
      return;
    }

    host.innerHTML = AS.ui.gridHTML(featured, "", { expandSeries: true });
    AS.ui.bindImageError(host);
    AS.ui.setupReveal();
  }

  function renderCategories() {
    var host = document.getElementById("category-list");
    var works = data.all();

    host.innerHTML = data
      .categories()
      .map(function (cat, i) {
        var count = works.filter(function (w) {
          return w.type === cat.id;
        }).length;
        return (
          '<a class="category-card" href="gallery.html?type=' +
          encodeURIComponent(cat.id) +
          '" data-reveal>' +
          '<span class="category-card__index">' +
          String(i + 1).padStart(2, "0") +
          "</span>" +
          '<span class="category-card__name">' +
          esc(cat.label) +
          "</span>" +
          '<span class="category-card__count">' +
          count +
          " 件作品</span>" +
          '<span class="category-card__arrow" aria-hidden="true">進入分類 →</span>' +
          "</a>"
        );
      })
      .join("");

    AS.ui.bindImageError(host);
    AS.ui.setupReveal();
  }

  function renderAboutPreview() {
    var host = document.getElementById("about-preview-body");
    var concept = (data.about && data.about.concept) || "";
    var isFormal = data.mode === "formal";

    if (concept.trim()) {
      host.innerHTML =
        "<p>" +
        esc(concept) +
        '</p><a class="btn btn--ghost" href="about.html">閱讀完整展覽介紹</a>';
    } else if (isFormal) {
      // 正式模式：隱藏尚未完成的區塊
      host.innerHTML =
        '<p class="placeholder-note--inline">展覽介紹內容整理中。</p>' +
        '<a class="btn btn--ghost" href="about.html">展覽介紹</a>';
    } else {
      host.innerHTML =
        placeholderNote("預留區塊", "展覽理念與創作者介紹將放在此處，正式內容待補充。") +
        '<p style="margin-top:1rem">網站目前僅建立版型與互動功能，所有正式文字與圖片將由創作者提供後替換。</p>' +
        '<a class="btn btn--ghost" href="about.html">查看展覽介紹版型</a>';
    }
  }

  function init() {
    renderHeroMeta();
    renderHeroMedia();
    renderFeatured();
    renderCategories();
    renderAboutPreview();
    AS.ui.bindImageError(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
