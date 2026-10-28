/* =========================================================
   ArtScope — 展覽設定與介紹資料
   ---------------------------------------------------------
   ★ 作品資料不在這個檔案，而是由 artworks/ 資料夾自動產生：
     assets/js/artworks.js（執行 node tools/generate-artworks.mjs）
   本檔只放「網站設定、分類定義、展覽介紹文字」。
   詳細說明請見 README.md
   ========================================================= */
(function () {
  "use strict";

  window.ARTSCOPE = {
    /* ---------- 網站與創作者設定 ---------- */
    config: {
      siteName: "ArtScope",
      siteTagline: "昱佐 YuZuo 的 3D 與 2D 美術作品集",

      // 創作者名稱（顯示於頁首、頁尾）
      creator: "昱佐 YuZuo",
      // LOGO 圖片路徑（換掉這個檔案即可更新全站 LOGO）
      logo: "artworks/我的LOGO.png",

      // 展覽正式標題（尚未提供 → 留空，網站會顯示預留狀態）
      exhibitionTitle: "",
      // 展覽簡介（尚未提供 → 留空，首頁會顯示預設說明）
      exhibitionIntro: "",

      // "demo"  ：顯示「內容預留中」的提示區塊（方便日後補文字）
      // "formal"：正式展示模式，會隱藏所有 demo:true 的作品與未完成區塊
      dataMode: "demo",

      version: "0.2.0"
    },

    /* ---------- 展覽分類（可自由增減，會同步到篩選列與首頁入口） ---------- */
    categories: [
      { id: "2d", label: "2D 插畫" },
      { id: "3d", label: "3D 美術" }
    ],

    /* ---------- 展覽介紹（Page 05 用，尚未提供 → 留空即顯示預留狀態） ---------- */
    about: {
      concept: "",      // 展覽理念
      artist: "",       // 創作者介紹
      direction: "",    // 創作方向
      categoryNotes: {
        "2d": "",       // 分類說明
        "3d": ""
      },
      contact: {
        email: "",
        link: "",
        note: "創作者：昱佐 YuZuo"
      }
    },

    /* 作品資料（由 artworks/ 自動產生，此處留空即可） */
    artworks: [],

    /* ---------- 手動補充欄位（overrides）----------
       作品結構（圖片、標題、精選）由 artworks/ 自動產生，
       這裡可以「只補文字」，以作品 slug 為鍵，不會被重新產生的檔案覆蓋。

       slug 格式：類型-標題，例如「3d-十二生肖系列-虎」「2d-幽影王」
       （所有作品的 slug 可在 assets/js/artworks.js 中查到）

       可補的欄位：
         description : 作品卡與詳情頁的簡短介紹
         tags        : 陣列，覆蓋自動產生的標籤
         story       : { background, concept, inspiration, theme, process, extra }
         process     : [{ stage:"階段名稱", image:"artworks/…", caption:"說明" }]
         featured    : true / false（是否為精選作品）
         sortOrder   : 數字，精選作品之間的固定順序

       範例：
         "3d-十二生肖系列-虎": {
           description: "（一句話介紹）",
           story: { concept: "（創作概念）" }
         }
    */
    overrides: {},

    /* ---------- 手動新增整件作品（選配，排在自動產生的作品之後） ----------
       適用於不在 artworks/ 資料夾中的作品。欄位說明見 README.md。 */
  };
})();
