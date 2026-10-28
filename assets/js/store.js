/* =========================================================
   ArtScope — 資料處理、收藏狀態與共用工具
   ========================================================= */
(function () {
  "use strict";

  var AS = (window.AS = window.AS || {});
  var RAW = window.ARTSCOPE || { config: {}, categories: [], artworks: [], about: {} };

  /* ---------------- 工具函式 ---------------- */

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isFilled(value) {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") {
      return Object.keys(value).some(function (k) {
        return isFilled(value[k]);
      });
    }
    return String(value).trim() !== "";
  }

  /* 正規化圖片項目：字串 → {src, alt, caption} */
  function normalizeImage(item, fallbackAlt) {
    if (!item) return null;
    if (typeof item === "string") {
      return { src: item, alt: fallbackAlt || "", caption: "" };
    }
    if (item.src) {
      return {
        src: item.src,
        alt: item.alt || fallbackAlt || "",
        caption: item.caption || ""
      };
    }
    return null;
  }

  /* 正規化製作階段：字串 → {stage, image, caption} */
  function normalizeStage(item, index) {
    if (!item) return null;
    if (typeof item === "string") {
      return { stage: "階段 " + (index + 1), image: item, caption: "" };
    }
    if (item.image || item.src) {
      return {
        stage: item.stage || "階段 " + (index + 1),
        image: item.image || item.src,
        caption: item.caption || ""
      };
    }
    return null;
  }

  /* ---------------- 作品資料正規化 ---------------- */

  var STORIES = [
    { key: "background", label: "創作背景" },
    { key: "concept", label: "創作概念" },
    { key: "inspiration", label: "靈感來源" },
    { key: "theme", label: "想表達的主題" },
    { key: "process", label: "製作過程" },
    { key: "extra", label: "其他補充故事" }
  ];

  /* 手動補充欄位（data.js 的 overrides）：以 slug 為鍵，
     可以只補文字，不必重貼整個作品資料，重新產生 artworks.js 也不會被覆蓋。 */
  var OVERRIDES = RAW.overrides || {};

  function applyOverride(work) {
    var patch = work && OVERRIDES[work.slug];
    if (!patch) return work;
    var merged = {};
    Object.keys(work).forEach(function (key) {
      merged[key] = work[key];
    });
    Object.keys(patch).forEach(function (key) {
      if (key === "story") {
        merged.story = mergePlain(work.story, patch.story);
      } else {
        merged[key] = patch[key];
      }
    });
    return merged;
  }

  function mergePlain(base, extra) {
    var out = {};
    [base || {}, extra || {}].forEach(function (obj) {
      Object.keys(obj).forEach(function (key) {
        out[key] = obj[key];
      });
    });
    return out;
  }

  function normalizeArtwork(raw, index) {
    var work = raw || {};
    var gallery = (Array.isArray(work.gallery) ? work.gallery : [])
      .map(function (item) {
        return normalizeImage(item, work.title || "作品圖片");
      })
      .filter(Boolean);

    var process = (Array.isArray(work.process) ? work.process : [])
      .map(normalizeStage)
      .filter(Boolean);

    // 封面一定會出現在圖片列表最前面
    var cover = normalizeImage(work.coverImage, (work.title || "作品") + " 封面");
    var images = [];
    if (cover) images.push(cover);
    gallery.forEach(function (g) {
      if (!cover || g.src !== cover.src) images.push(g);
    });

    var story = {};
    STORIES.forEach(function (s) {
      var text = work.story && typeof work.story[s.key] === "string" ? work.story[s.key].trim() : "";
      if (text) story[s.key] = { label: s.label, text: text };
    });

    return {
      id: work.id || "work-" + (index + 1),
      slug: work.slug || work.id || "work-" + (index + 1),
      title: isFilled(work.title) ? String(work.title).trim() : "作品名稱待補充",
      type: work.type || "other",
      coverImage: cover ? cover.src : "assets/placeholders/favicon.svg",
      description: isFilled(work.description) ? String(work.description).trim() : "",
      tags: Array.isArray(work.tags) ? work.tags.map(String) : [],
      story: story,                 // 已過濾為「有內容」的段落
      storyRaw: work.story || {},
      gallery: gallery,             // 封面以外的補充圖片
      images: images,               // 封面 + 補充圖片（圖片檢視器用）
      process: process,             // 製作階段
      featured: !!work.featured,
      sortOrder: typeof work.sortOrder === "number" ? work.sortOrder : index + 1,
      demo: !!work.demo
    };
  }

  var mode = RAW.config && RAW.config.dataMode === "formal" ? "formal" : "demo";

  // 作品來源：artworks.js（由 artworks/ 資料夾自動產生）
  // ＋ data.js 的 artworks 陣列（可手動新增少數作品）
  var generatedWorks = Array.isArray(window.ARTSCOPE_ARTWORKS) ? window.ARTSCOPE_ARTWORKS : [];
  var manualWorks = Array.isArray(RAW.artworks) ? RAW.artworks : [];
  var sourceWorks = generatedWorks.concat(manualWorks);

  var allWorks = sourceWorks.map(function (raw, index) {
    return normalizeArtwork(applyOverride(raw), index);
  });
  var visibleWorks = allWorks.filter(function (w) {
    return mode === "demo" ? true : !w.demo; // 正式模式隱藏 DEMO 作品
  });

  /* 排序規則：
     1. 精選作品（優質）依照 sortOrder 固定排在最前面
     2. 其餘作品每次造訪隨機排序（同一次瀏覽內順序維持一致） */
  var featuredWorks = visibleWorks
    .filter(function (w) {
      return w.featured;
    })
    .sort(function (a, b) {
      return a.sortOrder - b.sortOrder;
    });
  var otherWorks = visibleWorks.filter(function (w) {
    return !w.featured;
  });
  orderRandomly(otherWorks);
  visibleWorks = featuredWorks.concat(otherWorks);

  var bySlug = {};
  visibleWorks.forEach(function (w) {
    bySlug[w.slug] = w;
  });

  /* ---------------- 其餘作品的隨機排序 ---------------- */

  var SHUFFLE_KEY = "artscope:shuffle";

  function shuffleArray(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function orderRandomly(list) {
    if (list.length < 2) return list;
    var ids = list.map(function (w) {
      return w.id;
    });
    var signature = ids.join("|");
    var storedOrder = null;

    try {
      var raw = sessionStorage.getItem(SHUFFLE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.signature === signature && Array.isArray(parsed.order)) {
          storedOrder = parsed.order;
        }
      }
    } catch (e) {
      storedOrder = null;
    }

    if (storedOrder) {
      var position = {};
      storedOrder.forEach(function (id, i) {
        position[id] = i;
      });
      list.sort(function (a, b) {
        var pa = position[a.id] === undefined ? 9999 : position[a.id];
        var pb = position[b.id] === undefined ? 9999 : position[b.id];
        return pa - pb;
      });
      return list;
    }

    shuffleArray(list);
    try {
      sessionStorage.setItem(
        SHUFFLE_KEY,
        JSON.stringify({
          signature: signature,
          order: list.map(function (w) {
            return w.id;
          })
        })
      );
    } catch (e) {
      /* 無法儲存時，改為每次載入重新隨機 */
    }
    return list;
  }

  /* ---------------- 收藏（localStorage） ---------------- */

  var FAV_KEY = "artscope:favorites";
  var favCache = null;

  function readFavorites() {
    if (favCache) return favCache;
    try {
      var raw = localStorage.getItem(FAV_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      favCache = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
      favCache = [];
    }
    return favCache;
  }

  function writeFavorites(ids) {
    favCache = ids;
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(ids));
    } catch (e) {
      /* 隱私模式或空間不足時忽略，功能仍會在本次會話有效 */
    }
    window.dispatchEvent(new CustomEvent("artscope:favorites", { detail: { ids: ids } }));
  }

  var favorites = {
    ids: function () {
      return readFavorites().slice();
    },
    has: function (id) {
      return readFavorites().indexOf(String(id)) !== -1;
    },
    toggle: function (id) {
      id = String(id);
      var list = readFavorites();
      var idx = list.indexOf(id);
      var added;
      if (idx === -1) {
        list.push(id);
        added = true;
      } else {
        list.splice(idx, 1);
        added = false;
      }
      writeFavorites(list);
      return added;
    },
    remove: function (id) {
      id = String(id);
      var list = readFavorites().filter(function (x) {
        return x !== id;
      });
      writeFavorites(list);
    },
    count: function () {
      return readFavorites().length;
    },
    works: function () {
      return readFavorites()
        .map(function (id) {
          return visibleWorks.filter(function (w) {
            return w.id === id;
          })[0];
        })
        .filter(Boolean);
    }
  };

  /* ---------------- 分類與標籤 ---------------- */

  function categories() {
    return (RAW.categories || []).slice();
  }

  function categoryLabel(id) {
    var found = categories().filter(function (c) {
      return c.id === id;
    })[0];
    return found ? found.label : id;
  }

  function tags() {
    var seen = {};
    var out = [];
    visibleWorks.forEach(function (w) {
      w.tags.forEach(function (t) {
        if (!seen[t]) {
          seen[t] = true;
          out.push(t);
        }
      });
    });
    return out;
  }

  /* ---------------- 查詢 ---------------- */

  function all() {
    return visibleWorks.slice();
  }

  function featured() {
    return visibleWorks.filter(function (w) {
      return w.featured;
    });
  }

  function byId(id) {
    return visibleWorks.filter(function (w) {
      return w.id === id;
    })[0] || null;
  }

  function bySlugFn(slug) {
    return bySlug[slug] || null;
  }

  function neighbours(slug) {
    var list = visibleWorks;
    var idx = -1;
    list.forEach(function (w, i) {
      if (w.slug === slug) idx = i;
    });
    return {
      index: idx,
      prev: idx > 0 ? list[idx - 1] : null,
      next: idx !== -1 && idx < list.length - 1 ? list[idx + 1] : null
    };
  }

  function related(work, limit) {
    limit = limit || 3;
    var sameType = [];
    var others = [];
    visibleWorks.forEach(function (w) {
      if (w.id === work.id) return;
      if (w.type === work.type) sameType.push(w);
      else others.push(w);
    });
    return sameType.concat(others).slice(0, limit);
  }

  /* ---------------- 篩選 ---------------- */

  function filterWorks(opts) {
    opts = opts || {};
    var type = opts.type || "";
    var tag = opts.tag || "";
    var featuredOnly = !!opts.featured;
    var query = (opts.query || "").trim().toLowerCase();

    return visibleWorks.filter(function (w) {
      if (featuredOnly && !w.featured) return false;
      if (type && w.type !== type) return false;
      if (tag && w.tags.indexOf(tag) === -1) return false;
      if (query) {
        var haystack = [w.title, w.description, categoryLabel(w.type)]
          .concat(w.tags)
          .join(" ")
          .toLowerCase();
        if (haystack.indexOf(query) === -1) return false;
      }
      return true;
    });
  }

  /* ---------------- 對外介面 ---------------- */

  AS.utils = {
    escapeHtml: escapeHtml,
    isFilled: isFilled,
    STORIES: STORIES
  };

  AS.data = {
    config: RAW.config || {},
    about: RAW.about || {},
    categories: categories,
    categoryLabel: categoryLabel,
    tags: tags,
    all: all,
    featured: featured,
    byId: byId,
    bySlug: bySlugFn,
    neighbours: neighbours,
    related: related,
    filter: filterWorks,
    mode: mode
  };

  AS.favorites = favorites;
})();
