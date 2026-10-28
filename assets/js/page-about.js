/* =========================================================
   ArtScope — 展覽介紹頁腳本
   有內容 → 顯示正式文字；無內容 → 顯示預留狀態
   （正式展示模式 dataMode:"formal" 時，未完成區塊會被隱藏）
   ========================================================= */
(function () {
  "use strict";

  var AS = window.AS;
  var esc = AS.utils.escapeHtml;
  var data = AS.data;
  var isFormal = data.mode === "formal";

  function block(title, content, wide) {
    if (!content || !String(content).trim()) {
      if (isFormal) return ""; // 正式模式：隱藏未完成區塊
      return (
        '<article class="about-block' +
        (wide ? " about-block--wide" : "") +
        '" data-reveal>' +
        "<h2>" +
        esc(title) +
        "</h2>" +
        '<span class="placeholder-note"><span class="placeholder-note__tag">預留區塊</span>' +
        esc(title) +
        "的正式內容待補充。</span>" +
        "</article>"
      );
    }
    return (
      '<article class="about-block' +
      (wide ? " about-block--wide" : "") +
      '" data-reveal>' +
      "<h2>" +
      esc(title) +
      "</h2>" +
      "<p>" +
      esc(content) +
      "</p>" +
      "</article>"
    );
  }

  function render() {
    var about = data.about || {};
    var grid = document.getElementById("about-grid");

    var html =
      block("展覽理念", about.concept, true) +
      block("創作者介紹", about.artist) +
      block("創作方向", about.direction);

    if (!html.trim()) {
      html =
        '<article class="about-block about-block--wide" data-reveal>' +
        '<span class="placeholder-note"><span class="placeholder-note__tag">版型已就緒</span>' +
        "展覽理念、創作者介紹與創作方向的內容尚未提供。" +
        "請在 <code>assets/js/data.js</code> 的 <code>about</code> 欄位填入正式文字，或在正式展示模式中這些區塊會自動隱藏。" +
        "</span></article>";
    }
    grid.innerHTML = html;

    // 分類說明
    var notes = document.getElementById("category-notes");
    notes.innerHTML = data
      .categories()
      .map(function (cat) {
        var note = (about.categoryNotes && about.categoryNotes[cat.id]) || "";
        var count = data.all().filter(function (w) {
          return w.type === cat.id;
        }).length;
        return (
          "<div>" +
          "<h3>" +
          esc(cat.label) +
          "</h3>" +
          (note.trim()
            ? "<p>" + esc(note) + "</p>"
            : isFormal
            ? '<p class="placeholder-note--inline">說明待補充。</p>'
            : '<span class="placeholder-note"><span class="placeholder-note__tag">預留</span>' +
              esc(cat.label) +
              "的分類說明待補充。</span>") +
          '<p style="margin-top:var(--sp-3);color:var(--c-text-dim);font-size:var(--fs-sm)">目前展出 ' +
          count +
          " 件作品</p>" +
          "</div>"
        );
      })
      .join("");

    // 聯絡資訊
    var contact = about.contact || {};
    var contactHost = document.getElementById("contact-block");
    var lines = [];
    if (contact.email) lines.push("<p>Email：" + esc(contact.email) + "</p>");
    if (contact.link) lines.push('<p><a href="' + esc(contact.link) + '">' + esc(contact.link) + "</a></p>");
    if (contact.note) lines.push("<p>" + esc(contact.note) + "</p>");

    contactHost.innerHTML = lines.length
      ? '<div class="about-block" data-reveal>' + lines.join("") + "</div>"
      : isFormal
      ? ""
      : '<span class="placeholder-note" data-reveal><span class="placeholder-note__tag">預留區塊</span>' +
        "聯絡信箱、社群連結與其他聯絡方式待補充。</span>";

    AS.ui.bindImageError(document);
    AS.ui.setupReveal();
  }

  function init() {
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
